"""Flask API serving the LightGBM delivery-time model.

Run:  python app.py        (dev, port 5000)
      gunicorn app:app     (prod)
"""

import os
from datetime import datetime
from zoneinfo import ZoneInfo

from flask import Flask, jsonify, request
from flask_cors import CORS

import predictor
import utils
from weather import get_weather

app = Flask(__name__)
CORS(app, origins=os.getenv("ALLOWED_ORIGINS").split(","))

DEFAULT_LAT = float(os.getenv("DEFAULT_LAT", 30.3165))   # Dehradun
DEFAULT_LON = float(os.getenv("DEFAULT_LON", 78.0322))
TIMEZONE = os.getenv("TIMEZONE", "Asia/Kolkata")


def _bad(message, code=400):
    return jsonify({"error": message}), code


@app.get("/api/health")
def health():
    try:
        cols = predictor.feature_columns()
        return jsonify({"status": "ok", "model_loaded": True, "n_features": len(cols)})
    except FileNotFoundError as exc:
        return jsonify({"status": "degraded", "model_loaded": False, "error": str(exc)}), 503


@app.get("/api/context")
def context():
    """Everything the app collects on the user's behalf: time, weather, traffic, festival."""
    try:
        lat = float(request.args.get("lat", DEFAULT_LAT))
        lon = float(request.args.get("lon", DEFAULT_LON))
    except ValueError:
        return _bad("lat and lon must be numbers")

    if not utils.coords_look_valid(lat, lon):
        lat, lon = DEFAULT_LAT, DEFAULT_LON

    now = datetime.now(ZoneInfo(TIMEZONE))
    wx = get_weather(lat, lon)

    return jsonify({
        "order_hour": now.hour,
        "local_time": now.strftime("%H:%M"),
        "timezone": TIMEZONE,
        "weather": wx["category"],
        "weather_detail": wx,
        "road_traffic_density": utils.traffic_for_hour(now.hour),
        "festival": utils.is_festival(now.date()),
        "location": {"lat": lat, "lon": lon},
    })


@app.post("/api/predict")
def predict():
    body = request.get_json(silent=True) or {}
    warnings = []

    # --- distance: either supplied, or derived from the two coordinate pairs
    if "distance_km" in body:
        try:
            distance = float(body["distance_km"])
        except (TypeError, ValueError):
            return _bad("distance_km must be a number")
    else:
        required = ["restaurant_lat", "restaurant_lng", "delivery_lat", "delivery_lng"]
        missing = [k for k in required if k not in body]
        if missing:
            return _bad(f"Provide distance_km, or all of: {', '.join(required)}")
        try:
            r_lat, r_lng = abs(float(body["restaurant_lat"])), abs(float(body["restaurant_lng"]))
            d_lat, d_lng = abs(float(body["delivery_lat"])), abs(float(body["delivery_lng"]))
        except (TypeError, ValueError):
            return _bad("Coordinates must be numbers")
        for name, (la, lo) in {
            "restaurant": (r_lat, r_lng),
            "delivery address": (d_lat, d_lng),
        }.items():
            if not utils.coords_look_valid(la, lo):
                return _bad(f"{name.capitalize()} coordinates fall outside India's valid range")
        distance = utils.haversine_km(r_lat, r_lng, d_lat, d_lng)

    distance, dist_warning = utils.clamp_distance(distance)
    if dist_warning:
        warnings.append(dist_warning)

    # --- categorical validation against the training vocabulary
    checks = [
        ("Weather_conditions", utils.WEATHER_CATEGORIES),
        ("Road_traffic_density", utils.TRAFFIC_CATEGORIES),
        ("Type_of_vehicle", utils.VEHICLE_TYPES),
        ("City", utils.CITY_CATEGORIES),
    ]
    for field, allowed in checks:
        if body.get(field) not in allowed:
            return _bad(f"{field} must be one of {allowed}, got {body.get(field)!r}")

    try:
        vehicle_condition = int(body["Vehicle_condition"])
        age = float(body["Delivery_person_Age"])
        ratings = float(body["Delivery_person_Ratings"])
        deliveries = int(body["multiple_deliveries"])
        order_hour = int(body["order_hour"])
    except (KeyError, TypeError, ValueError) as exc:
        return _bad(f"Missing or malformed numeric field: {exc}")

    if vehicle_condition not in utils.VEHICLE_CONDITIONS:
        return _bad("Vehicle_condition must be 0, 1 or 2")
    if not 20 <= age <= 39:
        warnings.append(f"Age {age:.0f} is outside the observed 20-39 range.")
    if not 2.5 <= ratings <= 5.0:
        warnings.append(f"Rating {ratings} is outside the observed 2.5-5.0 range.")
    if not 0 <= deliveries <= 3:
        return _bad("multiple_deliveries must be 0-3")
    if not 0 <= order_hour <= 23:
        return _bad("order_hour must be 0-23")

    festival = "Yes" if str(body.get("Festival", "No")).lower() in ("yes", "1", "true") else "No"

    features = {
        "Delivery_person_Age": age,
        "Delivery_person_Ratings": ratings,
        "multiple_deliveries": deliveries,
        "distance_km": round(distance, 3),
        "order_hour": order_hour,
        "Festival": festival,
        "Road_traffic_density": body["Road_traffic_density"],
        "Weather_conditions": body["Weather_conditions"],
        "Vehicle_condition": vehicle_condition,
        "Type_of_vehicle": body["Type_of_vehicle"],
        "City": body["City"],
    }

    try:
        minutes = predictor.predict_minutes(features)
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 503

    low, high = utils.eta_window(minutes, predictor.TEST_MAE)

    if features["City"] == "Semi-Urban":
        warnings.append("Semi-Urban is supported by only 156 training rows. Treat this ETA as high-uncertainty.")
    if festival == "Yes":
        warnings.append("Festival days appear in only 2% of training rows.")

    return jsonify({
        "predicted_minutes": round(minutes, 2),
        "eta_low": low,
        "eta_high": high,
        "mae": predictor.TEST_MAE,
        "features_used": features,
        "warnings": warnings,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
