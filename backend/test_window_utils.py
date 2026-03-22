"""Unit tests for shared forecast window utilities."""

from __future__ import annotations

import unittest
from unittest.mock import AsyncMock, patch

from backend.mock_data import MOCK_REGION, build_mock_simulation, get_mock_forecast
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


if __name__ == "__main__":
    unittest.main()
