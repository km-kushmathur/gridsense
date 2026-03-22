import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchForecast } from '../api/gridsense';
import * as gridCache from '../cache/gridCache';

const FORECAST_TTL = 300_000; // 5 minutes

export function useForecast(city) {
  const [forecast, setForecast] = useState(() => {
    return gridCache.getData(city, 'forecast') ?? [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const activeRef = useRef(true);

  const load = useCallback(async () => {
    if (!city) return;

    // Check cache first
    if (!gridCache.isStale(city, 'forecast', FORECAST_TTL)) {
      const cached = gridCache.getData(city, 'forecast');
      if (cached) {
        setForecast(cached);
        setFromCache(true);
        setLoading(false);
        return;
      }
    }

    // Stale-while-revalidate: show cached data immediately if available
    const staleData = gridCache.getData(city, 'forecast');
    if (staleData) {
      setForecast(staleData);
      setFromCache(true);
    }

    setLoading(!staleData);
    setError(null);
    try {
      const result = await fetchForecast(city);
      if (activeRef.current) {
        setForecast(result);
        gridCache.set(city, 'forecast', result);
        setFromCache(false);
      }
    } catch (err) {
      if (activeRef.current) {
        setError(err.message);
      }
    } finally {
      if (activeRef.current) {
        setLoading(false);
      }
    }
  }, [city]);

  useEffect(() => {
    activeRef.current = true;
    load();
    return () => { activeRef.current = false; };
  }, [load]);

  return { forecast, loading, error, fromCache, refetch: load };
}
