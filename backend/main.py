"""GridSense backend for site-based weather-driven grid stress simulation."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from models import (
    EnvironmentSummary,
    OptimizationAction,
    ScenarioResult,
    SimulationRequest,
    SiteProfile,
    WeatherScenarioSlug,
    WeatherSnapshot,
)
from simulation_engine import SimulationEngine
from site_profiles import SITE_PROFILES, get_site, list_sites
from weather_service import WeatherService

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional in minimal runtime checks
    def load_dotenv() -> bool:
        return False


load_dotenv()

weather_service = WeatherService()
simulation_engine = SimulationEngine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """No-op lifespan hook for future cache warmup."""
    yield


app = FastAPI(
    title="GridSense API",
    description="Weather-driven grid stress simulator for campuses and distributed energy planning.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _require_site(site_id: str) -> SiteProfile:
    """Resolve a known site or raise a 404."""
    if site_id not in SITE_PROFILES:
        raise HTTPException(status_code=404, detail=f"Unknown site: {site_id}")
    return get_site(site_id)


@app.get("/api/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/sites", response_model=list[SiteProfile])
async def get_sites() -> list[SiteProfile]:
    """List supported demo sites."""
    return list_sites()


@app.get("/api/site-lookup", response_model=list[SiteProfile])
async def site_lookup(q: str = Query(..., min_length=2, description="Search query")) -> list[SiteProfile]:
    """Search demo sites by name or city."""
    query = q.lower().strip()
    results = [
        site
        for site in list_sites()
        if query in site.name.lower() or query in site.city.lower() or query in site.summary.lower()
    ]
    return results[:5]


@app.get("/api/weather", response_model=list[WeatherSnapshot])
async def get_weather(
    site_id: str = Query(..., description="Demo site id"),
    weather_scenario: WeatherScenarioSlug = Query("heat_wave", description="Weather scenario preset"),
) -> list[WeatherSnapshot]:
    """Return hourly weather for a demo site and scenario."""
    _require_site(site_id)
    return weather_service.get_weather(site_id, weather_scenario)


@app.get("/api/environment", response_model=EnvironmentSummary)
async def get_environment(
    site_id: str = Query(..., description="Demo site id"),
    weather_scenario: WeatherScenarioSlug = Query("heat_wave", description="Weather scenario preset"),
) -> EnvironmentSummary:
    """Return environment overlays for a demo site and scenario."""
    _require_site(site_id)
    return weather_service.get_environment(site_id, weather_scenario)


@app.get("/api/demand-forecast", response_model=ScenarioResult)
async def get_demand_forecast(
    site_id: str = Query(..., description="Demo site id"),
    weather_scenario: WeatherScenarioSlug = Query("heat_wave", description="Weather scenario preset"),
    scenario: str = Query("baseline", pattern="^(baseline|optimized)$"),
) -> ScenarioResult:
    """Return a full simulation result for the requested site and operating mode."""
    _require_site(site_id)
    return simulation_engine.run(site_id, weather_scenario, scenario)


@app.get("/api/actions", response_model=list[OptimizationAction])
async def get_actions(
    site_id: str = Query(..., description="Demo site id"),
    weather_scenario: WeatherScenarioSlug = Query("heat_wave", description="Weather scenario preset"),
) -> list[OptimizationAction]:
    """Return ranked optimization actions for the site and weather scenario."""
    _require_site(site_id)
    result = simulation_engine.run(site_id, weather_scenario, "optimized")
    return result.active_actions


@app.post("/api/simulate", response_model=ScenarioResult)
async def simulate(body: SimulationRequest) -> ScenarioResult:
    """Run a baseline or optimized simulation with optional action filtering."""
    _require_site(body.site_id)
    return simulation_engine.run(
        site_id=body.site_id,
        weather_scenario=body.weather_scenario,
        scenario=body.scenario,
        enabled_action_ids=body.enabled_action_ids,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
