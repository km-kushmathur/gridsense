"""Deterministic mock data for offline GridSense development."""

from datetime import datetime, timedelta, timezone

try:
    from .grid_utils import clean_power_score_from_moer, emissions_band_from_score, region_label_for
except ImportError:
    from grid_utils import clean_power_score_from_moer, emissions_band_from_score, region_label_for

MOCK_CITY_COORDS: dict[str, tuple[float, float]] = {
    "sacramento": (38.5816, -121.4944),
    "san francisco": (37.7749, -122.4194),
    "los angeles": (34.0522, -118.2437),
    "new york": (40.7128, -74.0060),
    "chicago": (41.8781, -87.6298),
    "seattle": (47.6062, -122.3321),
    "austin": (30.2672, -97.7431),
    "denver": (39.7392, -104.9903),
    "charlottesville": (38.0293, -78.4767),
}

MOCK_REGION = "CAISO_NORTH"
_MOER_PATTERN: list[float] = [
    860.0, 830.0, 790.0, 740.0, 680.0, 610.0,
    550.0, 500.0, 470.0, 520.0, 590.0, 660.0,
    730.0, 790.0, 840.0, 890.0, 910.0, 870.0,
    820.0, 740.0, 660.0, 590.0, 520.0, 470.0,
]
_TEMP_PATTERN: list[float] = [
    26.0, 25.5, 25.0, 24.5, 24.0, 24.5,
    26.0, 28.0, 30.0, 32.5, 35.0, 37.5,
    39.5, 40.5, 41.0, 40.0, 38.0, 35.0,
    33.0, 31.0, 29.0, 28.0, 27.0, 26.5,
]


def get_mock_coordinates(city: str) -> tuple[float, float]:
    """Return stable coordinates for local testing."""
    return MOCK_CITY_COORDS.get(city.strip().lower(), MOCK_CITY_COORDS["sacramento"])


def _green_score(moer: float) -> float:
    return clean_power_score_from_moer(moer)


def _condition(temp_c: float) -> str:
    if temp_c >= 36:
        return "Hot"
    if temp_c >= 30:
        return "Sunny"
    if temp_c >= 24:
        return "Clear"
    return "Cool"


def get_mock_realtime(region: str) -> dict[str, float]:
    """Return a deterministic current grid snapshot."""
    hour = datetime.now(timezone.utc).hour
    moer = _MOER_PATTERN[hour % len(_MOER_PATTERN)]
    green_score = _green_score(moer)
    return {
        "moer": moer,
        "pct_renewable": round(green_score / 100, 2),
        "clean_power_score": green_score,
        "green_score": green_score,
    }


def get_mock_forecast(region: str) -> list[dict[str, float | str]]:
    """Return a 24-hour mock MOER forecast."""
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    forecast: list[dict[str, float | str]] = []
    for hour_offset in range(24):
        point_time = now + timedelta(hours=hour_offset)
        moer = _MOER_PATTERN[(point_time.hour + hour_offset) % len(_MOER_PATTERN)]
        green_score = _green_score(moer)
        forecast.append({
            "time": point_time.isoformat(),
            "moer": moer,
            "pct_renewable": round(green_score / 100, 2),
            "clean_power_score": green_score,
        })
    return forecast


def get_mock_weather_forecast(city: str) -> list[dict[str, float | int | str]]:
    """Return a 24-hour mock weather forecast."""
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    forecast: list[dict[str, float | int | str]] = []
    city_offset = len(city.strip()) % 3
    for hour_offset in range(24):
        point_time = now + timedelta(hours=hour_offset)
        temp_c = _TEMP_PATTERN[(point_time.hour + city_offset) % len(_TEMP_PATTERN)]
        forecast.append({
            "time": point_time.isoformat(),
            "hour": point_time.hour,
            "temp_c": temp_c,
            "precip_mm": 0.0,
            "cloud_cover": max(0, 45 - hour_offset),
            "condition": _condition(temp_c),
        })
    return forecast


