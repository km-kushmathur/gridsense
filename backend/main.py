"""GridSense FastAPI backend — dashboard, weather, nudges, and simulation."""

import asyncio
import contextlib
import os
import re
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

try:
    from .alert_service import AlertService
    from .demand_simulator import DemandSimulator
    from .geo_utils import geocode_city
    from .grid_utils import emissions_band_from_score, region_label_for
    from .map_service import fetch_static_map
    from .models import (
        AlertCountResponse,
        AlertSubscribeRequest,
        AlertSubscribeResponse,
        AlertTestRequest,
        AlertTestResponse,
        AlertTriggerRequest,
        AlertTriggerResponse,
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
    from .window_utils import build_best_window_meta
except ImportError:
    from alert_service import AlertService
    from demand_simulator import DemandSimulator
    from geo_utils import geocode_city
    from grid_utils import emissions_band_from_score, region_label_for
    from map_service import fetch_static_map
    from models import (
        AlertCountResponse,
        AlertSubscribeRequest,
        AlertSubscribeResponse,
        AlertTestRequest,
        AlertTestResponse,
        AlertTriggerRequest,
        AlertTriggerResponse,
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
    from window_utils import build_best_window_meta

load_dotenv()

watttime = WattTimeClient()
weather = WeatherClient()
simulator = DemandSimulator(weather, watttime)
nudge_engine = NudgeEngine()
alert_service = AlertService()

CACHE: dict[str, tuple[float, object]] = {}
CACHE_TTL = 300  # 5 minutes
ACTIVE_SUBSCRIPTIONS: dict[str, dict[str, float | str]] = {}
TOPIC_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,39}$")
ALERT_THRESHOLD = 70.0
ALERT_POLL_INTERVAL_SECONDS = 300
ALERT_COOLDOWN_SECONDS = 1800

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


def _validate_topic(topic: str) -> str:
    normalized = topic.strip()
    if not TOPIC_PATTERN.fullmatch(normalized):
        raise HTTPException(
            status_code=400,
            detail="Topic must be alphanumeric or hyphenated and under 40 characters.",
        )
    return normalized


def _find_best_window(forecast: list[dict], window_size: int = 2) -> str:
    return str(build_best_window_meta(forecast, window_size=window_size)["best_window_label"])


async def _build_forecast_timeline(city: str, lat: float, lng: float, region: str) -> list[dict]:
    """Build the shared 24-hour forecast timeline used across the dashboard."""
    simulation = await simulator.simulate(city, "normal", lat, lng, region)
    return list(simulation["timeline"])


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
    temp_c = float(weather_now.get("temp_c", 22.0))
    grid_stress = simulator.estimate_current_grid_stress(
        temp_c=temp_c,
        moer=float(realtime.get("moer", 0.0)),
        hour=datetime.now(timezone.utc).hour,
        scenario="normal",
    )
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
        "temp_c": temp_c,
        "heat_wave": heat_wave,
        "grid_stress": grid_stress,
    }


async def _fetch_intensity_payload(city: str, use_cache: bool = True) -> dict:
    cache_key = f"{city.lower()}:intensity"
    if use_cache:
        cached = _cache_get(cache_key)
        if cached:
            return cached

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
    return result


async def _fetch_forecast_payload(city: str, use_cache: bool = True) -> list[dict]:
    cache_key = f"{city.lower()}:forecast"
    if use_cache:
        cached = _cache_get(cache_key)
        if cached:
            return cached

    try:
        lat, lng, region = await _resolve_city(city)
        forecast = await _build_forecast_timeline(city, lat, lng, region)
    except ValueError:
        forecast = _mock_or_raise(city, "forecast", ValueError(f"Could not geocode city: {city}"))
    except Exception as exc:
        forecast = _mock_or_raise(city, "forecast", exc)

    _cache_set(cache_key, forecast)
    return forecast


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
    result = await _fetch_intensity_payload(city)
    return IntensityResponse(**result)


@app.get("/api/forecast", response_model=list[ForecastPoint])
async def get_forecast(city: str = Query(..., description="City name to look up")) -> list[ForecastPoint]:
    """Get merged 24-hour carbon, weather, and demand forecast."""
    forecast = await _fetch_forecast_payload(city)
    return [ForecastPoint(**point) for point in forecast]


