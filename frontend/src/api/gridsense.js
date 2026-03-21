const API_BASE = '/api';

async function parseResponse(res, fallbackMessage) {
  if (res.ok) {
    return res.json();
  }

  let detail = '';
  try {
    const data = await res.json();
    detail = data.detail || '';
  } catch {
    detail = '';
  }

  throw new Error(detail || `${fallbackMessage}: ${res.status}`);
}

export async function fetchIntensity(city) {
  const res = await fetch(`${API_BASE}/intensity?city=${encodeURIComponent(city)}`);
  return parseResponse(res, 'Failed to fetch intensity');
}

export async function fetchForecast(city) {
  const res = await fetch(`${API_BASE}/forecast?city=${encodeURIComponent(city)}`);
  return parseResponse(res, 'Failed to fetch forecast');
}

export async function fetchWeather(city) {
  const res = await fetch(`${API_BASE}/weather?city=${encodeURIComponent(city)}`);
  return parseResponse(res, 'Failed to fetch weather');
}

export async function fetchNudges(city) {
  const res = await fetch(`${API_BASE}/nudges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city }),
  });
  return parseResponse(res, 'Failed to fetch nudges');
}

export async function fetchSimulation(city, scenario) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, scenario }),
  });
  return parseResponse(res, 'Failed to fetch simulation');
}
