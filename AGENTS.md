# GridSense Agent Rules

## Project
Real-time grid carbon intensity dashboard. Backend is FastAPI Python.
Frontend is React + Vite + Tailwind. No TypeScript — plain JS only.

## Code Style
- Python: snake_case, type hints on all functions, docstrings on classes
- JS: camelCase, async/await only (no .then()), named exports
- Never use any, object, or dict without a Pydantic model in Python
- Always handle API errors gracefully with fallback UI states

## API Keys
All secrets come from environment variables. Never hardcode.
Keys needed: WATTTIME_USER, WATTTIME_PASSWORD, AZURE_AI_ENDPOINT, AZURE_AI_KEY, AZURE_AI_MODEL, GOOGLE_MAPS_API_KEY

## WattTime Rules
- Always use v3 API endpoints (not v2)
- Auth token expires every 30 minutes — always refresh before requests
- Free tier: use signal_type=co2_moer, region=CAISO_NORTH for testing
- Production: use /v3/region-to-signal to get region from lat/lng

## Nudge Generation
Use Claude Sonnet via Azure AI Foundry (azure-ai-inference SDK). Keep nudges under 40 words.
Tone: friendly, specific, actionable. Always mention % renewable or MOER value.

## API Contract
GET /api/intensity returns: {city, region, moer, pct_renewable, green_score (0-100), status ("clean"|"moderate"|"dirty")}
GET /api/forecast returns: [{time: ISO string, moer: float, pct_renewable: float}]
POST /api/nudges returns: [{appliance, emoji, best_time, co2_saved_grams, message}]
