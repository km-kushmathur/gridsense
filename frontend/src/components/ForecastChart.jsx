import { getCleanPowerScore, getMoerColor } from '../constants';
import { getBestWindowMeta } from '../utils/forecast';
import { formatHourFromValue, formatWindowFromPointRange } from '../utils/time';
import { SkeletonCard } from './SkeletonCard';
import { DetailDisclosure } from './ui/DetailDisclosure';

function getTooltipPositionClass(index, total) {
  if (index <= 1) return 'left-0 translate-x-0';
  if (index >= total - 2) return 'right-0 left-auto translate-x-0';
  return 'left-1/2 -translate-x-1/2';
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
  const { points: bestWindow, startIndex: bestPairStart } = getBestWindowMeta(hourly);

  return (
    <div className="card-glass p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="taxonomy-chip taxonomy-chip-observed">Observed forecast</span>
            <span className="taxonomy-chip taxonomy-chip-derived">Derived ranking</span>
          </div>
          <p className="panel-title mt-3">Balancing-region MOER forecast</p>
          <p className="panel-subtitle">
            Each bar is one hourly forecast of Marginal Operating Emissions Rate. Lower bars in this panel represent cleaner operating windows because the display inverts MOER visually for faster scanning.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="metric-chip" style={{ borderColor: `${statusColor}30`, color: statusColor }}>
            Derived best 2-hour window: {formatWindowFromPointRange(bestWindow)}
          </span>
          <span className="metric-chip">
            Lowest forecast MOER: {Math.round(bestWindow[0]?.moer || 0)} lbs/MWh
          </span>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-grid-clean" />
            Lower marginal emissions
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-grid-moderate" />
            Moderate marginal emissions
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-grid-dirty" />
            Higher marginal emissions
          </span>
        </div>

        <div className="overflow-x-auto overflow-y-visible pb-3">
          <div className="min-w-[720px] px-1">
            <div className="relative flex h-56 items-end gap-2 pt-12">
              {hourly.map((point, index) => {
                const moer = point.moer || 0;
                const color = getMoerColor(moer);
                const cleanRatio = 1 - moer / (maxMoer * 1.15);
                const height = Math.max(24, cleanRatio * 190 + 26);
                const isNow = index === currentIndex;
                const isBestWindow = index === bestPairStart || index === bestPairStart + 1;
                const cleanScore = Math.round(getCleanPowerScore(point));

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

                    <div className="relative flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t-[16px] transition duration-200 group-hover:opacity-100"
                        style={{
                          height,
                          background: `linear-gradient(180deg, ${color}, ${color}bb)`,
                          boxShadow: isNow ? `0 0 28px ${color}40` : 'none',
                          opacity: isNow ? 1 : 0.88,
                        }}
                      />

                      <div className={`pointer-events-none absolute bottom-full z-10 mb-3 hidden w-40 rounded-2xl border border-white/10 bg-[#071018]/95 px-3 py-2 text-left shadow-2xl group-hover:block ${getTooltipPositionClass(index, hourly.length)}`}>
                        <p className="text-xs font-semibold text-white">{formatHourFromValue(point.time)}</p>
                        <p className="mt-1 text-[11px] text-slate-300">Observed or forecast MOER: {Math.round(moer)} lbs CO2/MWh</p>
                        <p className="text-[11px] text-slate-400">
                          Derived score: {cleanScore}/100
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              {hourly.map((point, index) => (
                <div key={`${point.time || index}-label`} className="flex min-w-[32px] flex-1 justify-center">
                  <span className="h-4 text-[11px] font-medium text-slate-500">
                    {index % 3 === 0 ? formatHourFromValue(point.time, '') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <DetailDisclosure
          badge="How to read this"
          title="Observed forecast values and the derived best-window ranking"
          summary="Open for the exact operational interpretation, units, and the way the best two-hour window is selected."
        >
          <p>
            <span className="font-semibold text-white">Observed quantity:</span> each bar corresponds to forecasted Marginal Operating Emissions Rate, expressed in pounds of carbon dioxide per megawatt-hour.
          </p>
          <p>
            <span className="font-semibold text-white">Derived ranking:</span> the dashboard scans adjacent two-hour windows and selects the minimum mean MOER window as the best shift candidate.
          </p>
          <p>
            <span className="font-semibold text-white">Operational use:</span> shift flexible demand into the lowest-MOER window rather than using average daily timing or a generic off-peak assumption.
          </p>
          <p>
            <span className="font-semibold text-white">Limitation:</span> the forecast is balancing-region level. It does not describe feeder-level or neighborhood-level grid behavior.
          </p>
        </DetailDisclosure>
      </div>
    </div>
  );
}
