"""Weather scenario generation and optional Google integration hooks."""

from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from models import EnvironmentSummary, WeatherScenarioSlug, WeatherSnapshot
from site_profiles import get_site


class WeatherService:
    """Provides deterministic weather profiles for demo scenarios."""

    _SCENARIO_OFFSETS: dict[WeatherScenarioSlug, dict[str, float | str]] = {
        "heat_wave": {
            "temp_base": 92.0,
            "temp_amp": 9.0,
            "humidity": 68.0,
            "wind": 7.0,
            "cloud": 18.0,
            "precip": 10.0,
            "condition": "Heat advisory",
            "severity": 88.0,
            "air_quality": 74,
            "pollen": 38,
            "solar_factor": 0.92,
        },
        "cold_snap": {
            "temp_base": 24.0,
            "temp_amp": 10.0,
            "humidity": 55.0,
            "wind": 15.0,
            "cloud": 44.0,
            "precip": 18.0,
            "condition": "Cold snap",
            "severity": 79.0,
            "air_quality": 41,
            "pollen": 8,
            "solar_factor": 0.58,
        },
        "storm_front": {
            "temp_base": 70.0,
            "temp_amp": 7.0,
            "humidity": 82.0,
            "wind": 28.0,
            "cloud": 78.0,
            "precip": 64.0,
            "condition": "Storm front",
            "severity": 84.0,
            "air_quality": 48,
            "pollen": 16,
            "solar_factor": 0.32,
        },
        "smoke_event": {
            "temp_base": 79.0,
            "temp_amp": 5.0,
            "humidity": 61.0,
            "wind": 10.0,
            "cloud": 52.0,
            "precip": 6.0,
            "condition": "Smoke transport",
            "severity": 76.0,
            "air_quality": 132,
            "pollen": 24,
            "solar_factor": 0.48,
        },
    }

    def get_weather(self, site_id: str, scenario: WeatherScenarioSlug, hours: int = 24) -> list[WeatherSnapshot]:
        """Return deterministic hourly weather data for the requested site."""
        site = get_site(site_id)
        tz = ZoneInfo(site.timezone)
        start = datetime.now(tz=tz).replace(minute=0, second=0, microsecond=0)
        cfg = self._SCENARIO_OFFSETS[scenario]
        points: list[WeatherSnapshot] = []

        for hour_index in range(hours):
            current = start + timedelta(hours=hour_index)
            hour = current.hour
            solar_curve = max(0.0, 1 - abs(hour - 13) / 8)
            diurnal = 1 - abs(hour - 16) / 12
            overnight = 1 - abs(hour - 6) / 8

            temp = float(cfg["temp_base"]) + float(cfg["temp_amp"]) * diurnal
            if scenario == "cold_snap":
                temp = float(cfg["temp_base"]) - float(cfg["temp_amp"]) * overnight

            cloud = min(100.0, float(cfg["cloud"]) + (1 - solar_curve) * 14)
            precip = min(100.0, float(cfg["precip"]) + (24 if scenario == "storm_front" and 13 <= hour <= 20 else 0))
            wind = float(cfg["wind"]) + (9 if scenario == "storm_front" and hour >= 15 else 0)
            humidity = min(100.0, float(cfg["humidity"]) + (8 if scenario == "storm_front" else 0))
            apparent = temp + (humidity - 50) * 0.05
            if scenario == "cold_snap":
                apparent = temp - wind * 0.18

            points.append(
                WeatherSnapshot(
                    timestamp=current.isoformat(),
                    local_label=current.strftime("%a %-I%p"),
                    temperature_f=round(temp, 1),
                    apparent_temperature_f=round(apparent, 1),
                    humidity_pct=round(humidity, 1),
                    wind_mph=round(wind, 1),
                    cloud_cover_pct=round(cloud, 1),
                    precipitation_prob_pct=round(precip, 1),
                    condition=str(cfg["condition"]),
                    severity=float(cfg["severity"]),
                )
            )

        return points

    def get_environment(self, site_id: str, scenario: WeatherScenarioSlug) -> EnvironmentSummary:
        """Return environmental overlays for the selected scenario."""
        site = get_site(site_id)
        cfg = self._SCENARIO_OFFSETS[scenario]
        solar_factor = float(cfg["solar_factor"])
        solar_kw = round(1850 * solar_factor, 1)

        label = "strong"
        if solar_factor < 0.65:
            label = "limited"
        if solar_factor < 0.4:
            label = "suppressed"

        notes = {
            "heat_wave": [
                "Cooling demand rises sharply from late morning through early evening.",
                "Clear skies preserve solar value, but peak load still outruns local generation.",
            ],
            "cold_snap": [
                "Morning heating load shifts the peak earlier than the current dashboard assumes.",
                "Cloudier winter conditions reduce daytime solar support.",
            ],
            "storm_front": [
                "Storm risk reduces solar headroom and justifies a more conservative operations posture.",
                "Wind and precipitation increase failure risk even before demand peaks.",
            ],
            "smoke_event": [
                "Poor air quality increases indoor filtration load and occupant sensitivity.",
                "Hazy skies weaken solar output while HVAC systems work harder indoors.",
            ],
        }[scenario]

        return EnvironmentSummary(
            site_id=site.id,
            weather_scenario=scenario,
            air_quality_index=int(cfg["air_quality"]),
            air_quality_label="Unhealthy for sensitive groups" if int(cfg["air_quality"]) > 100 else "Moderate",
            pollen_index=int(cfg["pollen"]),
            solar_generation_kw=solar_kw,
            solar_outlook_label=label,
            notes=notes,
        )
