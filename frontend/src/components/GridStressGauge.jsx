export function GridStressGauge({ value = 0, label = 'Grid Stress' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const angle = -90 + (clamped / 100) * 180;
  const needleX = 100 + Math.cos((angle * Math.PI) / 180) * 68;
  const needleY = 100 + Math.sin((angle * Math.PI) / 180) * 68;
  const critical = clamped > 85;

  return (
    <div className="rounded-xl border border-grid-border bg-grid-surface p-4">
      <svg viewBox="0 0 200 130" className="w-full">
        <path d="M20 100 A80 80 0 0 1 80 20" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" />
        <path d="M80 20 A80 80 0 0 1 140 20" fill="none" stroke="#eab308" strokeWidth="12" strokeLinecap="round" />
        <path d="M140 20 A80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" />
        {critical && <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(239,68,68,0.35)" strokeWidth="4" className="animate-pulse" />}
        <line x1="100" y1="100" x2={needleX} y2={needleY} stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="100" r="8" fill="#f8fafc" />
        <text x="100" y="82" textAnchor="middle" className="fill-white text-[24px] font-bold">
          {Math.round(clamped)}%
        </text>
        <text x="100" y="104" textAnchor="middle" className="fill-gray-400 text-[10px] uppercase tracking-[0.25em]">
          {label}
        </text>
        {critical && (
          <text x="100" y="120" textAnchor="middle" className="fill-red-400 text-[11px] font-bold uppercase animate-pulse">
            Critical
          </text>
        )}
      </svg>
    </div>
  );
}
