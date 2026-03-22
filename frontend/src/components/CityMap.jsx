import { useEffect, useMemo, useState } from 'react';
import { getCleanPowerScore, getMoerColor, getStatusColor, getStatusLabel } from '../constants';
import { SkeletonCard } from './SkeletonCard';
import { DetailDisclosure } from './ui/DetailDisclosure';

export function CityMap({ data, cityName, loading }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const mapUrl = useMemo(() => {
    const query = encodeURIComponent(cityName || 'United States');
    return `/api/map/static?city=${query}`;
  }, [cityName]);

  const mapLink = useMemo(() => {
    const query = encodeURIComponent(cityName || 'United States');
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }, [cityName]);

  const osmEmbedUrl = useMemo(() => {
    const lat = Number(data?.latitude);
    const lng = Number(data?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return '';
    }
    const latDelta = 0.12;
    const lngDelta = 0.18;
    const bbox = [
      lng - lngDelta,
      lat - latDelta,
      lng + lngDelta,
      lat + latDelta,
    ].join(',');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
  }, [data?.latitude, data?.longitude]);

  useEffect(() => {
    setMapLoaded(false);
    setMapFailed(false);
  }, [mapUrl]);

  if (loading || !data) {
    return (
      <div className="card-glass flex min-h-[360px] items-center justify-center p-6">
        <div className="grid w-full gap-4">
          <SkeletonCard className="h-5 w-40" />
          <SkeletonCard className="h-[250px] w-full rounded-[28px]" />
          <SkeletonCard className="h-5 w-72" />
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(data);
  const statusLabel = getStatusLabel(data);
  const moerColor = getMoerColor(data.moer || 0);
  const cleanPowerScore = Math.round(getCleanPowerScore(data));
  const coordinateLabel = data.latitude !== undefined && data.longitude !== undefined
    ? `${Number(data.latitude).toFixed(4)}, ${Number(data.longitude).toFixed(4)}`
    : 'Unavailable';

  return (
    <div className="card-glass relative min-h-[420px] overflow-hidden p-5 sm:p-6">
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="taxonomy-chip taxonomy-chip-observed">Observed geography</span>
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold text-gray-900">Grid balancing region for {cityName}</h3>
          <p className="mt-1 text-sm text-slate-600">{cityName} is mapped to the {data.region_label || 'local balancing region'}. All carbon data on this dashboard reflects that region.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Observed MOER now</p>
          <p className="mt-2 text-3xl font-semibold" style={{ color: moerColor }}>
            {Math.round(data.moer || 0)}
          </p>
          <p className="text-xs text-slate-500">lbs CO&#x2082;/MWh</p>
        </div>
      </div>

      <div className="relative mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-slate-100">
        {!mapLoaded && !mapFailed && (
          <div className="absolute inset-0 z-10">
            <SkeletonCard className="h-[280px] w-full rounded-none" />
          </div>
        )}

        {mapFailed ? (
          osmEmbedUrl ? (
            <iframe
              key={osmEmbedUrl}
              title={`Map of ${cityName}`}
              src={osmEmbedUrl}
              className="h-[280px] w-full border-0"
              loading="lazy"
              onLoad={() => setMapLoaded(true)}
            />
          ) : (
            <div className="flex h-[280px] w-full items-center justify-center bg-slate-100">
              <p className="text-sm text-slate-500">Map unavailable for this location</p>
            </div>
          )
        ) : (
          <img
            key={mapUrl}
            alt={`Static map of ${cityName}`}
            src={mapUrl}
            loading="lazy"
            width="800"
            height="280"
            className="h-[280px] w-full object-cover"
            onLoad={() => setMapLoaded(true)}
            onError={() => {
              setMapLoaded(true);
              setMapFailed(true);
            }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.35) 100%), radial-gradient(circle at 50% 52%, ${statusColor}38 0%, ${statusColor}14 24%, transparent 58%)`,
          }}
        />

        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-md">
            Regional carbon-signal context
          </div>
          {mapFailed && osmEmbedUrl && (
            <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-md">
              Fallback base map
            </div>
          )}
        </div>

        <div
          className="absolute bottom-5 right-5 rounded-full border px-3 py-1.5 text-xs font-semibold text-gray-900 backdrop-blur-md"
          style={{
            borderColor: `${statusColor}55`,
            background: `${statusColor}22`,
          }}
        >
          {statusLabel}
        </div>

        <div className="absolute bottom-5 left-5 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Signal scope</p>
          <p className="mt-1 text-[11px] text-gray-900">Balancing-region level</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Geocoded point</p>
          <p className="mt-1 text-[11px] text-gray-900">{coordinateLabel}</p>
        </div>

        <div
          className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_20px_rgba(0,0,0,0.25)]"
          style={{ background: statusColor }}
        />

        {mapFailed && !osmEmbedUrl && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/88 px-6 text-center backdrop-blur-sm">
            <div>
              <p className="text-base font-semibold text-gray-900">Unable to load the map — check your connection.</p>
              <a
                href={mapLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="flex flex-wrap gap-2">
          <span className="metric-chip">Observed scope: balancing region</span>
          <span className="metric-chip">Derived score {cleanPowerScore}/100</span>
        </div>
      </div>

      <div className="mt-4">
        <DetailDisclosure
          badge="Map method"
          title="What the map shows and what it doesn't"
          summary="How the location is resolved, why the signal is regional rather than local, and what that means for interpreting the data."
        >
          <p>
            <span className="font-semibold text-gray-900">Observed inputs:</span> Google Geocoding converts the selected city into latitude and longitude, and WattTime identifies the balancing region serving that location.
          </p>
          <p>
            <span className="font-semibold text-gray-900">What the map means:</span> it provides geographic context for the point served by the current balancing-region carbon signal. The signal is region-level, not block-level.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Why no block-level overlay:</span> WattTime data is measured at the balancing-region level. No public API currently provides verified feeder- or neighborhood-level carbon telemetry, so this dashboard does not imply finer resolution than the data supports.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Coordinates shown:</span> {coordinateLabel}.
          </p>
        </DetailDisclosure>
      </div>
    </div>
  );
}
