export const CITY_COORDS = {
  'sacramento': [38.58, -121.49],
  'san francisco': [37.77, -122.42],
  'los angeles': [34.05, -118.24],
  'new york': [40.71, -74.01],
  'chicago': [41.88, -87.63],
  'seattle': [47.61, -122.33],
  'austin': [30.27, -97.74],
  'denver': [39.74, -104.99],
  'charlottesville': [38.03, -78.48],
  'university of virginia': [38.03, -78.51],
};

export const LOW_EMISSIONS_SCORE_THRESHOLD = 70;
export const MODERATE_EMISSIONS_SCORE_THRESHOLD = 40;

export function cleanPowerScoreFromMoer(moer) {
  const numericMoer = Number.isFinite(Number(moer)) ? Number(moer) : 0;
  return Math.max(0, Math.min(100, 100 * (1 - numericMoer / 1000)));
}

export function getCleanPowerScore(data) {
  if (!data) return 0;
  if (typeof data === 'number') return cleanPowerScoreFromMoer(data);
  if (typeof data.clean_power_score === 'number') return data.clean_power_score;
  if (typeof data.green_score === 'number') return data.green_score;
  if (typeof data.moer === 'number') return cleanPowerScoreFromMoer(data.moer);
  if (typeof data.pct_renewable === 'number') return data.pct_renewable * 100;
  return 0;
}

export function getStatusColor(data) {
  if (!data) return '#888780';
  if (typeof data.status === 'string') {
    if (data.status === 'clean') return '#22C55E';
    if (data.status === 'moderate') return '#EAB308';
    if (data.status === 'dirty') return '#EF4444';
  }
  const score = getCleanPowerScore(data);
  if (score >= LOW_EMISSIONS_SCORE_THRESHOLD) return '#22C55E';
  if (score >= MODERATE_EMISSIONS_SCORE_THRESHOLD) return '#EAB308';
  return '#EF4444';
}

export function getStatusLabel(data) {
  if (!data) return 'Unknown';
  if (typeof data.status === 'string') {
    if (data.status === 'clean') return 'Lower emissions';
    if (data.status === 'moderate') return 'Moderate emissions';
    if (data.status === 'dirty') return 'High carbon';
  }
  const score = getCleanPowerScore(data);
  if (score >= LOW_EMISSIONS_SCORE_THRESHOLD) return 'Lower emissions';
  if (score >= MODERATE_EMISSIONS_SCORE_THRESHOLD) return 'Moderate emissions';
  return 'High carbon';
}

export function getMoerColor(moer) {
  if (moer < 400) return '#22C55E';
  if (moer < 700) return '#EAB308';
  return '#EF4444';
}

export function getStressColor(stress) {
  if (stress < 60) return '#22C55E';
  if (stress <= 85) return '#EAB308';
  return '#EF4444';
}
