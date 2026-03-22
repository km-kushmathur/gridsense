import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchIntensity } from '../api/gridsense';
import * as gridCache from '../cache/gridCache';

const POLL_INTERVAL = 60_000; // 60 seconds
const INTENSITY_TTL = 60_000; // 60 seconds

export function useGridData(city) {
  const [data, setData] = useState(() => {
    const cached = gridCache.getData(city, 'intensity');
    return cached ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const timeoutRef = useRef(null);
  const activeRef = useRef(true);

  const load = useCallback(async () => {
    if (!city) return;

    // Check cache first
    if (!gridCache.isStale(city, 'intensity', INTENSITY_TTL)) {
      const cached = gridCache.getData(city, 'intensity');
      if (cached) {
        setData(cached);
        setFromCache(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setFromCache(false);
    try {
      const result = await fetchIntensity(city);
      if (activeRef.current) {
        setData(result);
        gridCache.set(city, 'intensity', result);
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

    // Self-correcting timeout-based polling
    function scheduleNext() {
      timeoutRef.current = setTimeout(async () => {
        if (!activeRef.current) return;
        setFromCache(false);
        try {
          const result = await fetchIntensity(city);
          if (activeRef.current) {
            setData(result);
            gridCache.set(city, 'intensity', result);
          }
        } catch (err) {
          if (activeRef.current) {
            setError(err.message);
          }
        }
        if (activeRef.current) {
          scheduleNext();
        }
      }, POLL_INTERVAL);
    }

    load().then(() => {
      if (activeRef.current) {
        scheduleNext();
      }
    });

    return () => {
      activeRef.current = false;
      clearTimeout(timeoutRef.current);
    };
  }, [load, city]);

  return { data, loading, error, fromCache, refetch: load };
}
