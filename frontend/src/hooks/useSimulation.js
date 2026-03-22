import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchSimulation } from '../api/gridsense';
import * as gridCache from '../cache/gridCache';

const SIMULATION_TTL = 300_000; // 5 minutes

export function useSimulation(city, scenario) {
  const cacheKey = `simulation::${scenario}`;

  const [simulation, setSimulation] = useState(() => {
    return gridCache.getData(city, cacheKey) ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeRef = useRef(true);

  const load = useCallback(async () => {
    if (!city) return;

    // Check cache first
    if (!gridCache.isStale(city, cacheKey, SIMULATION_TTL)) {
      const cached = gridCache.getData(city, cacheKey);
      if (cached) {
        setSimulation(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchSimulation(city, scenario);
      if (activeRef.current) {
        setSimulation(result);
        gridCache.set(city, cacheKey, result);
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
  }, [city, scenario, cacheKey]);

  useEffect(() => {
    activeRef.current = true;
    load();
    return () => { activeRef.current = false; };
  }, [load]);

  return { simulation, loading, error, refetch: load };
}
