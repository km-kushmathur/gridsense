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

export function getStatusColor(data) {
  if (!data) return '#888780';
  const pct = data.pct_renewable;
  if (pct > 0.60) return '#22C55E';
  if (pct >= 0.30) return '#EAB308';
  return '#EF4444';
}

export function getStatusLabel(data) {
  if (!data) return 'Unknown';
  const pct = data.pct_renewable;
  if (pct > 0.60) return 'Clean';
  if (pct >= 0.30) return 'Moderate';
  return 'Dirty';
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
