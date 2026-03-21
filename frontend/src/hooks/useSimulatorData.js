import { useEffect, useState } from 'react';
import {
  fetchActions,
  fetchEnvironment,
  fetchScenario,
  fetchSites,
  fetchWeather,
} from '../api/gridsense';

export function useSimulatorData(initialSiteId = 'uva_campus', initialWeatherScenario = 'heat_wave') {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState(initialSiteId);
  const [weatherScenario, setWeatherScenario] = useState(initialWeatherScenario);
  const [weather, setWeather] = useState([]);
  const [environment, setEnvironment] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [optimized, setOptimized] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      try {
        const nextSites = await fetchSites();
        if (cancelled) return;
        setSites(nextSites);
        if (!nextSites.some((site) => site.id === siteId) && nextSites[0]) {
          setSiteId(nextSites[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadSites();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;

    async function loadScenario() {
      setLoading(true);
      setError(null);
      try {
        const [weatherData, environmentData, baselineData, optimizedData, actionData] = await Promise.all([
          fetchWeather(siteId, weatherScenario),
          fetchEnvironment(siteId, weatherScenario),
          fetchScenario(siteId, weatherScenario, 'baseline'),
          fetchScenario(siteId, weatherScenario, 'optimized'),
          fetchActions(siteId, weatherScenario),
        ]);

        if (cancelled) return;
        setWeather(weatherData);
        setEnvironment(environmentData);
        setBaseline(baselineData);
        setOptimized(optimizedData);
        setActions(actionData);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadScenario();
    return () => {
      cancelled = true;
    };
  }, [siteId, weatherScenario]);

  const selectedSite = sites.find((site) => site.id === siteId) || null;

  return {
    sites,
    selectedSite,
    siteId,
    setSiteId,
    weatherScenario,
    setWeatherScenario,
    weather,
    environment,
    baseline,
    optimized,
    actions,
    loading,
    error,
  };
}
