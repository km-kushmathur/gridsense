# GridSense Copy, Typography & Scientific Accuracy Prompt
## For use with Claude Opus 4.6

---

You are editing the GridSense frontend for three things only: **writing quality**, **scientific accuracy**, and **typographic consistency**. You are not changing layouts, colors, component structure, or logic. Every change is text or a Tailwind class swap.

Read every file listed before writing a single edit. Do not assume — verify line numbers before changing them.

**Working directory:** `/home/kato/gridsense/frontend/src`

---

## Typography System to Enforce

GridSense uses two fonts. Apply them consistently according to these rules:

| Font | Tailwind class | Use for |
|------|---------------|---------|
| Space Grotesk | `font-display` | All major headings (h1, h2, h3 that are section or card titles), all large KPI numbers |
| Manrope | (default, no class) | Body text, descriptions, labels, captions, chips — everything else |

**Rule:** Every `<h1>`, `<h2>`, and prominent card `<h3>` that is currently missing `font-display` needs it added. The `.section-title` CSS class already includes `font-display` via `@apply`, so those are covered. The issue is card-level headings inside components.

**Specific fixes required:**

In `components/IntensityBadge.jsx`:
- Line with `<h3 className="mt-5 text-lg font-semibold text-gray-900">Clean Power Score</h3>` → add `font-display`
- Line with `<h3 className="mt-4 text-xl font-semibold text-gray-900 sm:text-2xl">` → already good, keep

In `components/CityMap.jsx`:
- `<h3 className="mt-3 text-xl font-semibold text-gray-900">` → add `font-display`

In `components/MethodologyPanel.jsx`:
- `<h3 className="text-lg font-semibold text-white">` in `PanelIntro` → change to `<h3 className="font-display text-lg font-semibold text-gray-900">` (also fix text-white → text-gray-900)
- Mini stat card values `<p className="mt-2 text-2xl font-semibold text-white">` → change to `<p className="mt-2 font-display text-2xl font-semibold text-gray-900">`

In `components/ForecastChart.jsx`:
- `<p className="panel-title mt-3">Carbon Rate Forecast (lbs CO&#x2082;/MWh)</p>` — `.panel-title` has `font-semibold` but not `font-display`. Add it: change to `<p className="panel-title mt-3 font-display">`

In `pages/Simulator.jsx`:
- `<h2 className="mt-4 text-2xl font-semibold text-gray-900 sm:text-3xl">Demand follows the spike</h2>` → add `font-display`
- `<h2 className="mt-4 text-2xl font-semibold text-gray-900 sm:text-3xl">Demand shifts into cleaner hours</h2>` → add `font-display`
- KPI values already use `font-display` — good, keep

In `components/NudgePanel.jsx`:
- `<h3 className="text-lg font-semibold text-gray-900">Expected Savings vs Running Right Now</h3>` → add `font-display`

In `components/AlertSubscribe.jsx`:
- No heading changes needed here.

In `components/TopBar.jsx`:
- `<span className="block font-display text-lg font-semibold text-white">GridSense</span>` → change `text-white` to `text-gray-900`
- `<span className="block text-xs text-slate-400">Understand your grid in plain English</span>` → fine, keep

---

## Copy Rewrites Required

### CRITICAL — Remove internal/meta language visible to users

**`pages/Simulator.jsx`** — This line is currently visible to every user of the site:

Find: `This is the section that makes the demo concrete for judges and first-time visitors.`

Replace the entire `<p className="section-subtitle ...">` that contains it with:
```
<p className="section-subtitle max-w-3xl">
  These live counters show the concrete operational difference between the two timelines — how much carbon was avoided, and how much demand was successfully moved to cleaner hours.
</p>
```

**`pages/Simulator.jsx`** — Scenario description currently says:
> "Heat waves are the strongest demo because they show how quickly the grid can tip into critical territory."

"Strongest demo" is internal. Replace entire description string for `heat_wave` in the `SCENARIOS` array:

Old: `'High cooling demand pushes the grid toward its failure threshold.'`
New: `'Sustained cooling demand stacks loads into the same peak hours, rapidly pushing the grid toward its stress limit.'`

