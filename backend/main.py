"""GridSense FastAPI backend — dashboard, weather, nudges, and simulation."""

import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

try:
    from .demand_simulator import DemandSimulator
    from .geo_utils import geocode_city
    from .grid_utils import emissions_band_from_score, region_label_for
    from .map_service import fetch_static_map
    from .models import (
        ForecastPoint,
        HealthResponse,
        IntensityResponse,
        NudgeRequest,
        NudgeResponse,
        SimulateRequest,
        SimulateResponse,
        WeatherResponse,
    )
    from .mock_data import build_mock_simulation, get_mock_intensity, get_mock_weather_response
    from .nudge_engine import NudgeEngine
    from .settings import azure_openai_configured, use_mock_data
    from .watttime_client import WattTimeClient
    from .weather_client import WeatherClient
except ImportError:
    from demand_simulator import DemandSimulator
    from geo_utils import geocode_city
    from grid_utils import emissions_band_from_score, region_label_for
    from map_service import fetch_static_map
    from models import (
        ForecastPoint,
        HealthResponse,
        IntensityResponse,
        NudgeRequest,
        NudgeResponse,
        SimulateRequest,
        SimulateResponse,
        WeatherResponse,
    )
    from mock_data import build_mock_simulation, get_mock_intensity, get_mock_weather_response
    from nudge_engine import NudgeEngine
    from settings import azure_openai_configured, use_mock_data
    from watttime_client import WattTimeClient
    from weather_client import WeatherClient

load_dotenv()

watttime = WattTimeClient()
weather = WeatherClient()
simulator = DemandSimulator(weather, watttime)
nudge_engine = NudgeEngine()

CACHE: dict[str, tuple[float, object]] = {}
CACHE_TTL = 300  # 5 minutes

