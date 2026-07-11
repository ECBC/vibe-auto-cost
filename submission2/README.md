# 🚗 Vibe-Auto-Cost — Lifetime Vehicle Cost Estimator (Submission v2)

> Two-phase AI-engineering project built end-to-end with **AdaL** (engineer-mode orchestration of builder + evaluator workers). Phase 1 clones the autodoc.es vehicle selector to high fidelity; Phase 2 adds a deterministic 5-year Total-Cost-of-Ownership engine with Pydantic-validated outputs, guardrails, and an analytical dashboard.

## ⚠️ Format note (v2 fix)

Reviewer feedback flagged that v1 contained non-gradable file types (`.jsx`, `.py`, `.ttf`, `.woff`, `.svg`). **v2 embeds ALL source code inside Markdown documents** as fenced code blocks — the submission now contains only `.md` (documents) and `.png` (images), both gradable. Source is fully readable and copy-pasteable from the `.md` files in `source/`.

## 📦 Contents

```
submission2/
├── README.md                          ← this writeup (judging criteria + feedback response)
├── source/                            ← all source as .md (fenced code blocks)
│   ├── phase1_selector_source.md      ← React+Vite+Tailwind selector clone (every .jsx/.css/.js file)
│   ├── phase2_backend_source.md       ← FastAPI + Pydantic + cost engine + tests
│   ├── phase2_frontend_source.md      ← dashboard HTML/JS/CSS + Chart.js
│   ├── phase2_config_ops.md           ← requirements (pinned), Dockerfile, Makefile, run.sh, config, pyproject
│   ├── logic_guide_v1.md              ← backend spec the agent followed
│   └── visual_architecture_101.md     ← UI/chart spec the agent followed
├── screenshots/                       ← 7 PNGs (original vs clone, dashboard before/after)
├── adal-workflow/                     ← AdaL proof: contracts, plans, eval rounds
├── guardrails/                        ← guardrail code extracts (as .md)
└── tests/                             ← pytest results + test source (as .md)
```

---

## ✅ Judging Criteria

### 1. Clear business value
**Problem:** TCO is a major consumer/fleet pain point — hidden maintenance, fuel, depreciation make purchases unpredictable.
**Solution:** Select make/model/engine → get a deterministic 5-year cost projection (fuel + maintenance) + reliability radar.
**Measurable impact:** Merges 6,000-row European cars dataset + 1,728-row UCI Car Evaluation dataset. Returns concrete numbers (e.g. BMW 1 Series petrol: `€1,426.50 fuel + €500 maint → €9,632.50 / 5yr`). Deterministic `overall_vibe_score ∈ [0,100]`.

### 2. AdaL workflow (start to finish)
Built entirely in AdaL engineer mode — supervisor orchestrating builder + evaluator workers. Evidence in `adal-workflow/`:
- **Frame & map** → supervisor reads specs, inspects data, verifies/installs infra (Playwright+Chromium to beat Cloudflare; Python+FastAPI+Pydantic).
- **Contract** → engineer-authored contract with verbatim goal, scope, ground-truth schema, 10–15 measurable ACs.
- **Investigate-first builder** → reads source, writes plan, implements, self-tests.
- **Adversarial evaluator** → separate worker, system belief "this is broken — prove it", numeric checks.
- **Iterate to ACCEPT** → Phase 1: Round 1 REJECT (6 BLOCKERs) → fixed → Round 2 ACCEPT. Phase 2: ACCEPT round 1 (15/15 ACs). Polish round: both MAJORs fixed + new tests pass.

### 3. Guardrails (prevent unsafe/unintended behavior)
- **Structured output:** strict Pydantic schema (`EvaluateResponse`); malformed outputs rejected — no free-form LLM text.
- **≤0 prevention:** cost `≤0` → HTTP 422 exception.
- **Reliability cap:** `overall_vibe_score` clamped to `[0,100]` (verified 20-brand sample).
- **Upper boundary:** `total_5_year_cost > €150,000` → capped + `flagged: true`.
- **Fallback:** unknown selections → global median (never crashes).
- **Determinism:** no LLM in calc path; same input → byte-identical output.
- **NEW (v2): Subresource Integrity** on Chart.js CDN include (supply-chain protection).
- **NEW (v2): zip integrity checks** in the data loader (clear errors on missing/corrupt archives).

### 4. System prompts effectively used
- **Engineer:** team lead who owns outcomes; delegates all labor; judges diffs at design level; runs independent validation before claiming success.
- **Builder:** "You are the BUILDER. Discover existing helpers first. Propose done-criteria. Implement to spec. Self-test aggressively. Do NOT write the eval report." Pinned to a model + `coding` mode at boot (never switched mid-session).
- **Evaluator:** "This code is BROKEN. Prove failures with numeric evidence. ACCEPT without numbers is invalid." Builder and evaluator are NEVER the same worker.
Enforces separation of concerns, adversarial review, and measurable acceptance.

---

## 🔧 Feedback Response (every item addressed)

