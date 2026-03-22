# GridSense UI Implementation Prompt
## For use with Claude Opus 4.6

---

You are implementing a set of focused UI changes to GridSense — a React + Tailwind CSS carbon grid intelligence dashboard. Read every file listed before writing a single line of code. Verify your understanding of the existing structure before changing it.

**Working directory:** `/home/kato/gridsense/frontend`

---

## Design System (from UI/UX Pro Max audit)

Use these values throughout. Do not introduce new arbitrary hex values.

| Token | Value | Use |
|-------|-------|-----|
| Background | `#F8FAFC` | Page background |
| Surface | `#F1F5F9` | Nested panels, inner containers |
| Card | `#FFFFFF` | All cards |
| Text primary | `#1E293B` | Headings, labels, values |
| Text secondary | `#475569` | Subtitles, descriptions |
| Text muted | `#94A3B8` | Captions, hints, timestamps |
| Border default | `#E2E8F0` | All card borders |
| Border subtle | `#F1F5F9` | Inner dividers |
| Status green | `#22C55E` | Clean signal, savings, positive |
| Status yellow | `#EAB308` | Moderate signal |
| Status red | `#EF4444` | Dirty signal, alerts |
| Status blue | `#3B8BD4` | Info, links |
| Card shadow | `0 4px 24px rgba(0,0,0,0.06)` | All elevated surfaces |

**Style guidance:** Executive Dashboard + Minimalism/Swiss. Large KPI numbers (24–48px), traffic-light status, clean white cards, subtle shadows, 16–24px border radius. No glassmorphism. No dark surfaces.

---

## Task 1 — Convert to Light Mode

### Files to read first:
- `src/index.css`
- `tailwind.config.js`
- `src/components/TopBar.jsx`
- `src/components/GridStressGauge.jsx`
- `src/components/IntensityBadge.jsx`
- `src/components/ForecastChart.jsx`
- `src/components/MethodologyPanel.jsx`
- `src/components/AlertSubscribe.jsx`
- `src/components/ui/DetailDisclosure.jsx`
- `src/pages/Dashboard.jsx`

### `src/index.css` — full rewrite

Replace the entire file. Key changes:

```
:root { color-scheme: light; }

body background:
  radial-gradient(circle at top left, rgba(59,139,212,0.07), transparent 26%),
  radial-gradient(circle at top right, rgba(34,197,94,0.06), transparent 30%),
  linear-gradient(180deg, #EEF4FF 0%, #F8FAFC 42%, #F5F7FA 100%)
body color: #111827

Scrollbar track: #F1F5F9, thumb: rgba(100,116,139,0.35)

.skeleton: background rgba(0,0,0,0.06), shimmer rgba(0,0,0,0.04)

.card-glass: bg-white/80 backdrop-blur-2xl border-slate-200
.card-solid: bg-white border-slate-200

.section-kicker: border-green-200 bg-green-50 text-grid-clean
.section-title: text-gray-900
.section-subtitle: text-slate-600

.panel-title: text-gray-900
.panel-subtitle: text-slate-500

.metric-chip: border-slate-200 bg-slate-50 text-slate-600

.taxonomy-chip-observed: border-sky-200 bg-sky-50 text-sky-700
.taxonomy-chip-derived: border-emerald-200 bg-emerald-50 text-emerald-700
.taxonomy-chip-generated: border-violet-200 bg-violet-50 text-violet-700

.mini-stat-card: border-slate-200 bg-slate-50

.disclosure-shell: border-slate-200 bg-white hover:border-slate-300
.disclosure-body: border-slate-100 text-slate-600

.reference-tab: border-slate-200 bg-slate-50 text-slate-600
.reference-tab-active: text-green-700, border rgba(34,197,94,0.4), bg rgba(34,197,94,0.08)

.text-shimmer: use rgba(71,85,105,0.8) and #16a34a instead of white
.star-shell: increase opacity on green stop to 0.3 so it's visible on white

hover-lift shadow: rgba(0,0,0,0.10) not rgba(0,0,0,0.28)
```

### `tailwind.config.js`

Update color tokens:
```js
grid: {
  bg: '#F8FAFC',
  surface: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  clean: '#22C55E',    // keep
  moderate: '#EAB308', // keep
  dirty: '#EF4444',    // keep
  info: '#3B8BD4',     // keep
},
text: {
  primary: '#1E293B',
  muted: '#475569',
  hint: '#94A3B8',
  label: '#64748B',
  body: '#334155',
},
```

### JSX files — class substitution rules

Apply these substitutions consistently across ALL JSX files. Read each file before editing.

