"""Pydantic response models for GridSense API."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Service health summary."""

    status: str
    watttime: bool
    openai: bool


class IntensityResponse(BaseModel):
    """Real-time grid carbon intensity for a city."""

    city: str
    region: str
    region_label: str
    latitude: float
    longitude: float
    moer: float
    pct_renewable: float
    clean_power_score: float
    green_score: float
    status: str
    temp_c: float
    heat_wave: bool
    grid_stress: float


class ForecastPoint(BaseModel):
    """Single data point in a 24-hour carbon and demand forecast."""

    time: str
    moer: float
    pct_renewable: float
    clean_power_score: float
    temp_c: float
    demand_index: float
    grid_stress: float


class WeatherResponse(BaseModel):
    """Current and forecast weather snapshot."""

    temp_c: float
    condition: str
    heat_wave: bool
    forecast_highs: list[float]


class NudgeItem(BaseModel):
    """A single appliance nudge recommendation."""

    appliance: str
    emoji: str
    best_time: str
    best_window_start: str
    best_window_end: str
    best_window_label: str
    co2_saved_grams: float
    message: str


class NudgeRequest(BaseModel):
    """Request body for nudge generation."""

    city: str


class NudgeResponse(BaseModel):
    """Wrapped nudge response payload."""

    nudges: list[NudgeItem]


class AlertSubscribeRequest(BaseModel):
    """Request body for creating an ntfy alert subscription."""

    city: str
    topic: str


class AlertSubscribeResponse(BaseModel):
    """Subscription creation response."""

    success: bool
    topic: str
    ntfy_url: str


class AlertTestRequest(BaseModel):
    """Request body for sending a test alert."""

    topic: str
    city: str


class AlertTestResponse(BaseModel):
    """Result of sending a test alert."""

    sent: bool


class AlertTriggerRequest(BaseModel):
    """Request body for manually firing a live alert."""

    topic: str


class AlertTriggerResponse(BaseModel):
    """Result of sending a manual alert."""

    sent: bool


class AlertCountResponse(BaseModel):
    """Current number of active in-memory subscriptions."""

    count: int


class SimulationPoint(BaseModel):
    """Single simulation time bucket."""

    hour: int
    time: str
    temp_c: float
    demand_index: float
    moer: float
    pct_renewable: float
    clean_power_score: float
    grid_stress: float


class SimulateRequest(BaseModel):
    """Request body for simulation endpoint."""

    city: str
    scenario: str


class SimulateResponse(BaseModel):
    """Simulation response payload."""

    scenario: str
    city: str
    timeline: list[SimulationPoint]
    shifted_timeline: list[SimulationPoint]
    failure_hour: int | None
    savings_kg_co2: float
