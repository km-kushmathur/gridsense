"""Unit tests for shared forecast window utilities."""

from __future__ import annotations

import unittest
from unittest.mock import AsyncMock, patch

from backend.mock_data import MOCK_REGION, build_mock_simulation, get_mock_forecast, get_mock_intensity
from backend import main
from backend.nudge_engine import NudgeEngine
from backend.window_utils import build_best_window_meta, format_window_label, parse_iso_timestamp


class WindowUtilsTests(unittest.TestCase):
    def test_parse_iso_timestamp_handles_z_suffix(self) -> None:
        parsed = parse_iso_timestamp("2026-03-22T10:00:00Z")
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed.isoformat(), "2026-03-22T10:00:00+00:00")

    def test_build_best_window_meta_renders_two_hour_span(self) -> None:
        forecast = build_mock_simulation("Charlottesville", "normal")["timeline"]
        meta = build_best_window_meta(forecast)

        self.assertTrue(meta["best_window_start"])
        self.assertTrue(meta["best_window_end"])
        self.assertEqual(meta["best_window_label"], format_window_label(meta["best_window_start"], meta["best_window_end"]))
        self.assertRegex(meta["best_window_label"], r"^[0-9]{1,2} (am|pm) - [0-9]{1,2} (am|pm)$")
        self.assertEqual(len(meta["points"]), 2)

    def test_nudge_engine_uses_shared_best_window_and_positive_savings(self) -> None:
        forecast = build_mock_simulation("Charlottesville", "normal")["timeline"]
        meta = build_best_window_meta(forecast)
        engine = NudgeEngine()

        nudges = engine._build_fallback_nudges(forecast, current_moer=900.0, current_weather={})

        self.assertTrue(nudges)
        self.assertEqual(nudges[0].best_window_start, meta["best_window_start"])
        self.assertEqual(nudges[0].best_window_end, meta["best_window_end"])
        self.assertEqual(nudges[0].best_window_label, meta["best_window_label"])
        self.assertTrue(all(nudge.co2_saved_grams > 0 for nudge in nudges))


class ForecastCacheFallbackTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        main.CACHE.clear()

    async def asyncTearDown(self) -> None:
        main.CACHE.clear()

    async def test_forecast_uses_stale_cache_when_refresh_fails(self) -> None:
        cached_forecast = build_mock_simulation("Charlottesville", "normal")["timeline"]
        main.CACHE["charlottesville:forecast"] = (0.0, cached_forecast)

        with patch("backend.main._resolve_city", new=AsyncMock(return_value=(38.0, -78.0, "CAISO_NORTH"))):
            with patch("backend.main._build_forecast_timeline", new=AsyncMock(side_effect=RuntimeError("bad key"))):
                result = await main._fetch_forecast_payload("Charlottesville", use_cache=False)

        self.assertEqual(result, cached_forecast)


class NudgeSavingsTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        main.CACHE.clear()

    async def asyncTearDown(self) -> None:
        main.CACHE.clear()

    async def test_zero_savings_cached_payload_is_not_reused(self) -> None:
        main.CACHE["austin:nudges"] = (
            9999999999.0,
            {
                "nudges": [
                    {
                        "appliance": "ev_charger",
                        "emoji": "⚡",
                        "best_time": "2026-03-22T10:00:00+00:00",
                        "best_window_start": "2026-03-22T10:00:00+00:00",
                        "best_window_end": "2026-03-22T12:00:00+00:00",
                        "best_window_label": "10 am - 12 pm",
                        "co2_saved_grams": 0.0,
                        "window_avg_moer": 200.0,
                        "message": "cached zero",
                    }
                ]
            },
        )

        with patch.object(main.nudge_engine, "is_configured", return_value=False):
            with patch("backend.main._resolve_city", new=AsyncMock(return_value=(30.0, -97.0, "CAISO_NORTH"))):
                with patch("backend.main.watttime.get_realtime", new=AsyncMock(return_value={"moer": 100.0})):
                    with patch("backend.main.weather.get_current", new=AsyncMock(return_value={"temp_c": 28.0, "condition": "Clear"})):
                        with patch("backend.main.weather.is_heat_wave", new=AsyncMock(return_value=False)):
                            result = await main.get_nudges(main.NudgeRequest(city="Austin"))

        self.assertTrue(any(nudge.co2_saved_grams > 0 for nudge in result.nudges))

    async def test_nudges_use_forecast_current_moer_for_savings(self) -> None:
        with patch.object(main.nudge_engine, "is_configured", return_value=False):
            with patch("backend.main._resolve_city", new=AsyncMock(return_value=(30.0, -97.0, "CAISO_NORTH"))):
                with patch("backend.main.watttime.get_realtime", new=AsyncMock(return_value={"moer": 50.0})):
                    with patch("backend.main.weather.get_current", new=AsyncMock(return_value={"temp_c": 28.0, "condition": "Clear"})):
                        with patch("backend.main.weather.is_heat_wave", new=AsyncMock(return_value=False)):
                            result = await main.get_nudges(main.NudgeRequest(city="Austin"))

        self.assertTrue(result.nudges)
        self.assertTrue(all(nudge.co2_saved_grams > 0 for nudge in result.nudges))


