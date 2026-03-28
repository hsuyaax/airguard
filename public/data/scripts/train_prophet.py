"""
Train Prophet forecasting models for each CPCB station.

Usage: python scripts/train_prophet.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import joblib
from prophet import Prophet
from ingestion.cache_manager import init_db, get_historical
from config import PROPHET_DIR


def train():
    print("Loading historical data...")
    init_db()
    df = get_historical(days=7)

    if len(df) == 0:
        print("No historical data found. Run scripts/seed_cache.py first.")
        return

    print(f"  Loaded {len(df)} readings.")

    os.makedirs(PROPHET_DIR, exist_ok=True)

    stations = df["station_id"].unique()
    print(f"  Training models for {len(stations)} stations...")

    for i, station_id in enumerate(stations):
        station_df = df[df["station_id"] == station_id].copy()
        station_df = station_df.dropna(subset=["pm25"])

        if len(station_df) < 48:  # Need at least 2 days of data
            print(f"  [{i+1}/{len(stations)}] {station_id}: SKIPPED (only {len(station_df)} points)")
            continue

        # Prepare Prophet format
        prophet_df = pd.DataFrame({
            "ds": pd.to_datetime(station_df["timestamp"]),
            "y": station_df["pm25"].values,
        })
        prophet_df = prophet_df.sort_values("ds").drop_duplicates(subset=["ds"])

        try:
            model = Prophet(
                yearly_seasonality=False,
                weekly_seasonality=True,
                daily_seasonality=True,
                changepoint_prior_scale=0.05,
            )
            model.fit(prophet_df)

            model_path = os.path.join(PROPHET_DIR, f"{station_id}.pkl")
            joblib.dump(model, model_path)
            print(f"  [{i+1}/{len(stations)}] {station_id}: OK ({len(prophet_df)} points)")
        except Exception as e:
            print(f"  [{i+1}/{len(stations)}] {station_id}: FAILED ({e})")

    print(f"\nProphet models saved to {PROPHET_DIR}")


if __name__ == "__main__":
    train()
