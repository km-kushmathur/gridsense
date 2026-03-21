import { useState, useEffect, useCallback } from 'react';
import { fetchForecast } from '../api/gridsense';

export function useForecast(city) {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchForecast(city);
      setForecast(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    load();
  }, [load]);

  return { forecast, loading, error, refetch: load };
}