class HardcodedForecastTests(unittest.TestCase):
    def test_forecasts_vary_by_city(self) -> None:
        west = get_mock_forecast(MOCK_REGION, "San Francisco")
        south = get_mock_forecast(MOCK_REGION, "Austin")
        midwest = get_mock_forecast(MOCK_REGION, "Chicago")

        self.assertEqual(len(west), 24)
        self.assertEqual(len(south), 24)
        self.assertEqual(len(midwest), 24)
        self.assertNotEqual([row["moer"] for row in west[:6]], [row["moer"] for row in south[:6]])
        self.assertNotEqual([row["moer"] for row in south[:6]], [row["moer"] for row in midwest[:6]])

    def test_unknown_city_forecast_is_stable(self) -> None:
        first = get_mock_forecast(MOCK_REGION, "Demo City")
        second = get_mock_forecast(MOCK_REGION, "Demo City")

        self.assertEqual([row["moer"] for row in first], [row["moer"] for row in second])
        self.assertEqual(len(first), 24)

    def test_cleaner_window_score_gap_is_within_target_range(self) -> None:
        first = get_mock_forecast(MOCK_REGION, "Austin")
        second = get_mock_forecast(MOCK_REGION, "Austin")

        def score_gap(forecast: list[dict]) -> float:
            current_score = float(forecast[0]["clean_power_score"])
            meta = build_best_window_meta(forecast)
            window_score = sum(float(point["clean_power_score"]) for point in meta["points"]) / len(meta["points"])
            return round(window_score - current_score, 1)

        first_gap = score_gap(first)
        second_gap = score_gap(second)

        self.assertGreaterEqual(first_gap, 10.0)
        self.assertLessEqual(first_gap, 30.0)
        self.assertEqual(first_gap, second_gap)

    def test_mock_intensity_matches_forecast_baseline_score(self) -> None:
        forecast = get_mock_forecast(MOCK_REGION, "San Francisco")
        intensity = get_mock_intensity("San Francisco")

        self.assertEqual(float(intensity["moer"]), float(forecast[0]["moer"]))
        self.assertEqual(float(intensity["clean_power_score"]), float(forecast[0]["clean_power_score"]))
        self.assertEqual(float(intensity["grid_stress"]), float(build_mock_simulation("San Francisco", "normal")["timeline"][0]["grid_stress"]))

    def test_mock_intensity_is_stable_for_same_city(self) -> None:
        first = get_mock_intensity("Austin")
        second = get_mock_intensity("Austin")

        self.assertEqual(float(first["clean_power_score"]), float(second["clean_power_score"]))
        self.assertEqual(float(first["grid_stress"]), float(second["grid_stress"]))

    def test_mock_intensity_preserves_location_context_overrides(self) -> None:
        intensity = get_mock_intensity(
            "Austin",
            region="ERCOT",
            latitude=30.2672,
            longitude=-97.7431,
            temp_c=31.5,
            heat_wave=True,
        )

        self.assertEqual(str(intensity["region"]), "ERCOT")
        self.assertEqual(str(intensity["region_label"]), "Texas balancing region")
        self.assertEqual(float(intensity["latitude"]), 30.2672)
        self.assertEqual(float(intensity["longitude"]), -97.7431)
        self.assertEqual(float(intensity["temp_c"]), 31.5)
        self.assertTrue(bool(intensity["heat_wave"]))
        self.assertLess(float(intensity["clean_power_score"]), 100.0)
        self.assertGreater(float(intensity["grid_stress"]), 0.0)

    def test_regional_score_and_pressure_ordering_is_plausible(self) -> None:
        san_francisco = get_mock_intensity("San Francisco")
        austin = get_mock_intensity("Austin")
        chicago = get_mock_intensity("Chicago")

        self.assertGreater(float(san_francisco["clean_power_score"]), float(austin["clean_power_score"]))
        self.assertGreater(float(austin["clean_power_score"]), float(chicago["clean_power_score"]))
        self.assertLess(float(san_francisco["grid_stress"]), float(austin["grid_stress"]))
        self.assertLess(float(austin["grid_stress"]), float(chicago["grid_stress"]))


class IntensityPayloadTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        main.CACHE.clear()

    async def asyncTearDown(self) -> None:
        main.CACHE.clear()

    async def test_live_context_uses_demo_current_signal_metrics(self) -> None:
        with patch("backend.main.use_mock_data", return_value=False):
            with patch("backend.main._resolve_city", new=AsyncMock(return_value=(30.2672, -97.7431, "ERCOT"))):
                with patch("backend.main.weather.get_current", new=AsyncMock(return_value={"temp_c": 31.5, "condition": "Clear"})):
                    with patch("backend.main.weather.is_heat_wave", new=AsyncMock(return_value=True)):
                        with patch("backend.main.watttime.get_realtime", new=AsyncMock(side_effect=AssertionError("realtime path should not be used"))):
                            result = await main._fetch_intensity_payload("Austin", use_cache=False)

        self.assertEqual(str(result["region"]), "ERCOT")
        self.assertEqual(str(result["region_label"]), "Texas balancing region")
        self.assertEqual(float(result["temp_c"]), 31.5)
        self.assertTrue(bool(result["heat_wave"]))
        self.assertGreater(float(result["clean_power_score"]), 0.0)
        self.assertLess(float(result["clean_power_score"]), 100.0)
        self.assertGreater(float(result["grid_stress"]), 0.0)


if __name__ == "__main__":
    unittest.main()
