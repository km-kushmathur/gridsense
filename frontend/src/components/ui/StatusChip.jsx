const STATUS_ICONS = {
  clean: '\u2713',      // ✓
  moderate: '\u25C9',   // ◉
  dirty: '\u25B2',      // ▲
};

const STATUS_LABELS = {
  clean: 'Lower emissions',
  moderate: 'Moderate emissions',
  dirty: 'High carbon',
};

export function StatusChip({ status, color, label, className = '' }) {
  const displayLabel = label || STATUS_LABELS[status] || status || 'Unknown';
  const icon = STATUS_ICONS[status] || '\u25CF'; // ● default

  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-semibold ${className}`}
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}12`,
      }}
    >
      <span aria-hidden="true" className="text-base">{icon}</span>
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {displayLabel}
    </span>
  );
}
