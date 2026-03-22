"""Azure OpenAI-powered appliance nudge generation engine."""

import json
import httpx

try:
    from .settings import (
        azure_openai_api_key,
        azure_openai_base_url,
        azure_openai_configured,
        azure_openai_deployment,
        use_mock_data,
    )
except ImportError:
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


class NudgeEngine:
    """Generates appliance nudge messages using Azure OpenAI."""

    def __init__(self) -> None:
        self._base_url = azure_openai_base_url()
        self._api_key = azure_openai_api_key()
        self._model = azure_openai_deployment()

    def is_configured(self) -> bool:
        """Return whether Azure OpenAI is configured for live nudge generation."""
        return azure_openai_configured()

    def _find_cleanest_windows(
        self, forecast: list[dict], n: int = 3
    ) -> list[dict]:
        """Find the n time windows with the lowest MOER values."""
        sorted_points = sorted(forecast, key=lambda p: p.get("moer", 9999))
        return sorted_points[:n]

    def _calculate_co2_saved(
        self, appliance: str, current_moer: float, best_moer: float
    ) -> float:
        """Calculate grams of CO₂ saved by shifting to a cleaner window.

        Formula: kWh × MOER_difference(lbs/MWh) × 453.592(g/lb) / 1000(kWh/MWh)
        """
        kwh = APPLIANCE_KWH.get(appliance, 1.0)
        moer_diff = max(0, current_moer - best_moer)
        return round(kwh * moer_diff * 453.592 / 1000, 1)

    def _build_fallback_nudges(
        self,
        forecast: list[dict],
        current_moer: float,
        current_weather: dict | None = None,
    ) -> list[dict]:
        """Build deterministic nudges when AI is unavailable."""
        cleanest = self._find_cleanest_windows(forecast, n=len(APPLIANCE_KWH))
        fallback_windows = cleanest or [{"time": "later tonight", "moer": current_moer, "clean_power_score": 50.0}]
        nudges: list[dict] = []
        appliances = list(APPLIANCE_KWH.keys())
        temp_c = round(float((current_weather or {}).get("temp_c", 24.0)))

        for index, appliance in enumerate(appliances):
            window = fallback_windows[index % len(fallback_windows)]
            best_time = str(window.get("time", "later tonight"))
            best_moer = float(window.get("moer", current_moer))
            clean_power_score = round(float(window.get("clean_power_score", 50.0)))
            nudges.append({
                "appliance": appliance,
                "emoji": APPLIANCE_EMOJI[appliance],
                "best_time": best_time,
                "co2_saved_grams": self._calculate_co2_saved(appliance, current_moer, best_moer),
                "message": (
                    f"Run your {appliance.replace('_', ' ')} at {best_time} "
                    f"when the clean-power score is about {clean_power_score}/100 and {temp_c}C."
                ),
            })

        return nudges

    async def generate_nudges(
        self,
        forecast: list[dict],
        city: str,
        current_weather: dict,
        current_moer: float = 500.0,
    ) -> list[dict]:
        """Generate 4 appliance nudge recommendations.
        """
        cleanest = self._find_cleanest_windows(forecast)
        cleanest_summary = "\n".join(
            f"- {w.get('time', 'N/A')}: MOER={w.get('moer', 0)}, "
            f"clean_score={float(w.get('clean_power_score', 50.0)):.0f}/100"
            for w in cleanest
        )

        user_prompt = (
            f"Create four appliance timing recommendations for {city}.\n"
            f"Current temperature: {current_weather.get('temp_c', 0)}C.\n"
            f"Heat wave conditions: {current_weather.get('heat_wave', False)}.\n"
            f"Current carbon intensity: {current_moer} lbs CO2 per MWh.\n\n"
            f"Best upcoming windows:\n{cleanest_summary}\n\n"
            "Use each appliance exactly once: dishwasher, washer, ev_charger, dryer.\n"
            "Return a JSON object with key nudges.\n"
            "Each nudge should include appliance, best_time, and message.\n"
            "Keep each message under 30 words and mention carbon intensity or the clean-power score.\n"
            "Use one of the supplied times for best_time."
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
            nudges = []
            for nudge in nudges_raw:
                appliance = nudge.get("appliance", "dishwasher")
                best_match = next(
                    (window for window in cleanest if window.get("time") == nudge.get("best_time")),
                    cleanest[0] if cleanest else {"moer": current_moer},
                )
                nudges.append({
                    "appliance": appliance,
                    "emoji": APPLIANCE_EMOJI.get(appliance, "⚡"),
                    "best_time": nudge.get("best_time", ""),
                    "co2_saved_grams": self._calculate_co2_saved(
                        appliance, current_moer, float(best_match.get("moer", current_moer))
                    ),
                    "message": nudge.get("message", ""),
                })

            return nudges

        except Exception:
            return self._build_fallback_nudges(forecast, current_moer, current_weather)
