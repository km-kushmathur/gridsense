# GridSense Metrics Audit Prompt
## For use with Claude Opus 4.6

---

You are a peer reviewer with expertise in power systems engineering, environmental data science, and applied energy policy. Your task is to audit GridSense — a carbon-aware grid intelligence tool — for metric accuracy, methodological soundness, and academic rigor.

You have access to the full codebase at `/home/kato/gridsense`. Read all relevant source files before answering any question. Do not assume — verify by reading the code.

---

## Part 1 — MOER Signal Fidelity

**Read:** `backend/watttime_client.py`, `backend/grid_utils.py`, `backend/main.py`, `backend/mock_data.py`

Answer each question with specific evidence from the code:

1. **What signal is actually being fetched?** Confirm whether the dashboard uses MOER (Marginal Operating Emissions Rate) or AER (Average Emissions Rate). These are distinct concepts — MOER reflects the marginal generator responding to incremental load, not the fleet average. Cite the exact API endpoint and response field being used.

2. **Is the MOER value lbs CO₂/MWh or kg CO₂/MWh?** WattTime v2 returns lbs CO₂/MWh natively. Confirm no unit conversion error is present. Show the raw field name and any transformation applied.

3. **What is the data freshness guarantee?** Identify the polling interval, cache TTL, and whether stale data can silently replace live data. What is the worst-case staleness a user could see?

4. **Is there a fallback to mock or estimated data?** If WattTime is unavailable, what does the user see? Is it clearly labeled as estimated? Read `backend/mock_data.py` and trace how mock data enters the response chain.

5. **Grid region assignment:** How is the balancing authority region resolved from a city name? Is this lookup correct for cities that span multiple regions (e.g., Los Angeles)? Could a user in one balancing region receive MOER data for an adjacent region?

---

## Part 2 — Clean Power Score Formula

**Read:** `backend/grid_utils.py`, `frontend/src/constants.js`

6. **Assess the normalization formula:** `score = max(0, min(100, 100 × (1 − MOER / 1000)))`

   - Where does the 1000 lbs/MWh denominator come from? Is it empirically grounded or arbitrary? The US grid MOER range is roughly 50–2000 lbs/MWh depending on region and hour. Using 1000 as the ceiling compresses the scale — a coal-heavy region at 1200 lbs/MWh would score negative, clipped to 0. Evaluate whether this ceiling is appropriate.
   - Does the score behave monotonically and consistently across the MOER range actually observed in production? Check if the backend returns MOER values that would produce nonsensical scores (e.g., MOER > 1000 resulting in a score of 0 with no distinction).
   - Is the score labeled clearly as a derived normalization index, not a physical measurement or renewable percentage? Audit the UI copy in `frontend/src/components/IntensityBadge.jsx` and `frontend/src/components/MethodologyPanel.jsx`.

7. **Check for double derivation:** Is the Clean Power Score recomputed from MOER on both the backend and frontend? If the backend already returns a `clean_power_score` field, does the frontend re-derive it anyway? Could these diverge?

---

## Part 3 — Forecast Accuracy and Best-Window Selection

**Read:** `frontend/src/utils/forecast.js`, `backend/watttime_client.py`, `frontend/src/components/ForecastChart.jsx`

8. **Best-window algorithm:** The dashboard finds the lowest mean-MOER 2-hour window in a 24-hour forecast. Evaluate:
   - Does the algorithm scan future-only hours, or could it recommend a window that has already passed?
   - Is the window size (2 hours) appropriate? For EV charging, a single-session window may underfit or overfit real-world flexibility windows.
   - Is there any confidence interval or forecast uncertainty shown to the user? WattTime forecast MOER can have meaningful error bands — are these surfaced?

9. **Time zone handling:** Are all forecast timestamps interpreted in local time or UTC? A user in Sacramento (UTC−7/−8) could see a "best window at 2pm" that is actually 2pm UTC (7am local). Trace timestamp parsing from the API response through to the chart x-axis labels.

---

## Part 4 — Carbon Savings Calculation

**Read:** `backend/nudge_engine.py`, `backend/models.py`

10. **Appliance kWh assumptions:** The engine uses fixed per-cycle kWh values:
    - EV charger: 7.2 kWh
    - Dryer: 3.5 kWh
    - Dishwasher: 1.2 kWh
    - Washer: 0.5 kWh

    Evaluate the sourcing of these values. Are they representative medians, or optimistic/pessimistic outliers? The ENERGY STAR 2023 database reports dishwasher range of 0.8–1.8 kWh, dryer range 2.0–5.8 kWh. What is the uncertainty range of the savings estimate given these ranges?

11. **Savings formula:** `CO₂ saved (g) = kWh × (current_MOER − window_MOER) × 453.592 / 1000`

    - Is the unit conversion factor 453.592 correct? (1 lb = 453.592 g — confirm)
    - If `window_MOER > current_MOER` (the suggested window is dirtier than right now), does the formula return a negative value? Is that clamped to zero or surfaced to the user? Read the `_calculate_co2_saved` method carefully.
    - Is there a scenario where `current_moer` passed to the function does not reflect what was actually displayed to the user (e.g., stale cache vs. live value)?

12. **Single-window assignment:** Confirm whether each appliance is independently assigned to the cleanest window for that appliance, or whether all appliances share one consensus window. Are the savings estimates recalculated correctly for whichever assignment strategy is used?

---

## Part 5 — AI-Generated Recommendation Layer

**Read:** `backend/nudge_engine.py` system prompt and user prompt construction

13. **Is the language model given physically grounded inputs?** Confirm the LLM receives pre-computed MOER and savings values as fixed inputs — not asked to estimate them. Does the system prompt instruct the model to stay within those physical bounds?

14. **What happens when the LLM message contradicts the derived data?** For example, if the model generates a message saying "this is one of the cleanest hours of the year" but MOER is 800 lbs/MWh, is there a guardrail? Evaluate the validation logic after `json.loads`.

15. **Is the generated layer clearly distinguished from measured data in the UI?** The UI uses taxonomy chips (`generated recommendation`, `observed`, `derived`) — verify these are displayed correctly and that no generated text is presented under an "observed" or "derived" label.

---

## Part 6 — Academic Rigor Checklist

Produce a structured verdict on each item:

| Item | Status | Evidence | Recommendation |
|------|--------|----------|----------------|
| MOER vs AER distinction — clearly communicated | | | |
| Unit correctness (lbs/MWh, no silent conversion) | | | |
| Score formula ceiling (1000 lbs/MWh) — empirically justified | | | |
| Appliance kWh values — cited and representative | | | |
| CO₂ savings formula — unit-correct, handles edge cases | | | |
| Forecast timestamps — timezone-safe | | | |
| Mock/fallback data — clearly labeled in UI | | | |
| LLM layer — physically grounded, not free-generating metrics | | | |
| Observed / derived / generated — correctly distinguished | | | |
| Balancing region assignment — correct for all supported cities | | | |

For each row, mark: ✅ Rigorous | ⚠️ Minor gap | ❌ Needs correction

---

## Deliverable

Return a structured report with:
1. **Critical findings** — anything that could materially mislead a user (wrong units, wrong region, fabricated savings)
2. **Methodological gaps** — defensible choices that should be disclosed more clearly
3. **Suggested disclosures** — exact text additions for the MethodologyPanel that would bring the tool to academic-paper citation standards
4. **Suggested code changes** — specific, minimal code edits to fix any critical findings

Be direct. Cite line numbers. Do not soften findings.
