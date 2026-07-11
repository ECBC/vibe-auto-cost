# 2026-07 Phase 2 Contract — Vibe-Auto-Cost Estimator

## Project: auto-evaluation (Vibe-Auto-Cost)

### Workers
- builder: anthropic-claude-opus-4-6 (coding)
- evaluator: minimax-MiniMax-M3 (browser-use via Playwright) — to be started after build

## Task: Build the deterministic 5-year cost-estimator web app

### User Goal (verbatim)
> Execute Phase 2 implementation, building the final web application completely inside the dedicated directory './auto-evaluation/app/'. Use the cloned interface in './autodoc-clone' as your base layout and asset reference. Strictly read, ingest, and adhere to './auto-evaluation/logic_guide_v1.md' (backend) and './auto-evaluation/visual_architecture_101.md' (UI/charts).

### Ground truth (verified by supervisor)
- Workspace root = `/workspace/auto-evaluation/` (Windows: `C:\Users\cc\Documents\vibe-auto-cost\auto-evaluation\`).
- Data already extracted to `./data/extracted_european/EUROPEAN CARS DATASET.xlsx` (6000 rows × 25 cols) and `./data/extracted_uci/car.data` (1728 rows, unheadered, positional: buying,maint,doors,persons,lug_boot,safety,class).
- Python 3.11 + pydantic 2.13 + fastapi 0.139 + openpyxl + uvicorn installed system-wide.
- Phase-1 clone lives at `/workspace/autodoc-clone/` (React + Vite + Tailwind, components in `src/components/`).
- Chromium + Playwright installed at `/app/node_modules/playwright` for the evaluator.

### European dataset schema (REAL — guide assumed CSV, it's xlsx)
Columns: Model Name, Brand, Body Type, Segment, Usable Battery (kWh), Real Range (km), Efficiency (Wh/km), 0–100 km/h (s), Top Speed (km/h), Towing Capacity (kg), Price (EUR), Charging Time (min), Max Charging Power (kW), Horsepower (HP), Torque (Nm), Maintenance Cost (€/year), Seating Capacity, Boot Capacity (L), ADAS Level, Safety Rating (Euro NCAP), Usage Type, Energy Cost (€/100km), Insurance Rating, Powertrain Type, Fuel Type.

### Architecture (decided)
- **Backend:** FastAPI (Python) at `./app/backend/`. Serves `/api/evaluate?make=...&model=...&engine=...` returning the exact JSON schema from logic_guide §4. Pydantic models enforce the schema; guardrails (≤0 rejection, vibe_score ∈ [0,100], >€150k cap+flag) enforced.
- **Frontend:** Static HTML/CSS/JS at `./app/frontend/` (or a single `index.html`). Reuses the Phase-1 autodoc-clone selector as the top section (copy the built `dist/` or re-embed the selector markup). The cost dashboard injects BELOW the selector with id `#evaluation-dashboard-root`, styled per visual_architecture §1 dark tokens.
- **Charts:** Chart.js via CDN. Element 1 = cumulative 5-year cost (fuel yellow `#ffd800`, maintenance orange `#ff8a00`). Element 2 = reliability radar (safety, maint, lug_boot, comfort; fill 0.2, grid `#334155`).
- **Data engine:** Python loads the xlsx + car.data at startup, builds an in-memory index. Heuristic Alignment Matrix (logic_guide §3) maps make→buying tier, engine→maint tier. Fallback: strip sub-model badges → match make + closest engine → else global median.

### Cost formula (logic_guide §4 — deterministic)
- Annual fuel cost = `Energy Cost (€/100km)` × 150 (i.e. 15000km/100) — for ICE. For EV use `Efficiency (Wh/km) × 15000 / 1000 × electricity_rate`. Use the dataset's `Energy Cost (€/100km)` column as the primary driver when present.
- Annual maintenance = UCI `maint` mapped: vhigh=1200, high=850, med=500, low=250. Cross-check with the dataset's `Maintenance Cost (€/year)`; prefer UCI-mapped value per the guide, but use dataset value as the fallback/secondary.
- Total 5-year = (annual_fuel + annual_maintenance) × 5.

### Reliability scores (logic_guide §4 schema)
- `safety_rating`: from dataset `Safety Rating (Euro NCAP)` (0–5) → string label.
- `comfort_rating`: derived (seating, ADAS, boot).
- `overall_vibe_score`: integer [0,100] combining safety + UCI class + comfort.

### Visual tokens (visual_architecture §1 — MANDATORY for the dashboard, distinct from Phase-1 light theme)
```
--autodoc-dark-bg: #22252a;  --autodoc-card-bg: #1b1d22;
--autodoc-brand-yellow: #ffd800;  --autodoc-brand-orange: #ff8a00;
--autodoc-text-main: #ffffff;  --autodoc-text-muted: #94a3b8;  --autodoc-border-gray: #334155;
```
- Dashboard must NOT render above the selector (visual_architecture §4 test).
- Dashboard bg must NOT be white/transparent (evaluator checks `backgroundColor`).
- Hover: `transition: all 0.2s ease-in-out`, gray→orange borders.
- Dropdowns: 4px radius, yellow active outline.

### Acceptance criteria
1. `./app/backend/` runs: `uvicorn main:app` serves `/api/evaluate` returning schema-valid JSON.
2. `./app/frontend/index.html` opens and shows the autodoc selector on top + dashboard area below (initially "waiting for selection").
3. Selecting make/model/engine + clicking Buscar/Evaluate → dashboard animates open, fetches `/api/evaluate`, renders both charts.
4. Pydantic schema matches logic_guide §4 exactly; invalid responses rejected.
5. Guardrails: no ≤0 costs; vibe_score ∈ [0,100]; >€150k capped + flagged.
6. Charts: 5-year cumulative (fuel+maintenance split, brand colors) + reliability radar (4 axes, fill 0.2, gray grid).
7. Dashboard styled with the dark token palette; transparent chart backgrounds.
8. No layout shift / no unstyled white backgrounds / no broken asset paths.
9. Adversarial evaluator script (visual_architecture §4) passes: dashboard below selector, non-white bg, components present.
10. App is self-contained in `./app/`; no reliance on `./autodoc-clone` at runtime (copy needed assets in).

### Validation commands
- `cd ./app/backend && python3 -c "import main; print('ok')"` → imports clean.
- `cd ./app/backend && uvicorn main:app --port 8000 &` → serves; `curl 'http://127.0.0.1:8000/api/evaluate?make=BMW&model=...&engine=...'` → 200 + schema-valid JSON.
- Open `./app/frontend/index.html` (served via a static server) → selector + dashboard render.
- Evaluator runs Playwright against the served app.

### Status
- DONE 2026-07-10 — eval_round_1 verdict ACCEPT (all 15 ACs PASS, numeric evidence). App runs at http://127.0.0.1:8000/. Backend: FastAPI + Pydantic schema + guardrails verified. Frontend: selector-on-top + dark-token dashboard below + 2 Chart.js charts. Builder + evaluator workers stopped.
- POLISH 2026-07-10 (feedback round): Phase-1 CTA hover fixed (button enabled, onClick guard) + 1280 overflow fixed (overflow-x-auto). Phase-2: Chart.js SRI, pinned deps, Dockerfile+Makefile+run.sh, config.py (env ELECTRICITY_RATE/ANNUAL_KM), centralized EV heuristic, zip integrity, a11y (focus-visible + aria-live), 12 pytest tests pass, ruff clean. Submission v2 = gradable formats only (.md/.png).