Also fix `cold_snap` description for clarity:
Old: `'Heating demand creates a sharp peak in carbon intensity and grid pressure.'`
New: `'A sudden drop in temperature drives heating demand into a concentrated morning peak, raising both grid stress and carbon intensity.'`

And `normal`:
Old: `'A steady demand profile shows what the grid looks like without extreme weather.'`
New: `'A baseline demand day with no weather extremes — a useful reference for comparing how much worse the stressed scenarios are.'`

---

### Dashboard — Section subtitles

These are too long, too meta, or too jargon-heavy for a real user:

**Section: Grid overview subtitle**

Find (in `pages/Dashboard.jsx`):
```
A layered operating view of <GradientText>{city}</GradientText>, built around the live carbon signal first.
```
That is the h1 — leave it as is.

Find the `<p className="section-subtitle ...">` immediately following it:
> "The main dashboard prioritizes the current signal, the next 24-hour forecast, map context, and appliance timing recommendations. Scientific definitions and derivations remain available without crowding the primary reading path."

Replace with:
```
See how clean or dirty your electricity is right now, what the next 24 hours look like, and the single best time to run your heaviest appliances.
```

**Section: Current signal subtitle**

Find:
> "The Carbon Rate (lbs CO₂/MWh) tells you how much carbon the grid is emitting right now. The Clean Power Score ranks this moment from 0 to 100 to help you decide when to run heavy appliances."

Replace with:
```
The Carbon Rate measures how much CO₂ the grid emits per unit of electricity right now. The Clean Power Score translates that number into a 0–100 scale so you can quickly decide whether this is a good time to run heavy appliances.
```

**Section: Current conditions subtitle**

Find:
> "Current weather is measured directly. Grid Load Pressure and heat-wave risk are calculated from forecast data to help you prioritize when to shift energy use."

Replace with:
```
Live air temperature and conditions from Open-Meteo. Grid Load Pressure and heat-wave risk are derived from the forecast — use them alongside the carbon signal to judge urgency.
```

**Section: Next 24 hours subtitle**

Find:
> "Find the cleanest hours ahead to schedule EV charging, laundry, or other heavy loads for the lowest carbon impact."

This is fine. Keep it.

**Section: Map context subtitle**

Find:
> "The map anchors the city geographically and shows where the region-level carbon signal applies. It is contextual, not neighborhood telemetry."

Replace with:
```
This map shows where {city} sits within its grid balancing region. The carbon signal applies at the regional level — not block by block.
```
Note: use `{city}` as the JSX variable, not the literal text.

**Section: What to do now subtitle**

Find (in Dashboard.jsx, not NudgePanel):
> "Appliance-by-appliance suggestions based on the current forecast, so you know exactly what to run and when for the cleanest electricity."

This now describes the old per-appliance design. Replace with:
```
The single best window to run all your high-draw appliances, based on the forecast. Estimated carbon savings are shown for each one.
```

---

### NudgePanel — Internal subtitle

**`components/NudgePanel.jsx`**

Find inside `panel-subtitle`:
> "Based on the forecast, here are the best times to run each appliance to use the cleanest electricity and avoid peak carbon hours."

Replace with:
```
The cleanest upcoming window for EV charging, laundry, and other high-draw appliances. Savings estimates assume you'd otherwise run them right now.
```

---

### ForecastChart — Bar description is backwards

**`components/ForecastChart.jsx`**

Find:
> "Each bar shows the predicted Carbon Rate for one hour. Taller bars mean cleaner power — a good time to run heavy appliances. Shorter bars mean more carbon-intensive electricity."

This is confusing because taller = cleaner is counterintuitive. Rewrite to explain the encoding instead of letting users guess:

Replace with:
```
Each bar shows the forecasted carbon rate for one hour. Bar height is inverted: taller means lower emissions — a better time to run heavy appliances. Hover any bar to see the exact rate and Clean Power Score.
```

---

### CityMap — Defensive and overly technical copy

**`components/CityMap.jsx`**

