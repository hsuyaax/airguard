"""
AirGuard — ML Inference API
FastAPI backend wrapping all original Python ML models.

Serves: XGBoost source classifier, Prophet forecasting, LSTM forecasting,
        IDW/Kriging interpolation, LOSO cross-validation, source fingerprinting,
        enforcement notice generation (template + Groq LLM).

Run: uvicorn server:app --port 8000 --reload
"""

import sys
import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Add original AIR project to path ──
AIR_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "AIR"))
sys.path.insert(0, AIR_DIR)

# ── Import original modules ──
from config import (
    AQI_BREAKPOINTS_PM25, GRAP_THRESHOLDS, SOURCE_TYPES,
    INTERVENTIONS, DELHI_CENTER, SQLITE_DB, GEOJSON_PATH, STATIONS_CSV,
    XGB_MODEL_PATH, PROPHET_DIR,
)
from models.fingerprinting import estimate_sources, get_primary_source, get_top_sources
from models.source_classifier import predict_source, build_features, FEATURE_NAMES
from models.forecaster import forecast_station, forecast_ward, _linear_forecast, _flat_forecast
from models.validation import leave_one_out_validation, forecast_validation_metrics, rmse, mae, r_squared
from spatial.interpolation import idw_interpolate, interpolate_at_points
from spatial.kriging import ordinary_kriging, fit_variogram, spherical_variogram
from spatial.ward_mapper import pm25_to_aqi, load_ward_geojson, compute_ward_aqi, get_grap_stage
from spatial.vulnerability import compute_vulnerability_index
from simulator.whatif import simulate_interventions
from enforcement.generator import generate_ward_notice
from enforcement.templates import generate_notice, SOURCE_ACTIONS, GRAP_ACTIONS
from enforcement.llm_generator import generate_llm_notice, generate_bilingual_notice
from src.alert_engine import (
    get_health_advisory, get_grap_alert, generate_priority_alerts,
    HEALTH_ADVISORIES, GRAP_ALERTS,
)
from src.utils import haversine_km, find_nearest_station, ist_now
from ingestion.cache_manager import init_db, get_latest, get_historical, get_staleness_minutes

# ── Try optional imports ──
try:
    from models.lstm_forecaster import lstm_forecast, train_lstm, TORCH_AVAILABLE
except ImportError:
    TORCH_AVAILABLE = False
    lstm_forecast = None

