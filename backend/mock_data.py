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
_MOER_PROFILES: dict[str, list[float]] = {
    "west_coast": [
        640.0, 620.0, 590.0, 550.0, 500.0, 450.0,
        390.0, 340.0, 300.0, 270.0, 250.0, 260.0,
        320.0, 390.0, 480.0, 590.0, 690.0, 760.0,
        720.0, 690.0, 670.0, 650.0, 620.0, 590.0,
    ],
    "southwest": [
        760.0, 730.0, 700.0, 660.0, 610.0, 560.0,
        480.0, 400.0, 320.0, 270.0, 240.0, 220.0,
        240.0, 320.0, 430.0, 570.0, 710.0, 820.0,
        790.0, 750.0, 720.0, 700.0, 680.0, 650.0,
    ],
    "midwest": [
        820.0, 800.0, 780.0, 750.0, 710.0, 660.0,
        620.0, 590.0, 560.0, 530.0, 510.0, 500.0,
        520.0, 560.0, 610.0, 680.0, 760.0, 820.0,
        840.0, 830.0, 810.0, 790.0, 770.0, 750.0,
    ],
    "northeast": [
        720.0, 700.0, 680.0, 650.0, 620.0, 580.0,
        540.0, 520.0, 500.0, 470.0, 450.0, 440.0,
        460.0, 500.0, 560.0, 640.0, 720.0, 790.0,
        770.0, 740.0, 720.0, 700.0, 690.0, 680.0,
    ],
    "mountain": [
        700.0, 680.0, 650.0, 620.0, 580.0, 540.0,
        500.0, 450.0, 410.0, 370.0, 340.0, 330.0,
        350.0, 390.0, 450.0, 530.0, 620.0, 700.0,
        680.0, 650.0, 630.0, 610.0, 590.0, 570.0,
    ],
}
_CITY_PROFILE_OVERRIDES: dict[str, str] = {
    "sacramento": "west_coast",
    "san francisco": "west_coast",
    "los angeles": "west_coast",
    "seattle": "west_coast",
    "austin": "southwest",
    "denver": "mountain",
    "chicago": "midwest",
    "new york": "northeast",
    "charlottesville": "northeast",
}
_TEMP_PATTERN: list[float] = [
    26.0, 25.5, 25.0, 24.5, 24.0, 24.5,
    26.0, 28.0, 30.0, 32.5, 35.0, 37.5,
    39.5, 40.5, 41.0, 40.0, 38.0, 35.0,
    33.0, 31.0, 29.0, 28.0, 27.0, 26.5,
]


def get_mock_coordinates(city: str) -> tuple[float, float]:
    """Return stable coordinates for local testing."""
    return MOCK_CITY_COORDS.get(city.strip().lower(), MOCK_CITY_COORDS["sacramento"])


def _normalize_city(city: str) -> str:
    return city.strip().lower()


def _city_checksum(city: str) -> int:
    normalized = _normalize_city(city)
    return sum(ord(char) for char in normalized if char.isalnum())


def _select_city_profile(city: str, region: str) -> str:
    normalized = _normalize_city(city)
    if normalized in _CITY_PROFILE_OVERRIDES:
        return _CITY_PROFILE_OVERRIDES[normalized]

    profile_names = list(_MOER_PROFILES.keys())
    if not normalized:
        return "west_coast" if region == MOCK_REGION else profile_names[0]
    return profile_names[_city_checksum(normalized) % len(profile_names)]


def _build_city_moer_pattern(city: str, region: str) -> list[float]:
    base_pattern = _MOER_PROFILES[_select_city_profile(city, region)]
    checksum = _city_checksum(city)
    shift = checksum % 4
    scale = 0.94 + (checksum % 7) * 0.02
    if shift:
        rotated = base_pattern[shift:] + base_pattern[:shift]
    else:
        rotated = list(base_pattern)
    return [round(value * scale, 1) for value in rotated]


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
    moer = _MOER_PROFILES["west_coast"][hour % 24]
    green_score = _green_score(moer)
    return {
        "moer": moer,
        "pct_renewable": round(green_score / 100, 2),
        "clean_power_score": green_score,
        "green_score": green_score,
    }


def get_mock_forecast(region: str, city: str = "") -> list[dict[str, float | str]]:
    """Return a deterministic 24-hour mock MOER forecast."""
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    pattern = _build_city_moer_pattern(city, region)
    start_index = now.hour % len(pattern)
    forecast: list[dict[str, float | str]] = []
    for hour_offset in range(24):
        point_time = now + timedelta(hours=hour_offset)
        moer = pattern[(start_index + hour_offset) % len(pattern)]
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
    current_forecast = get_mock_forecast(MOCK_REGION, city)
    current_moer = float(current_forecast[0]["moer"])
    green_score = float(_green_score(current_moer))
    weather = get_mock_weather_response(city)
    current_simulation = build_mock_simulation(city, "normal")["timeline"][0]
    lat, lng = get_mock_coordinates(city)
    status = emissions_band_from_score(green_score)
    return {
        "city": city,
        "region": MOCK_REGION,
        "region_label": region_label_for(MOCK_REGION),
        "latitude": lat,
        "longitude": lng,
        "moer": current_moer,
        "pct_renewable": round(green_score / 100, 2),
        "clean_power_score": green_score,
        "green_score": green_score,
        "status": status,
        "temp_c": float(weather["temp_c"]),
        "heat_wave": bool(weather["heat_wave"]),
        "grid_stress": float(current_simulation["grid_stress"]),
    }


def build_mock_simulation(city: str, scenario: str) -> dict[str, object]:
    """Return a deterministic simulation response."""
    forecast = get_mock_forecast(MOCK_REGION, city)
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
