import { getStatusColor, getMoerColor } from '../constants';

export function CityMap({ data, cityName, loading }) {
  const statusColor = getStatusColor(data);
  const moer = data?.moer || 0;

  if (loading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#0C0E14' }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ background: '#0C0E14' }}>
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(34,197,94,0.06) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Concentric circles */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer ring — 80px, pulsing */}
        <div
          className="absolute rounded-full"
          style={{
            width: 80,
            height: 80,
            background: `${statusColor}2E`,
            border: `1.5px solid ${statusColor}66`,
            animation: 'mapPulse 3s ease-in-out infinite',
          }}
        />
        {/* Middle ring — 40px */}
        <div
          className="absolute rounded-full"
          style={{
            width: 40,
            height: 40,
            background: `${statusColor}4D`,
            border: `1.5px solid ${statusColor}`,
          }}
        />
        {/* Core dot — 10px */}
        <div
          className="absolute rounded-full"
          style={{
            width: 10,
            height: 10,
            background: statusColor,
          }}
        />
      </div>

      {/* Tooltip — top right */}
      <div
        className="absolute"
        style={{
          top: 16,
          right: 16,
          background: '#1A1D27',
          border: '0.5px solid #2A2A28',
          borderRadius: 8,
          padding: '10px 14px',
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 500, color: '#D0D0CE' }}>{cityName}</p>
        <p style={{ fontSize: 11, color: '#555553' }}>{data.region || 'Grid region'}</p>
        <p style={{ fontSize: 18, fontWeight: 500, color: getMoerColor(moer), marginTop: 4 }}>
          {Math.round(moer)}
        </p>
        <p style={{ fontSize: 10, color: '#444441' }}>lbs CO₂ per MWh — lower is better</p>
      </div>

      {/* Attribution — bottom center */}
      <p
        className="absolute"
        style={{
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 12,
          color: '#555553',
          whiteSpace: 'nowrap',
        }}
      >
        Map data powered by WattTime · Updated 1 min ago
      </p>
    </div>
  );
}
