import { HOUR_MS, toTimestampMs } from './time';

export function sortForecastPoints(forecast, limit = 24) {
  if (!Array.isArray(forecast)) {
    return [];
  }

  return [...forecast]
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = toTimestampMs(left?.time);
      const rightTime = toTimestampMs(right?.time);
      if (!Number.isFinite(leftTime) && !Number.isFinite(rightTime)) return 0;
      if (!Number.isFinite(leftTime)) return 1;
      if (!Number.isFinite(rightTime)) return -1;
      return leftTime - rightTime;
    })
    .slice(0, limit);
}

export function getCurrentForecastIndex(forecast, nowMs = Date.now()) {
  const hourly = sortForecastPoints(forecast, forecast?.length || 24);
  if (!hourly.length) {
    return 0;
  }

  const timestamps = hourly.map((point) => toTimestampMs(point?.time));
  for (let index = 0; index < timestamps.length; index += 1) {
    const start = timestamps[index];
    if (!Number.isFinite(start)) continue;

    const nextStart = timestamps[index + 1];
    const end = Number.isFinite(nextStart) ? nextStart : start + HOUR_MS;
    if (start <= nowMs && nowMs < end) {
      return index;
    }
  }

  const first = timestamps.find((value) => Number.isFinite(value));
  if (!Number.isFinite(first)) {
    return 0;
  }
  return nowMs < first ? 0 : Math.max(0, timestamps.length - 1);
}

export function getBestWindowMeta(forecast, windowSize = 2, limit = 24) {
  const hourly = sortForecastPoints(forecast, limit);
  if (!hourly.length) {
    return {
      averageMoer: 0,
      points: [],
      startIndex: 0,
    };
  }

  if (hourly.length <= windowSize) {
    const averageMoer = hourly.reduce((sum, point) => sum + Number(point?.moer || 0), 0) / hourly.length;
    return {
      averageMoer,
      points: hourly,
      startIndex: 0,
    };
  }

  let bestStart = 0;
  let lowestAverage = Number.POSITIVE_INFINITY;

  for (let index = 0; index <= hourly.length - windowSize; index += 1) {
    const points = hourly.slice(index, index + windowSize);
    const averageMoer = points.reduce((sum, point) => sum + Number(point?.moer || 0), 0) / points.length;
    if (averageMoer < lowestAverage) {
      lowestAverage = averageMoer;
      bestStart = index;
    }
  }

  return {
    averageMoer: lowestAverage,
    points: hourly.slice(bestStart, bestStart + windowSize),
    startIndex: bestStart,
  };
}
