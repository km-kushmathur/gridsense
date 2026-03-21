import { getMoerColor } from '../constants';
import { SkeletonCard } from './SkeletonCard';

function formatHourLabel(hour) {
  if (hour === 0) return '12a';
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return '12p';
  return `${hour - 12}p`;
}

function formatWindowLabel(points) {
  if (!points.length) return 'Unavailable';
  const start = new Date(points[0].time);
  const end = new Date(points[points.length - 1].time);
  const endHour = (end.getHours() + 1) % 24;
  return `${formatHourLabel(start.getHours())} - ${formatHourLabel(endHour)}`;
}

export function ForecastChart({ forecast, loading, statusColor = '#22C55E' }) {
  if (loading) {
    return (
      <div className="card-glass p-6">
        <SkeletonCard className="h-5 w-48" />
        <SkeletonCard className="mt-3 h-4 w-80" />
        <div className="mt-8 flex h-56 gap-2">
          {Array.from({ length: 24 }, (_, index) => (
            <SkeletonCard key={index} className="flex-1 self-end rounded-t-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!forecast?.length) {
    return (
      <div className="card-glass p-6">
        <p className="panel-title">Carbon Forecast</p>
        <p className="panel-subtitle">Forecast data has not loaded yet. Try refreshing the page in a moment.</p>
      </div>
    );
  }

  const hourly = forecast.slice(0, 24);
  const maxMoer = Math.max(...hourly.map((point) => point.moer || 0), 1);
  const currentHour = new Date().getHours();
  const currentIndex = Math.max(0, hourly.findIndex((point) => new Date(point.time).getHours() === currentHour));

  let bestPairStart = 0;
  let lowestAverage = Number.POSITIVE_INFINITY;
  for (let index = 0; index < hourly.length - 1; index += 1) {
    const averageMoer = ((hourly[index].moer || 0) + (hourly[index + 1].moer || 0)) / 2;
    if (averageMoer < lowestAverage) {
      lowestAverage = averageMoer;
      bestPairStart = index;
    }
  }

  const bestWindow = hourly.slice(bestPairStart, bestPairStart + 2);

  return (
    <div className="card-glass p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="panel-title">Carbon Forecast, next 24 hours</p>
          <p className="panel-subtitle">
            Taller bars mean cleaner electricity. Use this section to spot the lowest-carbon window before you schedule charging or appliance use.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="metric-chip" style={{ borderColor: `${statusColor}30`, color: statusColor }}>
            Best 2-hour window: {formatWindowLabel(bestWindow)}
          </span>
          <span className="metric-chip">{Math.round(bestWindow[0]?.pct_renewable * 100 || 0)}%+ renewable</span>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-white/8 bg-black/20 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-grid-clean" />
            Clean
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-grid-moderate" />
            Moderate
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-grid-dirty" />
            Dirty
          </span>
        </div>

        <div className="relative flex h-64 items-end gap-2 overflow-x-auto pb-3">
          {hourly.map((point, index) => {
            const moer = point.moer || 0;
            const hour = new Date(point.time).getHours();
            const color = getMoerColor(moer);
            const cleanRatio = 1 - moer / (maxMoer * 1.15);
            const height = Math.max(24, cleanRatio * 190 + 26);
            const isNow = index === currentIndex;
            const isBestWindow = index === bestPairStart || index === bestPairStart + 1;

            return (
              <div key={point.time || index} className="group relative flex min-w-[32px] flex-1 items-end justify-center">
                {isBestWindow && (
                  <div className="absolute inset-x-0 bottom-0 top-10 rounded-t-[18px] bg-grid-clean/10" />
                )}

                {isNow && (
                  <div className="absolute -top-1 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white">Now</span>
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-white"
                      style={{ boxShadow: '0 0 14px rgba(255,255,255,0.65)', animation: 'pulse 2s infinite' }}
                    />
                  </div>
                )}

                <div className="relative flex w-full flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-[16px] transition duration-200 group-hover:opacity-100"
                    style={{
                      height,
                      background: `linear-gradient(180deg, ${color}, ${color}bb)`,
                      boxShadow: isNow ? `0 0 28px ${color}40` : 'none',
                      opacity: isNow ? 1 : 0.88,
                    }}
                  />

                  <span className="mt-3 text-[11px] font-medium text-slate-500">
                    {index % 3 === 0 ? formatHourLabel(hour) : ''}
                  </span>

                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 hidden w-36 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#071018]/95 px-3 py-2 text-left shadow-2xl group-hover:block">
                    <p className="text-xs font-semibold text-white">{formatHourLabel(hour)}</p>
                    <p className="mt-1 text-[11px] text-slate-300">{Math.round(moer)} lbs CO2/MWh</p>
                    <p className="text-[11px] text-slate-400">
                      {Math.round((point.pct_renewable || 0) * 100)}% renewable
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
