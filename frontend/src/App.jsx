import { useState, useCallback, useEffect } from 'react';
import { fetchWeather } from './api/gridsense';
import { useGridData } from './hooks/useGridData';
import { useForecast } from './hooks/useForecast';
import { useSimulation } from './hooks/useSimulation';
import { LiveTicker } from './components/LiveTicker';
import { IntensityBadge } from './components/IntensityBadge';
import { CityMap } from './components/CityMap';
import { ForecastChart } from './components/ForecastChart';
import { NudgePanel } from './components/NudgePanel';
import { HeatWaveSimulator } from './components/HeatWaveSimulator';
import { GridStressGauge } from './components/GridStressGauge';

const CITY_COORDS = {
  'sacramento': [38.58, -121.49],
  'san francisco': [37.77, -122.42],
  'los angeles': [34.05, -118.24],
  'new york': [40.71, -74.01],
  'chicago': [41.88, -87.63],
  'seattle': [47.61, -122.33],
  'austin': [30.27, -97.74],
  'denver': [39.74, -104.99],
  'charlottesville': [38.03, -78.48],
};

export default function App() {
  const [city, setCity] = useState('Sacramento');
  const [searchInput, setSearchInput] = useState('Sacramento');
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [scenario, setScenario] = useState('heat_wave');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const {
    data: gridData,
    loading: gridLoading,
    error: gridError,
  } = useGridData(city);
  const {
    forecast,
    loading: forecastLoading,
    error: forecastError,
  } = useForecast(city);
  const {
    simulation,
    loading: simulationLoading,
    error: simulationError,
  } = useSimulation(city, scenario);

  const coords = CITY_COORDS[city.toLowerCase()] || null;
  const dashboardError = gridError || forecastError || weatherError || simulationError;

  useEffect(() => {
    let active = true;
    async function loadWeather() {
      try {
        const result = await fetchWeather(city);
        if (active) {
          setWeather(result);
          setWeatherError(null);
        }
      } catch (err) {
        if (active) {
          setWeatherError(err.message);
        }
      }
    }
    loadWeather();
    return () => {
      active = false;
    };
  }, [city]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCity(searchInput.trim());
    }
  }, [searchInput]);

  return (
    <div className="min-h-screen flex flex-col bg-grid-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-grid-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-grid-clean to-emerald-600 flex items-center justify-center text-sm font-bold">
            ⚡
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Grid<span className="text-grid-clean">Sense</span>
          </h1>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              id="city-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter a city…"
              className="pl-9 pr-4 py-2 w-64 rounded-lg bg-grid-surface border border-grid-border text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-grid-clean/40 focus:border-grid-clean/40 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-grid-clean/15 text-grid-clean border border-grid-clean/20 hover:bg-grid-clean/25 transition-colors"
          >
            Search
          </button>
        </form>
      </header>

      {/* Live Ticker */}
      <LiveTicker data={gridData} />

      {dashboardError && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {dashboardError}
        </div>
      )}

      {/* Main Dashboard */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[220px] flex-shrink-0 flex flex-col gap-4">
          <div className="bg-grid-surface rounded-xl border border-grid-border overflow-hidden">
          <div className="p-3 border-b border-grid-border">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Current Intensity
            </h2>
          </div>
          <IntensityBadge data={gridData} loading={gridLoading} />
          </div>
          <GridStressGauge value={simulation?.timeline?.[0]?.grid_stress || 0} />
          <div className="rounded-xl border border-grid-border bg-grid-surface p-4 text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Current Weather</h3>
            {weather ? (
              <div className="space-y-1 text-gray-300">
                <p><span className="font-semibold text-white">{Math.round(weather.temp_c)}C</span> · {weather.condition}</p>
                <p className={weather.heat_wave ? 'text-red-300' : 'text-gray-500'}>
                  {weather.heat_wave ? 'Heat wave expected in the next 24h' : 'No heat wave expected'}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Loading weather...</p>
            )}
          </div>
        </aside>

        {/* Center — Map */}
        <section className="flex-1 min-w-0">
          <CityMap data={gridData} coords={coords} />
        </section>

        {/* Right Panel */}
        <aside className="w-[340px] flex-shrink-0 flex flex-col gap-4">
          {/* Forecast Chart */}
          <div className="bg-grid-surface rounded-xl border border-grid-border overflow-hidden">
            <ForecastChart forecast={forecast} loading={forecastLoading} />
          </div>

          {/* Nudge Panel */}
          <div className="flex-1 bg-grid-surface rounded-xl border border-grid-border overflow-y-auto max-h-[400px]">
            <NudgePanel city={city} />
          </div>
        </aside>
      </main>

      <section className="px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setDrawerOpen((value) => !value)}
            className="rounded-lg border border-grid-border bg-grid-surface px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-300"
          >
            {drawerOpen ? 'Hide' : 'Show'} Simulator
          </button>
          <div className="flex items-center gap-2">
            {['heat_wave', 'cold_snap', 'normal'].map((option) => (
              <button
                key={option}
                onClick={() => setScenario(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] ${
                  scenario === option
                    ? 'bg-grid-clean/20 text-grid-clean border border-grid-clean/20'
                    : 'bg-grid-surface text-gray-400 border border-grid-border'
                }`}
              >
                {option.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        {drawerOpen && (
          <HeatWaveSimulator
            simulation={simulation}
            loading={simulationLoading}
            scenario={scenario}
          />
        )}
      </section>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-grid-border text-center text-xs text-gray-600">
        GridSense — Built with WattTime · Open-Meteo · OpenAI · Google Maps
      </footer>
    </div>
  );
}
