import { useMemo, useState } from 'react';
import { useSimulatorData } from './hooks/useSimulatorData';
import { LiveTicker } from './components/LiveTicker';
import { IntensityBadge } from './components/IntensityBadge';
import { CityMap } from './components/CityMap';
import { ForecastChart } from './components/ForecastChart';
import { NudgePanel } from './components/NudgePanel';

const WEATHER_OPTIONS = [
  { id: 'heat_wave', label: 'Heat Wave', tone: 'Cooling load dominates and solar stays useful until the late peak.' },
  { id: 'cold_snap', label: 'Cold Snap', tone: 'Morning electric heating creates a sharp early peak.' },
  { id: 'storm_front', label: 'Storm Front', tone: 'Solar drops, outage risk rises, and operators need more margin.' },
  { id: 'smoke_event', label: 'Smoke Event', tone: 'Indoor air protection adds HVAC load while skies stay hazy.' },
];

export default function App() {
  const {
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
  } = useSimulatorData();
  const [activeZoneId, setActiveZoneId] = useState(null);

  const activeZone = useMemo(
    () => selectedSite?.zones.find((zone) => zone.id === activeZoneId) || selectedSite?.zones[0] || null,
    [activeZoneId, selectedSite]
  );

  const activeScenario = WEATHER_OPTIONS.find((option) => option.id === weatherScenario) || WEATHER_OPTIONS[0];

  return (
    <div className="min-h-screen bg-grid-bg text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-grid-border bg-grid-panel px-5 py-5 shadow-grid-panel backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-grid-mint">
                Weather-Driven Grid Stress Simulator
              </p>
              <h1 className="max-w-3xl font-display text-4xl tracking-tight text-white sm:text-5xl">
                Forecast campus grid failure before weather turns operations against you.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                GridSense models how weather impacts demand, solar support, and operational risk, then shows how load shifting
                changes the next 24 hours.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
              <label className="rounded-2xl border border-grid-border bg-white/5 p-3">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-slate-400">Demo Site</span>
                <select
                  value={siteId}
                  onChange={(e) => {
                    setSiteId(e.target.value);
                    setActiveZoneId(null);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-grid-bg px-3 py-2 text-sm text-white focus:border-grid-mint focus:outline-none"
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-2xl border border-grid-border bg-white/5 p-3">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-slate-400">Weather Trigger</span>
                <select
                  value={weatherScenario}
                  onChange={(e) => setWeatherScenario(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-grid-bg px-3 py-2 text-sm text-white focus:border-grid-amber focus:outline-none"
                >
                  {WEATHER_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-grid-mint/15 via-white/5 to-transparent p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-grid-mint">Active Scenario</p>
              <p className="mt-2 text-lg font-semibold text-white">{activeScenario.label}</p>
              <p className="mt-1 text-sm text-slate-300">{activeScenario.tone}</p>
            </div>
            <IntensityBadge site={selectedSite} baseline={baseline} optimized={optimized} loading={loading} />
            <LiveTicker environment={environment} weather={weather} loading={loading} />
          </div>
        </header>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <main className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
          <section className="grid gap-4">
            <CityMap
              site={selectedSite}
              baseline={baseline}
              optimized={optimized}
              loading={loading}
              activeZoneId={activeZone?.id || null}
              onSelectZone={setActiveZoneId}
            />
            <ForecastChart baseline={baseline} optimized={optimized} weather={weather} loading={loading} />
          </section>

          <section className="grid gap-4">
            <NudgePanel
              site={selectedSite}
              environment={environment}
              actions={actions}
              baseline={baseline}
              optimized={optimized}
              loading={loading}
              activeZone={activeZone}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
