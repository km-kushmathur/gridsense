"""Pydantic response models for GridSense API."""

from pydantic import BaseModel


class IntensityResponse(BaseModel):
    """Real-time grid carbon intensity for a city."""

    city: str
    region: str
    moer: float
    pct_renewable: float
    green_score: float
    status: str  # "clean" | "moderate" | "dirty"


class ForecastPoint(BaseModel):
    """Single data point in a 24-hour carbon forecast."""

    time: str
    moer: float
    pct_renewable: float


class NudgeItem(BaseModel):
    """A single appliance nudge recommendation."""

    appliance: str
    emoji: str
    best_time: str
    co2_saved_grams: float
    message: str


class NudgeRequest(BaseModel):
    """Request body for nudge generation."""

    city: str
