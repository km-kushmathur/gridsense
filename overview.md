# GridSense Overview

GridSense is really three products in one: an onboarding/search surface, a live dashboard, and a side-by-side simulator.

The main app routes live in `frontend/src/App.jsx`. The backend API contract is defined in `backend/models.py`. Local run modes are described in `README.md`.

## What The User Sees

- The onboarding page in `frontend/src/pages/Onboarding.jsx` lets a user enter a city or campus, tap example cities, and get a "resume" hint if that city was already loaded in the current browser session. That resume hint comes from the in-memory frontend cache in `frontend/src/cache/gridCache.js`.
- The top bar in `frontend/src/components/TopBar.jsx` shows the selected city, a cache-age pill, and a "live updates" badge. Under the hood, intensity repolls every 60 seconds in `frontend/src/hooks/useGridData.js`, while forecast, weather, and nudges use 5-minute cache behavior through `frontend/src/hooks/useForecast.js` and `frontend/src/api/gridsense.js`.
- The main dashboard page in `frontend/src/pages/Dashboard.jsx` is composed of six visible sections: current signal, current conditions, 24-hour forecast, map context, what-to-do-now nudges, and a methodology/reference layer.
- The current signal card in `frontend/src/components/IntensityBadge.jsx` shows the current carbon status, the large Clean Power Score, the raw Carbon Rate, temperature, and heat-wave flag. It is the main "should I run something now?" card.
- The current conditions panel in `frontend/src/pages/Dashboard.jsx` adds the semicircular Grid Load Pressure gauge from `frontend/src/components/GridStressGauge.jsx`, plus current weather, the best 2-hour window, and heat-wave pressure. It also raises a warning banner if pressure crosses 70.
- The forecast chart in `frontend/src/components/ForecastChart.jsx` renders a 24-bar hourly MOER forecast, highlights the current hour with a "Now" marker, highlights the cleanest 2-hour pair, and shows hover tooltips with MOER and Clean Power Score.
- The map panel in `frontend/src/components/CityMap.jsx` shows where the selected city sits in its balancing region, displays the geocoded coordinates, and explicitly warns that the signal is regional, not neighborhood-level. If the static map fails, it falls back to an OpenStreetMap embed.
- The nudge panel in `frontend/src/components/NudgePanel.jsx` shows one shared optimal window for all heavy appliances, then itemizes dishwasher, washer, EV charger, and dryer with per-cycle energy, CO₂ savings, and a cost reference.
- The methodology panel in `frontend/src/components/MethodologyPanel.jsx` is a trust/transparency feature. It separates "Observed variables," "Derived metrics," and "Generated recommendations," which is the right mental model for the whole product.
- The alert feature in `frontend/src/components/AlertSubscribe.jsx` and `backend/alert_service.py` lets users subscribe to `ntfy` topics, send test alerts, and get notified when Grid Load Pressure crosses 70%. A background poller checks subscriptions every 5 minutes in `backend/main.py`.
- The simulator in `frontend/src/pages/Simulator.jsx` lets the user choose heat wave, cold snap, or normal day, then plays two timelines side by side: unmanaged demand and shifted demand. It stops playback when the unmanaged path reaches the failure hour.

## Every Metric And What It Means

### Carbon Rate / MOER

This is the core physical signal.

MOER means Marginal Operating Emissions Rate, not average grid emissions. It answers:

> If I consume one more unit of electricity right now, what emissions intensity is likely on the generator that responds?

The definition and units are explained in `frontend/src/components/MethodologyPanel.jsx`. The normalization helper lives in `backend/grid_utils.py`.

### Units

MOER is shown as `lbs CO₂/MWh`.

That means pounds of carbon dioxide per megawatt-hour of incremental electricity demand.

### Clean Power Score

This is a local readability index, not a provider-supplied field.

Formula:

```text
score = max(0, min(100, 100 * (1 - MOER / 1000)))
```

This logic exists in `backend/grid_utils.py` and is mirrored in `frontend/src/constants.js`.

Lower MOER means a higher Clean Power Score.

### Status Label

"Lower emissions," "Moderate emissions," and "High carbon" are score bands.

Thresholds:

- `>= 70`: clean
- `>= 40`: moderate
- `< 40`: dirty

These thresholds are implemented in `backend/grid_utils.py` and `frontend/src/constants.js`.

### `green_score` vs `clean_power_score`

In this codebase they are effectively the same thing.

`green_score` is a compatibility field. Both values map back to the same MOER-based normalization in `backend/main.py`.

### `pct_renewable`

This is important: in the current implementation it is not a true metered renewable-share measurement.

In both the live and mock WattTime client code, it is derived from Clean Power Score as:

```text
score / 100
```

That behavior lives in `backend/watttime_client.py` and `backend/mock_data.py`.

So it behaves more like a cleanliness proxy than a literal renewable mix percentage.

### Temperature And Weather Condition

These come from Open-Meteo on the live path in `backend/weather_client.py`.

They provide environmental context, not grid measurements.

### Heat-Wave Flag

This is derived, not directly observed.

