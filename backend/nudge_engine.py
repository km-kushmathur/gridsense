"""Azure OpenAI-powered appliance nudge generation engine."""

import json
from datetime import datetime, timedelta

import httpx

try:
    from .grid_utils import clean_power_score_from_moer
    from .models import NudgeItem
    from .settings import (
        azure_openai_api_key,
        azure_openai_base_url,
        azure_openai_configured,
        azure_openai_deployment,
        use_mock_data,
    )
except ImportError:
    from grid_utils import clean_power_score_from_moer
    from models import NudgeItem
    from settings import (
        azure_openai_api_key,
        azure_openai_base_url,
        azure_openai_configured,
        azure_openai_deployment,
        use_mock_data,
    )

# kWh per typical cycle for each appliance
APPLIANCE_KWH: dict[str, float] = {
    "dishwasher": 1.2,
    "washer": 0.5,
    "ev_charger": 7.2,
    "dryer": 3.5,
}

APPLIANCE_EMOJI: dict[str, str] = {
    "dishwasher": "🍽️",
    "washer": "👕",
    "ev_charger": "🔌",
    "dryer": "👖",
}

SYSTEM_PROMPT = """You write short, friendly appliance timing tips for GridSense.
Keep each message practical and calm. Avoid warnings, safety language, or policy talk.
Use the supplied clean-energy windows and return four concise recommendations."""
WINDOW_HOURS = 2


