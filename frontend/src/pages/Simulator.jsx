import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulation } from '../hooks/useSimulation';
import { TopBar } from '../components/TopBar';
import { GridStressGauge } from '../components/GridStressGauge';
import { getStressColor } from '../constants';

const SCENARIOS = [
  { key: 'heat_wave', label: 'Heat wave', activeStyle: { border: '0.5px solid #EF4444', color: '#EF4444', background: '#1A0A0A' } },
  { key: 'cold_snap', label: 'Cold snap', activeStyle: { border: '0.5px solid #EAB308', color: '#EAB308', background: '#1A1400' } },
  { key: 'normal', label: 'Normal day', activeStyle: { border: '0.5px solid #3B8BD4', color: '#3B8BD4', background: '#0A1020' } },
];

function formatHour(hour) {
  if (hour === 0) return '12 am';
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return '12 pm';
  return `${hour - 12} pm`;
}

function MiniTimeline({ timeline, currentHour }) {
  return (
    <div className="flex gap-[2px]" style={{ height: 48 }}>
      {timeline.map((point, i) => {
        const stress = point.grid_stress || 0;
        const color = getStressColor(stress);
        const height = Math.max(4, (stress / 100) * 44);
        return (
          <div
            key={i}
            className="flex-1 flex items-end"
            style={{ opacity: i <= currentHour ? 1 : 0.2 }}
          >
            <div
              style={{
                width: '100%',
                height,
                background: color,
                borderRadius: '2px 2px 0 0',
                transition: 'opacity 0.2s',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function Simulator() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const city = decodeURIComponent(cityName);

  const [scenario, setScenario] = useState('heat_wave');
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);

  const { simulation, loading } = useSimulation(city, scenario);

  const timeline = simulation?.timeline || [];
  const shiftedTimeline = simulation?.shifted_timeline || [];
  const failureHour = simulation?.failure_hour ?? null;
  const totalFrames = timeline.length;

  // Reset on scenario/simulation change
  useEffect(() => {
    setFrame(0);
    setPlaying(false);
  }, [simulation, scenario]);

  // Playback timer — 800ms per step, auto-pause at failure
  useEffect(() => {
    if (!playing || totalFrames === 0) return;
    const timer = setInterval(() => {
      setFrame((f) => {
        const next = f + 1;
        if (next >= totalFrames) {
          setPlaying(false);
          return f;
        }
        if (failureHour !== null && next === failureHour) {
          setPlaying(false);
        }
        return next;
      });
    }, 800);
    return () => clearInterval(timer);
  }, [playing, totalFrames, failureHour]);

  const current = timeline[Math.min(frame, Math.max(0, totalFrames - 1))];
  const shifted = shiftedTimeline[Math.min(frame, Math.max(0, totalFrames - 1))];
  const failureActive = failureHour !== null && frame >= failureHour;

  const liveSavings = useMemo(() => {
    if (!simulation?.savings_kg_co2 || totalFrames === 0) return 0;
    return (simulation.savings_kg_co2 / totalFrames) * frame;
  }, [frame, simulation, totalFrames]);

  const liveShifted = useMemo(() => {
    if (!shiftedTimeline.length || !timeline.length) return 0;
    let total = 0;
    for (let i = 0; i <= Math.min(frame, timeline.length - 1); i++) {
      const base = timeline[i]?.demand_index || 0;
      const opt = shiftedTimeline[i]?.demand_index || 0;
      total += Math.max(0, base - opt) * 10;
    }
    return total;
  }, [frame, timeline, shiftedTimeline]);

  return (
    <div style={{ background: '#0F1117', minHeight: '100vh' }}>
      <TopBar cityName={city} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        {/* Title */}
        <div className="mb-4">
          <button
            onClick={() => navigate(`/city/${encodeURIComponent(city)}`)}
            style={{ background: 'none', border: 'none', color: '#555553', fontSize: 12, cursor: 'pointer', marginBottom: 8, display: 'block' }}
          >
            ← Back to dashboard
          </button>
          <h1 style={{ fontSize: 14, fontWeight: 500, color: '#D0D0CE' }}>Grid failure simulator</h1>
          <p style={{ fontSize: 12, color: '#555553', marginTop: 4 }}>
            See what happens to the grid under different weather scenarios
          </p>
        </div>

        {/* Scenario selector */}
        <div className="flex gap-2 mb-4">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => setScenario(s.key)}
              style={scenario === s.key ? {
                ...s.activeStyle,
                borderRadius: 7,
                padding: 7,
                fontSize: 12,
                cursor: 'pointer',
              } : {
                background: '#1A1D27',
                border: '0.5px solid #2A2A28',
                borderRadius: 7,
                padding: 7,
                fontSize: 12,
                color: '#666663',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1A1D27',
              border: '0.5px solid #2A2A28',
              cursor: 'pointer',
            }}
          >
            {playing ? (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="#D0D0CE">
                <rect x="1" y="1" width="3" height="10" rx="0.5" />
                <rect x="6" y="1" width="3" height="10" rx="0.5" />
              </svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="#D0D0CE">
                <polygon points="1,1 9,6 1,11" />
              </svg>
            )}
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#D0D0CE', minWidth: 60 }}>
            {current ? formatHour(new Date(current.time).getHours()) : '12 am'}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalFrames - 1)}
            value={frame}
            onChange={(e) => {
              setFrame(parseInt(e.target.value));
              setPlaying(false);
            }}
            className="flex-1"
            style={{ accentColor: '#22C55E' }}
          />
          <button
            onClick={() => { setPlaying(false); setFrame(0); }}
            style={{ background: 'none', border: 'none', fontSize: 12, color: '#555553', cursor: 'pointer' }}
          >
            Reset
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="skeleton" style={{ height: 320, borderRadius: 10 }} />
        )}

        {/* Two-column comparison */}
        {!loading && simulation && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* Without GridSense */}
              <div
                style={{
                  background: '#13151F',
                  borderRadius: 10,
                  border: '0.5px solid #1E1E1C',
                  padding: 14,
                  position: 'relative',
                }}
              >
                <p style={{ fontSize: 11, color: '#555553', marginBottom: 12 }}>
                  <span style={{ fontWeight: 500 }}>Without GridSense</span> — no load shifting
                </p>
                <GridStressGauge value={current?.grid_stress || 0} />
                <div className="mt-3 text-center">
                  <p style={{ fontSize: 22, fontWeight: 500, color: getStressColor(current?.grid_stress || 0) }}>
                    {Math.round(current?.grid_stress || 0)}%
                  </p>
                  <p style={{ fontSize: 11, color: '#555553' }}>Grid stress</p>
                  <div className="mt-2">
                    {failureActive ? (
                      <span style={{
                        fontSize: 11, color: '#EF4444',
                        background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.25)',
                        borderRadius: 10, padding: '3px 8px',
                      }}>
                        Grid failure
                      </span>
                    ) : frame > 0 ? (
                      <span style={{
                        fontSize: 11, color: '#EF4444',
                        background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.25)',
                        borderRadius: 10, padding: '3px 8px',
                      }}>
                        Simulating...
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3">
                  <MiniTimeline timeline={timeline} currentHour={frame} />
                </div>

                {/* Failure overlay */}
                {failureActive && (
                  <div
                    style={{
                      marginTop: 10,
                      background: '#1A0000',
                      border: '0.5px solid rgba(239,68,68,0.38)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      animation: 'fadeIn 0.5s ease-in forwards',
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#EF4444' }}>
                      Grid failure — rolling blackouts
                    </p>
                    <p style={{ fontSize: 11, color: '#793333', marginTop: 4 }}>
                      Grid stress exceeded 85% — demand outpaced supply
                    </p>
                  </div>
                )}
              </div>

              {/* With GridSense */}
              <div
                style={{
                  background: '#13151F',
                  borderRadius: 10,
                  border: '0.5px solid rgba(34,197,94,0.15)',
                  padding: 14,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 11, color: '#555553' }}>
                    <span style={{ fontWeight: 500 }}>With GridSense</span> — load shifted to clean windows
                  </p>
                </div>
                <GridStressGauge value={shifted?.grid_stress || 0} />
                <div className="mt-3 text-center">
                  <p style={{ fontSize: 22, fontWeight: 500, color: getStressColor(shifted?.grid_stress || 0) }}>
                    {Math.round(shifted?.grid_stress || 0)}%
                  </p>
                  <p style={{ fontSize: 11, color: '#555553' }}>Grid stress</p>
                  <div className="mt-2">
                    <span style={{
                      fontSize: 11, color: '#22C55E',
                      background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.25)',
                      borderRadius: 10, padding: '3px 8px',
                    }}>
                      Stable
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <MiniTimeline timeline={shiftedTimeline} currentHour={frame} />
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ background: '#13151F', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 500, color: '#D0D0CE' }}>
                  {current ? formatHour(new Date(current.time).getHours()) : '—'}
                </p>
                <p style={{ fontSize: 11, color: '#444441' }}>Current hour</p>
              </div>
              <div style={{ background: '#13151F', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 500, color: '#22C55E' }}>
                  {liveSavings.toFixed(1)} kg
                </p>
                <p style={{ fontSize: 11, color: '#444441' }}>CO₂ saved so far</p>
              </div>
              <div style={{ background: '#13151F', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 500, color: '#22C55E' }}>
                  {Math.round(liveShifted)} kWh
                </p>
                <p style={{ fontSize: 11, color: '#444441' }}>Load shifted</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
