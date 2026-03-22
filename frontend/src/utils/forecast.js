export function getBestWindowMeta(forecast, windowSize = 2, limit = 24) {
  const hourly = Array.isArray(forecast) ? forecast.slice(0, limit) : [];
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
