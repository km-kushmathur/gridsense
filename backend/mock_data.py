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
_PROFILE_METRICS: dict[str, dict[str, float]] = {
    "west_coast": {
        "current_clean": 53.0,
        "clean_ceiling": 78.0,
        "pressure_base": 24.0,
        "pressure_peak": 64.0,
    },
    "southwest": {
        "current_clean": 36.0,
        "clean_ceiling": 64.0,
        "pressure_base": 38.0,
        "pressure_peak": 84.0,
    },
    "midwest": {
        "current_clean": 24.0,
        "clean_ceiling": 46.0,
        "pressure_base": 48.0,
        "pressure_peak": 82.0,
    },
    "northeast": {
        "current_clean": 31.0,
        "clean_ceiling": 54.0,
        "pressure_base": 42.0,
        "pressure_peak": 78.0,
    },
    "mountain": {
        "current_clean": 43.0,
        "clean_ceiling": 68.0,
        "pressure_base": 30.0,
        "pressure_peak": 68.0,
    },
}


def get_mock_coordinates(city: str) -> tuple[float, float]:
    """Return stable coordinates for local testing."""
    return MOCK_CITY_COORDS.get(city.strip().lower(), MOCK_CITY_COORDS["sacramento"])


def _normalize_city(city: str) -> str:
    return city.strip().lower()


def _city_checksum(city: str) -> int:
    normalized = _normalize_city(city)
    return sum(ord(char) for char in normalized if char.isalnum())


def _city_savings_score(city: str) -> int:
    """Return a stable 10-30 point cleaner-window uplift for a city."""
    return 10 + (_city_checksum(city) % 21)


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _city_offset(city: str, span: int, salt: int = 0) -> float:
    checksum = _city_checksum(city) + salt
    return float((checksum % ((span * 2) + 1)) - span)


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


def _best_window_start(values: list[float], window_size: int = 2) -> int:
    best_start = 0
    best_average = float("inf")
    for index in range(len(values) - window_size + 1):
        average = sum(values[index:index + window_size]) / window_size
        if average < best_average:
            best_average = average
            best_start = index
    return best_start


def _build_clean_power_scores(city: str, region: str, hourly_moer: list[float]) -> list[float]:
    """Return deterministic demo clean-power scores for a city forecast."""
    if not hourly_moer:
        return []

    profile = _select_city_profile(city, region)
    metrics = _PROFILE_METRICS[profile]
    target_current = _clamp(
        metrics["current_clean"] + _city_offset(city, 3, salt=11),
        8.0,
        88.0,
    )
    target_best = _clamp(
        target_current + float(_city_savings_score(city)),
        target_current + 4.0,
        metrics["clean_ceiling"] + _city_offset(city, 2, salt=29),
    )

    min_moer = min(hourly_moer)
    max_moer = max(hourly_moer)
    if max_moer == min_moer:
        return [round(target_current, 1) for _ in hourly_moer]

    normalized_cleanliness = [
        (max_moer - float(moer)) / (max_moer - min_moer)
        for moer in hourly_moer
    ]
    best_start = _best_window_start(hourly_moer)
    current_norm = normalized_cleanliness[0]
    best_norm = sum(normalized_cleanliness[best_start:best_start + 2]) / 2.0
    norm_gap = max(0.08, best_norm - current_norm)
    slope = (target_best - target_current) / norm_gap
    intercept = target_current - (slope * current_norm)

    scores = [
        _clamp(intercept + (slope * cleanliness), 0.0, 100.0)
        for cleanliness in normalized_cleanliness
    ]
    scores[0] = target_current
    if best_start + 1 < len(scores):
        current_best = (scores[best_start] + scores[best_start + 1]) / 2.0
        delta = target_best - current_best
        scores[best_start] = _clamp(scores[best_start] + delta, 0.0, 100.0)
        scores[best_start + 1] = _clamp(scores[best_start + 1] + delta, 0.0, 100.0)

    return [round(score, 1) for score in scores]


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


def _apply_city_clean_window(city: str, hourly_moer: list[float]) -> list[float]:
    """Shape the rolling forecast so each city has a stable cleaner window."""
    if len(hourly_moer) < 2:
        return hourly_moer

    checksum = _city_checksum(city)
    target_gap = _city_savings_score(city)
    window_start = min(len(hourly_moer) - 2, 6 + (checksum % 12))

    current_moer = float(hourly_moer[0])
    minimum_current_moer = float((target_gap * 10) + 180)
    if current_moer < minimum_current_moer:
        uplift = minimum_current_moer - current_moer
        hourly_moer = [round(value + uplift, 1) for value in hourly_moer]
        current_moer = minimum_current_moer

    target_window_moer = max(140.0, current_moer - (target_gap * 10.0))
    shoulder_moer = target_window_moer + 45.0
    non_window_floor = target_window_moer + 25.0

    adjusted = [float(value) for value in hourly_moer]
    for index, value in enumerate(adjusted):
        if index in {window_start, window_start + 1}:
            continue
        if value < non_window_floor:
            adjusted[index] = non_window_floor + ((checksum + index) % 3) * 6.0

    adjusted[window_start] = max(140.0, target_window_moer - 6.0)
    adjusted[window_start + 1] = max(140.0, target_window_moer + 6.0)

    if window_start - 1 >= 0:
        adjusted[window_start - 1] = max(adjusted[window_start - 1], shoulder_moer)
    if window_start + 2 < len(adjusted):
        adjusted[window_start + 2] = max(adjusted[window_start + 2], shoulder_moer + 8.0)

    return [round(value, 1) for value in adjusted]


