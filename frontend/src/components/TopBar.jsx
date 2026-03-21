import { useNavigate } from 'react-router-dom';

export function TopBar({ cityName }) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center justify-between px-4"
      style={{
        height: 44,
        background: '#13151F',
        borderBottom: '0.5px solid #1E1E1C',
        gridColumn: '1 / -1',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="rounded-full" style={{ width: 8, height: 8, background: '#22C55E' }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: '#D0D0CE' }}>GridSense</span>
      </button>

      {/* Location pill */}
      {cityName && (
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 transition-colors duration-200"
          style={{
            background: '#1A1D27',
            border: '0.5px solid #2A2A28',
            borderRadius: 20,
            padding: '5px 12px',
            fontSize: 12,
            color: '#888780',
            cursor: 'pointer',
          }}
        >
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
            <path d="M5 0C2.24 0 0 2.24 0 5c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#888780" />
          </svg>
          {cityName}
        </button>
      )}

      {/* Live badge */}
      <div className="flex items-center gap-1.5">
        <div
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            background: '#22C55E',
            animation: 'pulse 2s infinite',
          }}
        />
        <span style={{ fontSize: 11, color: '#22C55E' }}>Live — updates every 5 min</span>
      </div>
    </div>
  );
}
