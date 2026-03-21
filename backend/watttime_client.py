"""WattTime v3 API client with auto-refreshing JWT auth and in-memory caching."""

import os
import time
from datetime import datetime, timezone

import httpx

# Cache TTL in seconds
CACHE_TTL = 300  # 5 minutes
TOKEN_TTL = 1500  # 25 minutes (tokens expire at 30)

BASE_URL = "https://api.watttime.org"


class WattTimeClient:
    """Async client for the WattTime v3 API.

    Handles JWT auth with automatic refresh, region lookup,
    real-time MOER retrieval, and 24-hour forecast fetching.
    """

    def __init__(self) -> None:
        self._token: str | None = None
        self._token_ts: float = 0.0
        self._forecast_cache: dict[str, tuple[float, list[dict]]] = {}
        self._realtime_cache: dict[str, tuple[float, dict]] = {}

    async def _ensure_token(self) -> str:
        """Authenticate or refresh the JWT token if it's expired."""
        if self._token and (time.time() - self._token_ts) < TOKEN_TTL:
            return self._token

        username = os.getenv("WATTTIME_USER", "")
        password = os.getenv("WATTTIME_PASSWORD", "")

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/login",
                auth=(username, password),
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()

        self._token = data["token"]
        self._token_ts = time.time()
        return self._token

    async def _authed_get(self, path: str, params: dict | None = None) -> dict | list:
        """Make an authenticated GET request, retrying once on 401."""
        token = await self._ensure_token()
        headers = {"Authorization": f"Bearer {token}"}

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}{path}",
                headers=headers,
                params=params or {},
                timeout=15.0,
            )

            # If 401, re-auth and retry once
            if resp.status_code == 401:
                self._token = None
                token = await self._ensure_token()
                headers = {"Authorization": f"Bearer {token}"}
                resp = await client.get(
                    f"{BASE_URL}{path}",
                    headers=headers,
                    params=params or {},
                    timeout=15.0,
                )

            resp.raise_for_status()
            return resp.json()

    async def get_region(self, lat: float, lng: float) -> str:
        """Look up the WattTime balancing authority region for coordinates.

        Falls back to CAISO_NORTH on error (free tier default).
        """
        try:
            data = await self._authed_get(
                "/v3/region-from-loc",
                params={
                    "latitude": str(lat),
                    "longitude": str(lng),
                    "signal_type": "co2_moer",
                },
            )
            return data.get("region", "CAISO_NORTH")
        except Exception:
            return "CAISO_NORTH"

    async def get_realtime(self, region: str) -> dict:
        """Get real-time MOER data for a region.

        Returns:
            {moer, pct_renewable, green_score} where green_score is 0-100.
        """
        # Check cache
        cached = self._realtime_cache.get(region)
        if cached and (time.time() - cached[0]) < CACHE_TTL:
            return cached[1]

        data = await self._authed_get(
            "/v3/signal-index",
            params={"region": region, "signal_type": "co2_moer"},
        )

        # The API returns a list of data points; take the most recent
        if isinstance(data, dict) and "data" in data:
            points = data["data"]
        elif isinstance(data, list):
            points = data
        else:
            points = [data]

        if not points:
            return {"moer": 0, "pct_renewable": 0.0, "green_score": 50}

        latest = points[0] if isinstance(points[0], dict) else {}
        moer = float(latest.get("value", 0))

        # Normalize to green score: 200 = 100 (very clean), 1200 = 0 (very dirty)
        green_score = max(0, min(100, 100 - (moer - 200) / 10))
        pct_renewable = round(green_score / 100, 2)

        result = {
            "moer": moer,
            "pct_renewable": pct_renewable,
            "green_score": round(green_score, 1),
        }

        self._realtime_cache[region] = (time.time(), result)
        return result

    async def get_forecast(self, region: str) -> list[dict]:
        """Get 24-hour MOER forecast for a region.

        Returns:
            List of {time, moer, pct_renewable} dicts.
        """
        # Check cache
        cached = self._forecast_cache.get(region)
        if cached and (time.time() - cached[0]) < CACHE_TTL:
            return cached[1]

        data = await self._authed_get(
            "/v3/forecast",
            params={"region": region, "signal_type": "co2_moer"},
        )

        # Parse the forecast response
        if isinstance(data, dict) and "data" in data:
            raw_points = data["data"]
        elif isinstance(data, list):
            raw_points = data
        else:
            raw_points = []

        forecast = []
        for point in raw_points:
            if not isinstance(point, dict):
                continue
            moer_val = float(point.get("value", 0))
            green = max(0, min(100, 100 - (moer_val - 200) / 10))
            forecast.append({
                "time": point.get("point_time", datetime.now(timezone.utc).isoformat()),
                "moer": moer_val,
                "pct_renewable": round(green / 100, 2),
            })

        self._forecast_cache[region] = (time.time(), forecast)
        return forecast
