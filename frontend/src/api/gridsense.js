import * as gridCache from '../cache/gridCache';

const API_BASE = '/api';
const WEATHER_TTL = 300_000; // 5 minutes
const NUDGES_TTL = 300_000;  // 5 minutes

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

function hasPositiveNudgeSavings(payload) {
  const nudges = payload?.nudges;
  if (!Array.isArray(nudges) || nudges.length === 0) {
    return false;
  }

  return nudges.some((nudge) => Number(nudge?.co2_saved_grams || 0) > 0);
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
  if (!gridCache.isStale(city, 'weather', WEATHER_TTL)) {
    const cached = gridCache.getData(city, 'weather');
    if (cached) return cached;
  }
  const res = await fetch(`${API_BASE}/weather?city=${encodeURIComponent(city)}`);
  const data = await parseResponse(res, 'Failed to fetch weather');
  gridCache.set(city, 'weather', data);
  return data;
}

export async function fetchNudges(city) {
  if (!gridCache.isStale(city, 'nudges', NUDGES_TTL)) {
    const cached = gridCache.getData(city, 'nudges');
    if (cached && hasPositiveNudgeSavings(cached)) return cached;
  }
  const res = await fetch(`${API_BASE}/nudges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city }),
  });
  const data = await parseResponse(res, 'Failed to fetch nudges');
  if (hasPositiveNudgeSavings(data)) {
    gridCache.set(city, 'nudges', data);
  }
  return data;
}

export async function fetchSimulation(city, scenario) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, scenario }),
  });
  return parseResponse(res, 'Failed to fetch simulation');
}

export async function subscribeAlerts(city, topic) {
  const res = await fetch(`${API_BASE}/alerts/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, topic }),
  });
  return parseResponse(res, 'Failed to subscribe to alerts');
}

export async function sendAlertTest(city, topic) {
  const res = await fetch(`${API_BASE}/alerts/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, topic }),
  });
  return parseResponse(res, 'Failed to send test alert');
}

export async function triggerAlert(topic) {
  const res = await fetch(`${API_BASE}/alerts/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });
  return parseResponse(res, 'Failed to trigger alert');
}

export async function fetchAlertCount() {
  const res = await fetch(`${API_BASE}/alerts/count`);
  return parseResponse(res, 'Failed to fetch alert count');
}
