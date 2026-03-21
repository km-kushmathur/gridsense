import { getMoerColor } from '../constants';

function formatHourLabel(hour) {
  if (hour === 0) return '12a';
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return '12p';
  return `${hour - 12}p`;
}

export function ForecastChart({ forecast, loading }) {
  if (loading) {
    return (
      <div style={{ padding: '14px 16px' }}>
        <div className="skeleton" style={{ width: '100%', height: 12, marginBottom: 12 }} />
        <div className="flex gap-[3px]" style={{ height: 72 }}>
          {[...Array(24)].map((_, i) => (
            <div key={i} className="flex-1 skeleton" style={{ height: 20 + Math.random() * 48, alignSelf: 'flex-end', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!forecast?.length) {
    return (
      <div style={{ padding: '14px 16px', fontSize: 11, color: '#555553' }}>
        No forecast data yet
      </div>
    );
  }

  // Process to hourly, first 24 hours
  const now = new Date();
  const currentHour = now.getHours();

  const hourly = [];
  const seenHours = new Set();
  for (const point of forecast.slice(0, 48)) {
    const date = new Date(point.time);
    const hour = date.getHours();
    const key = `${date.toDateString()}-${hour}`;
    if (!seenHours.has(key)) {
      seenHours.add(key);
      hourly.push({ ...point, hour });
    }
    if (hourly.length >= 24) break;
  }

  // Find max MOER for scaling bar heights by pct_renewable if available, else by inverse MOER
  const maxMoer = Math.max(...hourly.map((p) => p.moer || 0), 1);

  return (
    <div style={{ padding: '14px 16px' }}>
      {/* Title */}
      <p style={{ fontSize: 11, color: '#555553', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
        24-hour forecast — cleaner times to run appliances
      </p>

      {/* Bar chart */}
      <div className="flex items-end gap-[3px]" style={{ height: 72 }}>
        {hourly.map((point, i) => {
          const moer = point.moer || 0;
          const color = getMoerColor(moer);
          // Height proportional to cleanness (inverse of moer)
          const cleanRatio = 1 - (moer / (maxMoer * 1.2));
          const barHeight = Math.max(4, cleanRatio * 68);
          const isCurrent = point.hour === currentHour;

          return (
            <div key={i} className="flex-1 relative" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <div
                style={{
                  width: '100%',
                  height: barHeight,
                  background: color,
                  borderRadius: '2px 2px 0 0',
                  outline: isCurrent ? '1.5px solid #FFFFFF' : 'none',
                  outlineOffset: isCurrent ? 1 : 0,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Hour labels — every other bar */}
      <div className="flex gap-[3px]" style={{ marginTop: 4 }}>
        {hourly.map((point, i) => (
          <div key={i} className="flex-1 text-center" style={{ fontSize: 9, color: '#444441' }}>
            {i % 2 === 0 ? formatHourLabel(point.hour) : ''}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2">
        {[
          { color: '#22C55E', label: 'Clean' },
          { color: '#EAB308', label: 'Moderate' },
          { color: '#EF4444', label: 'Dirty — avoid' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div style={{ width: 8, height: 8, borderRadius: 1, background: item.color }} />
            <span style={{ fontSize: 10, color: '#444441' }}>{item.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <div style={{ width: 8, height: 8, borderRadius: 1, border: '1.5px solid #FFFFFF', background: 'transparent' }} />
          <span style={{ fontSize: 10, color: '#444441' }}>Now</span>
        </div>
      </div>
    </div>
  );
}
