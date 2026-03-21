"""Google Maps Geocoding utilities for GridSense."""

import os

import httpx

try:
    from .mock_data import get_mock_coordinates
    from .settings import use_mock_data
except ImportError:
    from mock_data import get_mock_coordinates
    from settings import use_mock_data


async def geocode_city(city: str) -> tuple[float, float]:
    """Convert a city name to latitude and longitude."""
    if use_mock_data():
        return get_mock_coordinates(city)

    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured.")

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": city, "key": api_key}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise RuntimeError("Google Maps geocoding is unavailable.") from exc

    if data.get("status") == "OK" and data.get("results"):
        location = data["results"][0]["geometry"]["location"]
        return location["lat"], location["lng"]

    if data.get("status") in {"ZERO_RESULTS", "INVALID_REQUEST"}:
        raise ValueError(f"Could not geocode city: {city}")

    raise RuntimeError("Google Maps geocoding failed.")