Find `<h3 ...>Where the region-level carbon signal applies</h3>`:
Replace text with: `Grid balancing region for {cityName}`
(Keep className, add `font-display`, swap text only)

Find:
```
{cityName} is geocoded into the {data.region_label || 'local balancing region'} that receives the current carbon signal.
```
Replace with:
```
{cityName} is mapped to the {data.region_label || 'local balancing region'}. All carbon data on this dashboard reflects that region.
```

Find disclosure title `"Why this map shows context rather than local telemetry"`:
Replace with: `"What the map shows and what it doesn't"`

Find disclosure summary:
> "Open for the geocoding workflow, region-scope limitation, and the reason neighborhood carbon shading is intentionally absent."

Replace with:
```
How the location is resolved, why the signal is regional rather than local, and what that means for interpreting the data.
```

Inside the disclosure body, find:
> "Why there is no neighborhood overlay: the current API stack does not provide documented feeder-level or neighborhood-level carbon telemetry, so the interface avoids implying that resolution."

Replace with:
```
<span className="font-semibold text-gray-900">Why no block-level overlay:</span> WattTime data is measured at the balancing-region level. No public API currently provides verified feeder- or neighborhood-level carbon telemetry, so this dashboard does not imply finer resolution than the data supports.
```

---

### MethodologyPanel — Scientific accuracy and copy

**`components/MethodologyPanel.jsx`**

**MOER disclosure — tighten definition:**

Find:
> "WattTime defines Marginal Operating Emissions Rate as the emissions rate of the generator responding to an incremental change in load on the serving grid."

Replace with:
```
WattTime defines MOER as the emissions intensity of the marginal generator — the unit of generation that would respond to an incremental increase in load on the serving balancing authority. It reflects the carbon cost of the next kilowatt-hour consumed, not the average carbon intensity of all generators currently running.
```

Find:
> "lower MOER means the next unit of flexible demand is likely to be served by a cleaner marginal generator, making it the correct operational signal for load shifting."

Replace with:
```
Lower MOER means the marginal generator is cleaner at that moment — making it the right signal for timing flexible demand. Using average emissions intensity instead would misattribute the actual carbon impact of incremental consumption.
```

**Clean Power Score disclosure — add ceiling justification:**

Find:
> "Limitation: this is a local normalization layer. WattTime does not provide it directly."

Replace with:
```
<span className="font-semibold text-gray-900">Ceiling assumption:</span> the formula uses 1000 lbs CO₂/MWh as the normalization ceiling. This approximates the upper bound of the U.S. continental grid MOER range under typical operating conditions. MOER values above 1000 lbs/MWh are theoretically possible in extreme cases and would score 0 — they cannot be distinguished by this index alone.
```
Add this as a new `<p>` after the existing Limitation paragraph.

**Grid stress disclosure — be explicit it's a heuristic:**

Find:
> "Grid stress: this is a local heuristic derived from forecast demand and carbon conditions. It is not SCADA load, reserve margin, or a reliability declaration from a system operator."

Replace with:
```
<span className="font-semibold text-gray-900">Grid Load Pressure:</span> a local index derived from forecasted demand and MOER. It is not a SCADA measurement, not a utility reserve margin figure, and not a reliability declaration from any system operator. It should be treated as a directional indicator only.
```

**Derived quantity label on mini stat card:**

Find:
> "Normalized MOER score used only as a readability index."

Replace with:
```
Clean Power Score — a local index, not a direct WattTime field. See Derived metrics for the formula.
```

**Generated recommendations tab — clarify LLM role:**

Find:
> "Azure OpenAI converts those values into structured timing recommendations. The model does not generate MOER, coordinates, weather, or grid-stress measurements."

Replace with:
```
Azure OpenAI converts pre-computed values into plain-language recommendations. The model receives the timing window and savings figures as fixed inputs — it does not generate, estimate, or validate any physical measurements. If the model output conflicts with the underlying data, the data takes precedence.
```

---

### Onboarding — Minor copy tightening

**`pages/Onboarding.jsx`**

Find VALUE_POINT body for `'Live carbon data'`:
> `'See how clean or dirty your local electricity is right now with one glance.'`

