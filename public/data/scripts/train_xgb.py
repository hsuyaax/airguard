"""
Train XGBoost source classifier using pseudo-labels from fingerprinting.

Usage: python scripts/train_xgb.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from sklearn.model_selection import cross_val_score
from xgboost import XGBClassifier
from ingestion.cache_manager import init_db, get_historical
from models.fingerprinting import estimate_sources, get_primary_source
from models.source_classifier import build_features, FEATURE_NAMES
from config import XGB_MODEL_PATH, SOURCE_TYPES


def train():
    print("Loading historical data...")
    init_db()
    df = get_historical(days=7)

    if len(df) == 0:
        print("No historical data found. Run scripts/seed_cache.py first.")
        return

    print(f"  Loaded {len(df)} readings.")

    # Generate pseudo-labels and features
    print("Generating features and pseudo-labels...")
    X_list = []
    y_list = []

    for _, row in df.iterrows():
        ts = datetime.fromisoformat(row["timestamp"]) if isinstance(row["timestamp"], str) else row["timestamp"]
        hour = ts.hour
        month = ts.month

        features = build_features(
            row.get("pm25"), row.get("pm10"), row.get("no2"),
            row.get("so2"), row.get("co"), row.get("o3"),
            hour, month,
        )
        X_list.append(features.flatten())

        # Pseudo-label from fingerprinting heuristic
        sources = estimate_sources(
            row.get("pm25"), row.get("pm10"), row.get("no2"),
            row.get("so2"), row.get("co"), row.get("o3"),
            hour, month,
        )
        primary = get_primary_source(sources)
        y_list.append(SOURCE_TYPES.index(primary))

    X = np.array(X_list)
    y = np.array(y_list)
    print(f"  Features: {X.shape}, Labels: {len(np.unique(y))} classes")

    # Train XGBoost
    print("Training XGBoost classifier...")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        objective="multi:softprob",
        num_class=len(SOURCE_TYPES),
        random_state=42,
        verbosity=0,
    )

    # Cross-validation
    scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    print(f"  Cross-validation accuracy: {scores.mean():.3f} (+/- {scores.std():.3f})")

    # Train on full data
    model.fit(X, y)

    # Save model
    os.makedirs(os.path.dirname(XGB_MODEL_PATH), exist_ok=True)
    joblib.dump(model, XGB_MODEL_PATH)
    print(f"  Model saved to {XGB_MODEL_PATH}")

    # Feature importance
    importances = model.feature_importances_
    print("\n  Feature Importances:")
    for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True):
        bar = "#" * int(imp * 50)
        print(f"    {name:20s} {imp:.4f} {bar}")


if __name__ == "__main__":
    train()
