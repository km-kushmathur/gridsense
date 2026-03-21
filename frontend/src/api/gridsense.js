const API_BASE = '/api';

export async function fetchIntensity(city) {
  const res = await fetch(`${API_BASE}/intensity?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`Failed to fetch intensity: ${res.status}`);
  return res.json();
}

export async function fetchForecast(city) {
  const res = await fetch(`${API_BASE}/forecast?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`Failed to fetch forecast: ${res.status}`);
  return res.json();
}

export async function fetchNudges(city) {
  const res = await fetch(`${API_BASE}/nudges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city }),
  });
  if (!res.ok) throw new Error(`Failed to fetch nudges: ${res.status}`);
  return res.json();
}
