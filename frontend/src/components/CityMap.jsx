import { getMoerColor, getStatusColor, getStatusLabel } from '../constants';
import { SkeletonCard } from './SkeletonCard';

export function CityMap({ data, cityName, loading }) {
  if (loading || !data) {
    return (
      <div className="card-glass flex min-h-[360px] items-center justify-center p-6">
        <div className="grid w-full gap-4">
          <SkeletonCard className="h-5 w-40" />
          <SkeletonCard className="h-[250px] w-full rounded-[28px]" />
          <SkeletonCard className="h-5 w-72" />
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(data);
  const statusLabel = getStatusLabel(data);
  const moerColor = getMoerColor(data.moer || 0);

  return (
    <div className="card-glass relative min-h-[360px] overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-grid-clean/80">Local grid pulse</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{cityName}</h3>
          <p className="mt-1 text-sm text-slate-400">{data.region || 'Local balancing region'}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">MOER now</p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: moerColor }}>
            {Math.round(data.moer || 0)}
          </p>
          <p className="text-xs text-slate-500">lbs CO2 per MWh</p>
        </div>
      </div>

      <div className="relative mt-6 flex min-h-[220px] items-center justify-center overflow-hidden rounded-[30px] border border-white/8 bg-[#09111a]/85">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.09),transparent_52%)]" />

        <div
          className="absolute h-[280px] w-[280px] rounded-full"
          style={{
            background: `${statusColor}16`,
            border: `1px solid ${statusColor}24`,
            animation: 'mapPulse 3.4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute h-[172px] w-[172px] rounded-full"
          style={{
            background: `${statusColor}20`,
            border: `1px solid ${statusColor}4a`,
          }}
        />
        <div
          className="absolute h-[88px] w-[88px] rounded-full"
          style={{
            background: `${statusColor}38`,
            border: `1px solid ${statusColor}`,
            boxShadow: `0 0 40px ${statusColor}22`,
          }}
        />
        <div
          className="absolute h-4 w-4 rounded-full"
          style={{
            background: statusColor,
            boxShadow: `0 0 24px ${statusColor}`,
          }}
        />

        <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-slate-200">
          Live signal view
        </div>
        <div className="absolute bottom-5 right-5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-slate-200">
          {statusLabel}
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <p className="text-sm leading-7 text-slate-300">
          This visualization is a readable stand-in for the local grid. The brighter the center glow, the healthier and cleaner the current operating window is for your city.
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="metric-chip">{Math.round((data.pct_renewable || 0) * 100)}% renewable</span>
          <span className="metric-chip">{statusLabel} now</span>
        </div>
      </div>
    </div>
  );
}
