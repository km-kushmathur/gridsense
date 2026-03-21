import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EXAMPLE_CITIES = [
  'University of Virginia',
  'Charlottesville, VA',
  'Austin, TX',
  'Chicago, IL',
];

export default function Onboarding() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  function go(city) {
    const name = city.replace(/,\s*\w{2}$/, '').trim();
    navigate(`/city/${encodeURIComponent(name)}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (search.trim()) go(search.trim());
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0F1117' }}>
      <div className="w-full" style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-7">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#22C55E' }} />
          <span style={{ fontSize: 22, fontWeight: 500, color: '#D0D0CE' }}>GridSense</span>
        </div>

        {/* Tagline */}
        <p className="text-center mx-auto mb-7" style={{ fontSize: 14, color: '#888780', maxWidth: 320, lineHeight: 1.6 }}>
          See how clean your local power grid is right now — and get smart nudges for when to run your appliances.
        </p>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="relative mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter your city or campus..."
            className="w-full outline-none"
            style={{
              height: 50,
              background: '#1A1D27',
              border: '0.5px solid #3A3A38',
              borderRadius: 10,
              padding: '14px 48px 14px 16px',
              fontSize: 15,
              color: '#F0F0EF',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#22C55E'; }}
            onBlur={(e) => { e.target.style.borderColor = '#3A3A38'; }}
          />
          <button
            type="submit"
            className="absolute right-[10px] top-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              width: 30,
              height: 30,
              background: '#22C55E',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h11M8 3l4 4-4 4" stroke="#0F1117" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

        {/* City pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-7">
          {EXAMPLE_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => {
                setSearch(city);
                go(city);
              }}
              className="transition-colors duration-200"
              style={{
                background: '#1A1D27',
                border: '0.5px solid #2A2A28',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: 12,
                color: '#888780',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = '#22C55E'; e.target.style.color = '#22C55E'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = '#2A2A28'; e.target.style.color = '#888780'; }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Feature hints */}
        <div className="flex justify-center gap-5 mb-8">
          {[
            { icon: (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1C5.5 4 4 6.5 4 9a4 4 0 108 0c0-2.5-1.5-5-4-8z" stroke="#555553" strokeWidth="1.2" fill="none" />
              </svg>
            ), label: 'Live grid carbon data' },
            { icon: (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M9 1L5 9h4l-2 6 6-8H9l2-6z" stroke="#555553" strokeWidth="1.2" fill="none" />
              </svg>
            ), label: 'Demand spike predictions' },
            { icon: (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v2M8 13v2M3 4l1.5 1.5M11.5 10.5L13 12M1 8h2M13 8h2M3 12l1.5-1.5M11.5 5.5L13 4" stroke="#555553" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="8" cy="8" r="2.5" stroke="#555553" strokeWidth="1.2" fill="none" />
              </svg>
            ), label: 'Appliance nudges' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center" style={{
                width: 36, height: 36, borderRadius: 8,
                background: '#1A1D27', border: '0.5px solid #2A2A28',
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 11, color: '#555553', textAlign: 'center' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-center" style={{ fontSize: 12, color: '#444441' }}>
          No account needed — just enter your location
        </p>
      </div>
    </div>
  );
}
