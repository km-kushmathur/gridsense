import { useState } from 'react';
import { fetchNudges } from '../api/gridsense';

export function NudgePanel({ city, initialNudges }) {
  const [nudges, setNudges] = useState(initialNudges || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRefresh = async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNudges(city);
      setNudges(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const borderColor = {
    dishwasher: 'border-l-blue-400',
    washer: 'border-l-cyan-400',
    ev_charger: 'border-l-purple-400',
    dryer: 'border-l-orange-400',
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Smart Nudges
        </h3>
        <button
          id="refresh-nudges-btn"
          onClick={handleRefresh}
          disabled={loading || !city}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-grid-surface border border-grid-border hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {loading && !nudges.length ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
      ) : nudges.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-8">
          <p className="text-3xl mb-2">💡</p>
          <p>Enter a city and click Refresh to get personalized nudges</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {nudges.map((nudge, i) => (
            <div
              key={i}
              className={`border-l-4 ${borderColor[nudge.appliance] || 'border-l-gray-500'} bg-grid-surface rounded-lg p-3 border border-grid-border hover:bg-white/[0.02] transition-colors`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{nudge.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-white capitalize">
                      {nudge.appliance.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-grid-clean bg-grid-clean/15 px-2 py-0.5 rounded-full">
                      -{Math.round(nudge.co2_saved_grams)}g CO₂
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed mb-1.5">
                    {nudge.message}
                  </p>

                  <p className="text-xs text-gray-500">
                    ⏰ Best time: <span className="font-semibold text-gray-300">{nudge.best_time}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
