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

## Stack

- FastAPI + Uvicorn
- Pydantic v2 (schema validation)
- openpyxl (xlsx parsing)
- Chart.js 4.x (CDN)