def _pressure_time_factor(hour: int) -> float:
    if hour in {6, 7, 8, 9}:
        return 0.18
    if hour in {17, 18, 19, 20, 21}:
        return 0.28
    if hour in {12, 13, 14, 15}:
        return 0.10
    return 0.0


def _hardcoded_grid_load_pressure(
    city: str,
    region: str,
    temp_c: float,
    hour: int,
    scenario: str,
    clean_power_score: float,
) -> float:
    """Return a deterministic regional Grid Load Pressure heuristic."""
    profile = _select_city_profile(city, region)
    metrics = _PROFILE_METRICS[profile]
    pressure_low = metrics["pressure_base"] + _city_offset(city, 4, salt=41)
    pressure_high = metrics["pressure_peak"] + _city_offset(city, 4, salt=53)

    temperature_signal = abs(temp_c - 22.0) * 0.022
    scenario_signal = 0.18 if scenario == "heat_wave" else 0.12 if scenario == "cold_snap" else 0.0
    cleanliness_signal = max(0.0, 58.0 - clean_power_score) / 100.0
    pressure_signal = 0.18 + _pressure_time_factor(hour) + temperature_signal + scenario_signal + cleanliness_signal
    normalized_pressure = _clamp((pressure_signal - 0.18) / 0.85, 0.0, 1.0)

    return round(_clamp(
        pressure_low + (normalized_pressure * (pressure_high - pressure_low)),
        12.0,
        95.0,
    ), 1)


def get_mock_forecast(region: str, city: str = "") -> list[dict[str, float | str]]:
    """Return a deterministic 24-hour mock MOER forecast."""
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    pattern = _build_city_moer_pattern(city, region)
    start_index = now.hour % len(pattern)
    rolling_moer = [
        pattern[(start_index + hour_offset) % len(pattern)]
        for hour_offset in range(24)
    ]
    rolling_moer = _apply_city_clean_window(city, rolling_moer)
    rolling_scores = _build_clean_power_scores(city, region, rolling_moer)
    forecast: list[dict[str, float | str]] = []
    for hour_offset in range(24):
        point_time = now + timedelta(hours=hour_offset)
        moer = rolling_moer[hour_offset]
        green_score = rolling_scores[hour_offset]
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


def get_mock_intensity(
    city: str,
    region: str = MOCK_REGION,
    latitude: float | None = None,
    longitude: float | None = None,
    temp_c: float | None = None,
    heat_wave: bool | None = None,
) -> dict[str, float | str | bool]:
    """Return the intensity payload with weather context."""
    current_forecast = get_mock_forecast(region, city)
    current_moer = float(current_forecast[0]["moer"])
    green_score = float(current_forecast[0]["clean_power_score"])
    weather = get_mock_weather_response(city)
    current_simulation = build_mock_simulation(city, "normal", region=region)["timeline"][0]
    lat, lng = get_mock_coordinates(city)
    resolved_lat = float(latitude) if latitude is not None else lat
    resolved_lng = float(longitude) if longitude is not None else lng
    resolved_temp = float(temp_c) if temp_c is not None else float(weather["temp_c"])
    resolved_heat_wave = bool(weather["heat_wave"]) if heat_wave is None else bool(heat_wave)
    status = emissions_band_from_score(green_score)
    return {
        "city": city,
        "region": region,
        "region_label": region_label_for(region),
        "latitude": resolved_lat,
        "longitude": resolved_lng,
        "moer": current_moer,
        "pct_renewable": round(green_score / 100, 2),
        "clean_power_score": green_score,
        "green_score": green_score,
        "status": status,
        "temp_c": resolved_temp,
        "heat_wave": resolved_heat_wave,
        "grid_stress": float(current_simulation["grid_stress"]),
    }


def build_mock_simulation(city: str, scenario: str, region: str = MOCK_REGION) -> dict[str, object]:
    """Return a deterministic simulation response."""
    forecast = get_mock_forecast(region, city)
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
        clean_power_score = float(point["clean_power_score"])
        grid_stress = _hardcoded_grid_load_pressure(
            city=city,
            region=region,
            temp_c=temp_c,
            hour=hour,
            scenario=scenario,
            clean_power_score=clean_power_score,
        )
        if failure_hour is None and grid_stress > 85:
            failure_hour = index
        shifted_demand = demand_index * (0.72 if index in {13, 14, 15, 16, 17} else 0.92)
        shifted_stress = max(12.0, grid_stress - (8.0 if index in {13, 14, 15, 16, 17} else 3.0))
        savings += max(0.0, demand_index - shifted_demand) * moer * 0.453 / 1000
        base_row = {
            "hour": index,
            "time": str(point["time"]),
            "temp_c": temp_c,
            "moer": moer,
            "pct_renewable": float(point["pct_renewable"]),
            "clean_power_score": clean_power_score,
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
