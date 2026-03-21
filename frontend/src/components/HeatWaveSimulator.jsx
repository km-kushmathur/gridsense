import { useEffect, useMemo, useState } from 'react';
import { GridStressGauge } from './GridStressGauge';

function formatHourLabel(point) {
  if (!point?.time) return 'Hour 0';
  const date = new Date(point.time);
  return date.toLocaleTimeString([], { hour: 'numeric' });
}

export function HeatWaveSimulator({ simulation, loading, scenario }) {
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);

  const timeline = simulation?.timeline || [];
  const shiftedTimeline = simulation?.shifted_timeline || [];
  const failureHour = simulation?.failure_hour ?? null;
  const totalFrames = timeline.length;

  useEffect(() => {
    setFrame(0);
    setPlaying(false);
  }, [simulation, scenario]);

  useEffect(() => {
    if (!playing || totalFrames === 0) return undefined;
    const timer = setInterval(() => {
      setFrame((current) => {
        if (current >= totalFrames - 1) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, totalFrames]);

  const current = timeline[Math.min(frame, Math.max(0, totalFrames - 1))];
  const shifted = shiftedTimeline[Math.min(frame, Math.max(0, totalFrames - 1))];
  const liveSavings = useMemo(() => {
    if (!simulation?.savings_kg_co2 || totalFrames === 0) return 0;
    return (simulation.savings_kg_co2 / totalFrames) * frame;
  }, [frame, simulation, totalFrames]);

  if (loading) {
    return <div className="skeleton h-[320px] rounded-xl" />;
  }

  if (!simulation) {
    return (
      <div className="rounded-xl border border-grid-border bg-grid-surface p-5 text-sm text-gray-500">
        Simulation unavailable.
      </div>
    );
  }

  const failureActive = failureHour !== null && frame >= failureHour;

  return (
    <div className="rounded-xl border border-grid-border bg-grid-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
            Heat Wave Simulator
          </h3>
          <p className="text-xs text-gray-500">
            {scenario.replace('_', ' ')} at {current ? `${Math.round(current.temp_c)}C` : '0C'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying((value) => !value)}
            className="rounded-lg border border-grid-border bg-black/20 px-3 py-1.5 text-xs text-white"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setFrame(0);
            }}
            className="rounded-lg border border-grid-border bg-black/20 px-3 py-1.5 text-xs text-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`relative rounded-xl border p-4 ${failureActive ? 'border-red-500/50 bg-red-500/10' : 'border-grid-border bg-black/10'}`}>
          {failureActive && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-red-600/25 text-center text-white backdrop-blur-[1px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em]">Grid Failure</p>
                <p className="mt-2 text-lg font-bold">Rolling blackouts begin</p>
              </div>
            </div>
          )}
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gray-500">Without GridSense</p>
          <GridStressGauge value={current?.grid_stress || 0} />
          <div className="mt-3 text-xs text-gray-400">
            <p>{formatHourLabel(current)}</p>
            <p>Demand index: {current?.demand_index?.toFixed(2) || '0.00'}</p>
            <p>MOER: {Math.round(current?.moer || 0)} lbs/MWh</p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">With GridSense</p>
            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Grid Stable
            </span>
          </div>
          <GridStressGauge value={shifted?.grid_stress || 0} />
          <div className="mt-3 text-xs text-gray-300">
            <p>{formatHourLabel(shifted)}</p>
            <p>Demand index: {shifted?.demand_index?.toFixed(2) || '0.00'}</p>
            <p>MOER: {Math.round(shifted?.moer || 0)} lbs/MWh</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-grid-border bg-black/20 px-4 py-3 text-sm">
        <span className="text-gray-300">
          CO₂ saved: <span className="font-semibold text-white">{liveSavings.toFixed(1)} kg</span>
        </span>
        <span className="text-gray-300">
          Failure hour: <span className="font-semibold text-white">{failureHour === null ? 'None' : failureHour}</span>
        </span>
      </div>
    </div>
  );
}
