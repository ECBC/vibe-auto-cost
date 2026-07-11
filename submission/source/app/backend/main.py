"""
Vibe-Auto-Cost Phase 2 — FastAPI Backend
Serves /api/evaluate and static frontend files.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from pathlib import Path
import sys

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
