import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAlertCount } from '../api/gridsense';
import { AlertSubscribe } from '../components/AlertSubscribe';
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
import { useWeather } from '../hooks/useWeather';
import * as gridCache from '../cache/gridCache';
import { getMoerColor, getStatusColor, getStatusLabel } from '../constants';
import { StatusChip } from '../components/ui/StatusChip';
import { getBestWindowMeta } from '../utils/forecast';
import { formatWindowFromPointRange } from '../utils/time';

function getBestWindowLabel(forecast) {
  return formatWindowFromPointRange(getBestWindowMeta(forecast).points);
}

function ConditionRow({ label, value, valueClassName = '', valueStyle }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold text-gray-900 ${valueClassName}`} style={valueStyle}>
        {value}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const city = decodeURIComponent(cityName);

  const { data: gridData, loading: gridLoading, error: gridError, fromCache: gridFromCache } = useGridData(city);
  const { forecast, loading: forecastLoading, error: forecastError, fromCache: forecastFromCache } = useForecast(city);

  const isCached = gridFromCache || forecastFromCache;
  const cacheAge = isCached ? gridCache.getAge(city, 'intensity') || gridCache.getAge(city, 'forecast') : null;

  const weather = useWeather(city);
  const [showWelcome, setShowWelcome] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [showStressBanner, setShowStressBanner] = useState(false);
  const previousStressRef = useRef(null);

  useEffect(() => {
    try {
      setShowWelcome(window.localStorage.getItem('gridsense-welcome-dismissed') !== '1');
    } catch {
      setShowWelcome(true);
    }
  }, []);

  const refreshAlertCount = useCallback(async () => {
    try {
      const result = await fetchAlertCount();
      setAlertCount(Number(result?.count || 0));
    } catch {
      setAlertCount(0);
    }
  }, []);

  useEffect(() => {
    refreshAlertCount();
  }, [refreshAlertCount]);

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
  const bestWindow = useMemo(() => getBestWindowLabel(forecast), [forecast]);
  const currentTemperature = weather?.temp_c ?? gridData?.temp_c;
  const currentCondition = weather?.condition || 'Conditions loading';
  const heatWave = weather?.heat_wave ?? gridData?.heat_wave;
  const currentStress = gridData?.grid_stress ?? forecast[0]?.grid_stress ?? 0;
  const showAlertHint = Boolean(gridData?.status === 'moderate' || gridData?.status === 'dirty');

  useEffect(() => {
    if (!Number.isFinite(Number(currentStress))) {
      return;
    }
    const stressValue = Number(currentStress);
    const previousStress = previousStressRef.current;
    if (stressValue >= 70 && (previousStress === null || previousStress < 70)) {
      setShowStressBanner(true);
    }
    previousStressRef.current = stressValue;
  }, [currentStress]);

  return (
    <div className="min-h-screen">
      <TopBar cityName={city} cacheAge={isCached ? cacheAge : null} />

      <main className="page-shell pb-16">
        {showWelcome && (
          <AnimatedContent className="mb-8" delay={40}>
            <div className="card-glass flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-grid-clean">Welcome to GridSense</p>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  Start with the live carbon signal, then use the forecast and recommendations to decide when flexible demand should move. Formulas, source details, and limitations stay available through the reference layer below.
                </p>
              </div>

              <button
                onClick={dismissWelcome}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
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
              See how clean or dirty your electricity is right now, what the next 24 hours look like, and the single best time to run your heaviest appliances.
            </p>
          </section>
        </AnimatedContent>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <AnimatedContent delay={140}>
            <section>
              <span className="section-kicker">Current signal</span>
              <h2 className="section-title">Live Carbon Rate and Clean Power Score</h2>
              <p className="section-subtitle">
                The Carbon Rate measures how much CO&#x2082; the grid emits per unit of electricity right now. The Clean Power Score translates that number into a 0–100 scale so you can quickly decide whether this is a good time to run heavy appliances.
              </p>

              <div className="mt-6">
                <IntensityBadge
                  data={gridData}
                  loading={gridLoading}
                  onSimulate={() => navigate(`/city/${encodeURIComponent(city)}/simulate`)}
                  alertHint={showAlertHint}
                >
                  <AlertSubscribe city={city} onSubscribed={refreshAlertCount} />
                </IntensityBadge>
              </div>
            </section>
          </AnimatedContent>

          <AnimatedContent delay={180}>
            <section>
              <span className="section-kicker">Current conditions</span>
              <h2 className="section-title">Weather and Grid Load Pressure</h2>
              <p className="section-subtitle">
                Live air temperature and conditions from Open-Meteo. Grid Load Pressure and heat-wave risk are derived from the forecast — use them alongside the carbon signal to judge urgency.
              </p>

              {showStressBanner ? (
                <div
                  className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-[12px] text-yellow-800"
                  style={{ borderLeft: '2px solid #EAB308' }}
                >
                  <p className="font-semibold">Grid Load Pressure rising — {Math.round(currentStress)}%</p>
                  {alertCount > 0 ? (
                    <p className="mt-1 text-[11px] text-yellow-700">Subscribed users have been notified.</p>
                  ) : null}
                </div>
              ) : null}

              <div className="card-solid mt-6 p-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="taxonomy-chip taxonomy-chip-observed">Observed weather</span>
                        <span className="taxonomy-chip taxonomy-chip-derived">Derived pressure</span>
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-gray-900">{statusLabel}</p>
                    </div>
                    <StatusChip status={gridData?.status} color={statusColor} label="Live signal" />
                  </div>

                  <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                    <GridStressGauge value={currentStress} />
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white px-4">
                    <ConditionRow
                      label="Carbon Rate (lbs CO₂/MWh)"
                      value={`${Math.round(gridData?.moer || 0)} lbs CO₂/MWh`}
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
                    summary="Open for the heat-wave rule, the meaning of Grid Load Pressure, and what this panel should be used for."
                  >
                    <p>
                      <span className="font-semibold text-gray-900">Observed values:</span> air temperature and weather summary come from Open-Meteo.
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Derived values:</span> heat-wave pressure is triggered when any next-24-hour forecast temperature exceeds 35°C. Grid Load Pressure is a local heuristic for operational pressure, not a utility control-room measurement.
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Use:</span> combine this panel with the MOER forecast to decide how urgent it is to move flexible load away from hotter, higher-pressure hours.
                    </p>
                  </DetailDisclosure>
                </div>
              </div>
            </section>
          </AnimatedContent>
        </div>

        <AnimatedContent delay={300} className="mt-10">
          <section>
            <span className="section-kicker">Next 24 hours</span>
            <h2 className="section-title">Next 24 Hours — Best times to run high-energy appliances</h2>
            <p className="section-subtitle">
              Find the cleanest hours ahead to schedule EV charging, laundry, or other heavy loads for the lowest carbon impact.
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
                This map shows where {city} sits within its grid balancing region. The carbon signal applies at the regional level — not block by block.
              </p>

              <div className="mt-6">
                <CityMap data={gridData} cityName={city} loading={gridLoading} />
              </div>
            </section>
          </AnimatedContent>

          <AnimatedContent delay={400}>
            <section>
              <span className="section-kicker">What to do now</span>
              <h2 className="section-title">What to Do Now</h2>
              <p className="section-subtitle">
                The single best window to run all your high-draw appliances, based on the forecast. Estimated carbon savings are shown for each one.
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-900 shadow-xl">
          Unable to load some grid data — check your connection and try refreshing. The dashboard may be showing cached data.
        </div>
      )}
    </div>
  );
}
