import { useEffect, useState, useCallback } from 'react';
import { fetchSimulation } from '../api/gridsense';

export function useSimulation(city, scenario) {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSimulation(city, scenario);
      setSimulation(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [city, scenario]);

  useEffect(() => {
    load();
  }, [load]);

  return { simulation, loading, error, refetch: load };
}
