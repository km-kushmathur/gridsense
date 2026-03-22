import { useMemo } from 'react';
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
      <div className="card-glass p-6" aria-label="Loading forecast data">
        <SkeletonCard className="h-5 w-48" />
        <SkeletonCard className="mt-3 h-4 w-80" />
        <div className="mt-8 flex h-56 gap-2">
          {Array.from({ length: 24 }, (_, index) => {
            const skeletonHeight = 40 + Math.sin(index * 0.8) * 30 + Math.random() * 20;
            return (
              <SkeletonCard key={index} className="flex-1 self-end rounded-t-2xl" style={{ height: skeletonHeight }} />
            );
          })}
        </div>
      </div>
    );
  }

  if (!forecast?.length) {
    return (
      <div className="card-glass p-6">
        <p className="panel-title">Carbon Rate Forecast</p>
        <p className="panel-subtitle">Unable to load forecast data — check your connection and try refreshing.</p>
      </div>
    );
  }

  const { hourly, maxMoer, currentIndex, bestWindow, bestPairStart } = useMemo(() => {
    const h = forecast.slice(0, 24);
    const max = Math.max(...h.map((point) => point.moer || 0), 1);
    const hour = new Date().getHours();
    const idx = Math.max(0, h.findIndex((point) => new Date(point.time).getHours() === hour));
    const { points, startIndex } = getBestWindowMeta(h);
    return { hourly: h, maxMoer: max, currentIndex: idx, bestWindow: points, bestPairStart: startIndex };
  }, [forecast]);

  return (
    <div className="card-glass p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="taxonomy-chip taxonomy-chip-observed">Observed forecast</span>
            <span className="taxonomy-chip taxonomy-chip-derived">Derived ranking</span>
          </div>
          <p className="panel-title mt-3 font-display">Carbon Rate Forecast (lbs CO&#x2082;/MWh)</p>
          <p className="panel-subtitle">
            Each bar shows the forecasted carbon rate for one hour. Bar height is inverted: taller means lower emissions — a better time to run heavy appliances. Hover any bar to see the exact rate and Clean Power Score.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="metric-chip" style={{ borderColor: `${statusColor}30`, color: statusColor }}>
            Best 2-hour window: {formatWindowFromPointRange(bestWindow)}
          </span>
          <span className="metric-chip">
            Lowest Carbon Rate: {Math.round(bestWindow[0]?.moer || 0)} lbs CO&#x2082;/MWh
          </span>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
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
                const statusWord = moer < 400 ? 'clean' : moer < 700 ? 'moderate' : 'high carbon';
                const barLabel = `${formatHourFromValue(point.time)}: ${Math.round(moer)} lbs CO\u2082 per MWh, ${statusWord}`;

                return (
                  <div key={point.time || index} className="group relative flex min-w-[32px] flex-1 items-end justify-center" role="img" aria-label={barLabel}>
                    {isBestWindow && (
                      <div className="absolute inset-x-0 bottom-0 top-10 rounded-t-[18px] bg-grid-clean/10" />
                    )}

                    {isNow && (
                      <div className="absolute -top-1 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-900">Now</span>
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-gray-900"
                          style={{ boxShadow: '0 0 14px rgba(0,0,0,0.25)', animation: 'pulse 2s infinite' }}
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

                      <div className={`pointer-events-none absolute bottom-full z-10 mb-3 hidden w-40 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-left shadow-lg group-hover:block ${getTooltipPositionClass(index, hourly.length)}`}>
                        <p className="text-xs font-semibold text-gray-900">{formatHourFromValue(point.time)}</p>
                        <p className="mt-1 text-[11px] text-slate-600">Carbon Rate: {Math.round(moer)} lbs CO&#x2082;/MWh</p>
                        <p className="text-[11px] text-slate-500">
                          Clean Power Score: {cleanScore}/100
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
                  <span className="h-4 text-[11px] font-medium text-slate-400">
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
            <span className="font-semibold text-gray-900">Observed quantity:</span> each bar corresponds to forecasted Marginal Operating Emissions Rate, expressed in pounds of carbon dioxide per megawatt-hour.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Derived ranking:</span> the dashboard scans adjacent two-hour windows and selects the minimum mean MOER window as the best shift candidate.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Operational use:</span> shift flexible demand into the lowest-MOER window rather than using average daily timing or a generic off-peak assumption.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Limitation:</span> the forecast is balancing-region level. It does not describe feeder-level or neighborhood-level grid behavior.
          </p>
        </DetailDisclosure>
      </div>
    </div>
  );
}
