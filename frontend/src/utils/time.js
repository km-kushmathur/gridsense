export const HOUR_MS = 60 * 60 * 1000;

function normalizeTimeValue(value) {
  if (value instanceof Date || typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const isoLike = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(isoLike)) {
    return isoLike;
  }
  return `${isoLike}Z`;
}

export function toDate(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(normalizeTimeValue(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toTimestampMs(value) {
  const parsed = toDate(value);
  return parsed ? parsed.getTime() : Number.NaN;
}

export function formatHourLabel(hour) {
  if (hour === 0) return '12 am';
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return '12 pm';
  return `${hour - 12} pm`;
}

export function formatHourFromValue(value, fallback = 'Unavailable') {
  const parsed = toDate(value);
  if (!parsed) return fallback;
  return formatHourLabel(parsed.getHours());
}

export function formatWindowRange(startValue, endValue, fallback = 'Unavailable') {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start || !end) return fallback;
  return `${formatHourLabel(start.getHours())} - ${formatHourLabel(end.getHours())}`;
}

export function formatWindowFromPointRange(points, fallback = 'Unavailable') {
  if (!points?.length) return fallback;
  const start = toDate(points[0]?.time);
  const endPoint = toDate(points[points.length - 1]?.time);
  if (!start || !endPoint) return fallback;

  const end = new Date(endPoint.getTime() + HOUR_MS);
  return formatWindowRange(start, end, fallback);
}
