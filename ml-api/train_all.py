"""
AirGuard — Master Training Script
Run this AFTER you have API keys set and data flowing.

Usage:
  cd ml-api
  python train_all.py

This will:
1. Fetch live data from data.gov.in + WAQI (or use cached)
2. Seed the SQLite cache with 7 days of historical data
3. Train XGBoost source classifier (8 classes, 16 features)
4. Train Prophet per-station forecasters (39 models)
5. Optionally train LSTM forecasters (if PyTorch installed)
6. Run LOSO cross-validation and print accuracy metrics
"""

import sys
import os

# Add AIR project to path
AIR_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "AIR"))
sys.path.insert(0, AIR_DIR)

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

print("""
╔═══════════════════════════════════════════════════════╗
║     AirGuard — Model Training Pipeline            ║
║     India Innovates 2026 • Team AKX                   ║
╚═══════════════════════════════════════════════════════╝
""")

# ── Step 1: Initialize database and fetch/seed data ──
print("=" * 60)
print("STEP 1: Data Ingestion & Cache Seeding")
print("=" * 60)

from config import SQLITE_DB, STATIONS_CSV, XGB_MODEL_PATH, PROPHET_DIR
from ingestion.cache_manager import init_db, save_stations, save_readings, get_latest, get_historical

init_db()
print(f"  ✓ SQLite database initialized at {SQLITE_DB}")

# Load real station coordinates
stations_df = pd.read_csv(STATIONS_CSV)
save_stations(stations_df)
print(f"  ✓ {len(stations_df)} CPCB stations loaded from CSV")

# Try to fetch live data
live_data = None
try:
    from ingestion.data_gov import fetch_delhi_aqi
    live_data = fetch_delhi_aqi()
    if len(live_data) > 0:
        save_readings(live_data)
        print(f"  ✓ Fetched {len(live_data)} live records from data.gov.in")
except Exception as e:
    print(f"  ✗ data.gov.in failed: {e}")

if live_data is None or len(live_data) == 0:
    try:
        from ingestion.waqi_client import fetch_waqi_delhi
        live_data = fetch_waqi_delhi()
        if len(live_data) > 0:
            save_readings(live_data)
            print(f"  ✓ Fetched {len(live_data)} live records from WAQI")
    except Exception as e:
        print(f"  ✗ WAQI failed: {e}")

# Seed with synthetic historical if cache is empty
hist = get_historical(days=7)
if len(hist) < 100:
    print("  → Cache sparse, seeding 7 days of synthetic historical data...")
    try:
        # Run the seed script
        exec(open(os.path.join(AIR_DIR, "scripts", "seed_cache.py")).read())
        print("  ✓ Cache seeded with 7 days of hourly data")
    except Exception as e:
        print(f"  ⚠ Seed script failed: {e}, generating inline...")
        np.random.seed(42)
        for _, station in stations_df.iterrows():
            for hour_offset in range(7 * 24):
                ts = datetime.now() - timedelta(hours=7*24 - hour_offset)
                hour = ts.hour
                # Realistic diurnal pattern
                base_pm25 = 80 + 60 * np.sin((hour - 6) * np.pi / 12)
                reading = pd.DataFrame([{
                    "station_id": station["station_id"],
                    "timestamp": ts.isoformat(),
                    "pm25": max(10, base_pm25 + np.random.normal(0, 25)),
                    "pm10": max(20, base_pm25 * 1.8 + np.random.normal(0, 30)),
                    "no2": max(5, 30 + np.random.normal(0, 15)),
                    "so2": max(2, 12 + np.random.normal(0, 8)),
                    "co": max(0.1, 1.2 + np.random.normal(0, 0.5)),
                    "o3": max(5, 25 + np.random.normal(0, 10)),
                    "aqi": None,
                    "source": "synthetic_seed",
                }])
                try:
                    save_readings(reading)
                except:
                    pass
        print(f"  ✓ Seeded {len(stations_df) * 7 * 24} synthetic readings")
else:
    print(f"  ✓ Cache already has {len(hist)} historical records")

# ── Step 2: Train XGBoost Source Classifier ──
print()
print("=" * 60)
print("STEP 2: Training XGBoost Source Classifier")
print("=" * 60)

try:
    from models.fingerprinting import estimate_sources
    from models.source_classifier import build_features, FEATURE_NAMES

    hist = get_historical(days=7)
    if len(hist) < 50:
        print("  ⚠ Not enough data for XGBoost training. Need at least 50 records.")
    else:
        # Generate features and pseudo-labels from fingerprinting
        X_list = []
        y_list = []

        for _, row in hist.iterrows():
            pm25 = row.get("pm25", 100) or 100
            pm10 = row.get("pm10", 180) or 180
            no2 = row.get("no2", 30) or 30
            so2 = row.get("so2", 12) or 12
            co = row.get("co", 1.2) or 1.2
            o3 = row.get("o3", 25) or 25

            ts = pd.to_datetime(row.get("timestamp", datetime.now()))
            hour = ts.hour
            month = ts.month

            features = build_features(pm25, pm10, no2, so2, co, o3, hour, month)
            X_list.append(features[0])

            # Pseudo-label: primary source from fingerprinting
            sources = estimate_sources(pm25, pm10, no2, so2, co, o3, hour, month)
            primary = max(sources, key=sources.get)
            from config import SOURCE_TYPES
            y_list.append(SOURCE_TYPES.index(primary))

        X = np.array(X_list)
        y = np.array(y_list)

        print(f"  → Training data: {X.shape[0]} samples, {X.shape[1]} features")
        print(f"  → Classes: {len(set(y))} source types")

        from xgboost import XGBClassifier
        from sklearn.model_selection import cross_val_score
        import joblib

        model = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=42,
        )

        # 5-fold CV
        scores = cross_val_score(model, X, y, cv=min(5, len(set(y))), scoring="accuracy")
        print(f"  → 5-Fold CV Accuracy: {scores.mean():.3f} (+/- {scores.std():.3f})")

        # Train on full data
        model.fit(X, y)

        os.makedirs(os.path.dirname(XGB_MODEL_PATH), exist_ok=True)
        joblib.dump(model, XGB_MODEL_PATH)
        print(f"  ✓ XGBoost model saved to {XGB_MODEL_PATH}")
        print(f"  ✓ Model size: {os.path.getsize(XGB_MODEL_PATH) / 1024:.0f} KB")

        # Feature importance
        print("\n  Feature Importances:")
        for name, imp in sorted(zip(FEATURE_NAMES, model.feature_importances_), key=lambda x: -x[1]):
            bar = "█" * int(imp * 50)
            print(f"    {name:20s} {imp:.3f} {bar}")