# ── Initialize ──
app = FastAPI(
    title="AirGuard ML API",
    description="Real ML model inference for the AirGuard Next.js frontend",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite
try:
    init_db()
except Exception as e:
    print(f"Warning: Could not initialize DB: {e}")

# ── Check model availability ──
XGB_LOADED = os.path.exists(XGB_MODEL_PATH)
PROPHET_LOADED = os.path.isdir(PROPHET_DIR) and len(os.listdir(PROPHET_DIR)) > 0
GEOJSON_AVAILABLE = os.path.exists(GEOJSON_PATH)
STATIONS_AVAILABLE = os.path.exists(STATIONS_CSV)

print(f"""
╔═══════════════════════════════════════════════╗
║        AirGuard ML API v2.0               ║
╠═══════════════════════════════════════════════╣
║ XGBoost Model:    {'✓ LOADED' if XGB_LOADED else '✗ NOT FOUND'}              ║
║ Prophet Models:   {'✓ LOADED' if PROPHET_LOADED else '✗ NOT TRAINED (run train_prophet.py)'}  ║
║ LSTM (PyTorch):   {'✓ AVAILABLE' if TORCH_AVAILABLE else '✗ NOT INSTALLED'}            ║
║ GeoJSON (250w):   {'✓ LOADED' if GEOJSON_AVAILABLE else '✗ NOT FOUND'}              ║
║ Stations CSV:     {'✓ LOADED' if STATIONS_AVAILABLE else '✗ NOT FOUND'}              ║
║ SQLite Cache:     {'✓ EXISTS' if os.path.exists(SQLITE_DB) else '✗ NOT FOUND'}              ║
╚═══════════════════════════════════════════════╝
""")


# ═══════════════════════════════════════════════
# Pydantic Models
# ═══════════════════════════════════════════════

class SourceRequest(BaseModel):
    pm25: float
    pm10: float = 180.0
    no2: float = 40.0
    so2: float = 15.0
    co: float = 1.5
    o3: Optional[float] = None
    hour: Optional[int] = None
    month: Optional[int] = None

class ForecastRequest(BaseModel):
    station_id: Optional[str] = None
    ward_name: Optional[str] = None
    pm25: float = 120.0
    hours: int = 48

class SimulatorRequest(BaseModel):
    current_pm25: float
    source_breakdown: dict
    selected_interventions: list[str]

class EnforcementRequest(BaseModel):
    ward_name: str
    ward_no: int = 1
    aqi: float
    pm25: float
    pm10: float = 180.0
    no2: float = 40.0
    so2: float = 15.0
    co: float = 1.5
    language: str = "english"
    mode: str = "template"

class InterpolationRequest(BaseModel):
    method: str = "idw"  # "idw" or "kriging"
    target_lats: list[float]
    target_lons: list[float]


# ═══════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════

@app.get("/")
def health():
    return {
        "service": "AirGuard ML API",
        "status": "operational",
        "models": {
            "xgboost": XGB_LOADED,
            "prophet": PROPHET_LOADED,
            "lstm": TORCH_AVAILABLE,
            "kriging": True,
            "idw": True,
            "fingerprinting": True,
        },
        "data": {
            "geojson": GEOJSON_AVAILABLE,
            "stations_csv": STATIONS_AVAILABLE,
            "sqlite_cache": os.path.exists(SQLITE_DB),
        },
    }


# ═══════════════════════════════════════════════
# Source Apportionment (XGBoost + Fingerprinting)
# ═══════════════════════════════════════════════

@app.post("/ml/sources")
def predict_sources(req: SourceRequest):
    """
    Predict pollution source breakdown.
    Tier 1: XGBoost classifier (if model loaded)
    Tier 2: Ratio-based fingerprinting (always available)
    """
    sources = predict_source(
        req.pm25, req.pm10, req.no2, req.so2, req.co,
        req.o3, req.hour, req.month,
    )
    primary = get_primary_source(sources)
    top = get_top_sources(sources, n=5)

    return {
        "sources": sources,
        "primary_source": primary,
        "primary_pct": sources[primary],
        "top_sources": [{"source": s, "pct": p} for s, p in top],
        "model_used": "xgboost" if XGB_LOADED else "fingerprinting",
        "feature_names": FEATURE_NAMES if XGB_LOADED else None,
    }

@app.get("/ml/sources/fingerprint")
def fingerprint_only(
    pm25: float = 100, pm10: float = 180, no2: float = 40,
    so2: float = 15, co: float = 1.5, o3: float = 20,
    hour: Optional[int] = None, month: Optional[int] = None,
):
    """Pure heuristic fingerprinting (no ML)."""
    return estimate_sources(pm25, pm10, no2, so2, co, o3, hour, month)


# ═══════════════════════════════════════════════
# Forecasting (Prophet + LSTM + Linear)
# ═══════════════════════════════════════════════

@app.post("/ml/forecast")
def forecast(req: ForecastRequest):
    """
    48-hour PM2.5 forecast.
    Tier 1: Prophet (if per-station model exists)
    Tier 2: LSTM (if PyTorch + trained model)
    Tier 3: Linear extrapolation
    Tier 4: Flat forecast
    """
    model_used = "flat"

    # Try getting historical data from cache
    historical_df = None
    try:
        historical_df = get_historical(days=7)
        if historical_df is not None and len(historical_df) > 0:
            model_used = "linear"
    except Exception:
        pass

    # Try station-level Prophet forecast
    if req.station_id and PROPHET_LOADED:
        try:
            station_hist = None
            if historical_df is not None:
                station_hist = historical_df[historical_df["station_id"] == req.station_id]
            result = forecast_station(req.station_id, station_hist, req.hours)
            if result is not None and len(result) > 0:
                model_used = "prophet"
                return {
                    "forecast": result.to_dict(orient="records"),
                    "model_used": model_used,
                    "station_id": req.station_id,
                    "hours": req.hours,
                }
        except Exception:
            pass

    # Try LSTM
    if req.station_id and TORCH_AVAILABLE and lstm_forecast:
        try:
            recent = historical_df[historical_df["station_id"] == req.station_id] if historical_df is not None else None
            if recent is not None and len(recent) >= 24:
                result = lstm_forecast(req.station_id, recent, hours=req.hours)
                if result is not None:
                    model_used = "lstm"
                    return {
                        "forecast": result.to_dict(orient="records"),
                        "model_used": model_used,
                        "station_id": req.station_id,
                        "hours": req.hours,
                    }
        except Exception:
            pass

    # Try ward-level forecast (average of nearest stations)
    if req.ward_name:
        try:
            stations_df = pd.read_csv(STATIONS_CSV)
            # Add demo pm25 values for forecasting
            if "pm25" not in stations_df.columns:
                stations_df["pm25"] = req.pm25
            if "station_id" not in stations_df.columns:
                stations_df["station_id"] = [f"S{i}" for i in range(len(stations_df))]

            hist = historical_df if historical_df is not None and len(historical_df) > 0 else stations_df
            result = forecast_ward(req.ward_name, stations_df, hist, req.hours)
            if result is not None and len(result) > 0:
                model_used = "ward_average"
                return {
                    "forecast": result.to_dict(orient="records"),
                    "model_used": model_used,
                    "ward_name": req.ward_name,
                    "hours": req.hours,
                }
        except Exception:
            pass

    # Fallback: linear or flat
    if historical_df is not None and len(historical_df) >= 6:
        result = _linear_forecast(historical_df, req.hours)
        model_used = "linear"
    else:
        result = _flat_forecast(req.hours, base_value=req.pm25)
        model_used = "flat"

    return {
        "forecast": result.to_dict(orient="records"),
        "model_used": model_used,
        "hours": req.hours,
    }


# ═══════════════════════════════════════════════
# Spatial Interpolation (IDW + Kriging)
# ═══════════════════════════════════════════════

@app.post("/ml/interpolate")
def interpolate(req: InterpolationRequest):
    """
    Spatial interpolation at target points.
    Uses real station data from SQLite cache or CSV.
    """
    # Load station data
    try:
        stations_df = get_latest()
        if len(stations_df) == 0:
            raise ValueError("Empty cache")
    except Exception:
        stations_df = pd.read_csv(STATIONS_CSV)
        np.random.seed(42)
        stations_df["pm25"] = np.random.uniform(40, 300, len(stations_df))

    s_lats = stations_df["latitude"].values
    s_lons = stations_df["longitude"].values
    s_vals = stations_df["pm25"].values
    t_lats = np.array(req.target_lats)
    t_lons = np.array(req.target_lons)

    if req.method == "kriging":
        predicted, variance = ordinary_kriging(s_lats, s_lons, s_vals, t_lats, t_lons)
        return {
            "predicted": predicted.tolist(),
            "variance": variance.tolist(),
            "method": "kriging",
            "n_stations": len(s_lats),
            "variogram": {
                "sill": float(fit_variogram(s_lats, s_lons, s_vals)[0]),
                "range": float(fit_variogram(s_lats, s_lons, s_vals)[1]),
                "nugget": float(fit_variogram(s_lats, s_lons, s_vals)[2]),
            },
        }
    else:
        predicted = interpolate_at_points(s_lats, s_lons, s_vals, t_lats, t_lons)
        return {
            "predicted": predicted.tolist(),
            "method": "idw",
            "n_stations": len(s_lats),
        }


# ═══════════════════════════════════════════════
# Ward-Level AQI Computation
# ═══════════════════════════════════════════════

@app.get("/ml/wards")
def compute_wards(method: str = "idw"):
    """
    Compute AQI for all 250 wards using real GeoJSON + interpolation.
    Returns ward data + enriched GeoJSON.
    """
    # Load station data
    try:
        stations_df = get_latest()
        if len(stations_df) == 0:
            raise ValueError("Empty cache")
        source = "sqlite_cache"
    except Exception:
        stations_df = pd.read_csv(STATIONS_CSV)
        np.random.seed(42)
        stations_df["pm25"] = np.random.uniform(40, 300, len(stations_df)).round(1)
        stations_df["pm10"] = np.random.uniform(80, 450, len(stations_df)).round(1)
        stations_df["aqi"] = np.random.uniform(50, 400, len(stations_df)).round(0)
        stations_df["station_id"] = [f"DLCPCB{str(i).zfill(3)}" for i in range(len(stations_df))]
        stations_df["timestamp"] = datetime.now().isoformat()
        stations_df["source"] = "demo"
        source = "demo"

    try:
        wards, geojson = load_ward_geojson()
        ward_df, geojson_data = compute_ward_aqi(stations_df, wards, geojson)

        return {
            "ward_data": ward_df.to_dict(orient="records"),
            "geojson": geojson_data,
            "stations": stations_df.to_dict(orient="records"),
            "source": source,
            "n_wards": len(ward_df),
            "n_stations": len(stations_df),
            "method": method,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ward computation failed: {str(e)}")


# ═══════════════════════════════════════════════
# LOSO Cross-Validation
# ═══════════════════════════════════════════════

@app.get("/ml/validate")
def validate(method: str = "idw"):
    """
    Run Leave-One-Station-Out cross-validation.
    Returns RMSE, MAE, R-squared, per-station errors.
    """
    try:
        stations_df = get_latest()
        if len(stations_df) == 0:
            stations_df = pd.read_csv(STATIONS_CSV)
            np.random.seed(42)
            stations_df["pm25"] = np.random.uniform(40, 300, len(stations_df)).round(1)
    except Exception:
        stations_df = pd.read_csv(STATIONS_CSV)
        np.random.seed(42)
        stations_df["pm25"] = np.random.uniform(40, 300, len(stations_df)).round(1)

    metrics = leave_one_out_validation(stations_df, value_col="pm25")

    result = {
        "rmse": metrics["rmse"],
        "mae": metrics["mae"],
        "r2": metrics["r2"],
        "n_stations": metrics["n_stations"],
        "method": method,
    }

    if "station_errors" in metrics and metrics["station_errors"] is not None:
        result["station_errors"] = metrics["station_errors"].to_dict(orient="records")

    return result


# ═══════════════════════════════════════════════
# What-If Simulator
# ═══════════════════════════════════════════════

@app.post("/ml/simulate")
def simulate(req: SimulatorRequest):
    """Run policy intervention simulation with real source model."""
    result = simulate_interventions(
        req.current_pm25, req.source_breakdown, req.selected_interventions
    )
    return result


# ═══════════════════════════════════════════════
# Enforcement Notice Generation
# ═══════════════════════════════════════════════

@app.post("/ml/enforcement")
def enforcement(req: EnforcementRequest):
    """
    Generate enforcement notice.
    Tier 1: Groq LLM (Llama-3 70B)
    Tier 2: Template (offline, instant)
    """
    # Get source breakdown from real model
    source_breakdown = predict_source(
        req.pm25, req.pm10, req.no2, req.so2, req.co
    )
    primary = get_primary_source(source_breakdown)
    primary_pct = source_breakdown[primary]
    grap_stage, grap_label = get_grap_stage(req.aqi)

    if req.mode == "llm":
        try:
            if req.language == "both":
                notice = generate_bilingual_notice(
                    req.ward_name, req.ward_no, req.aqi,
                    primary, primary_pct, source_breakdown,
                )
            else:
                notice = generate_llm_notice(
                    req.ward_name, req.ward_no, req.aqi,
                    primary, primary_pct, source_breakdown,
                    language=req.language,
                )
            return {
                "notice": notice,
                "sources": source_breakdown,
                "primary_source": primary,
                "grap_stage": grap_stage,
                "model_used": "groq_llm",
            }
        except Exception:
            pass  # Fall through to template

    # Template fallback
    notice, source_bd, grap = generate_ward_notice(
        ward_name=req.ward_name,
        ward_no=req.ward_no,
        aqi=req.aqi,
        pm25=req.pm25,
        pm10=req.pm10,
        no2=req.no2,
        so2=req.so2,
        co=req.co,
    )

    return {
        "notice": notice,
        "sources": source_bd,
        "primary_source": primary,
        "grap_stage": grap,
        "model_used": "template",
    }


# ═══════════════════════════════════════════════
# Alerts & Advisories
# ═══════════════════════════════════════════════

@app.get("/ml/alerts")
def alerts(aqi: float = 300):
    """Get health advisory and GRAP alert for an AQI value."""
    advisory = get_health_advisory(aqi)
    grap = get_grap_alert(aqi)
    return {
        "advisory": advisory,
        "grap": grap,
    }


# ═══════════════════════════════════════════════
# Vulnerability Index
# ═══════════════════════════════════════════════

@app.get("/ml/vulnerability")
def vulnerability():
    """Compute vulnerability index for all wards."""
    try:
        stations_df = get_latest()
        if len(stations_df) == 0:
            raise ValueError("Empty")
    except Exception:
        stations_df = pd.read_csv(STATIONS_CSV)
        np.random.seed(42)
        stations_df["pm25"] = np.random.uniform(40, 300, len(stations_df)).round(1)

    try:
        wards, geojson = load_ward_geojson()
        ward_df, geojson_data = compute_ward_aqi(stations_df, wards, geojson)
        vuln_df = compute_vulnerability_index(ward_df, geojson_data)
        return {
            "vulnerability": vuln_df.to_dict(orient="records"),
            "n_wards": len(vuln_df),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════
# Data Cache Status
# ═══════════════════════════════════════════════

@app.get("/ml/cache-status")
def cache_status():
    """Check SQLite cache freshness."""
    try:
        staleness = get_staleness_minutes()
        latest = get_latest()
        return {
            "staleness_minutes": round(staleness, 1),
            "n_stations_cached": len(latest),
            "db_path": SQLITE_DB,
            "db_exists": os.path.exists(SQLITE_DB),
        }
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════
# Model Info
# ═══════════════════════════════════════════════

@app.get("/ml/model-info")
def model_info():
    """Return details about loaded ML models."""
    info = {
        "xgboost": {
            "loaded": XGB_LOADED,
            "path": XGB_MODEL_PATH,
            "classes": SOURCE_TYPES,
            "n_features": len(FEATURE_NAMES),
            "feature_names": FEATURE_NAMES,
        },
        "prophet": {
            "loaded": PROPHET_LOADED,
            "path": PROPHET_DIR,
            "n_models": len(os.listdir(PROPHET_DIR)) if PROPHET_LOADED else 0,
        },
        "lstm": {
            "available": TORCH_AVAILABLE,
            "architecture": "2-layer LSTM, 64 hidden, dropout 0.2" if TORCH_AVAILABLE else "PyTorch not installed",
            "input_features": ["pm25", "temperature", "humidity", "wind_speed"],
            "lookback": 24,
            "horizon": 48,
        },
        "interpolation": {
            "idw": {"power": 2, "description": "Inverse Distance Weighting"},
            "kriging": {"variogram": "spherical", "description": "Ordinary Kriging with auto-fit variogram"},
        },
        "fingerprinting": {
            "n_sources": len(SOURCE_TYPES),
            "sources": list(SOURCE_TYPES),
            "signals": {
                "road_dust": "PM10/PM25 ratio, daytime, summer",
                "construction_dust": "PM10/PM25 >3.5, working hours 9-17",
                "biomass_burning": "Fine fraction, winter, evening, high CO",
                "vehicular_traffic": "High NO2, rush hours, CO",
                "industrial": "High SO2, daytime",
                "secondary_aerosols": "Very fine particles, winter inversions",
                "waste_burning": "CO >4, evening, winter",
                "diesel_generators": "NO2 + SO2, peak power hours 10-16",
            },
        },
    }
    return info


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