app = FastAPI(
    title="GridSense API",
    description="Grid carbon dashboard, weather intelligence, and demand simulation",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cache_get(key: str) -> object | None:
    cached = CACHE.get(key)
    if cached and (time.time() - cached[0]) < CACHE_TTL:
        return cached[1]
    return None


def _cache_set(key: str, value: object) -> None:
    CACHE[key] = (time.time(), value)


def _status_from_green_score(green_score: float) -> str:
    return emissions_band_from_score(green_score)


async def _resolve_city(city: str) -> tuple[float, float, str]:
    lat, lng = await geocode_city(city)
    region = await watttime.get_region(lat, lng)
    return lat, lng, region


def _mock_or_raise(city: str, endpoint: str, exc: Exception) -> object:
    if use_mock_data():
        if endpoint == "intensity":
            return get_mock_intensity(city)
        if endpoint == "forecast":
            return build_mock_simulation(city, "normal")["timeline"]
        if endpoint == "weather":
            return get_mock_weather_response(city)
        if endpoint == "simulate":
            return build_mock_simulation(city, "heat_wave")
        if endpoint == "nudges":
            return {"nudges": []}
    raise exc


def _build_intensity_result(
    city: str,
    lat: float,
    lng: float,
    region: str,
    realtime: dict,
    weather_now: dict,
    heat_wave: bool,
) -> dict:
    """Merge realtime and weather data into the intensity payload."""
    green_score = float(realtime.get("green_score", 50.0))
    clean_power_score = float(realtime.get("clean_power_score", green_score))
    return {
        "city": city,
        "region": region,
        "region_label": region_label_for(region),
        "latitude": lat,
        "longitude": lng,
        "moer": float(realtime.get("moer", 0)),
        "pct_renewable": float(realtime.get("pct_renewable", 0)),
        "clean_power_score": clean_power_score,
        "green_score": green_score,
        "status": _status_from_green_score(green_score),
        "temp_c": float(weather_now.get("temp_c", 22.0)),
        "heat_wave": heat_wave,
    }


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Report whether demo-critical providers are configured."""
    return HealthResponse(
        status="ok",
        watttime=use_mock_data() or bool(os.getenv("WATTTIME_USER") and os.getenv("WATTTIME_PASSWORD")),
        openai=use_mock_data() or azure_openai_configured(),
    )


@app.get("/api/intensity", response_model=IntensityResponse)
async def get_intensity(city: str = Query(..., description="City name to look up")) -> IntensityResponse:
    """Get real-time carbon intensity and weather for a city."""
    cache_key = f"{city.lower()}:intensity"
    cached = _cache_get(cache_key)
    if cached:
        return IntensityResponse(**cached)

    try:
        lat, lng, region = await _resolve_city(city)
        realtime = await watttime.get_realtime(region)
        weather_now = await weather.get_current(lat, lng, city)
        heat_wave = await weather.is_heat_wave(lat, lng, city)
        result = _build_intensity_result(city, lat, lng, region, realtime, weather_now, heat_wave)
    except ValueError:
        result = _mock_or_raise(city, "intensity", ValueError(f"Could not geocode city: {city}"))
    except Exception as exc:
        result = _mock_or_raise(city, "intensity", exc)

    _cache_set(cache_key, result)
    return IntensityResponse(**result)


@app.get("/api/forecast", response_model=list[ForecastPoint])
async def get_forecast(city: str = Query(..., description="City name to look up")) -> list[ForecastPoint]:
    """Get merged 24-hour carbon, weather, and demand forecast."""
    cache_key = f"{city.lower()}:forecast"
    cached = _cache_get(cache_key)
    if cached:
        return [ForecastPoint(**point) for point in cached]

    try:
        lat, lng, region = await _resolve_city(city)
        simulation = await simulator.simulate(city, "normal", lat, lng, region)
        forecast = simulation["timeline"]
    except ValueError:
        forecast = _mock_or_raise(city, "forecast", ValueError(f"Could not geocode city: {city}"))
    except Exception as exc:
        forecast = _mock_or_raise(city, "forecast", exc)

    _cache_set(cache_key, forecast)
    return [ForecastPoint(**point) for point in forecast]


@app.post("/api/nudges", response_model=NudgeResponse)
async def get_nudges(body: NudgeRequest) -> NudgeResponse:
    """Generate smart appliance nudges for a city based on forecast data."""
    cache_key = f"{body.city.lower()}:nudges"
    cached = _cache_get(cache_key)
    if cached:
        return NudgeResponse(**cached)

    try:
        lat, lng, region = await _resolve_city(body.city)
        realtime = await watttime.get_realtime(region)
        weather_now = await weather.get_current(lat, lng, body.city)
        weather_now["heat_wave"] = await weather.is_heat_wave(lat, lng, body.city)
        forecast = await watttime.get_forecast(region)
        payload = {
            "nudges": await nudge_engine.generate_nudges(
                forecast=forecast,
                city=body.city,
                current_weather=weather_now,
                current_moer=float(realtime.get("moer", 500.0)),
            )
        }
    except ValueError:
        payload = {"nudges": []}
    except Exception:
        payload = {
            "nudges": await nudge_engine.generate_nudges(
                forecast=[
                    {
                        "time": row["time"],
                        "moer": row["moer"],
                        "pct_renewable": row["pct_renewable"],
                        "clean_power_score": row["clean_power_score"],
                    }
                    for row in build_mock_simulation(body.city, "normal")["timeline"]
                ],
                city=body.city,
                current_weather=get_mock_weather_response(body.city),
                current_moer=float(get_mock_intensity(body.city)["moer"]),
            )
        }

    _cache_set(cache_key, payload)
    return NudgeResponse(**payload)


@app.post("/api/simulate", response_model=SimulateResponse)
async def simulate_grid(body: SimulateRequest) -> SimulateResponse:
    """Simulate stress for a scenario."""
    cache_key = f"{body.city.lower()}:simulate:{body.scenario}"
    cached = _cache_get(cache_key)
    if cached:
        return SimulateResponse(**cached)

    try:
        lat, lng, region = await _resolve_city(body.city)
        payload = await simulator.simulate(body.city, body.scenario, lat, lng, region)
    except ValueError:
        payload = build_mock_simulation(body.city, body.scenario)
    except Exception:
        payload = build_mock_simulation(body.city, body.scenario)

    _cache_set(cache_key, payload)
    return SimulateResponse(**payload)


@app.get("/api/map/static")
async def get_static_map(city: str = Query(..., description="City name to look up")) -> Response:
    """Return a static map image for the selected city."""
    cache_key = f"{city.lower()}:map-static"
    cached = _cache_get(cache_key)
    if cached:
        return Response(
            content=cached["content"],
            media_type=cached["media_type"],
            headers={"Cache-Control": "public, max-age=300"},
        )

    try:
        lat, lng = await geocode_city(city)
        content, media_type = await fetch_static_map(lat, lng, city)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Static map unavailable.") from exc

    payload = {"content": content, "media_type": media_type}
    _cache_set(cache_key, payload)
    return Response(content=content, media_type=media_type, headers={"Cache-Control": "public, max-age=300"})


@app.get("/api/weather", response_model=WeatherResponse)
async def get_weather(city: str = Query(..., description="City name to look up")) -> WeatherResponse:
    """Return current weather and next-24-hour highs."""
    cache_key = f"{city.lower()}:weather"
    cached = _cache_get(cache_key)
    if cached:
        return WeatherResponse(**cached)

    try:
        lat, lng, _ = await _resolve_city(city)
        current = await weather.get_current(lat, lng, city)
        forecast = await weather.get_forecast(lat, lng, city)
        payload = {
            "temp_c": float(current.get("temp_c", 22.0)),
            "condition": str(current.get("condition", "Clear")),
            "heat_wave": any(float(point.get("temp_c", 0.0)) > 35.0 for point in forecast),
            "forecast_highs": [float(point.get("temp_c", 0.0)) for point in forecast[:24]],
        }
    except ValueError:
        payload = get_mock_weather_response(city)
    except Exception:
        payload = get_mock_weather_response(city)

    _cache_set(cache_key, payload)
    return WeatherResponse(**payload)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