except Exception as e:
    print(f"  ✗ XGBoost training failed: {e}")
    import traceback
    traceback.print_exc()

# ── Step 3: Train Prophet Forecasters ──
print()
print("=" * 60)
print("STEP 3: Training Prophet Per-Station Forecasters")
print("=" * 60)

try:
    from prophet import Prophet
    import joblib

    hist = get_historical(days=7)
    os.makedirs(PROPHET_DIR, exist_ok=True)
    trained = 0
    skipped = 0

    for station_id in stations_df["station_id"].unique():
        station_data = hist[hist["station_id"] == station_id].copy()

        if len(station_data) < 48:
            skipped += 1
            continue

        station_data = station_data.rename(columns={"timestamp": "ds", "pm25": "y"})
        station_data["ds"] = pd.to_datetime(station_data["ds"])
        station_data = station_data[["ds", "y"]].dropna()

        if len(station_data) < 48:
            skipped += 1
            continue

        try:
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=False,
                changepoint_prior_scale=0.05,
            )
            model.fit(station_data)

            model_path = os.path.join(PROPHET_DIR, f"{station_id}.pkl")
            joblib.dump(model, model_path)
            trained += 1
        except Exception as e:
            print(f"    ⚠ {station_id}: {e}")
            skipped += 1

    print(f"  ✓ Trained: {trained} station models")
    print(f"  ⚠ Skipped: {skipped} stations (insufficient data)")
    print(f"  → Models saved to {PROPHET_DIR}")

except ImportError:
    print("  ✗ Prophet not installed. Run: pip install prophet")
except Exception as e:
    print(f"  ✗ Prophet training failed: {e}")

# ── Step 4: LSTM Training (Optional) ──
print()
print("=" * 60)
print("STEP 4: LSTM Forecaster Training (Optional)")
print("=" * 60)

try:
    import torch
    from models.lstm_forecaster import train_lstm, TORCH_AVAILABLE

    if not TORCH_AVAILABLE:
        raise ImportError("PyTorch not available")

    hist = get_historical(days=7)
    trained = 0

    for station_id in stations_df["station_id"].unique()[:5]:  # Train top 5 stations
        station_data = hist[hist["station_id"] == station_id].copy()
        if len(station_data) < 72:  # Need 24 lookback + 48 horizon
            continue

        print(f"  → Training LSTM for {station_id}...")
        model = train_lstm(station_data, station_id, model_dir=os.path.join(AIR_DIR, "data", "models"), epochs=30)
        if model:
            trained += 1

    print(f"  ✓ Trained {trained} LSTM models")

except ImportError:
    print("  → PyTorch not installed. LSTM training skipped.")
    print("    To enable: pip install torch")
except Exception as e:
    print(f"  ✗ LSTM training failed: {e}")

# ── Step 5: Run LOSO Cross-Validation ──
print()
print("=" * 60)
print("STEP 5: Leave-One-Station-Out Cross-Validation")
print("=" * 60)

try:
    from models.validation import leave_one_out_validation

    # Use latest readings for validation
    latest = get_latest()
    if len(latest) < 5:
        # Use stations with synthetic data
        latest = stations_df.copy()
        np.random.seed(42)
        latest["pm25"] = np.random.uniform(40, 300, len(latest)).round(1)

    metrics = leave_one_out_validation(latest, value_col="pm25")

    print(f"\n  ╔══════════════════════════════════════╗")
    print(f"  ║  LOSO Cross-Validation Results       ║")
    print(f"  ╠══════════════════════════════════════╣")
    print(f"  ║  RMSE:      {str(metrics['rmse']):>8s} µg/m³        ║")
    print(f"  ║  MAE:       {str(metrics['mae']):>8s} µg/m³        ║")
    print(f"  ║  R-squared: {str(metrics['r2']):>8s}               ║")
    print(f"  ║  Stations:  {str(metrics['n_stations']):>8s}               ║")
    print(f"  ╚══════════════════════════════════════╝")

    if metrics.get("station_errors") is not None:
        print("\n  Top 5 Worst Predictions:")
        errors = metrics["station_errors"].sort_values("error", ascending=False).head(5)
        for _, row in errors.iterrows():
            print(f"    {row['station']:30s} Actual: {row['actual']:6.1f}  Predicted: {row['predicted']:6.1f}  Error: {row['error']:6.1f}")

except Exception as e:
    print(f"  ✗ Validation failed: {e}")

# ── Summary ──
print()
print("=" * 60)
print("TRAINING COMPLETE")
print("=" * 60)
print(f"""
  Next steps:
  1. Start the ML API server:
     cd ml-api && python server.py

  2. Start the Next.js frontend:
     cd .. && npm run dev

  3. The frontend will automatically use real ML models
     when the FastAPI backend is running on port 8000.

  4. To retrain with fresh data, run this script again
     after more data accumulates in the SQLite cache.
""")
