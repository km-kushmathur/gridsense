function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" role="img" aria-label="Warning">
      <path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ErrorBanner({ message, onRetry, className = '' }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 ${className}`}
      role="alert"
    >
      <span className="mt-0.5 flex-shrink-0 text-amber-300">
        <WarningIcon />
      </span>
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="min-h-[44px] min-w-[44px] flex-shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20"
        >
          Retry
        </button>
      )}
    </div>
  );
}
