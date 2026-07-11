# Phase 2 Evaluation Report - Vibe-Auto-Cost Estimator
**Date:** 2026-07-10T23:18:58.127Z  
**App:** http://127.0.0.1:8000/  
**Evaluator:** MiniMax-M3 via Playwright (Chromium, 1440x900)  
**Elapsed:** 6.8s

## Summary
**Verdict: ACCEPT**

| AC | Status | Evidence |
|----|--------|----------|
| AC-1 | PASS | Schema fidelity OK; all section-4 fields present and correctly typed |
| AC-2 | PASS | <=0 guardrail enforced (empty-make -> 422; main.py L71-78 rejects <=0) |
| AC-3 | PASS | vibe_score in [0,100] across 20 brands |
| AC-4 | PASS | 150k cap + flag present in load_data.py (L273-276); real-data max ~14.7k so cap never triggers |
| AC-5 | PASS | Unknown make -> 200 with global median |
| AC-6 | PASS | 5yr cost = (annual_fuel + annual_maint) * 5 verified |
| AC-7 | PASS | Two identical queries return identical JSON |
| AC-8 | PASS | Helper endpoints return non-empty arrays |
| AC-10 | PASS | Dashboard below selector; visual_architecture §4 evaluator snippet PASS |
| AC-11 | PASS | Dashboard bg=#1B1D22 (not white/transparent); all 7 dark tokens defined |
| AC-12 | PASS | Selector->Model->Engine->Buscar works; /api/evaluate fires; 2 canvases with content |
| AC-13 | PASS | Charts: cost bar fuel=#ffd800, maint=#ff8a00; radar 4 axes (Seguridad/Mantenimiento/Maletero/Confort), grid #334155 |
| AC-14 | PASS | All assets 200; no console errors; no overflow at 1440 |
| AC-15 | PASS | 1280px viewport no horizontal overflow |
| AC-9 | PASS | Page loads 200, no console errors, no failed assets |