Replace with:
`'See the carbon intensity of your local grid right now — how much CO₂ each unit of electricity is producing at this moment.'`

Find VALUE_POINT body for `'Smart nudges'`:
> `'Get appliance-by-appliance suggestions that explain what to run and when.'`

Replace with:
`'Get a single optimal window to run your high-draw appliances, with estimated carbon savings for each one.'`

Find HOW_IT_WORKS body for step `'02'`:
> `'We translate carbon intensity, weather, and forecast trends into a simple current status.'`

Replace with:
`'The dashboard translates MOER — the marginal carbon intensity of your grid — into a plain-language status and a 0–100 Clean Power Score.'`

Find the bottom-right value card text:
> `'You already charge your EV and run laundry — GridSense just tells you the best hour to do it. Less carbon, same effort.'`

Replace with:
`'You already charge your EV and run laundry. GridSense identifies the single lowest-carbon window in the next 24 hours and shows you how much CO₂ you avoid by timing it right.'`

---

### Simulator — "Without GridSense" description

**`pages/Simulator.jsx`**

Find:
> `'This is the unmanaged version of the day. Loads stack into the same hot hours, which pushes the grid toward its failure threshold.'`

Replace with:
`'Demand follows its natural curve with no load shifting. High-draw appliances run whenever they\'re scheduled, concentrating stress in the peak window.'`

Find (optimized side):
> `'This optimized path moves flexible demand out of the dirtiest, highest-stress window and into cleaner hours where the grid has room to breathe.'`

Replace with:
`'Flexible demand is shifted into lower-carbon, lower-stress windows. The same appliances run the same total energy — just at better times.'`

---

## Scientific Consistency Rules

Apply these consistently wherever the terms appear. Do a search for each and fix every instance:

1. **CO₂ not CO2** — Use `CO&#x2082;` in JSX or `CO₂` in JS strings. Never plain `CO2` in user-facing text. Check: `components/NudgePanel.jsx`, `components/ForecastChart.jsx`, `components/MethodologyPanel.jsx`, `pages/Simulator.jsx`.

2. **MOER capitalization** — Always fully capitalized: `MOER`. Never `Moer` or `moer` in display text.

3. **Units format** — `lbs CO₂/MWh` not `lbs CO2/MWh` and not `lbs CO2 per MWh` in inline text. In prose explanations, "pounds of CO₂ per megawatt-hour" is acceptable.

4. **Balancing region vs balancing authority** — Use "balancing region" consistently in user-facing copy. "Balancing authority" is technically more precise (it refers to the operator, not the geographic zone) but "region" is clearer to non-expert users and already used in most places. Do not mix them.

5. **"grid stress" vs "Grid Load Pressure"** — The displayed label in the UI is "Grid Load Pressure". In prose, always use "Grid Load Pressure" not "grid stress". The variable name `grid_stress` in code is fine to keep.

6. **kWh capitalization** — `kWh` not `kwh` or `KWH` in user-facing text. `MWh` not `mwh` or `MWH`.

---

## Verification Checklist

After all edits:

- [ ] No instance of "judges" or "first-time visitors" or "strongest demo" visible in any JSX string
- [ ] All major h1/h2/h3 section and card headings use `font-display`
- [ ] All large KPI numbers use `font-display`
- [ ] `text-white` replaced with `text-gray-900` in MethodologyPanel `PanelIntro` and mini stat cards
- [ ] MOER definition includes marginal vs average distinction
- [ ] Clean Power Score ceiling (1000 lbs/MWh) is explained and justified
- [ ] Grid Load Pressure is explicitly labeled a heuristic, not a utility measurement
- [ ] NudgePanel subtitle reflects single-window design (not "appliance-by-appliance")
- [ ] ForecastChart bar direction (taller = cleaner) is explained, not assumed
- [ ] CityMap disclosure language is plain, not defensive
- [ ] CO₂ rendered as `CO&#x2082;` in all user-visible JSX text
- [ ] No `CO2` (without subscript) in display text
- [ ] `kWh` and `MWh` capitalized correctly throughout
- [ ] "Grid Load Pressure" used in prose, not "grid stress"
