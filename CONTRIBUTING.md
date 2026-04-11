# Contributing to GridSense

## Tech Stack

**Backend:** FastAPI + Python · **Frontend:** React + Vite + Tailwind CSS · **No TypeScript.**

## Code Style

### Python
- snake_case naming, type hints on all functions, docstrings on classes
- Never use untyped `dict` or `Any` — use Pydantic models for all API contracts
- Handle API errors gracefully with mock-data fallbacks

### JavaScript
- camelCase naming, async/await only (no `.then()` chains), named exports
- Tailwind utility classes only — avoid custom CSS unless there's no Tailwind equivalent

### General
- No `console.log` or `print` statements in committed code
- All secrets via environment variables — never hardcode credentials

## API Keys

| Variable | Required for |
|---|---|
| `WATTTIME_USER` / `WATTTIME_PASSWORD` | Live carbon intensity data |
| `AZURE_OPENAI_BASE_URL` + `AZURE_OPENAI_API_KEY` + `AZURE_OPENAI_DEPLOYMENT` | Appliance nudge text generation |
| `GOOGLE_MAPS_API_KEY` | City geocoding |

Open-Meteo (weather) requires no API key. Set `USE_MOCK_DATA=true` to run without any keys.

## WattTime Notes

- Use v3 API endpoints only (not v2)
- Auth token expires every 30 minutes — always refresh before requests
- Use `/v3/region-to-signal` to look up region from lat/lng in production

## Mock Data

Mock forecasts in `backend/mock_data.py` are deterministic by city — they use stable region profiles and city checksums to produce clean, repeatable demo timelines. Keep them deterministic if you modify them.

## API Contract

```
GET  /api/intensity  → {city, region, moer, pct_renewable, green_score, status, temp_c, heat_wave}
GET  /api/forecast   → [{time, moer, pct_renewable, temp_c, demand_index, grid_stress}]
GET  /api/weather    → {temp_c, condition, heat_wave, forecast_highs}
POST /api/nudges     → {nudges: [{appliance, emoji, best_time, co2_saved_grams, message}]}
POST /api/simulate   → {scenario, city, timeline, shifted_timeline, failure_hour, savings_kg_co2}
```
