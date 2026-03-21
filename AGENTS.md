# GridSense Agent Rules

## Project
Real-time grid carbon dashboard + energy demand spike predictor.
Backend: FastAPI Python. Frontend: React + Vite + Tailwind. No TypeScript.

## Code Style
- Python: snake_case, type hints on all functions, docstrings on classes
- JS: camelCase, async/await only (no .then()), named exports
- Never use any, object, or dict without a Pydantic model in Python
- Always handle API errors gracefully with fallback UI states

## API Keys
All secrets come from environment variables. Never hardcode.
Keys needed: WATTTIME_USER, WATTTIME_PASSWORD, OPENAI_API_KEY, GOOGLE_MAPS_API_KEY
Open-Meteo requires no API key.

## WattTime Rules
- Always use v3 API endpoints (not v2)
- Auth token expires every 30 minutes — always refresh before requests
- Free tier: use signal_type=co2_moer, region=CAISO_NORTH for testing
- Production: use /v3/region-to-signal to get region from lat/lng

## Nudge Generation
Use OpenAI gpt-4.1-mini. Keep nudges under 40 words.
Tone: friendly, specific, actionable. Always mention % renewable or MOER value.

## API Contract
GET /api/intensity returns: {city, region, moer, pct_renewable, green_score (0-100), status ("clean"|"moderate"|"dirty"), temp_c, heat_wave}
GET /api/forecast returns: [{time: ISO string, moer: float, pct_renewable: float, temp_c: float, demand_index: float, grid_stress: float}]
POST /api/nudges returns: {nudges: [{appliance, emoji, best_time, co2_saved_grams, message}]}
POST /api/simulate returns: {scenario, city, timeline, shifted_timeline, failure_hour, savings_kg_co2}
GET /api/weather returns: {temp_c, condition, heat_wave, forecast_highs}
