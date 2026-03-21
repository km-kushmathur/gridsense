import { useEffect, useState } from 'react';

export function LiveTicker({ data }) {
  const [visible, setVisible] = useState(true);

  // Blink effect when data changes
  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, [data?.moer]);

  if (!data) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-grid-surface/50 border-b border-grid-border text-sm text-gray-500">
        <span className="w-2 h-2 rounded-full bg-gray-600" />
        Waiting for grid data…
      </div>
    );
  }

  const statusColors = {
    clean: { dot: 'bg-grid-clean', text: 'text-grid-clean' },
    moderate: { dot: 'bg-grid-moderate', text: 'text-grid-moderate' },
    dirty: { dot: 'bg-grid-dirty', text: 'text-grid-dirty' },
  };
  const colors = statusColors[data.status] || statusColors.moderate;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-grid-surface/50 border-b border-grid-border text-sm overflow-hidden">
      {/* Live dot */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse-slow`} />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Live</span>
      </div>

      {/* Ticker content */}
      <div className={`flex items-center gap-4 transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-gray-400">
          MOER: <span className={`font-mono font-bold ${colors.text}`}>{Math.round(data.moer)}</span>
          <span className="text-gray-600 ml-1">lbs/MWh</span>
        </span>

        <span className="text-gray-700">|</span>

        <span className="text-gray-400">
          Renewable: <span className={`font-semibold ${colors.text}`}>{Math.round(data.pct_renewable * 100)}%</span>
        </span>

        <span className="text-gray-700">|</span>

        <span className="text-gray-400">
          Score: <span className="font-semibold text-white">{Math.round(data.green_score)}</span>/100
        </span>

        <span className="text-gray-700">|</span>

        <span className={`capitalize font-medium ${colors.text}`}>
          {data.status}
        </span>
      </div>

      {/* City badge */}
      {data.city && (
        <span className="ml-auto flex-shrink-0 text-xs text-gray-500 bg-grid-surface rounded px-2 py-0.5 border border-grid-border">
          📍 {data.city}
        </span>
      )}
    </div>
  );
}
