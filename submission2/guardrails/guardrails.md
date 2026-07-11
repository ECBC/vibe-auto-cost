# Guardrails (code extracts)

The cost engine enforces hard safety boundaries. Below are the relevant code sections.

## From `backend/load_data.py` — cost engine + guardrails
```python
"""
Data loading, Heuristic Alignment Matrix, and cost calculation engine.
Loads the European Cars xlsx + UCI car.data at import time into in-memory indices.
"""

import csv
import statistics
import zipfile
from pathlib import Path
from typing import Optional

import openpyxl

from config import ANNUAL_KM, ELECTRICITY_RATE

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # /workspace/auto-evaluation
DATA_DIR = BASE_DIR / "data"
EUROPEAN_XLSX = DATA_DIR / "extracted_european" / "EUROPEAN CARS DATASET.xlsx"
UCI_CAR_DATA = DATA_DIR / "extracted_uci" / "car.data"

# ---------------------------------------------------------------------------
# Constants & Centralized Mappings
# ---------------------------------------------------------------------------

# Annual maintenance cost by UCI tier (€/year).
# Based on logic_guide heuristic: vhigh/high for >2.0L engines and EVs,
# med for standard ICE, low for small/efficient ICE.
MAINT_COST_MAP = {"vhigh": 1200, "high": 850, "med": 500, "low": 250}

# Maintenance tier mapping policy:
# - Electric vehicles → "high" (battery/electronics complexity, consistent with
#   guide's vhigh/high classification for >2.0L and EV drivetrains)
# - Hybrid → "med" (mixed drivetrain offsets EV complexity)
# - ICE HP > 200 → "high" (performance engines)
# - ICE HP < 120 → "low" (small efficient engines)
# - Default → "med"
# To change EV policy: edit _get_maint_tier() below.
MAINT_TIER_POLICY = {
    "electric": "high",
    "hybrid": "med",
    "high_hp_threshold": 200,  # HP above this → "high"
    "low_hp_threshold": 120,   # HP below this → "low"
    "default": "med",
}

# Fuel type mapping for energy cost calculation:
# - Electric: uses Efficiency (Wh/km) × ELECTRICITY_RATE
# - All others: uses Energy Cost (€/100km) from dataset
FUEL_POLICY = {
    "electric_uses_wh_km": True,  # If True, EV cost = Wh/km × km × rate
    "fallback_energy_cost": 8.0,  # €/100km if no data available
    "fallback_maint_cost": 500.0,  # €/year if no data available
}

PREMIUM_BRANDS = {
    "bmw", "mercedes-benz", "mercedes", "audi", "porsche", "lexus",
    "jaguar", "maserati", "bentley", "ferrari", "lamborghini",
    "aston martin", "rolls-royce", "tesla", "ds automobiles",
}

# ---------------------------------------------------------------------------
# In-memory stores (populated by load_all())
# ---------------------------------------------------------------------------
european_records: list[dict] = []
european_by_brand: dict[str, list[dict]] = {}
european_by_brand_model: dict[tuple[str, str], list[dict]] = {}
uci_records: list[dict] = []
global_median_fuel: float = 0.0
global_median_maint: float = 0.0
all_brands: list[str] = []
models_by_brand: dict[str, list[str]] = {}
engines_by_brand_model: dict[str, list[str]] = {}


def _extract_if_missing():
    """Re-extract zips if the extracted directories are missing (reproducibility)."""
    euro_zip = DATA_DIR / "archive.zip"
    uci_zip = DATA_DIR / "car+evaluation.zip"

    for zip_path, target_dir, desc in [
        (euro_zip, DATA_DIR / "extracted_european", "European Cars archive"),
        (uci_zip, DATA_DIR / "extracted_uci", "UCI car evaluation archive"),
    ]:
        target_files = list(target_dir.glob("*")) if target_dir.exists() else []
        if target_files:
            continue  # Already extracted
        if not zip_path.exists():
            raise FileNotFoundError(
                f"{desc} not found at {zip_path}. "
                "Please place the data archive in the data/ directory."
            )
        if not zipfile.is_zipfile(zip_path):
            raise ValueError(
                f"{desc} at {zip_path} is not a valid zip file (corrupted?)."
            )
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(target_dir)


def _load_european():
    """Load the European Cars xlsx into memory."""
    global european_records, european_by_brand, european_by_brand_model
    global global_median_fuel, global_median_maint, all_brands, models_by_brand, engines_by_brand_model

    wb = openpyxl.load_workbook(str(EUROPEAN_XLSX), read_only=True, data_only=True)
    ws = wb.active
    headers = [cell.value for cell in ws[1]]

    for row in ws.iter_rows(min_row=2, values_only=True):
        rec = dict(zip(headers, row))
        if not rec.get("Brand"):
            continue
        european_records.append(rec)
        brand_lower = rec["Brand"].strip().lower()
        european_by_brand.setdefault(brand_lower, []).append(rec)
        model_name = (rec.get("Model Name") or "").strip().lower()
        european_by_brand_model.setdefault((brand_lower, model_name), []).append(rec)

    wb.close()

    # Compute global medians for fallback
    fuel_costs = [r["Energy Cost (€/100km)"] for r in european_records if r.get("Energy Cost (€/100km)") and r["Energy Cost (€/100km)"] > 0]
    maint_costs = [r["Maintenance Cost (€/year)"] for r in european_records if r.get("Maintenance Cost (€/year)") and r["Maintenance Cost (€/year)"] > 0]
    global_median_fuel = statistics.median(fuel_costs) if fuel_costs else 8.0
    global_median_maint = statistics.median(maint_costs) if maint_costs else 500.0

    # Build dropdown data
    brand_set = sorted(set(r["Brand"].strip() for r in european_records if r.get("Brand")))
    all_brands.extend(brand_set)
    for rec in european_records:
        brand = rec["Brand"].strip()
        model = rec.get("Model Name", "").strip()
        fuel = rec.get("Fuel Type", "").strip()
        if model:
            models_by_brand.setdefault(brand, [])
            if model not in models_by_brand[brand]:
                models_by_brand[brand].append(model)
        if model and fuel:
            key = f"{brand}|{model}"
            engines_by_brand_model.setdefault(key, [])
            if fuel not in engines_by_brand_model[key]:
                engines_by_brand_model[key].append(fuel)


def _load_uci():
    """Load UCI car.data (unheadered CSV)."""
    global uci_records
    UCI_COLS = ["buying", "maint", "doors", "persons", "lug_boot", "safety", "class"]
    with open(UCI_CAR_DATA, "r") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) == 7:
                uci_records.append(dict(zip(UCI_COLS, [v.strip() for v in row])))


def load_all():
    """Load all datasets. Called once at app startup."""
    _extract_if_missing()
    _load_european()
    _load_uci()


# ---------------------------------------------------------------------------
# Heuristic Alignment Matrix
# ---------------------------------------------------------------------------

def _get_buying_tier(make: str) -> str:
    """Map make to UCI buying tier."""
    if make.lower() in PREMIUM_BRANDS:
        return "vhigh"
    return "med"


def _get_maint_tier(engine: str, horsepower: Optional[float] = None) -> str:
    """Map engine type to UCI maint tier (see MAINT_TIER_POLICY above)."""
    engine_lower = engine.lower() if engine else ""
    if "electric" in engine_lower:
        return MAINT_TIER_POLICY["electric"]
    if "hybrid" in engine_lower:
        return MAINT_TIER_POLICY["hybrid"]
    if horsepower and horsepower > MAINT_TIER_POLICY["high_hp_threshold"]:
        return "high"
    if horsepower and horsepower < MAINT_TIER_POLICY["low_hp_threshold"]:
        return "low"
    return MAINT_TIER_POLICY["default"]


def _find_uci_matches(buying_tier: str, maint_tier: str) -> list[dict]:
    """Find UCI records matching the buying and maint tiers."""
    matches = [r for r in uci_records if r["buying"] == buying_tier and r["maint"] == maint_tier]
    if not matches:
        # Relax: match just buying tier
        matches = [r for r in uci_records if r["buying"] == buying_tier]
    if not matches:
        matches = uci_records  # all as fallback
    return matches


def _strip_model(model: str) -> str:
    """Strip sub-model badges to get base model name."""
    # Remove common suffixes like GTI, TDI, etc.
    parts = model.strip().split()
    if len(parts) > 1:
        # Return first 1-2 significant words
        return parts[0]
    return model.strip()


def _find_european_match(make: str, model: str, engine: str) -> tuple[list[dict], str]:
    """
    Find European dataset records for given make/model/engine.
    Returns (matching_records, match_type).
    Fallback chain: exact model → stripped model → brand + engine → brand → global median.
    """
    brand_lower = make.strip().lower()
    model_lower = model.strip().lower()
    engine_lower = engine.strip().lower() if engine else ""

    # 1. Exact brand + model match
    key = (brand_lower, model_lower)
    if key in european_by_brand_model:
        recs = european_by_brand_model[key]
        # Filter by engine/fuel if possible
        fuel_filtered = [r for r in recs if r.get("Fuel Type", "").lower() == engine_lower]
        if fuel_filtered:
            return fuel_filtered, "exact"
        return recs, "exact_no_fuel"

    # 2. Strip model and try again
    stripped = _strip_model(model_lower)
    for k, v in european_by_brand_model.items():
        if k[0] == brand_lower and stripped in k[1]:
            fuel_filtered = [r for r in v if r.get("Fuel Type", "").lower() == engine_lower]
            if fuel_filtered:
                return fuel_filtered, "stripped"
            return v, "stripped_no_fuel"

    # 3. Brand match with engine filter
    if brand_lower in european_by_brand:
        brand_recs = european_by_brand[brand_lower]
        fuel_filtered = [r for r in brand_recs if r.get("Fuel Type", "").lower() == engine_lower]
        if fuel_filtered:
            return fuel_filtered, "brand_fuel"
        return brand_recs, "brand_only"

    # 4. Global fallback (empty list triggers median usage)
    return [], "global_fallback"


# ---------------------------------------------------------------------------
# Cost Calculation Engine
# ---------------------------------------------------------------------------

def calculate_evaluation(make: str, model: str, engine: str) -> dict:
    """
    Main evaluation function. Returns the full response dict
    conforming to the logic_guide §4 schema.
    """
    euro_matches, match_type = _find_european_match(make, model, engine)

    # Determine buying/maint tiers for UCI alignment
    buying_tier = _get_buying_tier(make)

    # Get average horsepower from matches for maint tier heuristic
    avg_hp = None
    if euro_matches:
        hps = [r["Horsepower (HP)"] for r in euro_matches if r.get("Horsepower (HP)") and r["Horsepower (HP)"] > 0]
        if hps:
            avg_hp = statistics.mean(hps)

    maint_tier = _get_maint_tier(engine, avg_hp)

    # UCI alignment
    uci_matches = _find_uci_matches(buying_tier, maint_tier)

    # --- Financial Projections ---
    # Annual fuel cost
    if euro_matches:
        fuel_values = [r["Energy Cost (€/100km)"] for r in euro_matches if r.get("Energy Cost (€/100km)") and r["Energy Cost (€/100km)"] > 0]
        if fuel_values:
            energy_cost_per_100km = statistics.mean(fuel_values)
        else:
            energy_cost_per_100km = global_median_fuel
    else:
        energy_cost_per_100km = global_median_fuel

    annual_fuel_cost = energy_cost_per_100km * (ANNUAL_KM / 100)

    # For EV: use Efficiency (Wh/km) if available
    if engine and "electric" in engine.lower() and euro_matches:
        eff_values = [r["Efficiency (Wh/km)"] for r in euro_matches if r.get("Efficiency (Wh/km)") and r["Efficiency (Wh/km)"] > 0]
        if eff_values:
            avg_eff = statistics.mean(eff_values)
            annual_fuel_cost = avg_eff * ANNUAL_KM / 1000 * ELECTRICITY_RATE

    # Annual maintenance cost (UCI-mapped primary, dataset fallback)
    annual_maintenance_cost = float(MAINT_COST_MAP.get(maint_tier, 500))

    # Total 5-year
    total_5_year_cost = (annual_fuel_cost + annual_maintenance_cost) * 5

    # --- Guardrails ---
    flagged = False
    if total_5_year_cost > 150000:
        total_5_year_cost = 150000.0
        flagged = True

    # --- Reliability Scores ---
    # Safety from European dataset
    if euro_matches:
        safety_vals = [r["Safety Rating (Euro NCAP)"] for r in euro_matches if r.get("Safety Rating (Euro NCAP)")]
        avg_safety = statistics.mean([float(s) for s in safety_vals if s]) if safety_vals else 3.0
    else:
        avg_safety = 3.0

    safety_labels = {5: "Excellent", 4: "Good", 3: "Average", 2: "Below Average", 1: "Poor", 0: "Not Rated"}
    safety_rating = safety_labels.get(round(avg_safety), "Average")

    # Comfort rating from boot capacity + seating + ADAS
    if euro_matches:
        boot_vals = [r["Boot Capacity (L)"] for r in euro_matches if r.get("Boot Capacity (L)") and r["Boot Capacity (L)"] > 0]
        seat_vals = [r["Seating Capacity"] for r in euro_matches if r.get("Seating Capacity") and r["Seating Capacity"] > 0]
        avg_boot = statistics.mean(boot_vals) if boot_vals else 350
        avg_seats = statistics.mean(seat_vals) if seat_vals else 5
    else:
        avg_boot = 350
        avg_seats = 5

    comfort_score = min(100, (avg_boot / 600 * 40) + (avg_seats / 7 * 30) + (avg_safety / 5 * 30))
    if comfort_score >= 75:
        comfort_rating = "Excellent"
    elif comfort_score >= 55:
        comfort_rating = "Good"
    elif comfort_score >= 35:
        comfort_rating = "Average"
    else:
        comfort_rating = "Below Average"

    # Overall vibe score: combines safety + UCI class distribution + comfort
    uci_class_scores = {"vgood": 100, "good": 75, "acc": 50, "unacc": 25}
    if uci_matches:
        class_vals = [uci_class_scores.get(r["class"], 50) for r in uci_matches]
        avg_class = statistics.mean(class_vals)
    else:
        avg_class = 50

    overall_vibe_score = int(round(
        (avg_safety / 5 * 35) +  # 35% safety
        (avg_class / 100 * 35) +  # 35% UCI class
        (comfort_score / 100 * 30)  # 30% comfort
    ))
    # Clamp [0, 100]
    overall_vibe_score = max(0, min(100, overall_vibe_score))

    # --- Radar chart data (for frontend) ---
    # Map UCI safety distribution
    safety_map = {"high": 5, "med": 3, "low": 1}
    uci_safety_vals = [safety_map.get(r["safety"], 3) for r in uci_matches] if uci_matches else [3]
    radar_safety = statistics.mean(uci_safety_vals) / 5 * 100

    # Maintenance (inverted: low maint = high score)
    maint_inv_map = {"low": 100, "med": 65, "high": 35, "vhigh": 10}
    radar_maint = maint_inv_map.get(maint_tier, 50)

    # Boot capacity
    lug_map = {"big": 90, "med": 60, "small": 30}
    uci_lug_vals = [lug_map.get(r["lug_boot"], 50) for r in uci_matches] if uci_matches else [50]
    radar_boot = statistics.mean(uci_lug_vals)

    # Comfort (reuse comfort_score)
    radar_comfort = comfort_score

    return {
        "status": "success",
        "metadata": {
            "requested_make": make,
            "requested_model": model,
            "matched_records": len(euro_matches),
            "flagged": flagged,
        },
        "reliability_scores": {
            "safety_rating": safety_rating,
            "comfort_rating": comfort_rating,
            "overall_vibe_score": overall_vibe_score,
        },
        "financial_projections": {
            "annual_fuel_cost": round(annual_fuel_cost, 2),
            "annual_maintenance_cost": round(annual_maintenance_cost, 2),
            "total_5_year_cost": round(total_5_year_cost, 2),
        },
        "radar_data": {
            "safety": round(radar_safety, 1),
            "maintenance": round(radar_maint, 1),
            "boot_capacity": round(radar_boot, 1),
            "comfort": round(radar_comfort, 1),
        },
        "yearly_breakdown": [
            {
                "year": y,
                "cumulative_fuel": round(annual_fuel_cost * y, 2),
                "cumulative_maintenance": round(annual_maintenance_cost * y, 2),
            }
            for y in range(1, 6)
        ],
    }
```

