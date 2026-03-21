import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GridStressGauge } from '../components/GridStressGauge';
import { SkeletonCard } from '../components/SkeletonCard';
import { TopBar } from '../components/TopBar';
import { AnimatedContent } from '../components/ui/AnimatedContent';
import { CountUp } from '../components/ui/CountUp';
import { GradientText } from '../components/ui/GradientText';
import { StarBorder } from '../components/ui/StarBorder';
import { useSimulation } from '../hooks/useSimulation';
import { getStressColor } from '../constants';

const SCENARIOS = [
  {
    key: 'heat_wave',
    label: 'Heat wave',
    tone: '#ef4444',
    description: 'High cooling demand pushes the grid toward its failure threshold.',
  },
  {
    key: 'cold_snap',
    label: 'Cold snap',
    tone: '#f59e0b',
    description: 'Heating demand creates a sharp peak in carbon intensity and grid pressure.',
  },
  {
    key: 'normal',
    label: 'Normal day',
    tone: '#38bdf8',
    description: 'A steady demand profile shows what the grid looks like without extreme weather.',
  },
];

function formatHour(hour) {
  if (hour === 0) return '12 am';
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return '12 pm';
  return `${hour - 12} pm`;
}

function MiniTimeline({ timeline, currentHour }) {
  return (
    <div className="flex h-16 gap-[3px]">
      {timeline.map((point, index) => {
        const stress = point.grid_stress || 0;
        const height = Math.max(6, (stress / 100) * 60);

        return (
          <div key={index} className="flex flex-1 items-end">
            <div
              className="w-full rounded-t-md transition-opacity"
              style={{
                height,
                background: getStressColor(stress),
                opacity: index <= currentHour ? 1 : 0.22,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ScenarioButton({ item, active, onSelect }) {
  return (
    <button
      onClick={() => onSelect(item.key)}
      className={`rounded-full border px-4 py-3 text-left transition ${
        active
          ? 'bg-white/[0.07] text-white'
          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]'
      }`}
      style={active ? { borderColor: `${item.tone}55`, boxShadow: `0 0 0 1px ${item.tone}22 inset` } : undefined}
    >
      <span className="block text-sm font-semibold">{item.label}</span>
      <span className="mt-1 block text-xs leading-6 text-slate-400">{item.description}</span>
    </button>
  );
}

export default function Simulator() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const city = decodeURIComponent(cityName);

  const [scenario, setScenario] = useState('heat_wave');
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);

  const { simulation, loading, error } = useSimulation(city, scenario);

  const timeline = simulation?.timeline || [];
  const shiftedTimeline = simulation?.shifted_timeline || [];
  const failureHour = simulation?.failure_hour ?? null;
  const totalFrames = timeline.length;
  const scenarioMeta = SCENARIOS.find((item) => item.key === scenario) || SCENARIOS[0];

  useEffect(() => {
    setFrame(0);
    setPlaying(false);
  }, [simulation, scenario]);

  useEffect(() => {
    if (!playing || totalFrames === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFrame((currentFrame) => {
        const nextFrame = currentFrame + 1;

        if (nextFrame >= totalFrames) {
          setPlaying(false);
          return currentFrame;
        }

        if (failureHour !== null && nextFrame === failureHour) {
          setPlaying(false);
        }

        return nextFrame;
      });
    }, 900);

    return () => window.clearInterval(timer);
  }, [failureHour, playing, totalFrames]);

  const current = timeline[Math.min(frame, Math.max(0, totalFrames - 1))];
  const shifted = shiftedTimeline[Math.min(frame, Math.max(0, totalFrames - 1))];
  const failureActive = failureHour !== null && frame >= failureHour;

  const liveSavings = useMemo(() => {
    if (!simulation?.savings_kg_co2 || totalFrames === 0) {
      return 0;
    }

    return (simulation.savings_kg_co2 / totalFrames) * frame;
  }, [frame, simulation, totalFrames]);

  const liveShifted = useMemo(() => {
    if (!timeline.length || !shiftedTimeline.length) {
      return 0;
    }

    let total = 0;

    for (let index = 0; index <= Math.min(frame, timeline.length - 1); index += 1) {
      const baseDemand = timeline[index]?.demand_index || 0;
      const optimizedDemand = shiftedTimeline[index]?.demand_index || 0;
      total += Math.max(0, baseDemand - optimizedDemand) * 10;
    }

    return total;
  }, [frame, shiftedTimeline, timeline]);

  const displayHour = current ? formatHour(new Date(current.time).getHours()) : '12 am';

  return (
    <div className="min-h-screen">
      <TopBar cityName={city} />

      <main className="page-shell pb-16">
        <AnimatedContent delay={60}>
          <button
            onClick={() => navigate(`/city/${encodeURIComponent(city)}`)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            Back to dashboard
          </button>
        </AnimatedContent>

        <AnimatedContent delay={110} className="mt-6">
          <section className="card-glass p-6 sm:p-8">
            <span className="section-kicker">Failure simulator</span>
            <h1 className="section-title max-w-4xl">
              See how <GradientText>{city}</GradientText> behaves when weather stress rises and what changes when GridSense shifts demand.
            </h1>
            <p className="section-subtitle max-w-3xl">
              This page compares two timelines: unmanaged demand on the left and optimized demand on the right. The goal is to make the grid-failure story obvious even for someone who has never seen MOER or grid stress before.
            </p>
          </section>
        </AnimatedContent>

        <AnimatedContent delay={170} className="mt-8">
          <section>
            <span className="section-kicker">Choose a scenario</span>
            <h2 className="section-title">What kind of day are we simulating?</h2>
            <p className="section-subtitle">
              Pick the weather condition that drives the demand curve. Heat waves are the strongest demo because they show how quickly the grid can tip into critical territory.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {SCENARIOS.map((item) => (
                <ScenarioButton
                  key={item.key}
                  item={item}
                  active={scenario === item.key}
                  onSelect={setScenario}
                />
              ))}
            </div>
          </section>
        </AnimatedContent>

        <AnimatedContent delay={220} className="mt-8">
          <section className="card-solid p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="panel-title">Playback controls</p>
                <p className="panel-subtitle">
                  Move hour by hour through the simulated day. Watch when the unmanaged grid crosses into danger and compare that with the optimized path.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StarBorder className="w-fit">
                  <button
                    onClick={() => setPlaying((value) => !value)}
                    className="rounded-full bg-[#0d2015] px-5 py-3 text-sm font-semibold text-grid-clean transition hover:bg-[#14301e]"
                  >
                    {playing ? 'Pause' : 'Play'}
                  </button>
                </StarBorder>

                <button
                  onClick={() => {
                    setPlaying(false);
                    setFrame(0);
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Reset
                </button>

                <span className="metric-chip">{displayHour}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={Math.max(0, totalFrames - 1)}
                value={frame}
                onChange={(event) => {
                  setFrame(parseInt(event.target.value, 10));
                  setPlaying(false);
                }}
                className="w-full"
                style={{ accentColor: scenarioMeta.tone }}
              />
            </div>
          </section>
        </AnimatedContent>

        {loading ? (
          <AnimatedContent delay={280} className="mt-8 grid gap-6 xl:grid-cols-2">
            <SkeletonCard className="h-[420px] rounded-[28px]" />
            <SkeletonCard className="h-[420px] rounded-[28px]" />
          </AnimatedContent>
        ) : (
          <>
            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <AnimatedContent delay={280}>
                <section className="card-solid relative overflow-hidden p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-300">Without GridSense</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">Demand follows the spike</h2>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        This is the unmanaged version of the day. Loads stack into the same hot hours, which pushes the grid toward its failure threshold.
                      </p>
                    </div>

                    <span className="metric-chip">Natural demand</span>
                  </div>

                  <div className="mt-8 rounded-[26px] border border-white/8 bg-black/20 p-4">
                    <GridStressGauge value={current?.grid_stress || 0} />
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current stress</p>
                      <p
                        className="mt-2 text-4xl font-semibold"
                        style={{ color: getStressColor(current?.grid_stress || 0) }}
                      >
                        {Math.round(current?.grid_stress || 0)}%
                      </p>
                    </div>

                    <span
                      className="rounded-full border px-3 py-1 text-sm font-semibold"
                      style={{
                        color: failureActive ? '#f87171' : '#fca5a5',
                        borderColor: failureActive ? 'rgba(239,68,68,0.35)' : 'rgba(248,113,113,0.22)',
                        background: failureActive ? 'rgba(127,29,29,0.35)' : 'rgba(239,68,68,0.08)',
                      }}
                    >
                      {failureActive ? 'Grid failure' : 'Unmanaged load'}
                    </span>
                  </div>

                  <div className="mt-6">
                    <MiniTimeline timeline={timeline} currentHour={frame} />
                  </div>

                  {failureActive && (
                    <div className="mt-6 rounded-[24px] border border-red-500/40 bg-red-950/40 px-5 py-4" style={{ animation: 'fadeIn 0.45s ease-out both' }}>
                      <p className="text-base font-semibold text-red-300">GRID FAILURE</p>
                      <p className="mt-2 text-sm leading-7 text-red-100/80">
                        Demand crossed the critical threshold. This is the moment rolling blackouts or emergency interventions become plausible in the scenario.
                      </p>
                    </div>
                  )}
                </section>
              </AnimatedContent>

              <AnimatedContent delay={340}>
                <section className="card-solid relative overflow-hidden p-6">
                  <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_60%)]" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-grid-clean">With GridSense</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">Demand shifts into cleaner hours</h2>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        This optimized path moves flexible demand out of the dirtiest, highest-stress window and into cleaner hours where the grid has room to breathe.
                      </p>
                    </div>

                    <span className="metric-chip">Shifted load</span>
                  </div>

                  <div className="mt-8 rounded-[26px] border border-white/8 bg-black/20 p-4">
                    <GridStressGauge value={shifted?.grid_stress || 0} />
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current stress</p>
                      <p
                        className="mt-2 text-4xl font-semibold"
                        style={{ color: getStressColor(shifted?.grid_stress || 0) }}
                      >
                        {Math.round(shifted?.grid_stress || 0)}%
                      </p>
                    </div>

                    <span className="rounded-full border border-grid-clean/30 bg-grid-clean/10 px-3 py-1 text-sm font-semibold text-grid-clean">
                      Grid stable
                    </span>
                  </div>

                  <div className="mt-6">
                    <MiniTimeline timeline={shiftedTimeline} currentHour={frame} />
                  </div>
                </section>
              </AnimatedContent>
            </div>

            <AnimatedContent delay={400} className="mt-8">
              <section>
                <span className="section-kicker">Impact summary</span>
                <h2 className="section-title">What changed because the load moved?</h2>
                <p className="section-subtitle">
                  These live counters explain the operational difference between the two timelines. This is the section that makes the demo concrete for judges and first-time visitors.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="card-solid p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current hour</p>
                    <p className="mt-3 font-display text-4xl font-semibold text-white">{displayHour}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">The playback position through the simulated day.</p>
                  </div>

                  <div className="card-solid p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">CO2 saved so far</p>
                    <CountUp
                      value={liveSavings}
                      decimals={1}
                      suffix=" kg"
                      className="mt-3 block font-display text-4xl font-semibold text-grid-clean"
                    />
                    <p className="mt-2 text-sm leading-7 text-slate-400">Cumulative avoided emissions from shifting load away from the dirtiest window.</p>
                  </div>

                  <div className="card-solid p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Load shifted</p>
                    <CountUp
                      value={liveShifted}
                      decimals={0}
                      suffix=" kWh"
                      className="mt-3 block font-display text-4xl font-semibold text-sky-300"
                    />
                    <p className="mt-2 text-sm leading-7 text-slate-400">Flexible demand moved into lower-stress hours as the simulation progresses.</p>
                  </div>
                </div>
              </section>
            </AnimatedContent>
          </>
        )}
      </main>

      {error && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-400/20 bg-[#23180d]/95 px-4 py-2 text-sm text-amber-100 shadow-xl">
          Simulation data failed to load cleanly. The page may be showing fallback data.
        </div>
      )}
    </div>
  );
}
