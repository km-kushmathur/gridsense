import { useState } from 'react';
import { fetchNudges } from '../api/gridsense';

const APPLIANCE_ORDER = ['ev_charger', 'dishwasher', 'dryer', 'washer'];

const APPLIANCE_ICONS = {
  dishwasher: { color: '#3B8BD4', icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )},
  washer: { color: '#22C55E', icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )},
  ev_charger: { color: '#3B8BD4', icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M8 1L4 7h4L6 13l6-7H8L10 1H8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )},
  dryer: { color: '#888780', icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7c1-1 3 1 4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )},
};

function sortNudges(nudges) {
  return [...nudges].sort((a, b) => {
    const ai = APPLIANCE_ORDER.indexOf(a.appliance);
    const bi = APPLIANCE_ORDER.indexOf(b.appliance);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function NudgePanel({ city }) {
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRefresh = async () => {
    if (!city) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNudges(city);
      setNudges(sortNudges(result.nudges || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '14px 16px' }}>
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: 11, color: '#555553', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Appliance nudges — what to run tonight
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 11,
            color: '#555553',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Refresh nudges
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 11, color: '#555553', marginBottom: 8 }}>Using cached data</p>
      )}

      {/* Nudge cards or skeletons */}
      {loading && !nudges.length ? (
        <div>
          <p style={{ fontSize: 11, color: '#555553', marginBottom: 8 }}>Generating nudges...</p>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8, marginBottom: 8 }} />
          ))}
        </div>
      ) : nudges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 12, color: '#555553' }}>Click Refresh to generate nudges</p>
        </div>
      ) : (
        <div>
          {nudges.map((nudge, i) => {
            const appliance = APPLIANCE_ICONS[nudge.appliance] || APPLIANCE_ICONS.dryer;
            return (
              <div
                key={i}
                className="flex gap-[10px]"
                style={{
                  background: '#0F1117',
                  borderRadius: 8,
                  border: '0.5px solid #1E1E1C',
                  padding: '10px 12px',
                  marginBottom: 8,
                }}
              >
                {/* Icon block */}
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: '#1A1D27',
                    color: appliance.color,
                  }}
                >
                  {appliance.icon}
                </div>

                {/* Text block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#D0D0CE' }}>
                      {nudge.appliance.replace(/_/g, ' ')}
                    </span>
                    <span style={{
                      fontSize: 10,
                      color: '#22C55E',
                      background: 'rgba(34,197,94,0.08)',
                      border: '0.5px solid rgba(34,197,94,0.25)',
                      borderRadius: 10,
                      padding: '2px 6px',
                      marginLeft: 'auto',
                    }}>
                      −{Math.round(nudge.co2_saved_grams)}g CO₂
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#22C55E', marginBottom: 2 }}>
                    Best time: {nudge.best_time}
                  </p>
                  <p style={{
                    fontSize: 11,
                    color: '#666663',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {nudge.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