### Phase-1 unresolved MAJORs — FIXED
| Issue | Fix | Verified |
|-------|-----|----------|
| Bottom CTA hover never fires (button disabled at rest) | Removed `disabled`; guard moved to `onClick` early-return; hover via CSS `:hover` | Rest `#0068D7` → hover `#0074F1`; never gray ✅ |
| Horizontal overflow at 1280×800 | `overflow-x-auto` + `whitespace-nowrap` on sub-nav; `overflow-hidden` on hero wrapper; added `.scrollbar-hide`; removed any `min-w-[1280px]` | scrollWidth ≤ innerWidth at 1280/1440/1920 ✅ |

### Security & ops — DONE
- **SRI** on Chart.js: `<script ... integrity="sha384-..." crossorigin="anonymous">` (pinned to chart.js@4.4.0). ✅
- **One-command run:** `run.sh` + `make run` (installs deps, starts uvicorn, prints URL). ✅
- **Dockerfile** (python:3.11-slim) added. ✅
- **Pinned deps:** exact versions (`fastapi==0.139.0`, `pydantic==2.13.4`, `uvicorn[standard]==0.51.0`, `openpyxl==3.1.5`, `python-multipart==0.0.32`). ✅

### Data handling — DONE
- EV maintenance heuristic centralized in a single commented `MAINT_TIER_POLICY`/`FUEL_POLICY` block in `load_data.py`; EV→"high" documented. ✅
- Unzip routine now validates `zipfile.is_zipfile` and raises clear errors on missing/corrupt archives. ✅

### Accessibility — DONE
- `:focus-visible` outlines (brand yellow `#ffd800`) on interactive dashboard elements. ✅
- `aria-live="polite"` region announces "Calculando…" → results transition. ✅
- CTA hover contrast checked on dark bg. ✅

### Testing — DONE
- `backend/test_engine.py`: **12 pytest tests** — EV path, unknown-make fallback, €150k cap, vibe_score range, schema validation. All pass. ✅ (see `tests/test_results.md`)
- Existing browser/e2e evals retained.

### Lint — DONE
- `pyproject.toml` with ruff + mypy config; `ruff check backend/` clean. ✅

### Deployment ergonomics — DONE
- `backend/config.py` + `.env.example`: `ELECTRICITY_RATE` (default 0.30 €/kWh) and `ANNUAL_KM` (default 15000) env-overridable. Verified: `ELECTRICITY_RATE=0.50 ANNUAL_KM=20000` → config picks up new values. ✅

---

## ▶️ Reproducibility

**Versions used (verified in this environment):**
- Python 3.11.2
- Node v20.20.2 / npm 10.8.2
- See `.python-version` and `requirements.txt` (exact pins) in `source/phase2_config_ops.md`

**Run Phase 2 (the main app):**
```bash
cd auto-evaluation/app
make run          # or: bash run.sh
# → installs deps, starts uvicorn on :8000, prints URL
# open http://127.0.0.1:8000/  →  select make/model/engine → Buscar → dashboard + charts
```
The app serves the frontend from FastAPI (mounted at `/static` + `/assets`) on a single port — no separate static server needed. Run from `auto-evaluation/app/` (the `backend/` dir contains `main.py`; `run.sh`/`Makefile` handle the `cd`).

**Run Phase 1 (selector clone):**
```bash
cd autodoc-clone && npm install && npm run dev   # http://localhost:5173
```

**Tests:**
```bash
cd auto-evaluation/app && make test     # pytest
cd auto-evaluation/app && make lint     # ruff
```

---

## 📄 Licensing & data sources

- **Autodoc assets** (logo `logo-light.svg`, fonts Inter/Montserrat, banner images): copied from autodoc.es for the hackathon clone. Autodoc retains all rights; assets are used here for demonstration/educational purposes only and should be replaced with licensed equivalents before any production use.
- **European Cars Dataset** (`archive.zip` → `EUROPEAN CARS DATASET.xlsx`): provided in the data vault; 6,000 synthetic/representative vehicle records. Source/license as provided in the hackathon materials.
- **UCI Car Evaluation Dataset** (`car+evaluation.zip` → `car.data`): public dataset by M. Bohanec & B. Zupan (1997), donated to the UCI Machine Learning Repository. Typically used under the UCI repository terms for research/educational use. Citation: Bohanec, M. & Rajkovic, V. (1988).
- **Chart.js** (v4.4.0): MIT-licensed, loaded via jsDelivr CDN with SRI.
- **Inter / Montserrat fonts**: SIL Open Font License.

---

## 🧪 Verification status (post-polish)

| Phase | Build | Tests | Eval verdict |
|-------|-------|-------|--------------|
| 1 — selector clone | `npm run build` exit 0 | — | ACCEPT (Round 2) + 2 MAJORs fixed in polish |
| 2 — cost estimator | `uvicorn` serves; API 200 | pytest 12 passed | ACCEPT (all 15 ACs) + polish (SRI, a11y, config, tests) |