def get_mock_current_weather(city: str) -> dict[str, float | str]:
    """Return current weather details."""
    forecast = get_mock_weather_forecast(city)
    current = forecast[0]
    return {
        "temp_c": float(current["temp_c"]),
        "condition": str(current["condition"]),
    }


def get_mock_weather_response(city: str) -> dict[str, float | str | bool | list[float]]:
    """Return the full weather endpoint payload."""
    forecast = get_mock_weather_forecast(city)
    highs = [float(point["temp_c"]) for point in forecast]
    current = get_mock_current_weather(city)
    return {
        "temp_c": float(current["temp_c"]),
        "condition": str(current["condition"]),
        "heat_wave": any(high > 35 for high in highs),
        "forecast_highs": highs,
    }


def get_mock_intensity(city: str) -> dict[str, float | str | bool]:
    """Return the intensity payload with weather context."""
    realtime = get_mock_realtime(MOCK_REGION)
    weather = get_mock_weather_response(city)
    current_simulation = build_mock_simulation(city, "normal")["timeline"][0]
    green_score = float(realtime["green_score"])
    lat, lng = get_mock_coordinates(city)
    status = emissions_band_from_score(green_score)
    return {
        "city": city,
        "region": MOCK_REGION,
        "region_label": region_label_for(MOCK_REGION),
        "latitude": lat,
        "longitude": lng,
        "moer": float(realtime["moer"]),
        "pct_renewable": float(realtime["pct_renewable"]),
        "clean_power_score": green_score,
        "green_score": green_score,
        "status": status,
        "temp_c": float(weather["temp_c"]),
        "heat_wave": bool(weather["heat_wave"]),
        "grid_stress": float(current_simulation["grid_stress"]),
    }


def build_mock_simulation(city: str, scenario: str) -> dict[str, object]:
    """Return a deterministic simulation response."""
    forecast = get_mock_forecast(MOCK_REGION)
    weather = get_mock_weather_forecast(city)
    multiplier = 1.4 if scenario == "heat_wave" else 1.3 if scenario == "cold_snap" else 1.0
    timeline: list[dict[str, float | int | str]] = []
    shifted_timeline: list[dict[str, float | int | str]] = []
    savings = 0.0
    failure_hour: int | None = None

    for index, point in enumerate(forecast):
        hour = int(weather[index]["hour"])
        time_factor = 0.2 if hour in {7, 8, 9} else 0.15 if hour in {18, 19, 20, 21} else 0.0
        temp_c = float(weather[index]["temp_c"])
        moer = float(point["moer"])
        demand_index = (0.5 + abs(temp_c - 22) * 0.03 + time_factor) * multiplier
        grid_stress = min(100.0, (demand_index * moer) / 12.0)
        if failure_hour is None and grid_stress > 85:
            failure_hour = index
        shifted_demand = demand_index * (0.72 if index in {13, 14, 15, 16, 17} else 0.92)
        shifted_stress = min(100.0, (shifted_demand * moer) / 12.0)
        savings += max(0.0, demand_index - shifted_demand) * moer * 0.453 / 1000
        base_row = {
            "hour": index,
            "time": str(point["time"]),
            "temp_c": temp_c,
            "moer": moer,
            "pct_renewable": float(point["pct_renewable"]),
            "clean_power_score": float(point["clean_power_score"]),
        }
        timeline.append({
            **base_row,
            "demand_index": round(demand_index, 2),
            "grid_stress": round(grid_stress, 1),
        })
        shifted_timeline.append({
            **base_row,
            "demand_index": round(shifted_demand, 2),
            "grid_stress": round(min(80.0, shifted_stress), 1),
        })

    return {
        "scenario": scenario,
        "city": city,
        "timeline": timeline,
        "shifted_timeline": shifted_timeline,
        "failure_hour": failure_hour,
        "savings_kg_co2": round(savings, 2),
    }