It turns true when any forecast temperature in the next 24 hours exceeds `35°C`. That rule is implemented in `backend/weather_client.py` and surfaced in `frontend/src/pages/Dashboard.jsx`.

### Grid Load Pressure

This is a heuristic operational-pressure index from 0 to 100.

On the live simulator and intensity logic, it is based on:

```text
demand_index * moer / 12
```

and then capped at 100.

That logic lives in `backend/demand_simulator.py`.

It is explicitly not SCADA, reserve margin, or an ISO/RTO reliability declaration.

### Demand Index

This is the internal driver behind Grid Load Pressure.

Formula:

```text
(0.5 + abs(temp_c - 22) * 0.03 + time_factor) * scenario_multiplier
```

This logic lives in `backend/demand_simulator.py`.

Demand Index rises when temperature moves far from `22°C` and during morning and evening peak periods.

### Best 2-Hour Window

This is the lowest-average-MOER contiguous 2-hour block within the 24-hour forecast.

The shared logic lives in `backend/window_utils.py` and is mirrored client-side in `frontend/src/utils/forecast.js`.

This is the core recommendation primitive for both the chart and the nudge system.

### Time Formatting

The app normalizes ISO timestamps, treats naive values as UTC, and formats hour ranges like `2 pm - 4 pm`.

That behavior lives in `frontend/src/utils/time.js` and `backend/window_utils.py`.

### CO₂ Saved Per Appliance

The nudge engine computes per-appliance carbon savings as:

```text
appliance_kWh * max(0, current_moer - best_window_moer) * 453.592 / 1000
```

This logic lives in `backend/nudge_engine.py`.

That is a real carbon-delta formula based on the change in emissions intensity between "run now" and "run in the best window."

### Appliance Energy Assumptions

The assumed energy per cycle is:

- EV charger: `7.2 kWh`
- Dryer: `3.5 kWh`
- Dishwasher: `1.2 kWh`
- Washer: `0.5 kWh`

These assumptions appear in both `frontend/src/components/NudgePanel.jsx` and `backend/nudge_engine.py`.

### Cost Column In The Nudge Table

This is not timing-based savings.

It is simply:

```text
kWh * $0.16 / kWh
```

per cycle in `frontend/src/components/NudgePanel.jsx`.

The methodology text is honest that the bill does not change if the same amount of electricity is used. The value shown is carbon savings, not electricity cost savings.

### Map Metrics

`region_label`, `latitude`, and `longitude` are geospatial context fields.

They tell the user:

- which balancing region the carbon signal applies to
- where the city was geocoded

The live path is Google Geocoding plus WattTime region lookup in `backend/geo_utils.py` and `backend/watttime_client.py`.

### Simulation `failure_hour`

This is the first hour where Grid Load Pressure exceeds `85`.

That logic lives in `backend/demand_simulator.py`.

In the UI, that is treated as the point where rolling blackouts or emergency intervention become plausible.

### Simulation `shifted_timeline`

The simulator finds the top 20% highest-demand hours, reduces them by 20%, and redistributes that demand into the lowest-MOER hours.

That logic lives in `backend/demand_simulator.py`.

It is a simple but intuitive load-shifting model.

### Simulation `savings_kg_co2`

This is accumulated avoided emissions from lowering demand during dirtier hours.

That logic lives in `backend/demand_simulator.py`.

On the frontend, the live counter spreads that total over the playback frames in `frontend/src/pages/Simulator.jsx`.

### Simulation "Load shifted"

This is a frontend presentation metric, not a backend API field.

It sums:

```text
(baseDemand - optimizedDemand) * 10
```

over elapsed frames in `frontend/src/pages/Simulator.jsx`.

It is best read as a visualization of movement, not a calibrated engineering meter.

## The Most Important Truth About The Current Build

### Observed Layer

Live geocoding, live weather, live static maps, and live WattTime realtime MOER are supported in the codebase through:

- `backend/geo_utils.py`
- `backend/weather_client.py`
- `backend/watttime_client.py`

### Derived Layer

Clean Power Score, status bands, best-window selection, Grid Load Pressure, CO₂ savings, and simulator outputs are all local calculations.

That is the intellectual core of the product.

### Generated Layer

Azure OpenAI only writes the short appliance message text.

It does not choose the window or compute the savings. That boundary is enforced in `backend/nudge_engine.py`.

### Demo Reality Today

The shared 24-hour forecast path currently comes from:

```python
build_mock_simulation(city, "normal")
```

in `backend/main.py`.

That means the forecast chart, best 2-hour window, nudge timing, and expected savings are currently driven by deterministic city-stable demo data from `backend/mock_data.py`, not a live WattTime forecast feed.

### Demo Shaping

Those demo forecasts are not random.

They use:

- stable region families
- city checksums
- a forced cleaner 2-hour window
- city-specific Clean Power Score and Grid Load Pressure heuristics

That logic lives in `backend/mock_data.py`.

## Possible Next Step

If needed, this document can be turned into a presentation-ready briefing with:

- what to say in a demo
- which metrics are scientifically strongest
- which implementation caveats should be disclosed if someone asks