class NudgeEngine:
    """Generates appliance nudge messages using Azure OpenAI."""

    def __init__(self) -> None:
        self._base_url = azure_openai_base_url()
        self._api_key = azure_openai_api_key()
        self._model = azure_openai_deployment()

    def is_configured(self) -> bool:
        """Return whether Azure OpenAI is configured for live nudge generation."""
        return azure_openai_configured()

    def _parse_timestamp(self, value: str) -> datetime | None:
        """Parse a forecast timestamp into a datetime."""
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    def _format_hour_label(self, hour: int) -> str:
        """Render an hour as a readable 12-hour label."""
        if hour == 0:
            return "12 am"
        if hour < 12:
            return f"{hour} am"
        if hour == 12:
            return "12 pm"
        return f"{hour - 12} pm"

    def _build_window_label(self, start_at: str, end_at: str) -> str:
        """Build a display label for a recommendation window."""
        start = self._parse_timestamp(start_at)
        end = self._parse_timestamp(end_at)
        if not start or not end:
            return "Cleaner window"
        return f"{self._format_hour_label(start.hour)} - {self._format_hour_label(end.hour)}"

    def _build_window(self, points: list[dict], start_index: int) -> dict:
        """Summarize a contiguous set of hourly forecast points."""
        start_at = str(points[0].get("time", ""))
        end_dt = self._parse_timestamp(str(points[-1].get("time", "")))
        end_at = (end_dt + timedelta(hours=1)).isoformat() if end_dt else start_at
        moer_values = [float(point.get("moer", 0.0)) for point in points]
        renewable_values = [float(point.get("pct_renewable", 0.0)) for point in points]
        clean_score_values = [float(point.get("clean_power_score", clean_power_score_from_moer(value))) for point, value in zip(points, moer_values)]
        avg_moer = sum(moer_values) / max(1, len(moer_values))
        avg_pct_renewable = sum(renewable_values) / max(1, len(renewable_values))
        avg_clean_power_score = sum(clean_score_values) / max(1, len(clean_score_values))
        return {
            "start_index": start_index,
            "best_window_start": start_at,
            "best_window_end": end_at,
            "best_window_label": self._build_window_label(start_at, end_at),
            "avg_moer": round(avg_moer, 1),
            "pct_renewable": round(avg_pct_renewable * 100),
            "clean_power_score": round(avg_clean_power_score),
        }

    def _find_cleanest_windows(self, forecast: list[dict], n: int = 3) -> list[dict]:
        """Find the cleanest non-overlapping two-hour windows."""
        if len(forecast) < WINDOW_HOURS:
            if not forecast:
                return []
            return [self._build_window(forecast[:1], start_index=0)]

        candidates = [
            self._build_window(forecast[index:index + WINDOW_HOURS], start_index=index)
            for index in range(len(forecast) - WINDOW_HOURS + 1)
        ]
        sorted_candidates = sorted(candidates, key=lambda window: (float(window["avg_moer"]), int(window["start_index"])))

        selected: list[dict] = []
        occupied_indexes: set[int] = set()
        for window in sorted_candidates:
            start_index = int(window["start_index"])
            candidate_indexes = set(range(start_index, start_index + WINDOW_HOURS))
            if occupied_indexes & candidate_indexes:
                continue
            selected.append(window)
            occupied_indexes.update(candidate_indexes)
            if len(selected) == n:
                break

        if len(selected) < n:
            for window in sorted_candidates:
                if window in selected:
                    continue
                selected.append(window)
                if len(selected) == n:
                    break

        return selected

    def _calculate_co2_saved(
        self, appliance: str, current_moer: float, best_moer: float
    ) -> float:
        """Calculate grams of CO₂ saved by shifting to a cleaner window.

        Formula: kWh × MOER_difference(lbs/MWh) × 453.592(g/lb) / 1000(kWh/MWh)
        """
        kwh = APPLIANCE_KWH.get(appliance, 1.0)
        moer_diff = max(0, current_moer - best_moer)
        return round(kwh * moer_diff * 453.592 / 1000, 1)

    def _build_fallback_message(self, appliance: str, window: dict) -> str:
        """Build a compact deterministic message when AI is unavailable."""
        renewable = int(window.get("pct_renewable", 0))
        avg_moer = round(float(window.get("avg_moer", 0.0)))
        return (
            f"Queue the {appliance.replace('_', ' ')} for the cleaner window. "
            f"Average MOER is about {avg_moer} lbs/MWh with {renewable}% renewable power."
        )

    def _build_fallback_nudges(
        self,
        forecast: list[dict],
        current_moer: float,
        current_weather: dict | None = None,
    ) -> list[NudgeItem]:
        """Build deterministic nudges when AI is unavailable."""
        cleanest = self._find_cleanest_windows(forecast, n=len(APPLIANCE_KWH))
        fallback_windows = cleanest or [{
            "best_window_start": "",
            "best_window_end": "",
            "best_window_label": "Later tonight",
            "avg_moer": current_moer,
            "pct_renewable": 50,
            "clean_power_score": 50,
        }]
        nudges: list[NudgeItem] = []
        appliances = list(APPLIANCE_KWH.keys())

        for index, appliance in enumerate(appliances):
            window = fallback_windows[index % len(fallback_windows)]
            best_window_start = str(window.get("best_window_start", ""))
            best_window_end = str(window.get("best_window_end", ""))
            best_window_label = str(window.get("best_window_label", "Later tonight"))
            best_moer = float(window.get("avg_moer", current_moer))
            nudges.append(NudgeItem(
                appliance=appliance,
                emoji=APPLIANCE_EMOJI[appliance],
                best_time=best_window_start,
                best_window_start=best_window_start,
                best_window_end=best_window_end,
                best_window_label=best_window_label,
                co2_saved_grams=self._calculate_co2_saved(appliance, current_moer, best_moer),
                message=self._build_fallback_message(appliance, window),
            ))

        return nudges

    async def generate_nudges(
        self,
        forecast: list[dict],
        city: str,
        current_weather: dict,
        current_moer: float = 500.0,
    ) -> list[NudgeItem]:
        """Generate 4 appliance nudge recommendations.
        """
        cleanest = self._find_cleanest_windows(forecast, n=len(APPLIANCE_KWH))
        assignments = []
        for index, appliance in enumerate(APPLIANCE_KWH.keys()):
            window = cleanest[index % len(cleanest)] if cleanest else {
                "best_window_start": "",
                "best_window_end": "",
                "best_window_label": "Cleaner window",
                "avg_moer": current_moer,
                "pct_renewable": 50,
                "clean_power_score": 50,
            }
            assignments.append({"appliance": appliance, **window})

        assignment_summary = "\n".join(
            (
                f"- appliance={row['appliance']}, "
                f"window={row['best_window_label']}, "
                f"avg_moer={row['avg_moer']} lbs/MWh, "
                f"renewable={row['pct_renewable']}%"
            )
            for row in assignments
        )

        user_prompt = (
            f"Create four appliance timing recommendations for {city}.\n"
            f"Current temperature: {current_weather.get('temp_c', 0)}C.\n"
            f"Heat wave conditions: {current_weather.get('heat_wave', False)}.\n"
            f"Current carbon intensity: {current_moer} lbs CO2 per MWh.\n\n"
            "The UI already shows the recommendation window, so messages should not repeat any times.\n"
            "Use each appliance exactly once: dishwasher, washer, ev_charger, dryer.\n"
            "Use the assigned windows below as fixed inputs.\n\n"
            f"Assigned clean-energy windows:\n{assignment_summary}\n\n"
            "Return a JSON object with key nudges.\n"
            "Each nudge should include appliance and message.\n"
            "Keep each message under 18 words.\n"
            "Mention MOER or renewable percentage.\n"
            "Do not include time ranges in the message."
        )

        try:
            if use_mock_data() or not self.is_configured() or not self._model:
                return self._build_fallback_nudges(forecast, current_moer, current_weather)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self._base_url.rstrip('/')}/chat/completions",
                    headers={
                        "api-key": self._api_key,
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self._model,
                        "response_format": {"type": "json_object"},
                        "max_completion_tokens": 600,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt},
                        ],
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                payload = response.json()

            raw_text = payload["choices"][0]["message"]["content"] or "{}"
            payload = json.loads(raw_text)
            nudges_raw = payload.get("nudges", [])
            generated_messages = {
                str(nudge.get("appliance", "")): str(nudge.get("message", "")).strip()
                for nudge in nudges_raw
                if isinstance(nudge, dict)
            }

            nudges: list[NudgeItem] = []
            for assignment in assignments:
                appliance = str(assignment["appliance"])
                message = generated_messages.get(appliance, "")
                if not message or len(message.split()) > 18:
                    message = self._build_fallback_message(appliance, assignment)

                nudges.append(NudgeItem(
                    appliance=appliance,
                    emoji=APPLIANCE_EMOJI.get(appliance, "⚡"),
                    best_time=str(assignment["best_window_start"]),
                    best_window_start=str(assignment["best_window_start"]),
                    best_window_end=str(assignment["best_window_end"]),
                    best_window_label=str(assignment["best_window_label"]),
                    co2_saved_grams=self._calculate_co2_saved(
                        appliance,
                        current_moer,
                        float(assignment.get("avg_moer", current_moer)),
                    ),
                    message=message,
                ))

            return nudges

        except Exception:
            return self._build_fallback_nudges(forecast, current_moer, current_weather)
