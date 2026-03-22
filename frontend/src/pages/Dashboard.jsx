import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWeather } from '../api/gridsense';
import { CityMap } from '../components/CityMap';
import { ForecastChart } from '../components/ForecastChart';
import { GridStressGauge } from '../components/GridStressGauge';
import { IntensityBadge } from '../components/IntensityBadge';
import { MethodologyPanel } from '../components/MethodologyPanel';
import { NudgePanel } from '../components/NudgePanel';
import { TopBar } from '../components/TopBar';
import { AnimatedContent } from '../components/ui/AnimatedContent';
import { DetailDisclosure } from '../components/ui/DetailDisclosure';
import { GradientText } from '../components/ui/GradientText';
import { useForecast } from '../hooks/useForecast';
import { useGridData } from '../hooks/useGridData';
import { getMoerColor, getStatusColor, getStatusLabel } from '../constants';
import { getBestWindowMeta } from '../utils/forecast';
import { formatWindowFromPointRange } from '../utils/time';

function getBestWindowLabel(forecast) {
  return formatWindowFromPointRange(getBestWindowMeta(forecast).points);
}

function ConditionRow({ label, value, valueClassName = '', valueStyle }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold text-white ${valueClassName}`} style={valueStyle}>
        {value}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const city = decodeURIComponent(cityName);

  const { data: gridData, loading: gridLoading, error: gridError } = useGridData(city);
  const { forecast, loading: forecastLoading, error: forecastError } = useForecast(city);

  const [weather, setWeather] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const result = await fetchWeather(city);
        if (active) {
          setWeather(result);
        }
      } catch {
        if (active) {
          setWeather(null);
        }
      }
    }

    loadWeather();

    return () => {
      active = false;
    };
  }, [city]);

  useEffect(() => {
    try {
      setShowWelcome(window.localStorage.getItem('gridsense-welcome-dismissed') !== '1');
    } catch {
      setShowWelcome(true);
    }
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    try {
      window.localStorage.setItem('gridsense-welcome-dismissed', '1');
    } catch {
      // Ignore storage issues and just dismiss for the current session.
    }
  }

  const dashboardError = gridError || forecastError;
  const statusColor = getStatusColor(gridData);
  const statusLabel = getStatusLabel(gridData);
  const bestWindow = getBestWindowLabel(forecast);
  const currentTemperature = weather?.temp_c ?? gridData?.temp_c;
  const currentCondition = weather?.condition || 'Conditions loading';
  const heatWave = weather?.heat_wave ?? gridData?.heat_wave;
  const currentStress = forecast[0]?.grid_stress ?? gridData?.grid_stress ?? 0;

  return (
    <div className="min-h-screen">
      <TopBar cityName={city} />

      <main className="page-shell pb-16">
        {showWelcome && (
          <AnimatedContent className="mb-8" delay={40}>
            <div className="card-glass flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-grid-clean">Welcome to GridSense</p>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                  Start with the live carbon signal, then use the forecast and recommendations to decide when flexible demand should move. Formulas, source details, and limitations stay available through the reference layer below.
                </p>
              </div>

              <button
                onClick={dismissWelcome}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                Dismiss
              </button>
            </div>
          </AnimatedContent>
        )}

        <AnimatedContent delay={80}>
          <section className="mb-10">
            <span className="section-kicker">Grid overview</span>
            <h1 className="section-title max-w-4xl">
              A layered operating view of <GradientText>{city}</GradientText>, built around the live carbon signal first.
            </h1>
            <p className="section-subtitle max-w-3xl">
              The main dashboard prioritizes the current signal, the next 24-hour forecast, map context, and appliance timing recommendations. Scientific definitions and derivations remain available without crowding the primary reading path.
            </p>
          </section>
        </AnimatedContent>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <AnimatedContent delay={140}>
            <section>
              <span className="section-kicker">Current signal</span>
              <h2 className="section-title">Live carbon signal and normalized operating score</h2>
              <p className="section-subtitle">
                Read the observed Marginal Operating Emissions Rate first. The normalized score sits beside it as a compact ranking layer for timing decisions.
              </p>

              <div className="mt-6">
                <IntensityBadge
                  data={gridData}
                  loading={gridLoading}
                  onSimulate={() => navigate(`/city/${encodeURIComponent(city)}/simulate`)}
                />
              </div>
            </section>
          </AnimatedContent>

          <AnimatedContent delay={180}>
            <section>
              <span className="section-kicker">Current conditions</span>
              <h2 className="section-title">Weather and operating pressure</h2>
              <p className="section-subtitle">
                Weather is directly observed. Heat-wave pressure and grid stress are local interpretation layers that help prioritize load shifting.
              </p>

              <div className="card-solid mt-6 p-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="taxonomy-chip taxonomy-chip-observed">Observed weather</span>
                        <span className="taxonomy-chip taxonomy-chip-derived">Derived pressure</span>
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-white">{statusLabel}</p>
                    </div>
                    <span
                      className="rounded-full border px-3 py-1 text-sm font-semibold"
                      style={{
                        color: statusColor,
                        borderColor: `${statusColor}40`,
                        background: `${statusColor}12`,
                      }}
                    >
                      Live signal
                    </span>
                  </div>

                  <div className="rounded-[26px] border border-white/8 bg-black/20 p-4">
                    <GridStressGauge value={currentStress} />
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-black/15 px-4">
                    <ConditionRow
                      label="Carbon intensity"
                      value={`${Math.round(gridData?.moer || 0)} lbs/MWh`}
                      valueStyle={{ color: getMoerColor(gridData?.moer || 0) }}
                    />
                    <ConditionRow
                      label="Current temperature"
                      value={currentTemperature !== undefined ? `${Math.round(currentTemperature)}°C` : 'Unavailable'}
                    />
                    <ConditionRow label="Weather summary" value={currentCondition} />
                    <ConditionRow label="Best 2-hour window" value={bestWindow} valueClassName="text-grid-clean" />
                    <ConditionRow
                      label="Heat-wave pressure"
                      value={heatWave ? 'Elevated demand risk' : 'Normal demand risk'}
                      valueStyle={{ color: heatWave ? '#f87171' : '#86efac' }}
                    />
                  </div>

                  <DetailDisclosure
                    badge="Condition method"
                    title="Observed weather vs derived operating pressure"
                    summary="Open for the heat-wave rule, the meaning of grid stress, and what this panel should be used for."
                  >
                    <p>
                      <span className="font-semibold text-white">Observed values:</span> air temperature and weather summary come from Open-Meteo.
                    </p>
                    <p>
                      <span className="font-semibold text-white">Derived values:</span> heat-wave pressure is triggered when any next-24-hour forecast temperature exceeds 35°C. Grid stress is a local heuristic for operational pressure, not a utility control-room measurement.
                    </p>
                    <p>
                      <span className="font-semibold text-white">Use:</span> combine this panel with the MOER forecast to decide how urgent it is to move flexible load away from hotter, higher-pressure hours.
                    </p>
                  </DetailDisclosure>
                </div>
              </div>
            </section>
          </AnimatedContent>
        </div>

        <AnimatedContent delay={300} className="mt-10">
          <section>
            <span className="section-kicker">24-hour forecast</span>
            <h2 className="section-title">Next 24 hours of carbon timing</h2>
            <p className="section-subtitle">
              Use the forecast to identify the lowest-emission window before shifting EV charging, laundry, or other flexible demand.
            </p>

            <div className="mt-6">
              <ForecastChart forecast={forecast} loading={forecastLoading} statusColor={statusColor} />
            </div>
          </section>
        </AnimatedContent>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
          <AnimatedContent delay={360}>
            <section>
              <span className="section-kicker">Map context</span>
              <h2 className="section-title">Geographic context for the serving balancing region</h2>
              <p className="section-subtitle">
                The map anchors the city geographically and shows where the region-level carbon signal applies. It is contextual, not neighborhood telemetry.
              </p>

              <div className="mt-6">
                <CityMap data={gridData} cityName={city} loading={gridLoading} />
              </div>
            </section>
          </AnimatedContent>

          <AnimatedContent delay={400}>
            <section>
              <span className="section-kicker">Recommendations</span>
              <h2 className="section-title">Actionable timing guidance</h2>
              <p className="section-subtitle">
                Recommendations are generated only after the physical and derived layers are computed, so the action stays tied to documented signals.
              </p>

              <div className="mt-6">
                <NudgePanel city={city} />
              </div>
            </section>
          </AnimatedContent>
        </div>

        <AnimatedContent delay={440} className="mt-10">
          <MethodologyPanel gridData={gridData} weather={weather} forecast={forecast} />
        </AnimatedContent>
      </main>

      {dashboardError && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-400/20 bg-[#23180d]/95 px-4 py-2 text-sm text-amber-100 shadow-xl">
          Some live calls failed. The dashboard may be showing cached or fallback data.
        </div>
      )}
    </div>
  );
}
