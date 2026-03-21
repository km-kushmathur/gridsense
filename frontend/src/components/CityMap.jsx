import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import { useEffect } from 'react';

const STATUS_COLORS = {
  clean: '#22c55e',
  moderate: '#eab308',
  dirty: '#ef4444',
};

const DEFAULT_CENTER = [38.58, -121.49]; // Sacramento
const DEFAULT_ZOOM = 11;

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, DEFAULT_ZOOM, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export function CityMap({ data, coords }) {
  const center = coords || DEFAULT_CENTER;
  const color = STATUS_COLORS[data?.status] || '#6b7280';
  const statusEmoji = { clean: '🟢', moderate: '🟡', dirty: '🔴' }[data?.status] || '⚪';

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-grid-border">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        style={{ height: '100%', minHeight: '400px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={center} />

        {data && (
          <>
            {/* Outer pulse ring */}
            <Circle
              center={center}
              radius={8000}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.12,
                weight: 1,
                opacity: 0.3,
              }}
              className="map-pulse"
            />
            {/* Inner solid circle */}
            <Circle
              center={center}
              radius={4000}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.25,
                weight: 2,
                opacity: 0.6,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating info card */}
      {data && (
        <div className="absolute top-4 right-4 z-[1000] bg-grid-surface/90 backdrop-blur-md border border-grid-border rounded-xl p-4 min-w-[180px] shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{statusEmoji}</span>
            <span className="text-lg font-bold capitalize" style={{ color }}>
              {data.status}
            </span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">MOER</span>
              <span className="font-mono font-semibold">{Math.round(data.moer)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Renewable</span>
              <span className="font-semibold" style={{ color }}>
                {Math.round(data.pct_renewable * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Region</span>
              <span className="font-mono text-xs text-gray-300">{data.region}</span>
            </div>
          </div>
        </div>
      )}

      {/* City label */}
      {data?.city && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-grid-surface/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium border border-grid-border">
          📍 {data.city}
        </div>
      )}
    </div>
  );
}
