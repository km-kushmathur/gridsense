import { getStressColor } from '../constants';

export function GridStressGaugeSkeleton() {
  return (
    <div className="flex flex-col items-center" aria-label="Loading grid load pressure">
      <svg viewBox="0 0 140 92" className="h-[92px] w-[150px]">
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="10"
          strokeLinecap="round"
          style={{ opacity: 0.5 }}
        />
        <circle cx="70" cy="75" r="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
      </svg>
      <div className="mt-1 flex w-full max-w-[150px] items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span>Safe</span>
        <span>Critical</span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">Grid Load Pressure</p>
    </div>
  );
}

export function GridStressGauge({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = getStressColor(clamped);
  const critical = clamped > 85;

  const radius = 55;
  const cx = 70;
  const cy = 75;

  const sweepAngle = (clamped / 100) * Math.PI;
  const fullArcLength = Math.PI * radius;
  const activeLength = (clamped / 100) * fullArcLength;

  const needleAngle = Math.PI - sweepAngle;
  const needleX = cx + radius * Math.cos(needleAngle);
  const needleY = cy - radius * Math.sin(needleAngle);

  const stressLabel = clamped <= 60 ? 'low' : clamped <= 85 ? 'moderate' : 'critical';

  return (
    <div className="flex flex-col items-center">
      <div aria-live="polite" className="sr-only">
        Grid Load Pressure: {Math.round(clamped)}%, {stressLabel}
      </div>
      <svg viewBox="0 0 140 92" className="h-[92px] w-[150px]" role="img" aria-label={`Grid Load Pressure gauge showing ${Math.round(clamped)}% — ${stressLabel}`}>
        {/* Background arc */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Green zone overlay (0%-50%) */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke="rgba(34,197,94,0.25)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${fullArcLength * 0.5} ${fullArcLength * 0.5}`}
        />

        {/* Red zone overlay (50%-100%) */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke="rgba(239,68,68,0.25)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${fullArcLength * 0.5} ${fullArcLength * 0.5}`}
          strokeDashoffset={`-${fullArcLength * 0.5}`}
        />

        {/* Active arc */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${activeLength} ${fullArcLength - activeLength}`}
          style={critical ? { filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.45))' } : undefined}
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'all 0.4s ease-out' }}
        />

        {/* Center pivot */}
        <circle cx={cx} cy={cy} r="4" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />

        <text x="70" y="60" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: color }}>
          {Math.round(clamped)}%
        </text>

        {critical && (
          <text x="70" y="14" textAnchor="middle" style={{ fontSize: 9, fill: '#EF4444', letterSpacing: 1.4 }}>
            CRITICAL
          </text>
        )}
      </svg>
      <div className="mt-1 flex w-full max-w-[150px] items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em]">
        <span className="rounded-full border border-grid-clean/25 bg-grid-clean/10 px-2 py-1 text-grid-clean">
          Safe
        </span>
        <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-red-500">
          Critical
        </span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">Grid Load Pressure</p>
    </div>
  );
}
