import { getStressColor } from '../constants';

export function GridStressGauge({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = getStressColor(clamped);
  const critical = clamped > 85;

  // Arc math: semicircle from left to right
  // Path: M 15 75 A 55 55 0 0 1 125 75
  // Center: (70, 75), radius: 55
  // Angle range: 180 degrees (pi), from left (180°) to right (0°)
  const radius = 55;
  const cx = 70;
  const cy = 75;

  // Active arc: sweep proportional to clamped value
  const sweepAngle = (clamped / 100) * Math.PI;
  const endX = cx - radius * Math.cos(sweepAngle);
  const endY = cy - radius * Math.sin(sweepAngle);

  // Full arc length for stroke-dasharray
  const fullArcLength = Math.PI * radius;
  const activeLength = (clamped / 100) * fullArcLength;

  // Needle endpoint
  const needleAngle = Math.PI - sweepAngle;
  const needleX = cx + radius * Math.cos(needleAngle);
  const needleY = cy - radius * Math.sin(needleAngle);

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 140 80" style={{ width: 140, height: 80 }}>
        {/* Background arc */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke="#1E1E1C"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Green zone overlay (0%-50%) */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke="rgba(34,197,94,0.3)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${fullArcLength * 0.5} ${fullArcLength * 0.5}`}
        />

        {/* Red zone overlay (50%-100%) */}
        <path
          d="M 15 75 A 55 55 0 0 1 125 75"
          fill="none"
          stroke="rgba(239,68,68,0.3)"
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
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#D0D0CE"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: 'all 0.4s ease-out' }}
        />

        {/* Center pivot */}
        <circle cx={cx} cy={cy} r="4" fill="#1A1D27" stroke="#D0D0CE" strokeWidth="1.5" />

        {/* Scale labels */}
        <text x="10" y="80" style={{ fontSize: 9, fill: '#444441' }}>0%</text>
        <text x="118" y="80" style={{ fontSize: 9, fill: '#444441' }}>100%</text>

        {/* CRITICAL text */}
        {critical && (
          <text x="70" y="14" textAnchor="middle" style={{ fontSize: 9, fill: '#EF4444' }}>
            CRITICAL
          </text>
        )}
      </svg>
    </div>
  );
}
