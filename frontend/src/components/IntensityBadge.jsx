import { getCleanPowerScore, getStatusColor, getStatusLabel } from '../constants';
import { CountUp } from './ui/CountUp';
import { DetailDisclosure } from './ui/DetailDisclosure';
import { StarBorder } from './ui/StarBorder';
import { StatusChip } from './ui/StatusChip';

export function IntensityBadge({ data, loading, onSimulate, alertHint = false, children = null }) {
  if (loading || !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
        <div className="skeleton h-36 w-36 rounded-[28px]" aria-label="Loading carbon score" />
        <div className="space-y-3" aria-label="Loading grid data">
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
        background: `linear-gradient(145deg, ${statusColor}12 0%, rgba(255,255,255,0.5) 48%, transparent 100%)`,
      }}
    >
      <div className="card-solid flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[28px] border px-6 py-7" style={{ borderColor: `${statusColor}45` }}>
        <div>
          <StatusChip status={data?.status} color={statusColor} label={statusLabel} />
          <h3 className="mt-5 font-display text-lg font-semibold text-gray-900">Clean Power Score</h3>
          <div className="mt-5 flex items-baseline gap-1.5">
            <CountUp
              value={cleanPowerScore}
              className="font-display text-5xl font-bold leading-none lg:text-6xl"
              style={{ color: statusColor }}
            />
            <span className="font-display text-xl font-semibold text-slate-400">/100</span>
          </div>
        </div>
        <span className="taxonomy-chip taxonomy-chip-derived mt-5">Derived metric</span>
      </div>

      <div className="flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="taxonomy-chip taxonomy-chip-observed">Observed MOER</span>
            <span className="taxonomy-chip taxonomy-chip-derived">Derived score</span>
          </div>

          <h3 className="mt-4 text-xl font-semibold text-gray-900 sm:text-2xl">
            The grid is producing {Math.round(data.moer)} lbs CO&#x2082;/MWh right now, giving it a Clean Power Score of {cleanPowerScore}/100.
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            The Carbon Rate (lbs CO&#x2082;/MWh) measures how much carbon the grid emits per unit of electricity. The Clean Power Score ranks this moment from 0 (dirtiest) to 100 (cleanest) so you can decide when to run heavy appliances.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="metric-chip">Carbon Rate: {Math.round(data.moer)} lbs CO&#x2082;/MWh</span>
          <span className="metric-chip">Clean Power Score: {cleanPowerScore}/100</span>
          <span className="metric-chip">Temperature: {Math.round(data.temp_c)}°C</span>
          <span className="metric-chip">{data.heat_wave ? 'Heat-wave risk: active' : 'Heat-wave risk: none'}</span>
        </div>

        <div className="mt-5 max-w-3xl">
          <DetailDisclosure
            badge="Method"
            title="How this score is calculated"
            summary="Formula, classification bands, and the limitation of reading this as a ranking index rather than a direct renewable-share measurement."
          >
            <p>
              <span className="font-semibold text-gray-900">Observed quantity:</span> MOER, or Marginal Operating Emissions Rate,
              measured in pounds of carbon dioxide per megawatt-hour.
            </p>
            <p>
              <span className="font-semibold text-gray-900">Derived formula:</span>{' '}
              <code className="rounded bg-slate-100 px-2 py-1 text-sky-700">score = max(0, min(100, 100 * (1 - MOER / 1000)))</code>
            </p>
            <p>
              <span className="font-semibold text-gray-900">Interpretation:</span> higher values indicate a lower-emissions marginal generator and therefore a better window for shifting flexible load.
            </p>
            <p>
              <span className="font-semibold text-gray-900">Limitation:</span> the score is a local normalization layer for readability. WattTime does not provide it as a direct field.
            </p>
          </DetailDisclosure>
        </div>

        {onSimulate && (
          <div className="mt-7">
            <StarBorder className="inline-block">
              <button
                onClick={onSimulate}
                className="min-h-[44px] rounded-full bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Run Scenario
              </button>
            </StarBorder>
          </div>
        )}

        {alertHint ? (
          <p className="mt-4 text-xs text-slate-500">
            Want an alert when this changes? <span className="font-semibold text-slate-700">↓</span>
          </p>
        ) : null}

        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>
  );
}
