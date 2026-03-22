function toDate(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

  const end = new Date(endPoint.getTime() + 60 * 60 * 1000);
  return formatWindowRange(start, end, fallback);
}
