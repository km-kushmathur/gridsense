export function DetailDisclosure({
  title,
  summary,
  badge,
  defaultOpen = false,
  children,
  className = '',
}) {
  return (
    <details className={`disclosure-shell group ${className}`.trim()} open={defaultOpen}>
      <summary className="disclosure-summary">
        <div className="flex-1">
          {badge ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{badge}</p>
          ) : null}
          <p className="mt-1 text-[15px] font-semibold text-gray-900">{title}</p>
          {summary ? <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{summary}</p> : null}
        </div>

        <span className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 transition group-hover:border-slate-300 group-hover:bg-slate-100">
          <span>Details</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>

      <div className="disclosure-body">{children}</div>
    </details>
  );
}
