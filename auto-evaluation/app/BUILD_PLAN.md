# Phase 2 Build Plan — Vibe-Auto-Cost Estimator
**Date:** 2026-07-10 | **Builder:** AdaL (claude-opus-4-6)

## File Structure
```
app/
├── BUILD_PLAN.md
├── README.md
├── requirements.txt
├── backend/
│   ├── __init__.py
│   ├── main.py          # FastAPI app, Pydantic models, /api/evaluate, static mount
│   └── load_data.py     # xlsx + car.data loader, alignment matrix, cost calculator
├── frontend/
│   ├── index.html       # Selector + dashboard shell
│   ├── app.js           # Fetch + Chart.js rendering
│   ├── styles.css       # Dark tokens + selector styles
│   └── assets/
│       ├── logo-light.svg
│       ├── fonts/ (Inter, Montserrat, slick)
│       └── banners/
└── screenshot.png       # Playwright verification artifact
```

## Pydantic Schema (logic_guide §4)
```python
class ReliabilityScores(BaseModel):
    safety_rating: str
    comfort_rating: str
    overall_vibe_score: int  # [0, 100]

class FinancialProjections(BaseModel):
    annual_fuel_cost: float
    annual_maintenance_cost: float
    total_5_year_cost: float

class Metadata(BaseModel):
    requested_make: str
    requested_model: str
    matched_records: int
    flagged: bool = False

class EvaluateResponse(BaseModel):
    status: str  # "success"
    metadata: Metadata
    reliability_scores: ReliabilityScores
    financial_projections: FinancialProjections
```

## Alignment Matrix Pseudocode
```
1. Load xlsx → dict keyed by (Brand_lower, ModelName_lower)
2. Load car.data → 1728 rows with columns [buying, maint, doors, persons, lug_boot, safety, class]
3. On query (make, model, engine):
   a. Determine buying_tier: premium brands (BMW,Mercedes,Audi,Porsche,etc) → vhigh/high; volume → med/low
   b. Determine maint_tier: engine>2.0L or EV → vhigh/high; ≤1.4L or hybrid → low/med; else med
   c. Find UCI rows matching (buying_tier, maint_tier) → extract safety, lug_boot distributions
   d. Search xlsx for exact (Brand, Model) match → get Energy Cost, Maintenance Cost, Safety Rating, etc.
   e. Fallback: strip sub-model badges → match Brand + closest engine → global median
4. Calculate costs per formula
5. Apply guardrails (≤0 → 422, vibe_score clamp, >150k cap+flag)
```

## Frontend Injection Approach
- Self-contained index.html served by FastAPI static mount
- Top section: autodoc-style selector with dark header, logo, make/model/engine dropdowns
- Bottom section: `#evaluation-dashboard-root` (hidden initially, dark bg `#1b1d22`)
- On evaluate click: fetch /api/evaluate → animate dashboard open → render Chart.js charts
- Selector has id `#car-selection-container` for evaluator test
- Spanish labels preserved (Marca, Modelo, Motor, Buscar)

## Chart Config
- Chart 1 (bar): type='bar', stacked, x=[Año 1..5], datasets: fuel (#ffd800), maint (#ff8a00), transparent bg
- Chart 2 (radar): type='radar', labels=[Seguridad, Mantenimiento, Maletero, Confort], fill opacity 0.2, grid #334155

## Assets Copied from autodoc-clone
- logo-light.svg
- fonts/Inter-VariableFont_opsz_wght.ttf
- fonts/Montserrat-VariableFont_wght.ttf
- fonts/slick.woff
- banners/ (all)

## Column Adaptations
- Guide assumed CSV with `Engine_Capacity` — actual xlsx has no explicit engine capacity column.
  Using `Powertrain Type` + `Fuel Type` for engine classification.
  EV detection: Fuel Type == "Electric" or Powertrain Type contains "Electric".
  Engine size heuristic: not directly available; use Horsepower as proxy (>200HP → high maint tier).
- `Energy Cost (€/100km)` column exists and is used directly for fuel cost.
- `Maintenance Cost (€/year)` exists as fallback when UCI mapping unavailable.
