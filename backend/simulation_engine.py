"""Deterministic heuristic engine for weather-driven grid stress simulation."""

from __future__ import annotations

from models import (
    DemandForecastPoint,
    OptimizationAction,
    ScenarioMode,
    ScenarioResult,
    WeatherScenarioSlug,
)
from site_profiles import get_site
from weather_service import WeatherService


class SimulationEngine:
    """Computes baseline and optimized site stress forecasts."""

    def __init__(self) -> None:
        self._weather = WeatherService()

    def _base_actions(self, site_id: str, scenario: WeatherScenarioSlug) -> list[OptimizationAction]:
        """Return ranked actions for a site and weather pattern."""
        site = get_site(site_id)
        is_heat = scenario == "heat_wave"
        is_cold = scenario == "cold_snap"
        is_storm = scenario == "storm_front"
        is_smoke = scenario == "smoke_event"

        return [
            OptimizationAction(
                id="shift_ev",
                title="Shift EV charging away from peak stress hours",
                target=site.assets[0].name,
                category="mobility",
                recommended_window="11pm-4am",
                impact_kw=950 if is_heat else 720,
                impact_score=92,
                rationale="EV charging is the fastest discretionary load to move without affecting campus safety.",
            ),
            OptimizationAction(
                id="precool_preheat",
                title="Pre-condition residence and classroom blocks before the peak",
                target="North Residences + Academic Core",
                category="buildings",
                recommended_window="7am-10am" if is_heat else "4am-7am",
                impact_kw=760 if is_heat else 680,
                impact_score=87,
                rationale="Thermal storage in buildings lets facilities avoid the most stressed hours later in the day.",
            ),
            OptimizationAction(
                id="solar_priority",
                title="Reserve solar-backed capacity for flexible daytime loads",
                target="Energy Park and academic loads",
                category="energy",
                recommended_window="10am-2pm",
                impact_kw=640 if not is_storm else 320,
                impact_score=78,
                rationale="Keeping flexible loads aligned with solar availability cuts grid imports during volatile conditions.",
            ),
            OptimizationAction(
                id="critical_shed",
                title="Reduce non-critical lab and ventilation loads",
                target="Academic Core",
                category="operations",
                recommended_window="Peak alert window",
                impact_kw=420 if not is_smoke else 260,
                impact_score=70,
                rationale="Short-duration curtailment can preserve headroom for critical facilities when stress persists.",
            ),
            OptimizationAction(
                id="filtration_balance",
                title="Balance indoor air protection with staged ventilation",
                target="Health Science Block",
                category="operations",
                recommended_window="All day",
                impact_kw=180 if is_smoke else 110 if is_storm else 90,
                impact_score=58,
                rationale="Weather-sensitive ventilation staging prevents indoor air goals from creating unnecessary peak demand.",
            ),
        ]

    def _weather_multiplier(self, scenario: WeatherScenarioSlug, hour: int, temperature_f: float) -> float:
        """Compute site demand pressure from the weather scenario."""
        if scenario == "heat_wave":
            return max(0, temperature_f - 72) * 1.45 + (12 if 14 <= hour <= 20 else 0)
        if scenario == "cold_snap":
            return max(0, 44 - temperature_f) * 1.35 + (10 if 6 <= hour <= 10 else 0)
        if scenario == "storm_front":
            return 22 + (18 if 14 <= hour <= 22 else 8)
        return 16 + max(0, temperature_f - 75) * 0.7

    def _solar_penalty(self, cloud_cover_pct: float, precipitation_pct: float, scenario: WeatherScenarioSlug) -> float:
        """Estimate generation risk due to weather conditions."""
        penalty = cloud_cover_pct * 0.42 + precipitation_pct * 0.18
        if scenario == "storm_front":
            penalty += 18
        if scenario == "smoke_event":
            penalty += 10
        return min(100.0, penalty)

    def _carbon_index(self, hour: int, scenario: WeatherScenarioSlug) -> float:
        """Synthetic carbon intensity index for the demo."""
        base = 46 + abs(hour - 14) * 1.8
        if scenario == "heat_wave":
            base += 14 if 15 <= hour <= 21 else 4
        elif scenario == "cold_snap":
            base += 12 if 6 <= hour <= 10 else 5
        elif scenario == "storm_front":
            base += 16
        else:
            base += 9
        return round(min(100.0, base), 1)

    def _risk_level(self, stress_score: float) -> str:
        """Map a stress score to a risk level."""
        if stress_score >= 82:
            return "failure-risk"
        if stress_score >= 68:
            return "critical"
        if stress_score >= 54:
            return "strained"
        return "normal"

    def _action_effect(self, hour: int, actions: list[OptimizationAction], scenario: WeatherScenarioSlug) -> float:
        """Compute aggregate action impact for optimized runs."""
        impact = 0.0
        if 23 <= hour or hour <= 4:
            impact += next((a.impact_kw for a in actions if a.id == "shift_ev"), 0.0)
        if scenario == "heat_wave" and 12 <= hour <= 18:
            impact += next((a.impact_kw for a in actions if a.id == "precool_preheat"), 0.0)
        if scenario == "cold_snap" and 6 <= hour <= 10:
            impact += next((a.impact_kw for a in actions if a.id == "precool_preheat"), 0.0)
        if 10 <= hour <= 14:
            impact += next((a.impact_kw for a in actions if a.id == "solar_priority"), 0.0)
        if 15 <= hour <= 20:
            impact += next((a.impact_kw for a in actions if a.id == "critical_shed"), 0.0)
        if scenario in {"storm_front", "smoke_event"} and 8 <= hour <= 20:
            impact += next((a.impact_kw for a in actions if a.id == "filtration_balance"), 0.0)
        return impact

    def run(
        self,
        site_id: str,
        weather_scenario: WeatherScenarioSlug,
        scenario: ScenarioMode,
        enabled_action_ids: list[str] | None = None,
    ) -> ScenarioResult:
        """Run a simulation for the requested site and scenario."""
        site = get_site(site_id)
        weather = self._weather.get_weather(site_id, weather_scenario)
        all_actions = self._base_actions(site_id, weather_scenario)
        active_actions = (
            [action for action in all_actions if not enabled_action_ids or action.id in enabled_action_ids]
            if scenario == "optimized"
            else []
        )

        forecast: list[DemandForecastPoint] = []
        peak = 0.0
        peak_window = weather[0].local_label
        critical_hours = 0
        failure_hours = 0
        avoided_peak_kw = 0.0
        emissions_saved = 0.0
        shifted_kwh = 0.0

        for point in weather:
            hour = int(point.timestamp[11:13])
            site_baseload = sum(zone.capacity_kw for zone in site.zones) / 175
            occupancy_wave = 14 if 8 <= hour <= 17 else 11 if 18 <= hour <= 22 else 7
            weather_load = self._weather_multiplier(weather_scenario, hour, point.apparent_temperature_f)
            generation_risk = self._solar_penalty(point.cloud_cover_pct, point.precipitation_prob_pct, weather_scenario)
            carbon_index = self._carbon_index(hour, weather_scenario)
            action_relief_kw = self._action_effect(hour, active_actions, weather_scenario)

            raw_demand_kw = site_baseload * 100 + occupancy_wave * 65 + weather_load * 55
            optimized_demand_kw = max(raw_demand_kw - action_relief_kw, raw_demand_kw * 0.78)
            effective_demand_kw = optimized_demand_kw if scenario == "optimized" else raw_demand_kw

            demand_index = round(effective_demand_kw / 170, 1)
            stress_score = min(
                100.0,
                round(
                    demand_index * 0.72
                    + generation_risk * 0.22
                    + carbon_index * 0.16
                    + point.severity * 0.12,
                    1,
                ),
            )
            risk_level = self._risk_level(stress_score)
            failure_risk = max(0.0, min(100.0, round((stress_score - 48) * 1.8, 1)))

            if risk_level in {"critical", "failure-risk"}:
                critical_hours += 1
            if risk_level == "failure-risk":
                failure_hours += 1

            if stress_score > peak:
                peak = stress_score
                peak_window = point.local_label

            if scenario == "optimized":
                avoided_peak_kw = max(avoided_peak_kw, raw_demand_kw - effective_demand_kw)
                emissions_saved += (raw_demand_kw - effective_demand_kw) * carbon_index / 1000
                shifted_kwh += max(0.0, raw_demand_kw - effective_demand_kw)

            forecast.append(
                DemandForecastPoint(
                    timestamp=point.timestamp,
                    local_label=point.local_label,
                    demand_index=demand_index,
                    generation_risk=round(generation_risk, 1),
                    carbon_intensity_index=carbon_index,
                    stress_score=stress_score,
                    risk_level=risk_level,
                    failure_risk_pct=failure_risk,
                    optimized=scenario == "optimized",
                )
            )

        summary = {
            "heat_wave": "Cooling demand outruns local solar during the late-day peak unless flexible loads move overnight.",
            "cold_snap": "Morning heating demand creates a sharp winter peak that can be flattened with pre-heating and charging controls.",
            "storm_front": "Storm-driven solar suppression and higher outage risk make conservative load staging the safest operating posture.",
            "smoke_event": "Indoor air protection increases HVAC demand while hazy skies reduce solar support, tightening the operating window.",
        }[weather_scenario]

        return ScenarioResult(
            site_id=site.id,
            weather_scenario=weather_scenario,
            scenario=scenario,
            summary=summary,
            stress_peak=round(peak, 1),
            peak_window=peak_window,
            critical_hours=critical_hours,
            failure_risk_hours=failure_hours,
            avoided_peak_kw=round(avoided_peak_kw, 1),
            avoided_emissions_kg=round(emissions_saved, 1),
            load_shifted_kwh=round(shifted_kwh, 1),
            active_actions=active_actions,
            forecast=forecast,
        )
