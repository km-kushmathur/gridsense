import { getStatusColor, getStatusLabel } from '../constants';
import { CountUp } from './ui/CountUp';
import { StarBorder } from './ui/StarBorder';

export function IntensityBadge({ data, loading, onSimulate }) {
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
  const pctRenewable = Math.round(data.pct_renewable * 100);

  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]"
      style={{
        background: `linear-gradient(145deg, ${statusColor}16 0%, rgba(255,255,255,0.02) 48%, transparent 100%)`,
      }}
    >
      <div className="card-solid flex min-h-[220px] flex-col justify-between rounded-[28px] border px-6 py-7" style={{ borderColor: `${statusColor}45` }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Renewable share now</p>
          <CountUp
            value={pctRenewable}
            suffix="%"
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
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">What this means</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Your grid is running on {pctRenewable}% cleaner energy right now.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Lower carbon intensity means cleaner electricity is doing more of the work. This is the first number a newcomer should read before deciding whether to charge an EV, run laundry, or wait for a better window.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="metric-chip">MOER {Math.round(data.moer)} lbs/MWh</span>
          <span className="metric-chip">{Math.round(data.temp_c)}°C outside</span>
          <span className="metric-chip">{data.heat_wave ? 'Heat wave pressure' : 'Normal weather load'}</span>
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
      </div>
    </div>
  );
}
