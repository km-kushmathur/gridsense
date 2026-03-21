"""Pydantic models for the GridSense weather-driven simulator."""

from typing import Literal

from pydantic import BaseModel, Field


RiskLevel = Literal["normal", "strained", "critical", "failure-risk"]
ScenarioMode = Literal["baseline", "optimized"]
WeatherScenarioSlug = Literal["heat_wave", "cold_snap", "storm_front", "smoke_event"]


class SiteZone(BaseModel):
    """A visual or operational zone within a site."""

    id: str
    name: str
    kind: Literal["residential", "academic", "mobility", "energy", "critical"]
    x: int = Field(ge=0, le=100)
    y: int = Field(ge=0, le=100)
    capacity_kw: int


class SiteAsset(BaseModel):
    """A campus asset that can be acted on during optimization."""

    id: str
    name: str
    type: Literal["ev_hub", "residence_hall", "lab", "solar_array", "data_center"]
    zone_id: str
    flexibility: int = Field(ge=0, le=100)


class SiteProfile(BaseModel):
    """Metadata and infrastructure assumptions for a demo site."""

    id: str
    name: str
    city: str
    region_hint: str
    timezone: str
    lat: float
    lng: float
    summary: str
    weather_risks: list[str]
    zones: list[SiteZone]
    assets: list[SiteAsset]
    assumptions: list[str]


class WeatherSnapshot(BaseModel):
    """Hourly weather input data used to drive the simulation."""

    timestamp: str
    local_label: str
    temperature_f: float
    apparent_temperature_f: float
    humidity_pct: float
    wind_mph: float
    cloud_cover_pct: float
    precipitation_prob_pct: float
    condition: str
    severity: float = Field(ge=0, le=100)


class EnvironmentSummary(BaseModel):
    """Environmental overlays that add context to the simulation."""

    site_id: str
    weather_scenario: WeatherScenarioSlug
    air_quality_index: int
    air_quality_label: str
    pollen_index: int
    solar_generation_kw: float
    solar_outlook_label: str
    notes: list[str]


class OptimizationAction(BaseModel):
    """An operational recommendation for risk reduction."""

    id: str
    title: str
    target: str
    category: Literal["mobility", "buildings", "energy", "operations"]
    recommended_window: str
    impact_kw: float
    impact_score: float = Field(ge=0, le=100)
    rationale: str


class DemandForecastPoint(BaseModel):
    """An hourly forecast point for the site simulation."""

    timestamp: str
    local_label: str
    demand_index: float
    generation_risk: float
    carbon_intensity_index: float
    stress_score: float
    risk_level: RiskLevel
    failure_risk_pct: float = Field(ge=0, le=100)
    optimized: bool


class ScenarioResult(BaseModel):
    """Baseline or optimized scenario results for the site."""

    site_id: str
    weather_scenario: WeatherScenarioSlug
    scenario: ScenarioMode
    summary: str
    stress_peak: float
    peak_window: str
    critical_hours: int
    failure_risk_hours: int
    avoided_peak_kw: float
    avoided_emissions_kg: float
    load_shifted_kwh: float
    active_actions: list[OptimizationAction]
    forecast: list[DemandForecastPoint]


class SimulationRequest(BaseModel):
    """Request body for simulation runs."""

    site_id: str
    weather_scenario: WeatherScenarioSlug = "heat_wave"
    scenario: ScenarioMode = "optimized"
    enabled_action_ids: list[str] | None = None
