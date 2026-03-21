import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

function getBarColor(moer) {
  if (moer < 400) return '#22c55e';
  if (moer < 700) return '#eab308';
  return '#ef4444';
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-grid-surface border border-grid-border rounded-lg px-3 py-2 shadow-xl text-sm">
      <p className="font-medium text-white">{d.label}</p>
      <p className="text-gray-400">
        MOER: <span className="font-mono font-semibold text-white">{Math.round(d.moer)}</span> lbs/MWh
      </p>
      <p className="text-gray-400">
        Renewable: <span className="font-semibold" style={{ color: getBarColor(d.moer) }}>
          {Math.round(d.pct_renewable * 100)}%
        </span>
      </p>
    </div>
  );
}

export function ForecastChart({ forecast, loading }) {
  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton w-full h-[200px]" />
      </div>
    );
  }

  if (!forecast?.length) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm">
        No forecast data yet
      </div>
    );
  }

  // Process data: group by hour and label nicely
  const now = new Date();
  const currentHour = now.getHours();

  const chartData = forecast.slice(0, 48).map((point, i) => {
    const date = new Date(point.time);
    const hour = date.getHours();
    const isPast = date < now;
    return {
      ...point,
      hour,
      label: `${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`,
      isCurrent: hour === currentHour && !isPast,
      index: i,
    };
  });

  // De-duplicate to hourly (take first per hour)
  const hourly = [];
  const seenHours = new Set();
  for (const d of chartData) {
    const key = `${new Date(d.time).toDateString()}-${d.hour}`;
    if (!seenHours.has(key)) {
      seenHours.add(key);
      hourly.push(d);
    }
  }

  const currentIndex = hourly.findIndex((d) => d.isCurrent);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          24h Forecast
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-grid-clean" /> Clean</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-grid-moderate" /> Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-grid-dirty" /> Dirty</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={hourly.slice(0, 24)} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            interval={2}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          {currentIndex >= 0 && (
            <ReferenceLine
              x={hourly[currentIndex]?.label}
              stroke="#818cf8"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{ value: 'NOW', position: 'top', fill: '#818cf8', fontSize: 10 }}
            />
          )}
          <Bar dataKey="moer" radius={[3, 3, 0, 0]} maxBarSize={16}>
            {hourly.slice(0, 24).map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.moer)} fillOpacity={entry.isCurrent ? 1 : 0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
