"""Static map rendering service for the dashboard map panel."""

from __future__ import annotations

import os

import httpx

try:
    from .settings import use_mock_data
except ImportError:
    from settings import use_mock_data

STATIC_MAP_URL = "https://maps.googleapis.com/maps/api/staticmap"


def _mock_map_svg(city: str, lat: float, lng: float) -> bytes:
    """Return a simple SVG map placeholder for mock mode."""
    safe_city = city or "Selected city"
    svg = f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640" viewBox="0 0 1200 640">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0d1720" />
          <stop offset="100%" stop-color="#102333" />
        </linearGradient>
      </defs>
      <rect width="1200" height="640" fill="url(#bg)" />
      <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
        <path d="M0 120 H1200" />
        <path d="M0 240 H1200" />
        <path d="M0 360 H1200" />
        <path d="M0 480 H1200" />
        <path d="M200 0 V640" />
        <path d="M400 0 V640" />
        <path d="M600 0 V640" />
        <path d="M800 0 V640" />
        <path d="M1000 0 V640" />
      </g>
      <circle cx="600" cy="320" r="84" fill="rgba(34,197,94,0.12)" />
      <circle cx="600" cy="320" r="10" fill="#22c55e" stroke="#f8fafc" stroke-width="4" />
      <text x="600" y="108" text-anchor="middle" fill="#e2e8f0" font-size="30" font-family="system-ui">
        Mock geographic context
      </text>
      <text x="600" y="148" text-anchor="middle" fill="#94a3b8" font-size="24" font-family="system-ui">
        {safe_city}
      </text>
      <text x="600" y="548" text-anchor="middle" fill="#94a3b8" font-size="22" font-family="system-ui">
        Geocoded point: {lat:.4f}, {lng:.4f}
      </text>
    </svg>
    """
    return svg.encode("utf-8")


async def fetch_static_map(lat: float, lng: float, city: str) -> tuple[bytes, str]:
    """Fetch a static base map for the selected city."""
    if use_mock_data():
        return _mock_map_svg(city, lat, lng), "image/svg+xml"

    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured.")

    params: list[tuple[str, str]] = [
        ("center", f"{lat},{lng}"),
        ("zoom", "10"),
        ("size", "1200x640"),
        ("scale", "2"),
        ("maptype", "roadmap"),
        ("style", "feature:poi|visibility:off"),
        ("style", "feature:transit|visibility:off"),
        ("style", "feature:road|element:geometry|color:0xe2e8f0"),
        ("style", "feature:water|element:geometry|color:0xdbeafe"),
        ("style", "feature:landscape|element:geometry|color:0xf8fafc"),
        ("key", api_key),
    ]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(STATIC_MAP_URL, params=params, timeout=20.0)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError("Google static map is unavailable.") from exc

    media_type = response.headers.get("content-type", "image/png").split(";", 1)[0]
    return response.content, media_type
