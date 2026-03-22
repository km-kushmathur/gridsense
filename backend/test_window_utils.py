"""Unit tests for shared forecast window utilities."""

from __future__ import annotations

import unittest

from backend.mock_data import build_mock_simulation
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


if __name__ == "__main__":
    unittest.main()
