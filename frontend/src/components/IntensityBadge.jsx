export function IntensityBadge({ data, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 p-6">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="skeleton w-24 h-4" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-gray-500">
        <div className="w-20 h-20 rounded-full border-2 border-gray-700 flex items-center justify-center text-3xl">
          —
        </div>
        <p className="text-sm">Enter a city to start</p>
      </div>
    );
  }

  const statusColor = {
    clean: 'text-grid-clean border-grid-clean bg-grid-clean/10',
    moderate: 'text-grid-moderate border-grid-moderate bg-grid-moderate/10',
    dirty: 'text-grid-dirty border-grid-dirty bg-grid-dirty/10',
  }[data.status] || 'text-gray-400 border-gray-600 bg-gray-800';

  const statusEmoji = { clean: '🟢', moderate: '🟡', dirty: '🔴' }[data.status] || '⚪';
  const dotColor = { clean: 'bg-grid-clean', moderate: 'bg-grid-moderate', dirty: 'bg-grid-dirty' }[data.status] || 'bg-gray-500';

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Big MOER number */}
      <div className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center ${statusColor}`}>
        <span className="text-3xl font-bold">{Math.round(data.moer)}</span>
        {/* Pulsing dot */}
        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${dotColor} animate-pulse-slow`} />
      </div>

      <p className="text-xs text-gray-400 tracking-wider uppercase">lbs CO₂/MWh</p>

      {/* Status badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}>
        <span>{statusEmoji}</span>
        <span className="capitalize">{data.status}</span>
      </div>

      {/* Green score bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Green Score</span>
          <span>{Math.round(data.green_score)}/100</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${data.green_score}%`,
              background: data.green_score > 60
                ? '#22c55e'
                : data.green_score > 30
                  ? '#eab308'
                  : '#ef4444',
            }}
          />
        </div>
      </div>

      {/* Renewable % */}
      <p className="text-sm text-gray-300">
        <span className="font-semibold text-white">{Math.round(data.pct_renewable * 100)}%</span> renewable
      </p>

      {/* Region */}
      <p className="text-xs text-gray-500 font-mono">{data.region}</p>
    </div>
  );
}
