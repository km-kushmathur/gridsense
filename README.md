# GridSense

GridSense is a real-time grid carbon dashboard and demand spike simulator built with FastAPI and React.

## Local Run

### 1. Configure environment

```bash
cp .env.example .env
```

Default local mode uses `USE_MOCK_DATA=true`, which enables the full dashboard and simulator without live provider access.

For live mode set:

```bash
USE_MOCK_DATA=false
WATTTIME_USER=...
WATTTIME_PASSWORD=...
AZURE_OPENAI_BASE_URL=https://your-resource.services.ai.azure.com/openai/v1/
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-5.4-mini
GOOGLE_MAPS_API_KEY=...
```

Legacy compatibility:
- `AZURE_AI_ENDPOINT` is also accepted and normalized to an OpenAI-compatible `/openai/v1/` base URL.
- `AZURE_AI_KEY` and `AZURE_AI_MODEL` are accepted as aliases for the Azure OpenAI key and deployment name.
- In Azure, the `model` value used by the API is your deployment name, not just the raw model family name.

### 2. Start the backend

```bash
cd backend
../venv/bin/pip install -r requirements.txt
../venv/bin/python -m uvicorn main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8000`

## Endpoints

- `GET /api/health`
- `GET /api/intensity?city=Charlottesville`
- `GET /api/forecast?city=Charlottesville`
- `GET /api/weather?city=Charlottesville`
- `POST /api/nudges`
- `POST /api/simulate`

## Demo Notes

- Use Charlottesville plus the `heat_wave` scenario for the strongest simulator story.
- In mock mode the app returns a stable dramatic failure timeline and a shifted-load recovery timeline.
- The frontend proxies `/api` requests to the backend through Vite.
