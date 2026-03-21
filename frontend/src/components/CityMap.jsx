const ZONE_TONES = {
  residential: 'from-orange-500/50 to-orange-300/20',
  academic: 'from-sky-500/50 to-sky-300/20',
  mobility: 'from-fuchsia-500/50 to-fuchsia-300/20',
  energy: 'from-emerald-500/50 to-emerald-300/20',
  critical: 'from-rose-500/50 to-rose-300/20',
};

function riskColor(level) {
  if (level === 'failure-risk') return 'border-rose-300 bg-rose-400/20';
  if (level === 'critical') return 'border-orange-300 bg-orange-400/20';
  if (level === 'strained') return 'border-amber-300 bg-amber-300/20';
  return 'border-emerald-300 bg-emerald-300/15';
}

export function CityMap({ site, baseline, optimized, loading, activeZoneId, onSelectZone }) {
  if (loading || !site || !baseline || !optimized) {
    return <div className="min-h-[440px] rounded-[28px] border border-grid-border bg-white/5 skeleton" />;
  }

  const stressedPoint = baseline.forecast.reduce((best, point) => (point.stress_score > best.stress_score ? point : best), baseline.forecast[0]);
  const currentOptimized = optimized.forecast.find((point) => point.local_label === stressedPoint.local_label) || optimized.forecast[0];

  return (
    <div className="overflow-hidden rounded-[28px] border border-grid-border bg-grid-panel shadow-grid-panel">
      <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-grid-mint">Interactive Site View</p>
          <h2 className="mt-2 font-display text-3xl text-white">{site.name}</h2>
          <p className="mt-1 text-sm text-slate-300">{site.city}</p>
        </div>
        <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            Peak window <span className="ml-2 font-semibold text-white">{baseline.peak_window}</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            Failure-risk hours <span className="ml-2 font-semibold text-white">{baseline.failure_risk_hours}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="relative min-h-[360px] rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(62,242,200,0.18),_transparent_32%),linear-gradient(180deg,_rgba(20,28,45,0.95),_rgba(9,12,19,1))]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:54px_54px]" />
          {site.zones.map((zone) => {
            const selected = zone.id === activeZoneId;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelectZone(zone.id)}
                className={`absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-3xl border px-4 py-4 text-left transition duration-200 hover:scale-[1.02] ${selected ? 'border-white shadow-[0_0_0_1px_rgba(255,255,255,0.28)]' : 'border-white/10'} bg-gradient-to-br ${ZONE_TONES[zone.kind]}`}
                style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">{zone.kind}</p>
                <p className="mt-2 text-sm font-semibold text-white">{zone.name}</p>
                <p className="mt-1 text-xs text-white/70">{zone.capacity_kw} kW capacity</p>
              </button>
            );
          })}

          {site.assets.map((asset) => {
            const zone = site.zones.find((item) => item.id === asset.zone_id);
            if (!zone) return null;
            return (
              <div
                key={asset.id}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white shadow-[0_0_16px_rgba(255,255,255,0.5)]"
                style={{ left: `${zone.x + 7}%`, top: `${zone.y - 6}%` }}
                title={asset.name}
              />
            );
          })}
        </div>

        <div className="space-y-3">
          <div className={`rounded-3xl border px-4 py-4 ${riskColor(stressedPoint.risk_level)}`}>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Baseline Alert</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stressedPoint.risk_level}</p>
            <p className="mt-1 text-sm text-white/80">
              Stress score {stressedPoint.stress_score} at {stressedPoint.local_label}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-grid-mint">Optimized Window</p>
            <p className="mt-2 text-2xl font-semibold text-white">{currentOptimized.risk_level}</p>
            <p className="mt-1 text-sm text-slate-300">
              Stress score drops to {currentOptimized.stress_score} with active load shifting.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Site Risks</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {site.weather_risks.map((risk) => (
                <span key={risk} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {risk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
