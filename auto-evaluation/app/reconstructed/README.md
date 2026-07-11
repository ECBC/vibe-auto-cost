# Vibe-Auto-Cost Estimator — Phase 2

Deterministic 5-year vehicle cost estimator with reliability radar.

## Quick Start

```bash
cd /workspace/auto-evaluation/app/backend
uvicorn main:app --port 8000
```

Open http://127.0.0.1:8000 in your browser.

## Architecture

- **Backend:** FastAPI (Python 3.11) — `/api/evaluate`, `/api/brands`, `/api/models`, `/api/engines`
- **Frontend:** Static HTML/CSS/JS served by FastAPI — Chart.js via CDN
- **Data:** European Cars Dataset (xlsx, 6000 rows) + UCI Car Evaluation (1728 rows)

## API

```
GET /api/evaluate?make=BMW&model=BMW%20111&engine=Petrol
```

Returns JSON with: status, metadata, reliability_scores, financial_projections, radar_data, yearly_breakdown.

## CORS

CORS: disabled; the frontend is served from the same FastAPI origin. If you need cross-origin usage, enable `CORSMiddleware` with an explicit allowlist.

## Input Contract

The `/api/evaluate` endpoint applies these normalization rules:

- **make / model / engine** are trimmed of leading/trailing whitespace.
- Matching is **case-insensitive** (internally lowercased).
- On fallback, sub-model badges (e.g. "GTI", "TDI") are stripped to find the base model.
- **Empty or whitespace-only `make`** → HTTP 422.
- Non-positive calculated costs → HTTP 422 (guardrail).
- Total 5-year cost capped at €150,000 (flagged in metadata).

## Sample Data Mode

Set `USE_SAMPLE_DATA=true` to run the app with synthetic data (no real archives needed):

```bash
USE_SAMPLE_DATA=true uvicorn backend.main:app --port 8001
```

## Stack

- FastAPI + Uvicorn
- Pydantic v2 (schema validation)
- openpyxl (xlsx parsing)
- Chart.js 4.x (CDN)
