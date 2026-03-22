export function DetailDisclosure({
  title,
  summary,
  badge,
  defaultOpen = false,
  children,
  className = '',
}) {
  return (
    <details className={`disclosure-shell ${className}`.trim()} open={defaultOpen}>
      <summary className="disclosure-summary">
        <div>
          {badge ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{badge}</p>
          ) : null}
          <p className="mt-1 text-sm font-semibold text-white">{title}</p>
          {summary ? <p className="mt-1 text-xs text-slate-400">{summary}</p> : null}
        </div>

        <span className="text-xs font-medium text-slate-400">View details</span>
      </summary>

      <div className="disclosure-body">{children}</div>
    </details>
  );
}
