"""Open-Meteo -> Weather_conditions category.

Open-Meteo needs no API key. It returns a WMO weather code, which we collapse
onto the six categories the model was trained on. The dataset has no "Rain"
class, so rain/drizzle/thunder all fold into Stormy. "Sandstorms" is not
derivable from any weather API and is only reachable via manual override.
"""

import time
from typing import Tuple

import requests

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
WIND_THRESHOLD_KMH = 25.0
CACHE_TTL_SECONDS = 600

_cache: dict[Tuple[float, float], tuple[float, dict]] = {}


def _wmo_to_category(code: int, wind_kmh: float) -> str:
    if code in (45, 48):
        return "Fog"
    if 51 <= code <= 67 or 80 <= code <= 82 or 95 <= code <= 99:
        return "Stormy"
    if 71 <= code <= 77 or 85 <= code <= 86:
        return "Cloudy"  # snow: nearest available class
    if wind_kmh >= WIND_THRESHOLD_KMH:
        return "Windy"
    if code in (0, 1):
        return "Sunny"
    if code in (2, 3):
        return "Cloudy"
    return "Sunny"


def get_weather(lat: float, lon: float) -> dict:
    """Returns {category, code, temperature_c, wind_kmh, source}."""
    key = (round(lat, 2), round(lon, 2))
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL_SECONDS:
        return hit[1]

    try:
        resp = requests.get(
            OPEN_METEO_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,weather_code,wind_speed_10m",
                "wind_speed_unit": "kmh",
                "timezone": "auto",
            },
            timeout=6,
        )
        resp.raise_for_status()
        current = resp.json()["current"]
        code = int(current["weather_code"])
        wind = float(current["wind_speed_10m"])
        result = {
            "category": _wmo_to_category(code, wind),
            "code": code,
            "temperature_c": float(current["temperature_2m"]),
            "wind_kmh": wind,
            "source": "open-meteo",
        }
    except Exception as exc:  # network down, rate limited, schema change
        result = {
            "category": "Sunny",
            "code": None,
            "temperature_c": None,
            "wind_kmh": None,
            "source": "fallback",
            "error": str(exc),
        }

    _cache[key] = (time.time(), result)
    return result
