import { useState, useEffect, useRef } from 'react';
import { fetchWeather } from '../api/gridsense';

export function useWeather(city) {
  const [weather, setWeather] = useState(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    async function load() {
      try {
        const result = await fetchWeather(city);
        if (activeRef.current) {
          setWeather(result);
        }
      } catch {
        if (activeRef.current) {
          setWeather(null);
        }
      }
    }

    load();

    return () => {
      activeRef.current = false;
    };
  }, [city]);

  return weather;
}
