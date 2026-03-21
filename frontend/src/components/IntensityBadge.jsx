import { getStatusColor, getStatusLabel, getMoerColor } from '../constants';

export function IntensityBadge({ data, loading, weather, forecast }) {
  if (loading || !data) {
    return (
      <div style={{ padding: 14 }}>
        <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 80, height: 40, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 12, marginBottom: 16 }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ width: '100%', height: 12, marginBottom: 8 }} />
        ))}
      </div>
    );
  }

  const statusColor = getStatusColor(data);
  const statusLabel = getStatusLabel(data);
  const pctRenewable = Math.round(data.pct_renewable * 100);

  // Find best window from forecast
  let bestWindow = '—';
  if (forecast?.length) {
    let bestStart = null;
    let lowestMoer = Infinity;
    for (const point of forecast.slice(0, 24)) {
      if (point.moer < lowestMoer) {
        lowestMoer = point.moer;
        bestStart = new Date(point.time);
      }
    }
    if (bestStart) {
      const h = bestStart.getHours();
      const end = (h + 2) % 24;
      const fmt = (hr) => {
        if (hr === 0) return '12 am';
        if (hr < 12) return `${hr} am`;
        if (hr === 12) return '12 pm';
        return `${hr - 12} pm`;
      };
      bestWindow = `${fmt(h)}–${fmt(end)}`;
    }
  }

  // Heat wave risk
  const heatWaveRisk = data.heat_wave ? 'High' : (data.temp_c > 30 ? 'Elevated' : 'Low');
  const heatWaveColor = data.heat_wave ? '#EF4444' : (data.temp_c > 30 ? '#EAB308' : '#22C55E');

  const conditions = [
    { label: 'Carbon intensity', value: `${Math.round(data.moer)} lbs/MWh`, color: getMoerColor(data.moer) },
    { label: 'Grid stress', value: `${Math.round(data.grid_stress || 0)}%`, color: statusColor },
    { label: 'Temperature', value: `${Math.round(data.temp_c)}°C`, color: '#D0D0CE' },
    { label: 'Heat wave risk', value: heatWaveRisk, color: heatWaveColor },
    { label: 'Best window today', value: bestWindow, color: '#22C55E' },
  ];

  return (
    <div style={{ padding: 14 }}>
      {/* Status card */}
      <div style={{
        background: '#0F1117',
        borderRadius: 10,
        padding: 14,
        border: '0.5px solid #1E2A1E',
        marginBottom: 14,
      }}>
        <p style={{ fontSize: 11, color: '#555553', marginBottom: 8 }}>Grid cleanliness right now</p>
        <p style={{ fontSize: 36, fontWeight: 500, color: statusColor, lineHeight: 1 }}>
          {pctRenewable}%
        </p>
        <p style={{ fontSize: 11, color: statusColor, opacity: 0.6, marginTop: 4, marginBottom: 10 }}>
          renewable energy on the grid
        </p>
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: statusColor,
          background: `${statusColor}14`,
          border: `0.5px solid ${statusColor}40`,
          borderRadius: 10,
          padding: '3px 8px',
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Current conditions */}
      <p style={{ fontSize: 11, color: '#444441', marginBottom: 8 }}>Current conditions</p>
      {conditions.map((c, i) => (
        <div
          key={i}
          className="flex items-center justify-between"
          style={{
            height: 28,
            borderBottom: i < conditions.length - 1 ? '0.5px solid #1E1E1C' : 'none',
          }}
        >
          <span style={{ fontSize: 12, color: '#666663' }}>{c.label}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: c.color }}>{c.value}</span>
        </div>
      ))}
    </div>
  );
}
