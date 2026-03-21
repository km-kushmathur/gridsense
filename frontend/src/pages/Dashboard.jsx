import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWeather } from '../api/gridsense';
import { useGridData } from '../hooks/useGridData';
import { useForecast } from '../hooks/useForecast';
import { CITY_COORDS } from '../constants';
import { TopBar } from '../components/TopBar';
import { IntensityBadge } from '../components/IntensityBadge';
import { CityMap } from '../components/CityMap';
import { ForecastChart } from '../components/ForecastChart';
import { NudgePanel } from '../components/NudgePanel';

export default function Dashboard() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const city = decodeURIComponent(cityName);

  const { data: gridData, loading: gridLoading, error: gridError } = useGridData(city);
  const { forecast, loading: forecastLoading, error: forecastError } = useForecast(city);
  const [weather, setWeather] = useState(null);

  const coords = CITY_COORDS[city.toLowerCase()] || null;
  const dashboardError = gridError || forecastError;

  useEffect(() => {
    let active = true;
    fetchWeather(city).then((r) => { if (active) setWeather(r); }).catch(() => {});
    return () => { active = false; };
  }, [city]);

  return (
    <div
      className="min-h-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 300px',
        gridTemplateRows: '44px 1fr',
        height: '100vh',
        background: '#0F1117',
      }}
    >
      {/* Top Bar */}
      <TopBar cityName={city} />

      {/* Left Sidebar */}
      <aside
        style={{
          background: '#13151F',
          borderRight: '0.5px solid #1E1E1C',
          overflowY: 'auto',
          padding: 0,
        }}
      >
        <IntensityBadge data={gridData} loading={gridLoading} weather={weather} forecast={forecast} />

        {/* Failure simulation button */}
        <div style={{ padding: '0 14px 14px' }}>
          <button
            onClick={() => navigate(`/city/${encodeURIComponent(city)}/simulate`)}
            className="w-full flex items-center gap-2 transition-colors duration-200"
            style={{
              background: '#1A1D27',
              border: '0.5px solid #2A2A28',
              borderRadius: 8,
              padding: 10,
              fontSize: 12,
              color: '#888780',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A28'; e.currentTarget.style.color = '#888780'; }}
          >
            <div className="rounded-full" style={{ width: 8, height: 8, background: '#EF4444' }} />
            Run failure simulation
          </button>
        </div>
      </aside>

      {/* Center Map */}
      <section style={{ background: '#0C0E14', position: 'relative', overflow: 'hidden' }}>
        <CityMap data={gridData} cityName={city} loading={gridLoading} />
      </section>

      {/* Right Panel */}
      <aside
        style={{
          background: '#13151F',
          borderLeft: '0.5px solid #1E1E1C',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Forecast */}
        <div style={{ borderBottom: '0.5px solid #1E1E1C' }}>
          <ForecastChart forecast={forecast} loading={forecastLoading} />
        </div>

        {/* Nudges */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <NudgePanel city={city} />
        </div>
      </aside>

      {/* Error banner */}
      {dashboardError && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1A1D27',
            border: '0.5px solid #2A2A28',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 11,
            color: '#555553',
            zIndex: 50,
          }}
        >
          Using cached data
        </div>
      )}
    </div>
  );
}
