"""OpenAI-powered appliance nudge generation engine."""

import json
import os

try:
    from .settings import use_mock_data
except ImportError:
    from settings import use_mock_data

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

SYSTEM_PROMPT = """You are GridSense, a friendly energy advisor for college campuses,
apartment buildings, and small towns. Return JSON {nudges: [...]} with exactly
4 items. Each: {appliance, emoji, best_time, co2_saved_grams, message}.
Message under 35 words. Mention specific time. Friendly not preachy.
Always include one EV charger nudge."""


class NudgeEngine:
    """Generates appliance nudge messages using OpenAI."""

    def __init__(self) -> None:
        self._client = None
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if api_key:
            try:
                from openai import OpenAI
            except ImportError:
                self._client = None
            else:
                self._client = OpenAI(api_key=api_key)
        self._model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()

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
        fallback_windows = cleanest or [{"time": "later tonight", "moer": current_moer, "pct_renewable": 0.5}]
        nudges: list[dict] = []
        appliances = list(APPLIANCE_KWH.keys())
        temp_c = round(float((current_weather or {}).get("temp_c", 24.0)))

        for index, appliance in enumerate(appliances):
            window = fallback_windows[index % len(fallback_windows)]
            best_time = str(window.get("time", "later tonight"))
            best_moer = float(window.get("moer", current_moer))
            pct_renewable = round(float(window.get("pct_renewable", 0.5)) * 100)
            nudges.append({
                "appliance": appliance,
                "emoji": APPLIANCE_EMOJI[appliance],
                "best_time": best_time,
                "co2_saved_grams": self._calculate_co2_saved(appliance, current_moer, best_moer),
                "message": (
                    f"Run your {appliance.replace('_', ' ')} at {best_time} "
                    f"when the grid is about {pct_renewable}% renewable and {temp_c}C."
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
            f"renewable={w.get('pct_renewable', 0):.0%}"
            for w in cleanest
        )

        user_prompt = (
            f"City: {city}\n"
            f"Current temperature: {current_weather.get('temp_c', 0)}C\n"
            f"Heat wave: {current_weather.get('heat_wave', False)}\n"
            f"Current MOER: {current_moer} lbs CO₂/MWh\n\n"
            f"The 3 cleanest windows in the next 24 hours:\n{cleanest_summary}\n\n"
            f"Generate nudges for these 4 appliances: dishwasher (1.2 kWh), "
            f"washer (0.5 kWh), EV charger (7.2 kWh), dryer (3.5 kWh).\n"
            f"Respond with JSON {{\"nudges\": [...]}} only."
        )

        try:
            if use_mock_data() or self._client is None or not self._model:
                return self._build_fallback_nudges(forecast, current_moer, current_weather)

            response = self._client.chat.completions.create(
                model=self._model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            )

            raw_text = response.choices[0].message.content or "{}"
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
