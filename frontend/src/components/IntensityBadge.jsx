import { getCleanPowerScore, getStatusColor, getStatusLabel } from '../constants';
import { CountUp } from './ui/CountUp';
import { DetailDisclosure } from './ui/DetailDisclosure';
import { StarBorder } from './ui/StarBorder';

export function IntensityBadge({ data, loading, onSimulate, alertHint = false, children = null }) {
  if (loading || !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
        <div className="skeleton h-36 w-36 rounded-[28px]" />
        <div className="space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-5 w-5/6" />
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton h-12 w-56 rounded-full" />
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(data);
  const statusLabel = getStatusLabel(data);
  const cleanPowerScore = Math.round(getCleanPowerScore(data));

  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]"
      style={{
        background: `linear-gradient(145deg, ${statusColor}16 0%, rgba(255,255,255,0.02) 48%, transparent 100%)`,
      }}
    >
      <div className="card-solid flex min-h-[220px] flex-col justify-between rounded-[28px] border px-6 py-7" style={{ borderColor: `${statusColor}45` }}>
        <div>
          <span className="taxonomy-chip taxonomy-chip-derived">Derived metric</span>
          <h3 className="mt-4 text-lg font-semibold text-white">Normalized MOER score</h3>
          <CountUp
            value={cleanPowerScore}
            suffix="/100"
            className="mt-4 block font-display text-6xl font-bold leading-none"
            style={{ color: statusColor }}
          />
        </div>
        <span
          className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold"
          style={{ color: statusColor, borderColor: `${statusColor}35`, background: `${statusColor}12` }}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor }} />
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="taxonomy-chip taxonomy-chip-observed">Observed MOER</span>
            <span className="taxonomy-chip taxonomy-chip-derived">Derived score</span>
          </div>

          <h3 className="mt-4 text-2xl font-semibold text-white">
            The grid is currently reading {Math.round(data.moer)} lbs CO2/MWh, which places this moment at {cleanPowerScore}/100 on the dashboard’s normalized carbon scale.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Use the observed Marginal Operating Emissions Rate, or MOER, to judge the physical signal. Use the normalized score only as a fast ranking aid for timing flexible demand.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="metric-chip">Observed MOER {Math.round(data.moer)} lbs/MWh</span>
          <span className="metric-chip">Derived score {cleanPowerScore}/100</span>
          <span className="metric-chip">Observed air temperature {Math.round(data.temp_c)}°C</span>
          <span className="metric-chip">{data.heat_wave ? 'Derived heat-wave flag: active' : 'Derived heat-wave flag: inactive'}</span>
        </div>

        <div className="mt-5 max-w-3xl">
          <DetailDisclosure
            badge="Method"
            title="How this score is calculated"
            summary="Formula, classification bands, and the limitation of reading this as a ranking index rather than a direct renewable-share measurement."
          >
            <p>
              <span className="font-semibold text-white">Observed quantity:</span> MOER, or Marginal Operating Emissions Rate,
              measured in pounds of carbon dioxide per megawatt-hour.
            </p>
            <p>
              <span className="font-semibold text-white">Derived formula:</span>{' '}
              <code className="rounded bg-black/30 px-2 py-1 text-sky-200">score = max(0, min(100, 100 * (1 - MOER / 1000)))</code>
            </p>
            <p>
              <span className="font-semibold text-white">Interpretation:</span> higher values indicate a lower-emissions marginal generator and therefore a better window for shifting flexible load.
            </p>
            <p>
              <span className="font-semibold text-white">Limitation:</span> the score is a local normalization layer for readability. WattTime does not provide it as a direct field.
            </p>
          </DetailDisclosure>
        </div>

        {onSimulate && (
          <div className="mt-7">
            <StarBorder className="inline-block">
              <button
                onClick={onSimulate}
                className="rounded-full bg-[#170d0f] px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-[#261114]"
              >
                Run failure simulation
              </button>
            </StarBorder>
          </div>
        )}

        {alertHint ? (
          <p className="mt-4 text-xs text-slate-400">
            Want an alert when this changes? <span className="font-semibold text-slate-200">↓</span>
          </p>
        ) : null}

        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>
  );
}
