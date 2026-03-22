import { useMemo, useState } from 'react';
import {
  LOW_EMISSIONS_SCORE_THRESHOLD,
  MODERATE_EMISSIONS_SCORE_THRESHOLD,
  getCleanPowerScore,
} from '../constants';
import { DetailDisclosure } from './ui/DetailDisclosure';

function SourceLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-sky-300 transition hover:text-sky-200"
    >
      {children}
    </a>
  );
}

function formatWindow(forecast) {
  if (!forecast?.length) return 'Unavailable';

  let bestPoint = forecast[0];
  for (const point of forecast.slice(0, 24)) {
    if ((point.moer || 0) < (bestPoint.moer || 0)) {
      bestPoint = point;
    }
  }

  const bestDate = new Date(bestPoint.time);
  return bestDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`reference-tab ${active ? 'reference-tab-active' : ''}`.trim()}
      type="button"
    >
      {children}
    </button>
  );
}

function PanelIntro({ title, summary }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{summary}</p>
    </div>
  );
}

export function MethodologyPanel({ gridData, weather, forecast }) {
  const [activeTab, setActiveTab] = useState('observed');

  const currentMoer = Math.round(gridData?.moer || 0);
  const currentScore = Math.round(getCleanPowerScore(gridData));
  const currentTemp = Math.round(weather?.temp_c ?? gridData?.temp_c ?? 0);
  const bestWindow = useMemo(() => formatWindow(forecast), [forecast]);

  return (
    <section className="card-glass p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <span className="section-kicker">Reference</span>
          <h2 className="section-title">Methodology and source definitions</h2>
          <p className="section-subtitle">
            The operational dashboard stays concise. This reference layer keeps the formulas, source APIs, units, and limitations one interaction away.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="taxonomy-chip taxonomy-chip-observed">Observed provider output</span>
          <span className="taxonomy-chip taxonomy-chip-derived">Derived dashboard metric</span>
          <span className="taxonomy-chip taxonomy-chip-generated">Generated recommendation</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="mini-stat-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Observed now</p>
          <p className="mt-2 text-2xl font-semibold text-white">{currentMoer} lbs CO2/MWh</p>
          <p className="mt-2 text-sm text-slate-400">Marginal Operating Emissions Rate from the serving balancing region.</p>
        </div>

        <div className="mini-stat-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Derived now</p>
          <p className="mt-2 text-2xl font-semibold text-white">{currentScore}/100</p>
          <p className="mt-2 text-sm text-slate-400">Normalized MOER score used only as a readability index.</p>
        </div>

        <div className="mini-stat-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Decision support</p>
          <p className="mt-2 text-2xl font-semibold text-white">{bestWindow}</p>
          <p className="mt-2 text-sm text-slate-400">Current best forecast shift window used to support timing nudges.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <TabButton active={activeTab === 'observed'} onClick={() => setActiveTab('observed')}>
          Observed variables
        </TabButton>
        <TabButton active={activeTab === 'derived'} onClick={() => setActiveTab('derived')}>
          Derived metrics
        </TabButton>
        <TabButton active={activeTab === 'generated'} onClick={() => setActiveTab('generated')}>
          Generated recommendations
        </TabButton>
      </div>

      <div className="mt-5 space-y-4">
        {activeTab === 'observed' && (
          <>
            <PanelIntro
              title="Direct provider outputs used by the dashboard"
              summary="Observed variables are returned from external APIs without local mathematical transformation. GridSense uses them as the physical basis for all downstream ranking and recommendation logic."
            />

            <DetailDisclosure
              badge="WattTime"
              title="Marginal Operating Emissions Rate, or MOER"
              summary="Definition, units, interpretation, and why this is the decision signal for load shifting."
            >
              <p>
                <span className="font-semibold text-white">Definition:</span> WattTime defines Marginal Operating Emissions Rate as the emissions rate of the generator responding to an incremental change in load on the serving grid.
              </p>
              <p>
                <span className="font-semibold text-white">Units:</span> pounds of carbon dioxide per megawatt-hour, written as lbs CO2/MWh.
              </p>
              <p>
                <span className="font-semibold text-white">Interpretation:</span> lower MOER means the next unit of flexible demand is likely to be served by a cleaner marginal generator, making it the correct operational signal for load shifting.
              </p>
              <p>
                <span className="font-semibold text-white">Current observed value:</span> {currentMoer} lbs CO2/MWh.
              </p>
            </DetailDisclosure>

            <DetailDisclosure
              badge="Google + Open-Meteo"
              title="Geographic and weather context"
              summary="What the location and weather APIs contribute, and what they do not provide."
            >
              <p>
                <span className="font-semibold text-white">Google Geocoding:</span> converts the selected city into latitude and longitude so the dashboard can place the city geographically and map it to a balancing region.
              </p>
              <p>
                <span className="font-semibold text-white">Open-Meteo:</span> supplies direct weather variables such as current air temperature and the hourly temperature forecast. The current observed air temperature is {currentTemp}°C.
              </p>
              <p>
                <span className="font-semibold text-white">Limitation:</span> neither API provides neighborhood-level carbon telemetry or utility control-room stress measurements.
              </p>
            </DetailDisclosure>
          </>
        )}

        {activeTab === 'derived' && (
          <>
            <PanelIntro
              title="Local calculations built on the observed signals"
              summary="Derived metrics are deterministic transformations that GridSense computes locally. They are meant to improve interpretability and operations planning, not to replace the underlying provider measurements."
            />

            <DetailDisclosure
              badge="Formula"
              title="Normalized MOER score and classification bands"
              summary="The exact formula, thresholds, and the reason this should not be interpreted as renewable-share percentage."
            >
              <p>
                <span className="font-semibold text-white">Formula:</span>{' '}
                <code className="rounded bg-black/30 px-2 py-1 text-sky-200">score = max(0, min(100, 100 * (1 - MOER / 1000)))</code>
              </p>
              <p>
                <span className="font-semibold text-white">Current example:</span> with MOER = {currentMoer} lbs CO2/MWh, the derived score is {currentScore}/100.
              </p>
              <p>
                <span className="font-semibold text-white">Classification:</span> lower emissions at scores greater than or equal to {LOW_EMISSIONS_SCORE_THRESHOLD}; moderate emissions for scores from {MODERATE_EMISSIONS_SCORE_THRESHOLD} to {LOW_EMISSIONS_SCORE_THRESHOLD - 1}; high carbon below {MODERATE_EMISSIONS_SCORE_THRESHOLD}.
              </p>
              <p>
                <span className="font-semibold text-white">Limitation:</span> this is a local normalization layer. WattTime does not provide it directly.
              </p>
            </DetailDisclosure>

            <DetailDisclosure
              badge="Heuristics"
              title="Heat-wave flag, best-window ranking, and grid-stress interpretation"
              summary="How the dashboard derives operational cues from observed carbon and weather variables."
            >
              <p>
                <span className="font-semibold text-white">Heat-wave flag:</span> the interface marks elevated heat-wave pressure when any forecast hourly temperature in the next 24 hours exceeds 35°C.
              </p>
              <p>
                <span className="font-semibold text-white">Best shift window:</span> the forecast layer searches for the minimum two-hour mean MOER window. The current best window begins around {bestWindow}.
              </p>
              <p>
                <span className="font-semibold text-white">Grid stress:</span> this is a local heuristic derived from forecast demand and carbon conditions. It is not SCADA load, reserve margin, or a reliability declaration from a system operator.
              </p>
            </DetailDisclosure>
          </>
        )}

        {activeTab === 'generated' && (
          <>
            <PanelIntro
              title="Recommendation logic and language-model role"
              summary="Generated recommendations sit on top of the physical and derived layers. They turn already-computed timing windows into concise operational guidance."
            />

            <DetailDisclosure
              badge="Azure OpenAI"
              title="How appliance timing nudges are produced"
              summary="The distinction between measured carbon data, locally computed savings, and generated explanatory text."
            >
              <p>
                <span className="font-semibold text-white">Physical inputs:</span> forecast MOER, current conditions, and the lowest-emission windows already identified by the dashboard.
              </p>
              <p>
                <span className="font-semibold text-white">Derived savings:</span> estimated carbon benefit is computed from appliance load assumptions and the difference between current MOER and the suggested window.
              </p>
              <p>
                <span className="font-semibold text-white">Generated output:</span> Azure OpenAI converts those values into structured timing recommendations. The model does not generate MOER, coordinates, weather, or grid-stress measurements.
              </p>
            </DetailDisclosure>

            <DetailDisclosure
              badge="Sources"
              title="Documentation used to define the dashboard vocabulary"
              summary="Direct links to the provider references that back the terminology and signal interpretation."
            >
              <div className="flex flex-wrap gap-4">
                <SourceLink href="https://legacy-docs.watttime.org/">WattTime API reference</SourceLink>
                <SourceLink href="https://watttime.org/data-science/methodology-validation/">WattTime methodology</SourceLink>
                <SourceLink href="https://developers.google.com/maps/documentation/geocoding/overview">Google Geocoding</SourceLink>
                <SourceLink href="https://open-meteo.com/en/docs">Open-Meteo Weather API</SourceLink>
                <SourceLink href="https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/structured-outputs">Azure structured outputs</SourceLink>
              </div>
            </DetailDisclosure>
          </>
        )}
      </div>
    </section>
  );
}
