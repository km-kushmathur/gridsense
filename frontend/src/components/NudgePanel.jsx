import { useCallback, useEffect, useState } from 'react';
import { fetchNudges } from '../api/gridsense';
import { SkeletonCard } from './SkeletonCard';
import { DetailDisclosure } from './ui/DetailDisclosure';
import { StarBorder } from './ui/StarBorder';
import { formatHourFromValue, formatWindowRange } from '../utils/time';

const APPLIANCE_ORDER = ['ev_charger', 'dryer', 'dishwasher', 'washer'];

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
    label: 'EV Charger',
    icon: '⚡',
  },
  dryer: {
    color: '#F59E0B',
    label: 'Dryer',
    icon: '🌀',
  },
};

const APPLIANCE_KWH = {
  dishwasher: 1.2,
  washer: 0.5,
  ev_charger: 7.2,
  dryer: 3.5,
};

const AVG_ELECTRICITY_COST_PER_KWH = 0.16; // US national average $/kWh (EIA 2024)

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

function formatSavedCo2(grams) {
  const value = Number(grams || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }
  if (value < 10) {
    return value.toFixed(1).replace(/\.0$/, '');
  }
  return String(Math.round(value));
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

  const bestNudge = nudges[0];
  const windowTime = bestNudge ? formatBestWindow(bestNudge) : null;
  const windowMoer = bestNudge?.window_avg_moer || 0;
  const totalCo2Saved = nudges.reduce((sum, n) => sum + (n.co2_saved_grams || 0), 0);
  const totalKwh = nudges.reduce((sum, n) => sum + (APPLIANCE_KWH[n.appliance] || 1.0), 0);

  return (
    <div className="card-glass p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="taxonomy-chip taxonomy-chip-generated">Generated recommendation</span>
          </div>
          <p className="panel-title font-display">What to Do Now</p>
          <p className="panel-subtitle">
            The cleanest upcoming window for EV charging, laundry, and other high-draw appliances. Savings estimates assume you'd otherwise run them right now.
          </p>
        </div>

        <StarBorder className="w-fit">
          <button
            onClick={loadNudges}
            disabled={loading}
            className="rounded-full bg-green-50 px-4 py-2.5 text-sm font-semibold text-grid-clean transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </StarBorder>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Unable to load recommendations — check your connection and try refreshing. If cached data is available, it is shown below.
        </div>
      )}

      {loading && nudges.length === 0 ? (
        <div className="mt-6 grid gap-4">
          <SkeletonCard className="h-[120px] rounded-[24px]" />
          <SkeletonCard className="h-[200px] rounded-[20px]" />
        </div>
      ) : nudges.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <p className="text-base text-gray-900">No recommendations available yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Tap "Refresh Data" to generate appliance timing suggestions for {city}.
          </p>
        </div>
      ) : (
        <>
          {/* Optimal Window hero */}
          <div className="mt-8 rounded-[24px] border border-green-200 bg-green-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600">Optimal window</p>
            <p className="mt-3 font-display text-3xl font-bold text-green-700">{windowTime}</p>
            {windowMoer > 0 && (
              <p className="mt-2 text-base text-green-600">
                {Math.round(windowMoer)} lbs CO&#x2082;/MWh during this window
              </p>
            )}
            <p className="mt-2 text-base text-slate-500">
              Run all appliances in this window for lowest carbon output.
            </p>
          </div>

          {/* Savings table */}
          <div className="mt-8">
            <h3 className="font-display text-lg font-semibold text-gray-900">
              Expected Savings vs Running Right Now
            </h3>
            <p className="mt-2 text-base leading-relaxed text-slate-500">
              Each row shows the typical energy per cycle for one appliance and the carbon and cost you save by running it during the optimal window instead of now.
            </p>

            <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-200 divide-y divide-slate-100">
              {/* Column header */}
              <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Appliance</span>
                <div className="flex items-center gap-6">
                  <span className="min-w-[72px] text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Per cycle</span>
                  <span className="min-w-[80px] text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">CO&#x2082; saved</span>
                  <span className="min-w-[64px] text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cost</span>
                </div>
              </div>

              {nudges.map((nudge) => {
                const meta = APPLIANCE_META[nudge.appliance] || APPLIANCE_META.dryer;
                const kwh = APPLIANCE_KWH[nudge.appliance] || 1.0;
                const costPerCycle = (kwh * AVG_ELECTRICITY_COST_PER_KWH).toFixed(2);

                return (
                  <div key={nudge.appliance} className="flex items-center justify-between bg-white px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-base"
                        style={{ background: `${meta.color}18`, color: meta.color }}
                      >
                        {nudge.emoji || meta.icon}
                      </div>
                      <span className="text-base font-medium text-gray-900">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="min-w-[72px] text-right text-sm text-slate-500">{kwh} kWh</span>
                      <span className="min-w-[80px] text-right text-base font-semibold text-green-700">
                        -{formatSavedCo2(nudge.co2_saved_grams)}g CO&#x2082;
                      </span>
                      <span className="min-w-[64px] text-right text-sm font-medium text-slate-600">
                        ${costPerCycle}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Total row */}
              <div className="flex items-center justify-between bg-green-50 px-5 py-4">
                <span className="text-base font-bold text-gray-900">Total (all appliances)</span>
                <div className="flex items-center gap-6">
                  <span className="min-w-[72px] text-right text-sm text-slate-500">{totalKwh.toFixed(1)} kWh</span>
                  <span className="min-w-[80px] text-right text-base font-bold text-green-700">
                    -{formatSavedCo2(totalCo2Saved)}g CO&#x2082;
                  </span>
                  <span className="min-w-[64px] text-right text-sm font-semibold text-slate-700">
                    ${(totalKwh * AVG_ELECTRICITY_COST_PER_KWH).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI message */}
          {bestNudge?.message && (
            <p className="mt-6 text-base leading-7 text-slate-600">{bestNudge.message}</p>
          )}
        </>
      )}

      <div className="mt-8">
        <DetailDisclosure
          badge="How savings are calculated"
          title="Methodology, appliance energy, and cost assumptions"
          summary="Formula, unit conversions, ENERGY STAR baseline values, and cost estimates."
        >
          <p>
            <span className="font-semibold text-gray-900">Carbon formula:</span> CO&#x2082; saved (g) = appliance kWh × (current MOER − window MOER) × 453.592 g/lb ÷ 1000
          </p>
          <p>
            <span className="font-semibold text-gray-900">Unit note:</span> 453.592 g/lb converts pounds to grams. Dividing by 1000 converts MWh to kWh.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Typical energy per cycle:</span> EV charger 7.2 kWh, dryer 3.5 kWh, dishwasher 1.2 kWh, washer 0.5 kWh. These are ENERGY STAR median values representing how much electricity each appliance uses in a single run.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Cost estimate:</span> the cost column uses $0.16/kWh, the U.S. national average residential electricity rate (EIA, 2024). Your actual rate may differ.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Energy note:</span> These appliances use the same kWh regardless of when you run them. The savings shown are carbon savings only — your electricity bill stays the same.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Limitation:</span> Based on forecasted MOER. Actual savings depend on real-time grid conditions during the window.
          </p>
        </DetailDisclosure>
      </div>
    </div>
  );
}
