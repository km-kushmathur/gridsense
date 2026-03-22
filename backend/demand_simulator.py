"""Demand spike simulation engine for GridSense."""

from __future__ import annotations

try:
    from .mock_data import build_mock_simulation
    from .settings import use_mock_data
except ImportError:
    from mock_data import build_mock_simulation
    from settings import use_mock_data


class DemandSimulator:
    """Predicts demand spikes and shifted load scenarios."""

    def __init__(self, weather_client, watttime_client) -> None:
        self._weather_client = weather_client
        self._watttime_client = watttime_client

    def _scenario_multiplier(self, scenario: str) -> float:
        return 1.4 if scenario == "heat_wave" else 1.3 if scenario == "cold_snap" else 1.0

    def _grid_stress(self, demand_index: float, moer: float) -> float:
        return round(min(100.0, (demand_index * moer) / 12.0), 1)

    async def simulate(
        self,
        city: str,
        scenario: str,
        lat: float,
        lng: float,
        region: str,
    ) -> dict:
        """Build a 24-hour grid stress timeline and a shifted-load alternative."""
        if use_mock_data():
            return build_mock_simulation(city, scenario)

        weather_forecast = await self._weather_client.get_forecast(lat, lng, city)
        moer_forecast = await self._watttime_client.get_forecast(region)

        if not weather_forecast or not moer_forecast:
            raise RuntimeError("Simulation inputs are unavailable.")

        limit = min(24, len(weather_forecast), len(moer_forecast))
        multiplier = self._scenario_multiplier(scenario)
        timeline: list[dict] = []

        for index in range(limit):
            weather_row = weather_forecast[index]
            moer_row = moer_forecast[index]
            hour = int(weather_row.get("hour", index))
            temp_c = float(weather_row.get("temp_c", 22.0))
            moer = float(moer_row.get("moer", 0.0))
            pct_renewable = float(moer_row.get("pct_renewable", 0.0))
            clean_power_score = float(moer_row.get("clean_power_score", pct_renewable * 100.0))
            time_factor = 0.2 if hour in {7, 8, 9} else 0.15 if hour in {18, 19, 20, 21} else 0.0
            demand_index = (0.5 + abs(temp_c - 22.0) * 0.03 + time_factor) * multiplier
            timeline.append({
                "hour": index,
                "time": str(moer_row.get("time", weather_row.get("time", ""))),
                "temp_c": round(temp_c, 1),
                "demand_index": round(demand_index, 2),
                "moer": round(moer, 1),
                "pct_renewable": round(pct_renewable, 2),
                "clean_power_score": round(clean_power_score, 1),
                "grid_stress": self._grid_stress(demand_index, moer),
            })

        failure_hour = next((row["hour"] for row in timeline if float(row["grid_stress"]) > 85.0), None)
        peak_count = max(1, round(limit * 0.2))
        peak_indexes = sorted(
            range(limit),
            key=lambda idx: float(timeline[idx]["demand_index"]),
            reverse=True,
        )[:peak_count]
        low_moer_indexes = sorted(range(limit), key=lambda idx: float(timeline[idx]["moer"]))[:peak_count]
        shift_amount = sum(float(timeline[idx]["demand_index"]) * 0.2 for idx in peak_indexes) / peak_count

        adjusted_demands = [float(row["demand_index"]) for row in timeline]
        for idx in peak_indexes:
            adjusted_demands[idx] = max(0.1, adjusted_demands[idx] * 0.8)
        for idx in low_moer_indexes:
            adjusted_demands[idx] += shift_amount

        shifted_timeline: list[dict] = []
        savings_kg_co2 = 0.0
        for index, row in enumerate(timeline):
            shifted_demand = round(adjusted_demands[index], 2)
            savings_kg_co2 += max(0.0, float(row["demand_index"]) - shifted_demand) * float(row["moer"]) * 0.453 / 1000
            shifted_timeline.append({
                **row,
                "demand_index": shifted_demand,
                "grid_stress": self._grid_stress(shifted_demand, float(row["moer"])),
            })

        return {
            "scenario": scenario,
            "city": city,
            "timeline": timeline,
            "shifted_timeline": shifted_timeline,
            "failure_hour": failure_hour,
            "savings_kg_co2": round(savings_kg_co2, 2),
        }
