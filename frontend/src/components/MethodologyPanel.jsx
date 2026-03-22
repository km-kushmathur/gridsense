import { useMemo, useState } from 'react';
import {
  LOW_EMISSIONS_SCORE_THRESHOLD,
  MODERATE_EMISSIONS_SCORE_THRESHOLD,
  getCleanPowerScore,
} from '../constants';
import { getBestWindowMeta } from '../utils/forecast';
import { formatWindowFromPointRange } from '../utils/time';
import { DetailDisclosure } from './ui/DetailDisclosure';

function SourceLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-sky-600 transition hover:text-sky-700"
    >
      {children}
    </a>
  );
}

function formatWindow(forecast) {
  return formatWindowFromPointRange(getBestWindowMeta(forecast).points);
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
      <h3 className="font-display text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-base leading-7 text-slate-600">{summary}</p>
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
          <p className="mt-2 font-display text-2xl font-semibold text-gray-900">{currentMoer} lbs CO&#x2082;/MWh</p>
          <p className="mt-2 text-sm text-slate-500">Marginal Operating Emissions Rate from the serving balancing region.</p>
        </div>

        <div className="mini-stat-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Derived now</p>
          <p className="mt-2 font-display text-2xl font-semibold text-gray-900">{currentScore}/100</p>
          <p className="mt-2 text-sm text-slate-500">Clean Power Score — a local index, not a direct WattTime field. See Derived metrics for the formula.</p>
        </div>

        <div className="mini-stat-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Decision support</p>
          <p className="mt-2 font-display text-2xl font-semibold text-gray-900">{bestWindow}</p>
          <p className="mt-2 text-sm text-slate-500">Current best forecast shift window used to support timing nudges.</p>
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
                <span className="font-semibold text-gray-900">Definition:</span> WattTime defines MOER as the emissions intensity of the marginal generator — the unit of generation that would respond to an incremental increase in load on the serving balancing region. It reflects the carbon cost of the next kilowatt-hour consumed, not the average carbon intensity of all generators currently running.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Units:</span> pounds of CO&#x2082; per megawatt-hour, written as lbs CO&#x2082;/MWh.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Interpretation:</span> lower MOER means the marginal generator is cleaner at that moment — making it the right signal for timing flexible demand. Using average emissions intensity instead would misattribute the actual carbon impact of incremental consumption.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Current observed value:</span> {currentMoer} lbs CO&#x2082;/MWh.
              </p>
            </DetailDisclosure>

            <DetailDisclosure
              badge="Google + Open-Meteo"
              title="Geographic and weather context"
              summary="What the location and weather APIs contribute, and what they do not provide."
            >
              <p>
                <span className="font-semibold text-gray-900">Google Geocoding:</span> converts the selected city into latitude and longitude so the dashboard can place the city geographically and map it to a balancing region.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Open-Meteo:</span> supplies direct weather variables such as current air temperature and the hourly temperature forecast. The current observed air temperature is {currentTemp}°C.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Limitation:</span> neither API provides neighborhood-level carbon telemetry or utility control-room stress measurements.
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
                <span className="font-semibold text-gray-900">Formula:</span>{' '}
                <code className="rounded bg-slate-100 px-2 py-1 text-sky-700">score = max(0, min(100, 100 * (1 - MOER / 1000)))</code>
              </p>
              <p>
                <span className="font-semibold text-gray-900">Current example:</span> with MOER = {currentMoer} lbs CO&#x2082;/MWh, the derived score is {currentScore}/100.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Classification:</span> lower emissions at scores greater than or equal to {LOW_EMISSIONS_SCORE_THRESHOLD}; moderate emissions for scores from {MODERATE_EMISSIONS_SCORE_THRESHOLD} to {LOW_EMISSIONS_SCORE_THRESHOLD - 1}; high carbon below {MODERATE_EMISSIONS_SCORE_THRESHOLD}.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Limitation:</span> this is a local normalization layer. WattTime does not provide it directly.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Ceiling assumption:</span> the formula uses 1000 lbs CO&#x2082;/MWh as the normalization ceiling. This approximates the upper bound of the U.S. continental grid MOER range under typical operating conditions. MOER values above 1000 lbs CO&#x2082;/MWh are theoretically possible in extreme cases and would score 0 — they cannot be distinguished by this index alone.
              </p>
            </DetailDisclosure>

            <DetailDisclosure
              badge="Heuristics"
              title="Heat-wave flag, best-window ranking, and Grid Load Pressure interpretation"
              summary="How the dashboard derives operational cues from observed carbon and weather variables."
            >
              <p>
                <span className="font-semibold text-gray-900">Heat-wave flag:</span> the interface marks elevated heat-wave pressure when any forecast hourly temperature in the next 24 hours exceeds 35°C.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Best shift window:</span> the forecast layer searches for the minimum two-hour mean MOER window. The current best window is {bestWindow}.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Grid Load Pressure:</span> a local index derived from forecasted demand and MOER. It is not a SCADA measurement, not a utility reserve margin figure, and not a reliability declaration from any system operator. It should be treated as a directional indicator only.
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
                <span className="font-semibold text-gray-900">Physical inputs:</span> forecast MOER, current conditions, and the lowest-emission windows already identified by the dashboard.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Derived savings:</span> estimated carbon benefit is computed from appliance load assumptions and the difference between current MOER and the suggested window.
              </p>
              <p>
                <span className="font-semibold text-gray-900">Generated output:</span> Azure OpenAI converts pre-computed values into plain-language recommendations. The model receives the timing window and savings figures as fixed inputs — it does not generate, estimate, or validate any physical measurements. If the model output conflicts with the underlying data, the data takes precedence.
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
