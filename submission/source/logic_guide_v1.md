# Auto-Evaluation Logic & Data Ingestion Guide v1

> **TL;DR:** Two-agent engineering loop (Builder + Evaluator) unzipping, parsing, and merging the European Cars dataset and the UCI Car Evaluation dataset to drive a deterministic 5-year financial/reliability backend engine within `/workspace/auto-evaluation/`.
> **Core Objective:** Map text inputs from the cloned `autodoc.es` vehicle dropdowns to structured categorical rules, calculate projections with strict mathematical boundaries, and return schema-validated JSON.

---

## 1. Agent Architecture & Execution Workspace

For Phase 2, the **Builder** and **Evaluator** operate inside the `/workspace/auto-evaluation/` directory. The absolute Windows directory `C:\Users\cc\Documents\vibe-auto-cost\` maps directly to `/workspace/` inside the Docker layer.

### Workspace File Map
* **Source UI Components:** `./autodoc-clone/` (The assets generated in Phase 1)
* **Target Application Directory:** `./auto-evaluation/`
* **Data Vault:** `./auto-evaluation/data/archive.zip` and `./auto-evaluation/data/car+evaluation.zip`
* **Execution Logs:** `./logs/phase2_adaptation.log`

---

## 2. Automated Data Ingestion Pipeline (The Zip Matrix)

The Builder agent must verify, unzip, and extract the source datasets using automated bash utilities. Do not attempt to read data directly out of an unextracted `.zip` file.

### Step 1: Verification & Extraction
The agent will execute an extraction script via its shell execution layer to process both compressed archives:

```bash
mkdir -p ./auto-evaluation/data/extracted_european/
mkdir -p ./auto-evaluation/data/extracted_uci/

# Unzip European Cars Dataset
unzip -q ./auto-evaluation/data/archive.zip -d ./auto-evaluation/data/extracted_european/

# Unzip UCI Car Evaluation Dataset
unzip -q ./auto-evaluation/data/car+evaluation.zip -d ./auto-evaluation/data/extracted_uci/
```

### Step 2: Source File Schema Identification
Once extracted, the agent must treat the following files as the ground truth schemas:
1.  **European Cars Data:** Look for `.csv` files inside `extracted_european/` containing columns: `Make`, `Model`, `Year`, `Engine_Capacity`, `Fuel_Type`, `KMs_Driven` (or equivalent metrics).
2.  **UCI Car Evaluation Data:** Look for `car.data` or `car.csv` inside `extracted_uci/`. Columns are unheadered by default and follow this positional order:
    * `vhigh`, `high`, `med`, `low` (Buying price → mapped to `buying`)
    * `vhigh`, `high`, `med`, `low` (Maintenance price → mapped to `maint`)
    * `2`, `3`, `4`, `5more` (Number of doors → mapped to `doors`)
    * `2`, `4`, `more` (Capacity in terms of persons → mapped to `persons`)
    * `small`, `med`, `big` (Size of luggage boot → mapped to `lug_boot`)
    * `low`, `med`, `high` (Estimated safety of the car → mapped to `safety`)
    * `unacc`, `acc`, `good`, `vgood` (Evaluation class → mapped to `class`)

---

## 3. Data Merging & Heuristic Alignment Contract

Because the UCI dataset uses generalized qualitative classifications (`vhigh`, `med`, `low`) and the European dataset uses explicit quantitative realities (exact models, fuel types, and engine sizes), the backend engine must utilize an **Algorithmic Alignment Matrix** to map real-world vehicle selections to predictive values.

| Selected Dropdown Metric | European Dataset Match | UCI Class Categorization Heuristic |
|---|---|---|
| Premium Brands (BMW, Mercedes, Audi) | Match exact `Make` | Map `buying` to `vhigh` or `high` |
| Volume Brands (Ford, Opel, Renault) | Match exact `Make` | Map `buying` to `med` or `low` |
| Engine Capacity > 2.0L or Electric | Match `Engine_Capacity` / `Fuel_Type` | Map `maint` to `vhigh` or `high` |
| Engine Capacity <= 1.4L or Hybrid | Match `Engine_Capacity` / `Fuel_Type` | Map `maint` to `low` or `med` |

### Fallback Resolution Engine
If a user selects a highly specific vehicle variant from the Autodoc dropdown that exists in the frontend code but does not have an identical text match in the underlying CSV records:
1. Strip localized sub-model badges (e.g., "Golf GTI 2.0 TDI" becomes "Golf").
2. Match solely based on the parent `Make` and the closest segment classification (`Engine_Capacity` match).
3. If no match is found, apply the global median values of the `archive.zip` dataset to prevent application failure.

---

## 4. Backend Engineering & Guardrails Contract

The backend calculation engine must be structured deterministically. All pricing, cost projections, and reliability analytics must pass validation gates before hitting the frontend view.

### The 5-Year Financial Projection Formula
The total projected lifetime operational cost is defined by the following logic:

* **Annual Fuel Cost:** Calculated by multiplying the engine efficiency factors (derived from `Fuel_Type` and `Engine_Capacity` in the European dataset) by a standardized annual mileage constant of 15,000 KM.
* **Annual Maintenance Cost:** Derived directly from the UCI `maint` category, translating text tokens to financial values:
    * `vhigh` = €1,200 / year
    * `high` = €850 / year
    * `med` = €500 / year
    * `low` = €250 / year

**Total 5-Year Cost = (Annual Fuel Cost + Annual Maintenance Cost) × 5**

### Structured JSON Output Schema
Every calculation must conform to this strict JSON contract. Responses failing this schema must be instantly intercepted, discarded, and retried:

```json
{
  "status": "success",
  "metadata": {
    "requested_make": "string",
    "requested_model": "string",
    "matched_records": "integer"
  },
  "reliability_scores": {
    "safety_rating": "string", 
    "comfort_rating": "string",
    "overall_vibe_score": "integer" 
  },
  "financial_projections": {
    "annual_fuel_cost": "float",
    "annual_maintenance_cost": "float",
    "total_5_year_cost": "float"
  }
}
```

### Safety Parameter Enforcements
* **Zero and Negative Prevention:** Any cost calculation yielding an output of `≤ 0` must throw an application exception.
* **Reliability Cap:** The `overall_vibe_score` metric must be mathematically constrained to a strict `[0, 100]` percentage interval.
* **Upper Boundary Filter:** If `total_5_year_cost` exceeds €150,000 for standard consumer passenger cars, the calculator must cap the output and flag a parsing exception for review.