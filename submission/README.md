# 🚗 Vibe-Auto-Cost — Lifetime Vehicle Cost Estimator

> A two-phase AI-engineering project built end-to-end with **AdaL** (engineer-mode orchestration of builder + evaluator workers). Phase 1 reverse-engineers the autodoc.es vehicle selector to pixel parity; Phase 2 bolts on a deterministic 5-year Total-Cost-of-Ownership engine with Pydantic-validated outputs, guardrails, and an analytical dashboard.

---

## 📦 What's in this submission

```
submission/
├── README.md                  ← this writeup (judging criteria addressed below)
├── source/                    ← AI agents' main source code
│   ├── autodoc-clone/         ← Phase 1: React+Vite+Tailwind vehicle selector (pixel-clone of autodoc.es above-the-fold)
│   ├── app/                   ← Phase 2: FastAPI backend + static frontend cost-estimator dashboard
│   │   ├── backend/           ← main.py (FastAPI+Pydantic), load_data.py (data engine + guardrails)
│   │   └── frontend/          ← index.html, app.js (Chart.js), styles.css (Autodoc tokens), assets/
│   ├── logic_guide_v1.md      ← backend spec the agent followed
│   └── visual_architecture_101.md  ← UI/chart spec the agent followed
├── screenshots/               ← visual evidence
│   ├── phase1_original_autodoc.png    ← live autodoc.es (after Cloudflare)
│   ├── phase1_clone_result.png        ← Phase-1 clone (passed eval Round 2)
│   ├── phase1_eval_original.png        ← eval: original
│   ├── phase1_eval_clone.png           ← eval: clone side-by-side
│   ├── phase2_app_full.png             ← Phase-2 full app
│   ├── phase2_dashboard_before.png     ← dashboard "waiting for selection"
│   └── phase2_dashboard_charts.png     ← dashboard with cost + radar charts
├── adal-workflow/             ← AdaL workflow proof (contracts, plans, eval rounds)
│   ├── phase1_contract.md              ← engineer-authored contract (goal, scope, 15 ACs)
│   ├── phase1_builder_plan.md          ← builder's investigate-first plan
│   ├── phase1_test_plan.md             ← evaluator's adversarial test plan
│   ├── phase1_eval_round1_REJECT.md    ← Round 1: 6 BLOCKERs found
│   ├── phase1_eval_round2_ACCEPT.md    ← Round 2: all fixed → ACCEPT
│   ├── phase2_contract.md              ← Phase-2 contract
│   └── phase2_eval_round1_ACCEPT.md    ← Phase-2 eval: all 15 ACs PASS
└── guardrails/                ← guardrail code extracts
    ├── cost_engine_guardrails.py        ← ≤0 rejection, vibe_score [0,100], €150k cap
    └── api_validation.py                ← Pydantic schema validation + 422
```

---

## ✅ Judging Criteria — How We Address Each

### 1. Clear business value (real-world use case, measurable impact)

**Problem:** Predicting Total Cost of Ownership (TCO) is a major consumer/fleet pain point — hidden maintenance, fuel, and depreciation costs make purchase decisions unpredictable.

**Solution:** Vibe-Auto-Cost takes a vehicle selection (make/model/engine) and returns a deterministic 5-year cost projection (fuel + maintenance) plus a reliability radar — so a buyer sees the *real* lifetime cost before purchasing.

**Measurable impact:**
- Merges two real datasets: a 6,000-row European cars dataset (price, fuel efficiency, maintenance, safety) + the UCI Car Evaluation dataset (1,728 rows of qualitative reliability classes).
- Returns concrete numbers, e.g. for a BMW 1 Series petrol: `annual_fuel €1,426.50 + annual_maintenance €500 → total_5_year €9,632.50`.
- Reliability score (`overall_vibe_score`) computed on a deterministic [0,100] scale from safety rating + UCI class + comfort signals.
- Familiar UX: reuses the autodoc.es selector so users onboard with zero learning curve.

### 2. Demonstrate the AdaL workflow (start to finish)

The project was built **entirely inside AdaL engineer mode** — a supervisor (this engineer agent) orchestrating builder + evaluator worker agents. Evidence is in `adal-workflow/`.

**The loop, run twice (Phase 1 + Phase 2):**

