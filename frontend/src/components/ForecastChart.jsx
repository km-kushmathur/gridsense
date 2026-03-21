import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-sm shadow-2xl">
      <p className="font-semibold text-white">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 text-slate-300">
          <span className="font-medium" style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
        </p>
      ))}
    </div>
  );
}

export function ForecastChart({ baseline, optimized, weather, loading }) {
  if (loading || !baseline || !optimized || !weather?.length) {
    return <div className="min-h-[380px] rounded-[28px] border border-grid-border bg-white/5 skeleton" />;
  }

  const chartData = baseline.forecast.map((point, index) => ({
    label: point.local_label,
    baselineStress: point.stress_score,
    optimizedStress: optimized.forecast[index]?.stress_score || point.stress_score,
    failureRisk: point.failure_risk_pct,
    temp: Math.round(weather[index]?.temperature_f || 0),
  }));

  return (
    <div className="overflow-hidden rounded-[28px] border border-grid-border bg-grid-panel shadow-grid-panel">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-grid-amber">Risk Timeline</p>
        <h2 className="mt-2 font-display text-3xl text-white">Baseline vs optimized operating posture</h2>
        <p className="mt-1 text-sm text-slate-300">
          Stress rises when weather pushes demand up or reduces local generation. The optimized line shows how load controls change the same window.
        </p>
      </div>

      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="baselineFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="optimizedFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#3ef2c8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#3ef2c8" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e2e8f0', fontSize: '12px' }} />
            <Area type="monotone" dataKey="baselineStress" name="Baseline stress" stroke="#f97316" fill="url(#baselineFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="optimizedStress" name="Optimized stress" stroke="#3ef2c8" fill="url(#optimizedFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="failureRisk" name="Failure risk %" stroke="#f43f5e" fill="transparent" strokeDasharray="6 4" strokeWidth={1.6} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Baseline Summary</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{baseline.summary}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Peak Window</p>
            <p className="mt-2 text-2xl font-semibold text-white">{baseline.peak_window}</p>
            <p className="mt-1 text-sm text-slate-300">{baseline.failure_risk_hours} hours at failure-risk in baseline mode.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Optimization Outcome</p>
            <p className="mt-2 text-2xl font-semibold text-grid-mint">{Math.round(optimized.avoided_peak_kw)} kW</p>
            <p className="mt-1 text-sm text-slate-300">
              Peak shed, {Math.round(optimized.load_shifted_kwh)} kWh shifted, {optimized.avoided_emissions_kg} kg avoided emissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
