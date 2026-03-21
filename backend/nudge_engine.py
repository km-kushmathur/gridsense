"""Claude-powered appliance nudge generation engine (Azure AI Foundry)."""

import json
import os

from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential

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

SYSTEM_PROMPT = """You are GridSense, a friendly neighborhood energy advisor.
Given real-time grid carbon data, generate specific, encouraging nudges
for home appliances. Be conversational, never preachy.
Always give a specific time (e.g. "tonight at 11pm") and a concrete saving.
Keep each nudge under 35 words.

You MUST respond with ONLY a valid JSON array of 4 objects, each with these exact keys:
- "appliance": string (one of: dishwasher, washer, ev_charger, dryer)
- "best_time": string (a specific human-readable time like "tonight at 11pm")
- "message": string (the nudge text, under 35 words)

Example:
[
  {"appliance": "dishwasher", "best_time": "tonight at 11pm", "message": "Your grid will be 78% renewable at 11pm — perfect time to run the dishwasher and save 218g of CO₂!"},
  {"appliance": "washer", "best_time": "tomorrow at 6am", "message": "Early bird gets clean clothes! 82% renewable power at 6am means your wash is nearly carbon-free."},
  {"appliance": "ev_charger", "best_time": "tonight at 2am", "message": "Plug in at 2am for peak renewables — you'll save over 1.4kg of CO₂ on a full charge."},
  {"appliance": "dryer", "best_time": "tomorrow at 1pm", "message": "Solar surge at 1pm! Run your dryer when the grid is greenest and save 630g of CO₂."}
]"""


class NudgeEngine:
    """Generates appliance nudge messages using Claude on Azure AI Foundry."""

    def __init__(self) -> None:
        self._client = ChatCompletionsClient(
            endpoint=os.getenv("AZURE_AI_ENDPOINT", ""),
            credential=AzureKeyCredential(os.getenv("AZURE_AI_KEY", "")),
        )
        self._model = os.getenv("AZURE_AI_MODEL", "claude-sonnet-4-20250514")

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

    async def generate_nudges(
        self,
        forecast: list[dict],
        city: str,
        current_moer: float = 500.0,
    ) -> list[dict]:
        """Generate 4 appliance nudge recommendations.

        Args:
            forecast: List of {time, moer, pct_renewable} dicts for next 24 hours.
            city: Name of the city.
            current_moer: Current MOER value for CO₂ savings calculation.

        Returns:
            List of 4 nudge dicts matching NudgeItem schema.
        """
        cleanest = self._find_cleanest_windows(forecast)
        cleanest_summary = "\n".join(
            f"- {w.get('time', 'N/A')}: MOER={w.get('moer', 0)}, "
            f"renewable={w.get('pct_renewable', 0):.0%}"
            for w in cleanest
        )

        user_prompt = (
            f"City: {city}\n"
            f"Current MOER: {current_moer} lbs CO₂/MWh\n\n"
            f"The 3 cleanest windows in the next 24 hours:\n{cleanest_summary}\n\n"
            f"Generate nudges for these 4 appliances: dishwasher (1.2 kWh), "
            f"washer (0.5 kWh), EV charger (7.2 kWh), dryer (3.5 kWh).\n"
            f"Respond with ONLY the JSON array."
        )

        try:
            response = self._client.complete(
                model=self._model,
                max_tokens=600,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            )

            raw_text = response.choices[0].message.content.strip()

            # Extract JSON from the response (handle markdown code blocks)
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
                raw_text = raw_text.strip()

            nudges_raw = json.loads(raw_text)

            # Enrich with emoji and CO₂ savings
            best_moer = cleanest[0].get("moer", current_moer) if cleanest else current_moer
            nudges = []
            for nudge in nudges_raw:
                appliance = nudge.get("appliance", "dishwasher")
                nudges.append({
                    "appliance": appliance,
                    "emoji": APPLIANCE_EMOJI.get(appliance, "⚡"),
                    "best_time": nudge.get("best_time", ""),
                    "co2_saved_grams": self._calculate_co2_saved(
                        appliance, current_moer, best_moer
                    ),
                    "message": nudge.get("message", ""),
                })

            return nudges

        except Exception as exc:
            # Fallback nudges if Claude API fails
            best_moer = cleanest[0].get("moer", current_moer) if cleanest else current_moer
            best_time = cleanest[0].get("time", "later tonight") if cleanest else "later tonight"
            return [
                {
                    "appliance": app,
                    "emoji": APPLIANCE_EMOJI[app],
                    "best_time": best_time,
                    "co2_saved_grams": self._calculate_co2_saved(app, current_moer, best_moer),
                    "message": f"Run your {app.replace('_', ' ')} at {best_time} "
                               f"for a cleaner grid. (AI unavailable: {exc})",
                }
                for app in APPLIANCE_KWH
            ]
