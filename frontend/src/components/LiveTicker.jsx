export function LiveTicker({ environment, weather, loading }) {
  if (loading || !environment || !weather?.length) {
    return <div className="min-h-[152px] rounded-2xl border border-grid-border bg-white/5 p-4 skeleton" />;
  }

  const current = weather[0];
  const aqiTone = environment.air_quality_index > 100 ? 'text-orange-300' : 'text-grid-mint';

  return (
    <div className="rounded-2xl border border-grid-border bg-white/5 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Environment</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-3xl font-semibold text-white">{Math.round(current.temperature_f)}°F</p>
          <p className="mt-1 text-sm text-slate-300">{current.condition}</p>
          <p className="mt-1 text-xs text-slate-500">
            Wind {Math.round(current.wind_mph)} mph · Cloud cover {Math.round(current.cloud_cover_pct)}%
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            AQI: <span className={`font-semibold ${aqiTone}`}>{environment.air_quality_index}</span>
          </p>
          <p>
            Solar outlook: <span className="font-semibold text-white">{environment.solar_outlook_label}</span>
          </p>
          <p>
            Estimated local solar support: <span className="font-semibold text-white">{Math.round(environment.solar_generation_kw)} kW</span>
          </p>
        </div>
      </div>
    </div>
  );
}
