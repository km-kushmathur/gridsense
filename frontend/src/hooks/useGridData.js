import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchIntensity } from '../api/gridsense';

const POLL_INTERVAL = 60_000; // 60 seconds

export function useGridData(city) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIntensity(city);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  return { data, loading, error, refetch: load };
}
