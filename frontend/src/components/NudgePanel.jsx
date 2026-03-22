import { useCallback, useEffect, useState } from 'react';
import { fetchNudges } from '../api/gridsense';
import { SkeletonCard } from './SkeletonCard';
import { AnimatedContent } from './ui/AnimatedContent';
import { DetailDisclosure } from './ui/DetailDisclosure';
import { SpotlightCard } from './ui/SpotlightCard';
import { StarBorder } from './ui/StarBorder';
import { formatHourFromValue, formatWindowRange } from '../utils/time';

const APPLIANCE_ORDER = ['ev_charger', 'dishwasher', 'dryer', 'washer'];

const APPLIANCE_META = {
  dishwasher: {
    color: '#3B8BD4',
    label: 'Dishwasher',
    icon: '🍽️',
  },
  washer: {
    color: '#22C55E',
    label: 'Washer',
    icon: '🧺',
  },
  ev_charger: {
    color: '#7dd3fc',
    label: 'EV charger',
    icon: '⚡',
  },
  dryer: {
    color: '#F59E0B',
    label: 'Dryer',
    icon: '🌀',
  },
};

function sortNudges(nudges) {
  return [...nudges].sort((left, right) => {
    const leftIndex = APPLIANCE_ORDER.indexOf(left.appliance);
    const rightIndex = APPLIANCE_ORDER.indexOf(right.appliance);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

function formatBestWindow(nudge) {
  if (nudge?.best_window_start && nudge?.best_window_end) {
    return formatWindowRange(nudge.best_window_start, nudge.best_window_end, 'Window unavailable');
  }
  if (nudge?.best_window_label) {
    return nudge.best_window_label;
  }
  if (nudge?.best_time) {
    return formatHourFromValue(nudge.best_time, nudge.best_time);
  }
  return 'Window unavailable';
}

export function NudgePanel({ city }) {
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNudges = useCallback(async () => {
    if (!city) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchNudges(city);
      setNudges(sortNudges(result.nudges || result || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    loadNudges();
  }, [loadNudges]);

  return (
    <div className="card-glass p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="taxonomy-chip taxonomy-chip-generated">Generated recommendation</span>
          </div>
          <p className="panel-title">Smart appliance nudges</p>
          <p className="panel-subtitle">
            Forecasted low-MOER windows are converted into appliance timing recommendations so the operational action is immediately clear.
          </p>
        </div>

        <StarBorder className="w-fit">
          <button
            onClick={loadNudges}
            disabled={loading}
            className="rounded-full bg-[#0d2015] px-4 py-2.5 text-sm font-semibold text-grid-clean transition hover:bg-[#14301e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Refreshing...' : 'Refresh nudges'}
          </button>
        </StarBorder>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Some live nudge data failed to load. If cached or fallback nudges are available, they are shown below.
        </div>
      )}

      {loading && nudges.length === 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard key={index} className="h-[180px] rounded-[24px]" />
          ))}
        </div>
      ) : nudges.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/15 px-6 py-12 text-center">
          <p className="text-base text-white">No nudges available yet.</p>
          <p className="mt-2 text-sm text-slate-400">
            Try refreshing to generate a fresh set of appliance recommendations for {city}.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {nudges.map((nudge, index) => {
            const meta = APPLIANCE_META[nudge.appliance] || APPLIANCE_META.dryer;

            return (
              <AnimatedContent key={`${nudge.appliance}-${index}`} delay={90 * index}>
                <SpotlightCard className="card-solid hover-lift h-full overflow-hidden border border-white/10 p-4 sm:p-5">
                  <div
                    className="absolute inset-y-4 left-0 w-1 rounded-r-full"
                    style={{ background: meta.color }}
                  />

                  <div className="relative flex h-full min-h-[260px] flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-lg"
                          style={{ background: `${meta.color}18`, color: meta.color }}
                        >
                          <span>{nudge.emoji || meta.icon}</span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Appliance</p>
                          <p className="mt-1 text-base font-semibold text-white sm:text-lg">{meta.label}</p>
                        </div>
                      </div>

                      <span
                        className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                        style={{
                          color: meta.color,
                          borderColor: `${meta.color}44`,
                          background: `${meta.color}12`,
                        }}
                      >
                        -{Math.round(nudge.co2_saved_grams || 0)}g CO2
                      </span>
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Best window</p>
                      <p className="mt-2 font-display text-[1.65rem] font-semibold leading-tight text-grid-clean sm:text-[1.9rem]">
                        {formatBestWindow(nudge)}
                      </p>
                    </div>

                    <p className="flex-1 text-sm leading-6 text-slate-300">{nudge.message}</p>
                  </div>
                </SpotlightCard>
              </AnimatedContent>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <DetailDisclosure
          badge="Recommendation method"
          title="How these recommendations are generated"
          summary="Open for the distinction between physical measurements, derived carbon savings, and the language-model step."
        >
          <p>
            <span className="font-semibold text-white">Observed inputs:</span> WattTime forecast values and current operating context.
          </p>
          <p>
            <span className="font-semibold text-white">Derived quantities:</span> best timing windows and estimated carbon savings based on appliance load assumptions and the MOER difference between now and the suggested window.
          </p>
          <p>
            <span className="font-semibold text-white">Generated layer:</span> Azure OpenAI converts those already-computed physical values into structured, readable instructions. The language model does not measure MOER, weather, or grid stress.
          </p>
        </DetailDisclosure>
      </div>
    </div>
  );
}
