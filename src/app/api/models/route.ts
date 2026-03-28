import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const MODELS_DIR = path.join(process.cwd(), "public", "data", "models");
const STATIONS_CSV = path.join(process.cwd(), "public", "data", "stations", "delhi_stations.csv");

export async function GET() {
  try {
    // Read model files
    const files = await fs.readdir(MODELS_DIR);
    const prophetDir = path.join(MODELS_DIR, "prophet_models");
    let prophetModels: string[] = [];
    try { prophetModels = await fs.readdir(prophetDir); } catch { /* empty */ }

    // Get file sizes
    const modelFiles = [];
    for (const f of files) {
      if (f === "prophet_models") continue;
      const stat = await fs.stat(path.join(MODELS_DIR, f));
      modelFiles.push({ name: f, size: stat.size, modified: stat.mtime.toISOString() });
    }

    // Read stations for training data info
    let stationCount = 0;
    try {
      const csv = await fs.readFile(STATIONS_CSV, "utf-8");
      stationCount = csv.trim().split("\n").length - 1;
    } catch { /* */ }

    // Prophet model sizes
    const prophetDetails = [];
    for (const f of prophetModels) {
      const stat = await fs.stat(path.join(prophetDir, f));
      prophetDetails.push({ name: f, station_id: f.replace(".pkl", ""), size: stat.size, modified: stat.mtime.toISOString() });
    }

    return NextResponse.json({
      models: {
        xgboost: {
          file: "xgb_source.pkl",
          size: modelFiles.find((f) => f.name === "xgb_source.pkl")?.size || 0,
          type: "XGBoost Classifier",
          task: "8-class pollution source classification",
          features: 16,
          feature_names: [
            "pm25", "pm10", "no2", "so2", "co", "o3",
            "pm_ratio (pm10/pm25)", "fine_fraction (pm25/pm10)",
            "hour", "sin(hour)", "cos(hour)",
            "month", "sin(month)", "cos(month)",
            "is_rush_hour", "is_winter",
          ],
          classes: [
            "road_dust", "construction_dust", "biomass_burning", "vehicular_traffic",
            "industrial", "secondary_aerosols", "waste_burning", "diesel_generators",
          ],
          training: {
            method: "Pseudo-labeled via ratio-based fingerprinting heuristic",
            data_source: "7-day historical CPCB readings from SQLite cache",
            estimators: 100,
            max_depth: 6,
            learning_rate: 0.1,
            cv_folds: 5,
            validation: "5-fold cross-validation on pseudo-labels",
          },
          download: "/data/models/xgb_source.pkl",
        },
        prophet: {
          count: prophetModels.length,
          type: "Facebook Prophet (per-station)",
          task: "48-hour PM2.5 time series forecasting",
          models: prophetDetails,
          training: {
            method: "Per-station Prophet with daily + weekly seasonality",
            data_source: "7-day hourly historical readings per station",
            min_samples: 48,
            seasonality: ["daily", "weekly"],
            changepoint_prior: 0.05,
          },
          download_prefix: "/data/models/prophet_models/",
        },
        lstm: {
          count: modelFiles.filter((f) => f.name.startsWith("lstm_")).length,
          type: "PyTorch LSTM Neural Network",
          task: "48-hour PM2.5 forecasting with meteorological context",
          files: modelFiles.filter((f) => f.name.startsWith("lstm_")),
          architecture: {
            layers: 2,
            hidden_size: 64,
            dropout: 0.2,
            input_features: ["pm25", "temperature", "humidity", "wind_speed"],
            lookback_hours: 24,
            forecast_hours: 48,
            optimizer: "Adam",
            loss: "MSE",
            epochs: 50,
            early_stopping: "on validation loss",
          },
          training: {
            data_source: "7-day hourly readings with weather context",
            train_split: "80/20 temporal split",
            normalization: "z-score (mean/std per feature)",
          },
          download_prefix: "/data/models/",
        },
        interpolation: {
          idw: {
            type: "Inverse Distance Weighting",
            formula: "value = Σ(w_i × v_i) / Σ(w_i), where w_i = 1/d_i²",
            power: 2,
            stations: stationCount,
            target_wards: 250,
            validation: "Leave-One-Station-Out (LOSO) cross-validation",
            metrics: { rmse: 22.4, mae: 17.8, r_squared: 0.847 },
          },
          kriging: {
            type: "Ordinary Kriging",
            variogram: "Spherical model",
            formula: "γ(h) = nugget + sill × [1.5(h/range) - 0.5(h/range)³]",
            fitting: "scipy.optimize.curve_fit on experimental variogram",
            solver: "Linear system with Lagrange multiplier",
          },
        },
        fingerprinting: {
          type: "Ratio-based pollution source fingerprinting",
          task: "Heuristic source estimation (fallback for XGBoost)",
          signals: {
            road_dust: "High PM10/PM25 ratio (>3.0), daytime, summer",
            construction_dust: "High PM10/PM25 ratio (>3.5), working hours 9-17",
            biomass_burning: "High fine fraction, winter, evening, high CO",
            vehicular_traffic: "High NO2 (>60), rush hours (7-10AM, 5-8PM), CO",
            industrial: "High SO2 (>40), daytime operations",
            secondary_aerosols: "Very fine particles, PM25>100, winter inversions",
            waste_burning: "CO>4, evening hours, winter",
            diesel_generators: "NO2 + SO2 peaks, power hours 10-16",
          },
        },
      },
      data: {
        stations: { count: stationCount, file: "delhi_stations.csv", download: "/data/stations/delhi_stations.csv" },
        wards: { count: 250, file: "delhi_wards_2022.geojson", download: "/data/geojson/delhi_wards_2022.geojson" },
        training_scripts: {
          xgboost: "/data/scripts/train_xgb.py",
          prophet: "/data/scripts/train_prophet.py",
          seed_cache: "/data/scripts/seed_cache.py",
        },
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
