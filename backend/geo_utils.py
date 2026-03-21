"""Google Maps Geocoding utilities for GridSense."""

import os

import httpx


async def geocode_city(city: str) -> tuple[float, float]:
    """Convert a city name to (latitude, longitude) using Google Maps Geocoding API.

    Args:
        city: Human-readable city name, e.g. "Sacramento, CA"

    Returns:
        Tuple of (latitude, longitude) as floats.

    Raises:
        ValueError: If the city cannot be geocoded.
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": city, "key": api_key}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()

    if data.get("status") != "OK" or not data.get("results"):
        raise ValueError(f"Could not geocode city: {city}")

    location = data["results"][0]["geometry"]["location"]
    return location["lat"], location["lng"]