| Old (dark) | New (light) |
|------------|-------------|
| `text-white` | `text-gray-900` |
| `text-slate-300` | `text-slate-600` |
| `text-slate-400` | `text-slate-500` |
| `text-slate-500` | `text-slate-400` |
| `border-white/10` | `border-slate-200` |
| `border-white/8` | `border-slate-200` |
| `border-white/6` | `border-slate-100` |
| `border-white/[0.08]` | `border-slate-200` |
| `border-white/[0.12]` | `border-slate-300` |
| `bg-black/20` | `bg-slate-50` |
| `bg-black/15` | `bg-slate-50` |
| `bg-white/[0.045]` | `bg-white` |
| `bg-white/[0.04]` | `bg-slate-50` |
| `bg-white/[0.03]` | `bg-slate-50` |
| `bg-[#101822]/95` | `bg-white` |
| `bg-[#0d2015]` | `bg-green-50` |
| `bg-[#14301e]` | `bg-green-100` |
| `bg-[#170d0f]` | `bg-red-50` |
| `bg-[#261114]` | `bg-red-100` |
| `bg-[#08111bcc]` | `bg-white/90` |
| `bg-[#0F1117]` | `bg-slate-50` |
| `bg-[#1A0A00]` | `bg-yellow-50` |
| `bg-[#071018]/95` | `bg-white/95` |
| `border-[#2A2A28]` | `border-slate-200` |
| `text-[#D0D0CE]` | `text-slate-700` |
| `text-[#666663]` | `text-slate-500` |
| `text-[#444441]` | `text-slate-400` |
| `text-[#555553]` | `text-slate-500` |
| `text-[#888780]` | `text-slate-400` |

### `TopBar.jsx` specific

- Header: `border-b border-slate-200 bg-white/90 backdrop-blur-xl`
- Logo button: `border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100`
- Logo text: `text-gray-900` for GridSense name, `text-slate-500` for subtitle
- City chip: use `.metric-chip` class (already updated in CSS)
- Cache badge: `border-sky-200 bg-sky-50 text-sky-700`
- Live updates pill: `border-slate-200 bg-slate-50 text-slate-600`

### `GridStressGauge.jsx` specific

SVG hardcoded colors must change:
- Background arc stroke `#1E1E1C` → `#CBD5E1`
- Skeleton arc stroke `#1E1E1C` → `#CBD5E1`
- Center pivot fill `#1A1D27` → `#F8FAFC`
- Center pivot stroke `#D0D0CE` → `#64748B`
- Needle stroke `#D0D0CE` → `#475569`
- Skeleton circle fill `#1A1D27` → `#F8FAFC`, stroke `#2A2A28` → `#CBD5E1`
- "Grid Load Pressure" label: `text-slate-400`
- Safe/Critical chips: keep their colored border/bg, they work on light

### `Dashboard.jsx` specific

- Stress banner: `border-yellow-300 bg-yellow-50 text-yellow-800`, left border `#EAB308`
- Stress banner sub-text: `text-yellow-600`
- Inner condition rows `border-white/6` → `border-slate-100`
- `ConditionRow` value default color `text-white` → `text-gray-900`
- Inner card containers `border-white/8 bg-black/20` → `border-slate-100 bg-slate-50`
- Error toast: `border-yellow-300 bg-yellow-50 text-yellow-900`
- Welcome banner: `card-glass` handles bg; update dismiss button to `border-slate-200 bg-slate-50 text-slate-600`
- Welcome banner text `text-slate-300` → `text-slate-600`

### `MethodologyPanel.jsx` specific

- `PanelIntro` h3: `text-gray-900`
- `PanelIntro` p: `text-slate-600`
- `SourceLink`: `text-sky-600 hover:text-sky-700` (darker for light bg contrast)
- Mini stat card values `text-white` → `text-gray-900`
- Mini stat card descriptions `text-slate-400` → `text-slate-500`
- Mini stat card labels `text-slate-500` → `text-slate-400`

### `DetailDisclosure.jsx` specific

- Badge text `text-slate-500` → `text-slate-400`
- Title `text-white` → `text-gray-900`
- Summary text `text-slate-400` → `text-slate-500`
- "View details" text `text-slate-400` → `text-slate-500`
- All `<span className="font-semibold text-white">` inside disclosure bodies → `font-semibold text-gray-900`

Note: The `font-semibold text-white` pattern appears in many disclosure body paragraphs in `IntensityBadge.jsx`, `ForecastChart.jsx`, `NudgePanel.jsx`, `Dashboard.jsx`, and `MethodologyPanel.jsx`. Find all instances and replace with `font-semibold text-gray-900`.

### `AlertSubscribe.jsx` specific

- Outer container: `border-slate-200 bg-slate-50`
- Input: `border-slate-200 bg-white text-gray-900 placeholder:text-slate-400 focus:border-green-400`
- Collapse/Hide buttons: `text-slate-400 hover:text-slate-600`
- Topic code display: `border-slate-200 bg-slate-50 text-green-700`
- Copy button: `border-slate-200 bg-white text-slate-600 hover:border-slate-300`
- Secondary action buttons: `border-slate-200 text-slate-500 hover:text-slate-700`

