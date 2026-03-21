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
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
GOOGLE_MAPS_API_KEY=...
```

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