@app.post("/api/alerts/subscribe", response_model=AlertSubscribeResponse)
async def subscribe_alerts(body: AlertSubscribeRequest) -> AlertSubscribeResponse:
    """Create an ntfy topic subscription for grid alerts."""
    topic = _validate_topic(body.topic)
    await _fetch_intensity_payload(body.city, use_cache=False)
    sent = await alert_service.send_welcome(topic=topic, city=body.city)
    if not sent:
        raise HTTPException(status_code=502, detail="Could not send welcome notification.")

    ACTIVE_SUBSCRIPTIONS[topic] = {
        "topic": topic,
        "city": body.city,
        "threshold": ALERT_THRESHOLD,
        "last_alerted_stress": 0.0,
        "last_alert_time": 0.0,
    }
    return AlertSubscribeResponse(
        success=True,
        topic=topic,
        ntfy_url=f"https://ntfy.sh/{topic}",
    )


@app.post("/api/alerts/test", response_model=AlertTestResponse)
async def send_alert_test(body: AlertTestRequest) -> AlertTestResponse:
    """Send a fixed-value test alert to an ntfy topic."""
    topic = _validate_topic(body.topic)
    sent = await alert_service.send_test(topic=topic, city=body.city)
    return AlertTestResponse(sent=sent)


@app.post("/api/alerts/trigger", response_model=AlertTriggerResponse)
async def trigger_alert(body: AlertTriggerRequest) -> AlertTriggerResponse:
    """Send a live alert immediately for a subscribed topic."""
    topic = _validate_topic(body.topic)
    subscription = ACTIVE_SUBSCRIPTIONS.get(topic)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription topic not found.")

    city = str(subscription["city"])
    data = await _fetch_intensity_payload(city, use_cache=False)
    forecast = await _fetch_forecast_payload(city, use_cache=False)
    best_window = _find_best_window(forecast)
    sent = await alert_service.send_alert(
        topic=topic,
        city=city,
        grid_stress=float(data["grid_stress"]),
        clean_power_score=float(data["clean_power_score"]),
        best_window=best_window,
    )
    if sent:
        ACTIVE_SUBSCRIPTIONS[topic]["last_alerted_stress"] = float(data["grid_stress"])
        ACTIVE_SUBSCRIPTIONS[topic]["last_alert_time"] = time.time()
    return AlertTriggerResponse(sent=sent)


@app.get("/api/alerts/count", response_model=AlertCountResponse)
async def get_alert_count() -> AlertCountResponse:
    """Return the number of active in-memory alert subscriptions."""
    return AlertCountResponse(count=len(ACTIVE_SUBSCRIPTIONS))


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
        forecast = await _build_forecast_timeline(body.city, lat, lng, region)
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


async def alert_poller() -> None:
    """Poll live grid state and send ntfy alerts when thresholds are crossed."""
    while True:
        await asyncio.sleep(ALERT_POLL_INTERVAL_SECONDS)
        for topic, subscription in list(ACTIVE_SUBSCRIPTIONS.items()):
            try:
                city = str(subscription["city"])
                threshold = float(subscription.get("threshold", ALERT_THRESHOLD))
                last_alerted_stress = float(subscription.get("last_alerted_stress", 0.0))
                last_alert_time = float(subscription.get("last_alert_time", 0.0))

                data = await _fetch_intensity_payload(city, use_cache=False)
                stress = float(data["grid_stress"])

                should_send = (
                    stress >= threshold
                    and last_alerted_stress < threshold
                    and (time.time() - last_alert_time) > ALERT_COOLDOWN_SECONDS
                )

                if should_send:
                    forecast = await _fetch_forecast_payload(city, use_cache=False)
                    best_window = _find_best_window(forecast)
                    sent = await alert_service.send_alert(
                        topic=topic,
                        city=city,
                        grid_stress=stress,
                        clean_power_score=float(data["clean_power_score"]),
                        best_window=best_window,
                    )
                    if sent:
                        ACTIVE_SUBSCRIPTIONS[topic]["last_alert_time"] = time.time()

                ACTIVE_SUBSCRIPTIONS[topic]["last_alerted_stress"] = stress
            except Exception:
                continue


@app.on_event("startup")
async def startup_alert_poller() -> None:
    """Start the background alert polling task."""
    app.state.alert_poller_task = asyncio.create_task(alert_poller())


@app.on_event("shutdown")
async def shutdown_alert_poller() -> None:
    """Cancel the background alert polling task."""
    task = getattr(app.state, "alert_poller_task", None)
    if task is None:
        return
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
