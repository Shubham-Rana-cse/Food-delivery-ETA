"""Pure helpers shared by the API layer. No model imports here."""

import math
from datetime import date

# --- Training-time distance envelope (report §5.1) -------------------------
DIST_MIN_KM = 1.47
DIST_MAX_KM = 20.97

# --- Category vocabularies the model was trained on ------------------------
WEATHER_CATEGORIES = ["Sunny", "Cloudy", "Fog", "Stormy", "Sandstorms", "Windy"]
TRAFFIC_CATEGORIES = ["Low", "Medium", "High", "Jam"]
VEHICLE_TYPES = ["motorcycle", "scooter", "electric_scooter"]
VEHICLE_CONDITIONS = [0, 1, 2]
# NOTE: "Metropolitian" is misspelled in the source dataset. Keep it.
CITY_CATEGORIES = ["Metropolitian", "Urban", "Semi-Urban"]

# --- Festival calendar (hardcoded demo set, MM-DD) -------------------------
FESTIVAL_DAYS = {
    "01-01",  # New Year
    "01-26",  # Republic Day
    "03-03",  # Holi (approx)
    "03-20",  # Eid al-Fitr (approx)
    "08-15",  # Independence Day
    "08-26",  # Janmashtami (approx)
    "10-02",  # Gandhi Jayanti
    "10-20",  # Dussehra (approx)
    "11-08",  # Diwali (approx)
    "12-25",  # Christmas
    "01-13",  # Lohri
    "01-14",  # Makar Sankranti / Pongal
    "02-14",  # Valentine's Day
    "03-25",  # Holika Dahan (approx)
    "04-10",  # Eid al-Adha / Bakrid (approx)
    "04-14",  # Baisakhi / Ambedkar Jayanti
    "04-18",  # Good Friday (approx)
    "05-12",  # Mother's Day (approx)
    "06-16",  # Father's Day (approx)
    "07-06",  # Muharram (approx)
    "08-09",  # Raksha Bandhan (approx)
    "08-27",  # Ganesh Chaturthi (approx)
    "09-05",  # Teacher's Day
    "09-15",  # Onam (approx)
    "10-10",  # Karwa Chauth (approx)
    "10-29",  # Dhanteras (approx)
    "10-31",  # Halloween
    "11-01",  # Govardhan Puja (approx)
    "11-02",  # Bhai Dooj (approx)
    "11-05",  # Guru Nanak Jayanti (approx)
    "11-14",  # Children's Day
    "12-24",  # Christmas Eve
    "12-31",  # New Year's Eve
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km. Identical formula to training (report §5.1)."""
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def clamp_distance(km: float):
    """Keep inference inside the range the model actually saw.

    Returns (clamped_km, warning_or_None).
    """
    if km < DIST_MIN_KM:
        return DIST_MIN_KM, f"Distance {km:.2f} km is below the training minimum; clamped to {DIST_MIN_KM} km."
    if km > DIST_MAX_KM:
        return DIST_MAX_KM, f"Distance {km:.2f} km is above the training maximum; clamped to {DIST_MAX_KM} km."
    return km, None


def traffic_for_hour(hour: int) -> str:
    """Stand-in for a live traffic feed. Mirrors the rush-hour curve in report §5.2."""
    if hour in (12, 13, 14):
        return "High"
    if hour in (17, 18, 19, 20, 21):
        return "Jam"
    if hour in (7, 8, 9, 15, 16, 22):
        return "Medium"
    return "Low"


def is_festival(on: date | None = None) -> str:
    on = on or date.today()
    return "Yes" if on.strftime("%m-%d") in FESTIVAL_DAYS else "No"


def coords_look_valid(lat: float, lon: float) -> bool:
    """India's coordinate envelope (report §3)."""
    return 8.0 <= abs(lat) <= 37.0 and 68.0 <= abs(lon) <= 97.0


def eta_window(minutes: float, mae: float = 3.11):
    """Turn a point estimate into an honest range (report §13)."""
    low = max(5, int(math.floor(minutes - mae)))
    high = int(math.ceil(minutes + mae))
    return low, high
