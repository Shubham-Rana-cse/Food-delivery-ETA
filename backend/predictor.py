"""Loads the LightGBM artefact and reproduces the training-time preprocessing.

The single most important thing in this file is `build_feature_frame`. At
training time the categoricals were one-hot encoded with `drop_first=True`.
At inference time a single order only ever contains ONE category per column,
so calling `get_dummies(..., drop_first=True)` again would silently delete it
and produce an all-zero row. Instead:

    1. one-hot WITHOUT drop_first
    2. reindex against the saved feature_columns list

Reindexing discards any dummy that was the dropped baseline, and fills in 0
for every category the order doesn't have. A baseline-category order therefore
correctly becomes all zeros across that column group. This is step 6 of the
deployment pipeline in report §12 — where deployment bugs concentrate.
"""

import os
from functools import lru_cache

import joblib
import pandas as pd

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "lgbm_delivery_model.pkl")
COLUMNS_PATH = os.path.join(MODEL_DIR, "feature_columns.pkl")

CATEGORICAL_COLUMNS = [
    "Road_traffic_density",
    "Weather_conditions",
    "Vehicle_condition",
    "Type_of_vehicle",
    "City",
]

TEST_MAE = 3.11  # report §10


@lru_cache(maxsize=1)
def _load():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Export lgbm_delivery_model.pkl "
            "and feature_columns.pkl from the Kaggle notebook into backend/models/."
        )
    model = joblib.load(MODEL_PATH)
    feature_columns = joblib.load(COLUMNS_PATH)
    return model, list(feature_columns)


def feature_columns():
    return _load()[1]


def build_feature_frame(raw: dict) -> pd.DataFrame:
    """raw -> a 1-row DataFrame whose columns exactly match training."""
    _, cols = _load()

    row = {
        "Delivery_person_Age": float(raw["Delivery_person_Age"]),
        "Delivery_person_Ratings": float(raw["Delivery_person_Ratings"]),
        "multiple_deliveries": float(raw["multiple_deliveries"]),
        "distance_km": float(raw["distance_km"]),
        "order_hour": int(raw["order_hour"]),
        "Festival": 1 if str(raw["Festival"]).strip().lower() in ("yes", "1", "true") else 0,
        "Road_traffic_density": str(raw["Road_traffic_density"]),
        "Weather_conditions": str(raw["Weather_conditions"]),
        "Vehicle_condition": int(raw["Vehicle_condition"]),
        "Type_of_vehicle": str(raw["Type_of_vehicle"]),
        "City": str(raw["City"]),
    }

    df = pd.DataFrame([row])
    df = pd.get_dummies(df, columns=CATEGORICAL_COLUMNS, drop_first=False)
    df = df.reindex(columns=cols, fill_value=0)
    return df.astype(float)


def predict_minutes(raw: dict) -> float:
    model, _ = _load()
    X = build_feature_frame(raw)
    return float(model.predict(X)[0])
