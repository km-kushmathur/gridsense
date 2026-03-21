const API_BASE = '/api';

async function request(path, init) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchSites() {
  return request('/sites');
}

export function fetchWeather(siteId, weatherScenario) {
  return request(`/weather?site_id=${encodeURIComponent(siteId)}&weather_scenario=${encodeURIComponent(weatherScenario)}`);
}

export function fetchEnvironment(siteId, weatherScenario) {
  return request(`/environment?site_id=${encodeURIComponent(siteId)}&weather_scenario=${encodeURIComponent(weatherScenario)}`);
}

export function fetchScenario(siteId, weatherScenario, scenario) {
  return request(
    `/demand-forecast?site_id=${encodeURIComponent(siteId)}&weather_scenario=${encodeURIComponent(weatherScenario)}&scenario=${encodeURIComponent(scenario)}`
  );
}

export function fetchActions(siteId, weatherScenario) {
  return request(`/actions?site_id=${encodeURIComponent(siteId)}&weather_scenario=${encodeURIComponent(weatherScenario)}`);
}
