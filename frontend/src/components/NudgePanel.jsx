function OutcomeCard({ label, value, tone, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-300">{hint}</p>
    </div>
  );
}

export function NudgePanel({ site, environment, actions, baseline, optimized, loading, activeZone }) {
  if (loading || !site || !environment || !baseline || !optimized) {
    return <div className="min-h-[700px] rounded-[28px] border border-grid-border bg-white/5 skeleton" />;
  }

  const avoidedFailureHours = Math.max(0, baseline.failure_risk_hours - optimized.failure_risk_hours);

  return (
    <div className="overflow-hidden rounded-[28px] border border-grid-border bg-grid-panel shadow-grid-panel">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-grid-mint">Action Console</p>
        <h2 className="mt-2 font-display text-3xl text-white">Recommended interventions</h2>
        <p className="mt-1 text-sm text-slate-300">
          These actions are ranked for the selected weather pattern and update the optimized scenario automatically.
        </p>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <OutcomeCard
            label="Failure-Risk Hours Avoided"
            value={`${avoidedFailureHours}`}
            tone="text-grid-mint"
            hint="Hours moved out of the highest-risk operating band."
          />
          <OutcomeCard
            label="Critical Hours Remaining"
            value={`${optimized.critical_hours}`}
            tone="text-grid-amber"
            hint="Residual windows that still need operator attention."
          />
          <OutcomeCard
            label="Weather Severity"
            value={`${Math.round((baseline.forecast[0]?.failure_risk_pct || 0))}%`}
            tone="text-sky-300"
            hint="Current failure exposure at the opening hour of the scenario."
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Environmental Notes</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {environment.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Focused Zone</p>
          <p className="mt-2 text-lg font-semibold text-white">{activeZone?.name || site.zones[0]?.name}</p>
          <p className="mt-1 text-sm text-slate-300">
            {activeZone
              ? `${activeZone.kind} zone with ${activeZone.capacity_kw} kW modeled capacity.`
              : 'Select a zone on the map to localize the story.'}
          </p>
        </div>

        <div className="space-y-3">
          {actions.map((action) => (
            <div key={action.id} className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/6 to-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-grid-mint">{action.category}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{action.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{action.target}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Impact</p>
                  <p className="mt-1 text-xl font-semibold text-white">{Math.round(action.impact_kw)} kW</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {action.recommended_window}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Impact score {Math.round(action.impact_score)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{action.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