## From `backend/main.py` — API validation / 422 guardrail
```python
"""
Vibe-Auto-Cost Phase 2 — FastAPI Backend
Serves /api/evaluate and static frontend files.
"""

import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from load_data import load_all, calculate_evaluation, all_brands, models_by_brand, engines_by_brand_model

# ---------------------------------------------------------------------------
# Pydantic Models (logic_guide §4 schema)
# ---------------------------------------------------------------------------

class ReliabilityScores(BaseModel):
    safety_rating: str
    comfort_rating: str
    overall_vibe_score: int = Field(ge=0, le=100)


class FinancialProjections(BaseModel):
    annual_fuel_cost: float
    annual_maintenance_cost: float
    total_5_year_cost: float


class Metadata(BaseModel):
    requested_make: str
    requested_model: str
    matched_records: int
    flagged: bool = False


class YearBreakdown(BaseModel):
    year: int
    cumulative_fuel: float
    cumulative_maintenance: float


class RadarData(BaseModel):
    safety: float
    maintenance: float
    boot_capacity: float
    comfort: float


class EvaluateResponse(BaseModel):
    status: str
    metadata: Metadata
    reliability_scores: ReliabilityScores
    financial_projections: FinancialProjections
    radar_data: RadarData
    yearly_breakdown: list[YearBreakdown]


# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Vibe-Auto-Cost Estimator", version="2.0.0")

# Load data at startup
@app.on_event("startup")
def startup_load():
    load_all()


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/evaluate", response_model=EvaluateResponse)
def evaluate(
    make: str = Query(..., description="Vehicle brand/make"),
    model: str = Query("", description="Vehicle model name"),
    engine: str = Query("", description="Engine/fuel type"),
):
    """Evaluate 5-year cost and reliability for a vehicle."""
    if not make or not make.strip():
        raise HTTPException(status_code=422, detail="Make parameter is required and must be non-empty.")

    result = calculate_evaluation(make.strip(), model.strip(), engine.strip())

    # Guardrail: reject ≤0 costs
    fp = result["financial_projections"]
    if fp["annual_fuel_cost"] <= 0 or fp["annual_maintenance_cost"] <= 0 or fp["total_5_year_cost"] <= 0:
        raise HTTPException(
            status_code=422,
            detail="Calculation produced non-positive cost values. Input may be invalid."
        )

    # Validate through Pydantic (will raise if schema violated)
    response = EvaluateResponse(**result)
    return response


@app.get("/api/brands")
def get_brands():
    """Return list of available brands for the selector."""
    return {"brands": all_brands}


@app.get("/api/models")
def get_models(brand: str = Query(...)):
    """Return models for a given brand."""
    return {"models": models_by_brand.get(brand, [])}


@app.get("/api/engines")
def get_engines(brand: str = Query(...), model: str = Query(...)):
    """Return engine/fuel types for a given brand+model."""
    key = f"{brand}|{model}"
    return {"engines": engines_by_brand_model.get(key, [])}


# ---------------------------------------------------------------------------
# Static Frontend Serving
# ---------------------------------------------------------------------------

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


@app.get("/")
def serve_index():
    """Serve the main index.html."""
    return FileResponse(str(FRONTEND_DIR / "index.html"))


# Mount static assets (CSS, JS, images, fonts)
app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
```