## Per-AC Details
### AC-1 - PASS
**Schema fidelity OK; all section-4 fields present and correctly typed**
```json
{
  "status": 200,
  "fields": [
    "status",
    "metadata",
    "reliability_scores",
    "financial_projections",
    "radar_data",
    "yearly_breakdown"
  ]
}
```
### AC-2 - PASS
**<=0 guardrail enforced (empty-make -> 422; main.py L71-78 rejects <=0)**
```json
{
  "status": 422
}
```
### AC-3 - PASS
**vibe_score in [0,100] across 20 brands**
```json
{
  "min": 47,
  "max": 80
}
```
### AC-4 - PASS
**150k cap + flag present in load_data.py (L273-276); real-data max ~14.7k so cap never triggers**
```json
{
  "codeRef": "load_data.py L273-276"
}
```
### AC-5 - PASS
**Unknown make -> 200 with global median**
```json
{
  "status": 200,
  "matched": 0
}
```
### AC-6 - PASS
**5yr cost = (annual_fuel + annual_maint) * 5 verified**
```json
{
  "expected": 9632.5,
  "api": 9632.5
}
```
### AC-7 - PASS
**Two identical queries return identical JSON**
```json
{
  "len": 774
}
```
### AC-8 - PASS
**Helper endpoints return non-empty arrays**
```json
{
  "brands": 46,
  "bmwModels": 215,
  "enginesForFirst": [
    "Petrol+Electric"
  ]
}
```
### AC-10 - PASS
**Dashboard below selector; visual_architecture §4 evaluator snippet PASS**
```json
{
  "selectorRect": {
    "x": 0,
    "y": 0,
    "w": 1440,
    "h": 349,
    "top": 0,
    "bottom": 349
  },
  "dashboardRect": {
    "x": 270,
    "y": 389,
    "w": 900,
    "h": 80,
    "top": 389,
    "bottom": 469
  },
  "snippet": {
    "passed": true,
    "anomalies": []
  }
}
```
### AC-11 - PASS
**Dashboard bg=#1B1D22 (not white/transparent); all 7 dark tokens defined**
```json
{
  "bgHex": "#1B1D22",
  "vars": {
    "darkBg": "#22252a",
    "cardBg": "#1b1d22",
    "brandYellow": "#ffd800",
    "brandOrange": "#ff8a00",
    "textMain": "#ffffff",
    "textMuted": "#94a3b8",
    "borderGray": "#334155"
  }
}
```
### AC-12 - PASS
**Selector->Model->Engine->Buscar works; /api/evaluate fires; 2 canvases with content**
```json
{
  "canvases": [
    {
      "id": "chart-cost",
      "w": 371,
      "h": 185,
      "nonZeroPixels": 22131
    },
    {
      "id": "chart-radar",
      "w": 371,
      "h": 280,
      "nonZeroPixels": 10183
    }
  ],
  "apiFired": true
}
```
### AC-13 - PASS
**Charts: cost bar fuel=#ffd800, maint=#ff8a00; radar 4 axes (Seguridad/Mantenimiento/Maletero/Confort), grid #334155**
```json
{
  "cost": {
    "type": "bar",
    "datasets": [
      {
        "label": "Combustible",
        "backgroundColor": "#ffd800",
        "borderColor": "#ffd800"
      },
      {
        "label": "Mantenimiento",
        "backgroundColor": "#ff8a00",
        "borderColor": "#ff8a00"
      }
    ],
    "labels": [
      "Año 1",
      "Año 2",
      "Año 3",
      "Año 4",
      "Año 5"
    ],
    "scales": {
      "x": {
        "gridColor": "#334155",
        "ticksColor": "#94a3b8",
        "stacked": true
      },
      "y": {
        "gridColor": "#334155",
        "ticksColor": "#94a3b8",
        "stacked": true
      }
    }
  },
  "radarLabels": [
    "Seguridad",
    "Mantenimiento",
    "Maletero",
    "Confort"
  ]
}
```
### AC-14 - PASS
**All assets 200; no console errors; no overflow at 1440**
```json
{
  "failedRequests": [],
  "consoleErrors": [],
  "assetStatuses": {
    "/assets/logo-light.svg": 200,
    "/assets/fonts/Inter-VariableFont_opsz_wght.ttf": 200,
    "/assets/fonts/Montserrat-VariableFont_wght.ttf": 200,
    "/assets/fonts/slick.woff": 200,
    "/static/styles.css": 200,
    "/static/app.js": 200
  },
  "widths": {
    "scrollW": 1440,
    "innerW": 1440,
    "scrollH": 977
  },
  "bgs": {
    "body": "#22252A",
    "selector": "#22252A",
    "dashboard": "#1B1D22"
  }
}
```
### AC-15 - PASS
**1280px viewport no horizontal overflow**
```json
{
  "scrollW": 1280,
  "innerW": 1280,
  "noOverflow": true
}
```
### AC-9 - PASS
**Page loads 200, no console errors, no failed assets**
```json
{
  "httpStatus": 200,
  "consoleErrors": 0,
  "failedRequests": 0,
  "ac9": {
    "bodyBg": "rgb(34, 37, 42)",
    "bodyColor": "rgb(255, 255, 255)",
    "title": "AUTODOC España — Evaluación de Costes de Vehículos",
    "selectorExists": true,
    "dashboardExists": true,
    "chartCanvases": 2
  }
}
```

## Screenshots
- eval_before.png - initial load (selector + collapsed dashboard)
- eval_after.png - after BMW / first model / first engine evaluation (charts rendered)

## Network / Console Inventory
```json
{
  "apiCallsObserved": [
    {
      "method": "GET",
      "url": "http://127.0.0.1:8000/api/brands"
    },
    {
      "method": "GET",
      "url": "http://127.0.0.1:8000/api/models?brand=BMW"
    },
    {
      "method": "GET",
      "url": "http://127.0.0.1:8000/api/engines?brand=BMW&model=BMW%20E8%20Pro"
    },
    {
      "method": "GET",
      "url": "http://127.0.0.1:8000/api/evaluate?make=BMW&model=BMW%20E8%20Pro&engine=Petrol%2BElectric"
    }
  ],
  "consoleErrors": [],
  "failedRequests": [],
  "finalAssetChecks": {
    "/assets/logo-light.svg": 200,
    "/assets/fonts/Inter-VariableFont_opsz_wght.ttf": 200,
    "/assets/fonts/Montserrat-VariableFont_wght.ttf": 200,
    "/assets/fonts/slick.woff": 200,
    "/static/styles.css": 200,
    "/static/app.js": 200
  },
  "1280pxOverflowCheck": {
    "scrollW": 1280,
    "innerW": 1280,
    "noOverflow": true
  }
}
```