1. **Frame & map** — supervisor reads the spec guides, inspects the data vault, verifies infra (installs Playwright+Chromium to beat Cloudflare; installs Python+FastAPI+Pydantic).
2. **Contract** — supervisor writes a contract file (`phase1_contract.md` / `phase2_contract.md`) with the verbatim user goal, scope, ground-truth schema, architecture decision, and 10–15 measurable acceptance criteria.
3. **Investigate-first builder** — builder reads the cited files, traces the data, writes a plan doc (`builder_plan.md`), then implements.
4. **Adversarial evaluator** — a *separate* worker (different session, system belief "this is broken — prove it") writes a test plan, then runs programmatic numeric checks on the live output.
5. **Iterate to ACCEPT** — Phase 1: Round 1 REJECT (6 BLOCKERs) → builder fixed all → Round 2 ACCEPT. Phase 2: Round 1 ACCEPT (all 15 ACs).
6. **Verify** — supervisor independently re-runs builds / curls the API / checks guardrails before accepting.

Phase 1 specifically showcases AdaL's visual-clone workflow: discovery (Playwright screenshots + `getComputedStyle` token extraction) → build → adversarial side-by-side pixel/token comparison at 1440/1920/1280 → iterate.

### 3. Implement guardrails (prevent unsafe / unintended behavior)

The backend enforces hard safety boundaries (see `guardrails/`):

- **Structured-output guardrail:** every API response must conform to a strict Pydantic schema (`EvaluateResponse` with nested `ReliabilityScores` / `FinancialProjections`). Non-conforming outputs are rejected — no free-form LLM text reaches the frontend.
- **Zero/negative prevention:** any cost calculation yielding `≤ 0` throws an application exception (HTTP 422), preventing impossible/meaningless outputs.
- **Reliability cap:** `overall_vibe_score` is mathematically clamped to `[0, 100]` — verified across a 20-brand sample, all in range.
- **Upper-boundary filter:** `total_5_year_cost` > €150,000 for a passenger car is capped and flagged (`"flagged": true`) for review.
- **Fallback resolution:** unknown vehicle selections never crash — they fall back to global-median values, guaranteeing the app always returns a valid response.
- **Determinism:** the engine is purely deterministic (no LLM in the calculation path) — same input always yields byte-identical output.
- **Deterministic data ingestion:** the Heuristic Alignment Matrix maps qualitative UCI classes to quantitative costs via fixed lookup tables, not generation.

### 4. Use system prompts effectively (role, objectives, constraints, behavior)

Each AdaL worker is bootstrapped with a role-specific system prompt set by the supervisor. Concretely:

- **Engineer (this agent):** role = team lead who owns the outcome and drives workers; objective = convert the user's goal into a measurable contract and deliver a verified result; constraints = delegate all labor, never write code directly, judge diffs at design level, run independent validation before claiming success.
- **Builder:** role = "You are the BUILDER. Use `codebase_understand` to discover existing helpers before writing new code. First propose done-criteria + validation. After contract acceptance, implement to spec. Self-test and iterate aggressively. Do NOT write the eval report — the evaluator does that." — pinned to a specific model and `coding` agent mode at boot (never switched mid-session).
- **Evaluator:** role = "This code is BROKEN. Read the diff, inspect changed code, run targeted tests, prove failures." System belief = the clone/app is broken; must produce numeric evidence; an ACCEPT without numbers is invalid; builder and evaluator are never the same worker.

These prompts enforce separation of concerns (builder cannot self-evaluate), adversarial review (evaluator's job is to find failures, not rubber-stamp), and measurable acceptance (every criterion maps to a numeric check).

---

## ▶️ How to run

**Phase 1 (selector clone):**
```bash
cd source/autodoc-clone
npm install
npm run dev      # http://localhost:5173
```

**Phase 2 (cost estimator — the main app):**
```bash
cd source/app/backend
pip install -r ../requirements.txt
uvicorn main:app --port 8000
# open http://127.0.0.1:8000/  →  select make/model/engine → click Buscar → dashboard + charts
```

The Phase-2 data must be present at `source/app`-relative `../data/` (the archives `archive.zip` + `car+evaluation.zip`). The loader auto-extracts if needed.

---

## 🧪 Verification status

| Phase | Build | Eval verdict | Evidence |
|-------|-------|--------------|----------|
| 1 — selector clone | `npm run build` exit 0 | ACCEPT (Round 2) | `adal-workflow/phase1_eval_round2_ACCEPT.md` |
| 2 — cost estimator | `uvicorn` serves; API 200 | ACCEPT (all 15 ACs) | `adal-workflow/phase2_eval_round1_ACCEPT.md` |
