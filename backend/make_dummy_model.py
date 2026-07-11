"""Generates a throwaway model + feature_columns so you can run the full stack
before exporting the real artefacts from Kaggle. Delete both files afterwards.

    python make_dummy_model.py
"""

import os

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor

FEATURE_COLUMNS = [
    "Delivery_person_Age",
    "Delivery_person_Ratings",
    "multiple_deliveries",
    "distance_km",
    "order_hour",
    "Festival",
    "Road_traffic_density_Low",
    "Road_traffic_density_Medium",
    "Road_traffic_density_Jam",
    "Weather_conditions_Fog",
    "Weather_conditions_Sandstorms",
    "Weather_conditions_Stormy",
    "Weather_conditions_Sunny",
    "Weather_conditions_Windy",
    "Vehicle_condition_1",
    "Vehicle_condition_2",
    "Type_of_vehicle_motorcycle",
    "Type_of_vehicle_scooter",
    "City_Semi-Urban",
    "City_Urban",
]

if __name__ == "__main__":
    rng = np.random.default_rng(0)
    X = pd.DataFrame(rng.random((2000, len(FEATURE_COLUMNS))), columns=FEATURE_COLUMNS)
    X["distance_km"] = rng.uniform(1.5, 21, 2000)
    X["order_hour"] = rng.integers(0, 24, 2000)
    y = 12 + 0.6 * X["distance_km"] + 4 * X["Road_traffic_density_Jam"] + rng.normal(0, 2, 2000)

    model = LGBMRegressor(n_estimators=60, verbose=-1).fit(X, y)

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/lgbm_delivery_model.pkl")
    joblib.dump(FEATURE_COLUMNS, "models/feature_columns.pkl")
    print("Wrote dummy artefacts. Replace with the real ones before you trust any number.")