### `ForecastChart.jsx` specific

- Tooltip bg `bg-[#071018]/95` → `bg-white/95 shadow-lg` with dark text
- Tooltip text: `text-gray-900` for time, `text-slate-600` for values
- Tooltip border: `border-slate-200`
- Chart inner container `border-white/[0.08] bg-black/20` → `border-slate-200 bg-slate-50`
- Legend text `text-slate-400` → `text-slate-500`
- Time label text `text-slate-500` → `text-slate-400`
- Best window overlay `bg-grid-clean/10` → keep (visible on light)

---

## Task 2 — Fix Clean Power Score Alignment

**File:** `src/components/IntensityBadge.jsx`

**Problem:** The `CountUp` renders `47/100` as one inline span at `text-6xl`. At 220px card width with 48px horizontal padding, the text overflows or sits awkwardly — the number and suffix are misaligned visually.

**Fix:** Split the number and suffix into separate elements with baseline alignment:

Replace:
```jsx
<CountUp
  value={cleanPowerScore}
  suffix="/100"
  className="mt-4 block font-display text-4xl font-bold leading-none sm:text-5xl lg:text-6xl"
  style={{ color: statusColor }}
/>
```

With:
```jsx
<div className="mt-4 flex items-baseline gap-1">
  <CountUp
    value={cleanPowerScore}
    className="font-display text-5xl font-bold leading-none lg:text-6xl"
    style={{ color: statusColor }}
  />
  <span className="font-display text-xl font-semibold text-slate-400">/100</span>
</div>
```

The `CountUp` component signature does not change — just remove the `suffix` prop and place `/100` in a separate `<span>` styled smaller so it reads as a denominator, not an equal part of the number.

---

## Task 3 — Single Optimal Window in NudgePanel

### Backend change first: `backend/nudge_engine.py`

Read the file. In `generate_nudges`, the window assignment loop currently assigns appliances round-robin across 3 cleanest windows:
```python
window = cleanest[index % len(cleanest)] if cleanest else {...}
```

Change to always use the single best window (index 0) for all appliances:
```python
window = cleanest[0] if cleanest else {...}
```

Do the same in `_build_fallback_nudges` — change:
```python
window = fallback_windows[index % len(fallback_windows)]
```
To:
```python
window = fallback_windows[0]
```

Also add `window_avg_moer: float = 0.0` to `NudgeItem` in `backend/models.py`.

Populate it in `nudge_engine.py` when building each `NudgeItem` — add:
```python
window_avg_moer=float(window.get("avg_moer", 0.0)),
```

### Frontend change: `src/components/NudgePanel.jsx`

**Read the file in full before rewriting.**

The new design replaces 4 separate appliance cards with:
1. A single "Optimal Window" hero section showing the best time
2. A per-appliance savings table
3. A total row with summed CO₂ and combined kWh
4. A calculation methodology disclosure

Add this constant at the top of the file (matches backend `APPLIANCE_KWH`):
```js
const APPLIANCE_KWH = {
  dishwasher: 1.2,
  washer: 0.5,
  ev_charger: 7.2,
  dryer: 3.5,
};
```

Keep the existing `loadNudges`, `useState`, and `useCallback` logic unchanged. Keep `formatBestWindow` unchanged.

**New render output structure** (when `nudges.length > 0`):

```
[Header: taxonomy chip + "What to Do Now" title + subtitle + Refresh button — unchanged]

[Error state — unchanged]

[Loading skeleton — unchanged]

[When loaded:]

  ┌─ Optimal Window hero card ─────────────────────────┐
  │ OPTIMAL WINDOW (kicker, green)                      │
  │ [formatted time, e.g. "11 pm – 1 am"]  (large green)│
  │ [avg MOER] lbs CO₂/MWh · Clean Power Score [n]/100  │
  │ Run all appliances in this window for lowest carbon. │
  └────────────────────────────────────────────────────┘

  Expected savings if run during this window:

  ┌─────────────────────────────────────────────────────┐
  │ [icon] EV Charger      7.2 kWh    -XXXg CO₂        │
  │ [icon] Dryer           3.5 kWh    -XXXg CO₂        │
  │ [icon] Dishwasher      1.2 kWh    -XXXg CO₂        │
  │ [icon] Washer          0.5 kWh    - XXg CO₂        │
  ├─────────────────────────────────────────────────────┤
  │ Total (all appliances) 12.4 kWh   -XXXXg CO₂       │
  └─────────────────────────────────────────────────────┘

  [AI message from nudges[0].message]

  [DetailDisclosure: How savings are calculated]
    Formula: CO₂ saved (g) = appliance kWh × (current MOER − window MOER) × 453.592 g/lb ÷ 1000
    Unit note: 453.592 g/lb converts pounds to grams. Dividing by 1000 converts MWh to kWh.
    Appliance assumptions: EV charger 7.2 kWh, dryer 3.5 kWh, dishwasher 1.2 kWh, washer 0.5 kWh (ENERGY STAR median values).
    Energy note: These appliances use the same kWh regardless of when you run them. The savings shown are carbon savings only.
    Limitation: Based on forecasted MOER. Actual savings depend on real-time grid conditions during the window.
    [Show the actual formula with live numbers if window_avg_moer > 0:
      e.g. "Example: EV charger = 7.2 × ([currentMoer] − [windowMoer]) × 453.592 / 1000 = [result]g"]
```

