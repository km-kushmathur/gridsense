"""Open-Meteo client for current and forecast weather."""

from __future__ import annotations

import httpx

try:
    from .mock_data import get_mock_current_weather, get_mock_weather_forecast
    from .settings import use_mock_data
except ImportError:
    from mock_data import get_mock_current_weather, get_mock_weather_forecast
    from settings import use_mock_data

BASE_URL = "https://api.open-meteo.com/v1/forecast"


class WeatherClient:
    """Fetches weather data from Open-Meteo."""

    def _condition_from_code(self, weather_code: int | None) -> str:
        mapping = {
            0: "Clear",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Cloudy",
            45: "Fog",
            51: "Drizzle",
            61: "Rain",
            71: "Snow",
            95: "Storm",
        }
        return mapping.get(weather_code or 0, "Clear")

    async def get_forecast(self, lat: float, lng: float, city: str = "Unknown") -> list[dict]:
        """Return the next 24 hourly forecast points."""
        if use_mock_data():
            return get_mock_weather_forecast(city)

        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": "temperature_2m,precipitation,cloudcover,weathercode",
            "current_weather": "true",
            "forecast_days": 2,
            "timezone": "UTC",
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(BASE_URL, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            raise RuntimeError("Open-Meteo weather service is unavailable.") from exc

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])[:24]
        temps = hourly.get("temperature_2m", [])[:24]
        precip = hourly.get("precipitation", [])[:24]
        cloud = hourly.get("cloudcover", [])[:24]
        codes = hourly.get("weathercode", [])[:24]
        forecast: list[dict] = []
        for index, point_time in enumerate(times):
            forecast.append({
                "time": point_time,
                "hour": int(point_time[11:13]),
                "temp_c": float(temps[index]),
                "precip_mm": float(precip[index]),
                "cloud_cover": int(cloud[index]),
                "condition": self._condition_from_code(codes[index] if index < len(codes) else 0),
            })
        return forecast

    async def get_current(self, lat: float, lng: float, city: str = "Unknown") -> dict:
        """Return the current weather snapshot."""
        if use_mock_data():
            return get_mock_current_weather(city)

        params = {
            "latitude": lat,
            "longitude": lng,
            "current_weather": "true",
            "timezone": "UTC",
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(BASE_URL, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            raise RuntimeError("Open-Meteo weather service is unavailable.") from exc

        current = data.get("current_weather", {})
        return {
            "temp_c": float(current.get("temperature", 22.0)),
            "condition": self._condition_from_code(current.get("weathercode")),
        }

    async def is_heat_wave(self, lat: float, lng: float, city: str = "Unknown") -> bool:
        """Return whether the next 24 hours contains heat-wave conditions."""
        forecast = await self.get_forecast(lat, lng, city)
        return any(float(point.get("temp_c", 0.0)) > 35.0 for point in forecast)
