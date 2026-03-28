"""
Seed SQLite cache with synthetic Delhi AQI data.
Run ONCE before competition day to ensure demo never depends on live API.

Usage: python scripts/seed_cache.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ingestion.cache_manager import init_db, save_stations, save_readings
from config import STATIONS_CSV


def seed():
    print("Initializing database...")
    init_db()

    # Load station metadata
    print("Loading station metadata...")
    stations = pd.read_csv(STATIONS_CSV)
    save_stations(stations)
    print(f"  Saved {len(stations)} stations.")

    # Generate 7 days of hourly synthetic data
    print("Generating 7 days of synthetic hourly data...")
    np.random.seed(42)
    now = datetime.now()
    hours = 7 * 24  # 7 days

    records = []
    for _, station in stations.iterrows():
        # Base pollution level (varies by station location)
        base_pm25 = np.random.uniform(50, 200)
        base_pm10 = base_pm25 * np.random.uniform(1.3, 2.2)

        for h in range(hours):
            ts = now - timedelta(hours=hours - h)
            hour_of_day = ts.hour

            # Diurnal pattern: higher in morning rush and evening
            diurnal = 1.0
            if hour_of_day in [7, 8, 9, 10]:
                diurnal = 1.3
            elif hour_of_day in [17, 18, 19, 20]:
                diurnal = 1.4
            elif hour_of_day in [2, 3, 4, 5]:
                diurnal = 0.7

            # Random walk for realistic variation
            noise = np.random.normal(0, 15)

            pm25 = max(10, base_pm25 * diurnal + noise)
            pm10 = max(20, base_pm10 * diurnal + noise * 1.5)
            no2 = max(5, np.random.uniform(20, 100) * diurnal)
            so2 = max(2, np.random.uniform(5, 40))
            co = max(0.2, np.random.uniform(0.5, 3.0))
            o3 = max(5, np.random.uniform(10, 60) * (1.5 if 10 <= hour_of_day <= 16 else 0.7))

            # AQI from PM2.5 (simplified)
            aqi = min(500, max(0, pm25 * 1.67))

            records.append({
                "station_id": station["station_id"],
                "timestamp": ts.isoformat(),
                "pm25": round(pm25, 1),
                "pm10": round(pm10, 1),
                "no2": round(no2, 1),
                "so2": round(so2, 1),
                "co": round(co, 2),
                "o3": round(o3, 1),
                "aqi": round(aqi),
                "source": "synthetic",
            })

        # Update base for next station
        base_pm25 += np.random.uniform(-20, 20)

    df = pd.DataFrame(records)
    print(f"  Generated {len(df)} readings for {len(stations)} stations.")

    # Save in batches
    batch_size = 5000
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i + batch_size]
        save_readings(batch)
        print(f"  Saved batch {i // batch_size + 1}/{(len(df) - 1) // batch_size + 1}")

    print(f"\nCache seeded successfully!")
    print(f"  Database: {os.path.join('data', 'cache', 'airguard.db')}")
    print(f"  Stations: {len(stations)}")
    print(f"  Readings: {len(df)}")
    print(f"  Time range: {df['timestamp'].min()} to {df['timestamp'].max()}")


if __name__ == "__main__":
    seed()