**Styling for hero card (light mode):**
```jsx
<div className="mt-6 rounded-[24px] border border-green-200 bg-green-50 p-5">
  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600">Optimal window</p>
  <p className="mt-2 font-display text-3xl font-bold text-green-700">{windowTime}</p>
  {windowMoer > 0 && (
    <p className="mt-1 text-sm text-green-600">
      {Math.round(windowMoer)} lbs CO₂/MWh during this window
    </p>
  )}
  <p className="mt-1 text-sm text-slate-500">
    Run all appliances in this window for lowest carbon output.
  </p>
</div>
```

**Styling for savings table:**
```jsx
<div className="mt-5">
  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
    Expected savings vs running right now
  </p>
  <div className="overflow-hidden rounded-[20px] border border-slate-200 divide-y divide-slate-100">
    {nudges.map(nudge => {
      const meta = APPLIANCE_META[nudge.appliance] || APPLIANCE_META.dryer;
      const kwh = APPLIANCE_KWH[nudge.appliance] || 1.0;
      return (
        <div key={nudge.appliance} className="flex items-center justify-between px-4 py-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm"
              style={{ background: `${meta.color}18`, color: meta.color }}>
              {nudge.emoji || meta.icon}
            </div>
            <span className="text-sm font-medium text-gray-900">{meta.label}</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-xs text-slate-400">{kwh} kWh</span>
            <span className="min-w-[80px] text-right text-sm font-semibold text-green-700">
              -{Math.round(nudge.co2_saved_grams || 0)}g CO₂
            </span>
          </div>
        </div>
      );
    })}
    {/* Total row */}
    <div className="flex items-center justify-between bg-green-50 px-4 py-3">
      <span className="text-sm font-bold text-gray-900">Total (all appliances)</span>
      <div className="flex items-center gap-5">
        <span className="text-xs text-slate-400">{totalKwh.toFixed(1)} kWh</span>
        <span className="min-w-[80px] text-right text-sm font-bold text-green-700">
          -{Math.round(totalCo2Saved)}g CO₂
        </span>
      </div>
    </div>
  </div>
</div>
```

**Derived values to compute before render:**
```js
const bestNudge = nudges[0];
const windowTime = bestNudge ? formatBestWindow(bestNudge) : null;
const windowMoer = bestNudge?.window_avg_moer || 0;
const totalCo2Saved = nudges.reduce((sum, n) => sum + (n.co2_saved_grams || 0), 0);
const totalKwh = nudges.reduce((sum, n) => sum + (APPLIANCE_KWH[n.appliance] || 1.0), 0);
```

Remove: the 4-card grid layout (`md:grid-cols-2`), `SpotlightCard`, `hover-lift`, per-appliance window display.
Keep: `APPLIANCE_META`, `APPLIANCE_ORDER`, `sortNudges`, `formatBestWindow`, `StarBorder` refresh button, error state, loading skeleton, `DetailDisclosure`.

---

## Verification Checklist

After all changes, verify:

- [ ] Body background is light (#F8FAFC range), not dark
- [ ] All `text-white` occurrences replaced with appropriate dark text
- [ ] Clean Power Score displays as `47` (large) + `/100` (smaller, gray), baseline-aligned
- [ ] TopBar has white background with light border
- [ ] GridStressGauge SVG arcs visible on light background (not invisible against white)
- [ ] NudgePanel shows one time window, not four appliance cards
- [ ] NudgePanel table shows per-appliance kWh and CO₂ savings
- [ ] NudgePanel total row shows summed values
- [ ] Methodology disclosure explains the formula with units
- [ ] Backend returns same `window_avg_moer` for all 4 nudges (same best window)
- [ ] Forecast chart tooltips readable on light background (not dark-on-dark)
- [ ] Status colors (green/yellow/red) still visible and vibrant on light bg
- [ ] No horizontal scroll introduced on mobile
- [ ] Taxonomy chips still display correctly (sky/emerald/violet on light)
- [ ] `font-semibold text-white` replaced throughout disclosure bodies
