import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWeather } from '../api/gridsense';
import { CityMap } from '../components/CityMap';
import { ForecastChart } from '../components/ForecastChart';
import { GridStressGauge } from '../components/GridStressGauge';
import { IntensityBadge } from '../components/IntensityBadge';
import { NudgePanel } from '../components/NudgePanel';
import { TopBar } from '../components/TopBar';
import { AnimatedContent } from '../components/ui/AnimatedContent';
import { GradientText } from '../components/ui/GradientText';
import { useForecast } from '../hooks/useForecast';
import { useGridData } from '../hooks/useGridData';
import { getMoerColor, getStatusColor, getStatusLabel } from '../constants';

function formatHour(hour) {
  if (hour === 0) return '12 am';
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return '12 pm';
  return `${hour - 12} pm`;
}

function getBestWindowLabel(forecast) {
  if (!forecast?.length) return 'Unavailable';

  let bestPoint = forecast[0];
  for (const point of forecast.slice(0, 24)) {
    if ((point.moer || 0) < (bestPoint.moer || 0)) {
      bestPoint = point;
    }
  }

  const startHour = new Date(bestPoint.time).getHours();
  return `${formatHour(startHour)} to ${formatHour((startHour + 2) % 24)}`;
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
                  This dashboard is organized to answer a newcomer’s questions in order: how clean the grid is right now, what is affecting it, when the next clean window arrives, and what actions reduce stress on the system.
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
              Understand <GradientText>{city}</GradientText> in one pass, from current carbon intensity to the cleanest time to shift demand.
            </h1>
            <p className="section-subtitle max-w-3xl">
              Each section below explains one layer of the story. If you are new to the project, start with the renewable share, then use the forecast and nudges panels to decide what to run later.
            </p>
          </section>
        </AnimatedContent>

        <AnimatedContent delay={140}>
          <section className="mb-10">
            <span className="section-kicker">Grid status</span>
            <h2 className="section-title">How clean is your electricity right now?</h2>
            <p className="section-subtitle">
              This is the headline state of the grid at the current moment. A greener score means cleaner power is carrying more of the load.
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <AnimatedContent delay={180}>
            <section>
              <span className="section-kicker">Grid map</span>
              <h2 className="section-title">Where the local grid pulse is centered</h2>
              <p className="section-subtitle">
                The map panel is a quick visual explanation of the current signal. It helps a visitor connect the abstract carbon number to a place they recognize.
              </p>

              <div className="mt-6">
                <CityMap data={gridData} cityName={city} loading={gridLoading} />
              </div>
            </section>
          </AnimatedContent>

          <AnimatedContent delay={240}>
            <section>
              <span className="section-kicker">Current conditions</span>
              <h2 className="section-title">What is pushing the grid right now?</h2>
              <p className="section-subtitle">
                Weather, carbon intensity, and load pressure all change how urgent it is to shift demand. This card summarizes those drivers in plain language.
              </p>

              <div className="card-solid mt-6 p-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current state</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{statusLabel}</p>
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
                </div>
              </div>
            </section>
          </AnimatedContent>
        </div>

        <AnimatedContent delay={300} className="mt-10">
          <section>
            <span className="section-kicker">24-hour forecast</span>
            <h2 className="section-title">Plan your energy use around the cleanest hours</h2>
            <p className="section-subtitle">
              This forecast shows when carbon intensity dips. Lower MOER periods are the best opportunities to shift EV charging, laundry, or other flexible demand.
            </p>

            <div className="mt-6">
              <ForecastChart forecast={forecast} loading={forecastLoading} statusColor={statusColor} />
            </div>
          </section>
        </AnimatedContent>

        <AnimatedContent delay={360} className="mt-10">
          <section>
            <span className="section-kicker">Smart nudges</span>
            <h2 className="section-title">AI-powered recommendations a newcomer can act on immediately</h2>
            <p className="section-subtitle">
              Instead of making you interpret the chart alone, GridSense converts the forecast into specific appliance timing suggestions with a clear time and expected carbon impact.
            </p>

            <div className="mt-6">
              <NudgePanel city={city} />
            </div>
          </section>
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
