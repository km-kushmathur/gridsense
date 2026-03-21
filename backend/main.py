"""GridSense FastAPI backend — real-time carbon intensity + nudge engine."""

import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from geo_utils import geocode_city
from models import ForecastPoint, IntensityResponse, NudgeItem, NudgeRequest
from nudge_engine import NudgeEngine
from watttime_client import WattTimeClient

load_dotenv()

# Singletons
watttime = WattTimeClient()
nudge_engine = NudgeEngine()

# Simple in-memory cache: {city: (timestamp, data)}
_intensity_cache: dict[str, tuple[float, dict]] = {}
_forecast_cache: dict[str, tuple[float, list[dict]]] = {}
CACHE_TTL = 300  # 5 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up the WattTime auth token on startup."""
    try:
        await watttime._ensure_token()
    except Exception:
        pass  # Token will be fetched on first request
    yield


app = FastAPI(
    title="GridSense API",
    description="Real-time neighborhood carbon intensity + smart appliance nudges",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/intensity", response_model=IntensityResponse)
async def get_intensity(city: str = Query(..., description="City name to look up")) -> IntensityResponse:
    """Get real-time carbon intensity for a city.

    Geocodes the city, resolves the WattTime region, and returns
    the current MOER value with a normalized green score.
    """
    # Check cache
    cached = _intensity_cache.get(city.lower())
    if cached and (time.time() - cached[0]) < CACHE_TTL:
        return IntensityResponse(**cached[1])

    try:
        lat, lng = await geocode_city(city)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    region = await watttime.get_region(lat, lng)
    realtime = await watttime.get_realtime(region)

    green_score = realtime.get("green_score", 50)
    if green_score > 60:
        status = "clean"
    elif green_score > 30:
        status = "moderate"
    else:
        status = "dirty"

    result = {
        "city": city,
        "region": region,
        "moer": realtime.get("moer", 0),
        "pct_renewable": realtime.get("pct_renewable", 0),
        "green_score": green_score,
        "status": status,
    }

    _intensity_cache[city.lower()] = (time.time(), result)
    return IntensityResponse(**result)


@app.get("/api/forecast", response_model=list[ForecastPoint])
async def get_forecast(city: str = Query(..., description="City name to look up")) -> list[ForecastPoint]:
    """Get 24-hour carbon intensity forecast for a city."""
    # Check cache
    cached = _forecast_cache.get(city.lower())
    if cached and (time.time() - cached[0]) < CACHE_TTL:
        return [ForecastPoint(**p) for p in cached[1]]

    try:
        lat, lng = await geocode_city(city)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    region = await watttime.get_region(lat, lng)
    forecast = await watttime.get_forecast(region)

    _forecast_cache[city.lower()] = (time.time(), forecast)
    return [ForecastPoint(**p) for p in forecast]


@app.post("/api/nudges", response_model=list[NudgeItem])
async def get_nudges(body: NudgeRequest) -> list[NudgeItem]:
    """Generate smart appliance nudges for a city based on forecast data."""
    try:
        lat, lng = await geocode_city(body.city)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    region = await watttime.get_region(lat, lng)
    realtime = await watttime.get_realtime(region)
    forecast = await watttime.get_forecast(region)

    nudges = await nudge_engine.generate_nudges(
        forecast=forecast,
        city=body.city,
        current_moer=realtime.get("moer", 500),
    )

    return [NudgeItem(**n) for n in nudges]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
