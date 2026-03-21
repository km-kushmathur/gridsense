function MetricCard({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export function IntensityBadge({ site, baseline, optimized, loading }) {
  if (loading || !site || !baseline || !optimized) {
    return <div className="min-h-[152px] rounded-2xl border border-grid-border bg-white/5 p-4 skeleton" />;
  }

  const avoidedCritical = Math.max(0, baseline.critical_hours - optimized.critical_hours);
  const peakDrop = Math.max(0, baseline.stress_peak - optimized.stress_peak).toFixed(1);

  return (
    <div className="grid gap-3 rounded-2xl border border-grid-border bg-white/5 p-4 md:grid-cols-3">
      <MetricCard label="Peak Stress" value={`${optimized.stress_peak}`} tone="text-grid-amber" />
      <MetricCard label="Critical Hours Avoided" value={`${avoidedCritical}`} tone="text-grid-mint" />
      <MetricCard label="Peak Drop" value={`${peakDrop}`} tone="text-sky-300" />
      <div className="md:col-span-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Site Summary</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{site.summary}</p>
      </div>
    </div>
  );
}
