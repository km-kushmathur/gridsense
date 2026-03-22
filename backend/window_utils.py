"""Shared forecast timestamp and best-window utilities."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import TypedDict


class ForecastRow(TypedDict, total=False):
    """Normalized forecast row used by the dashboard and nudges."""

    time: str
    moer: float
    pct_renewable: float
    clean_power_score: float
    temp_c: float
    demand_index: float
    grid_stress: float


class WindowMeta(TypedDict):
    """Best-window metadata derived from a forecast timeline."""

    average_moer: float
    points: list[ForecastRow]
    start_index: int
    best_window_start: str
    best_window_end: str
    best_window_label: str


def parse_iso_timestamp(value: str | None) -> datetime | None:
    """Parse an ISO timestamp, normalizing `Z` and naive values to UTC."""
    raw_value = str(value or "").strip()
    if not raw_value:
        return None

    normalized = raw_value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def format_hour_label(hour: int) -> str:
    """Render an hour as a compact 12-hour label."""
    if hour == 0:
        return "12 am"
    if hour < 12:
        return f"{hour} am"
    if hour == 12:
        return "12 pm"
    return f"{hour - 12} pm"


def format_window_label(start_value: str, end_value: str, fallback: str = "Unavailable") -> str:
    """Render a window label from ISO timestamps."""
    start = parse_iso_timestamp(start_value)
    end = parse_iso_timestamp(end_value)
    if not start or not end:
        return fallback
    return f"{format_hour_label(start.hour)} - {format_hour_label(end.hour)}"


def _sort_forecast_rows(forecast: list[ForecastRow], limit: int) -> list[ForecastRow]:
    def sort_key(point: ForecastRow) -> tuple[int, float]:
        parsed = parse_iso_timestamp(str(point.get("time", "")))
        if not parsed:
            return (1, float("inf"))
        return (0, parsed.timestamp())

    return sorted(forecast, key=sort_key)[:limit]


def build_best_window_meta(
    forecast: list[ForecastRow],
    window_size: int = 2,
    limit: int = 24,
) -> WindowMeta:
    """Return the lowest-average-MOER contiguous forecast window."""
    hourly = _sort_forecast_rows(forecast, limit)
    if not hourly:
        return {
            "average_moer": 0.0,
            "points": [],
            "start_index": 0,
            "best_window_start": "",
            "best_window_end": "",
            "best_window_label": "Unavailable",
        }

    effective_window = max(1, min(window_size, len(hourly)))
    best_start = 0
    lowest_average = float("inf")

    for index in range(len(hourly) - effective_window + 1):
        points = hourly[index:index + effective_window]
        average_moer = sum(float(point.get("moer", 0.0)) for point in points) / len(points)
        if average_moer < lowest_average:
            lowest_average = average_moer
            best_start = index

    best_points = hourly[best_start:best_start + effective_window]
    start = parse_iso_timestamp(str(best_points[0].get("time", "")))
    end_base = parse_iso_timestamp(str(best_points[-1].get("time", "")))
    best_window_start = start.isoformat() if start else ""
    best_window_end = (end_base + timedelta(hours=1)).isoformat() if end_base else ""

    return {
        "average_moer": round(lowest_average if lowest_average != float("inf") else 0.0, 1),
        "points": best_points,
        "start_index": best_start,
        "best_window_start": best_window_start,
        "best_window_end": best_window_end,
        "best_window_label": format_window_label(best_window_start, best_window_end),
    }
