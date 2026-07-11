# 🚗 Vibe-Auto-Cost — Lifetime Vehicle Cost Estimator (Submission v3)

> Two-phase AI-engineering project built end-to-end with **AdaL** (engineer-mode orchestration of builder + evaluator workers). Phase 1 clones the autodoc.es vehicle selector to high fidelity; Phase 2 adds a deterministic 5-year Total-Cost-of-Ownership engine with Pydantic-validated outputs, guardrails, and an analytical dashboard.

## ⚠️ Format note (v3 — reproducibility restored)

The automated grader accepts only `.md`/`.txt`/`.pdf`/images. So **all source code is embedded as Markdown** (fenced code blocks in `source/`), AND — per reviewer request — a **reconstruction script** is included (`reproducibility/reconstruct.txt`) that rebuilds the real runnable file tree:

```bash
python3 reproducibility/reconstruct.txt   # → writes ./reconstructed/ (backend/ + frontend/, 19 files)
cd reconstructed/backend && uvicorn main:app --port 8000
```

This submission contains **only** `.md` (documents), `.png` (images), and `.txt` (the reconstruction script) — all gradable. Reviewers who want the raw file tree run the script; those reading inline get the full source in Markdown.

## 📦 Contents

```
submission3/
├── README.md                          ← this writeup (criteria + feedback response)
├── source/                            ← all source as .md (fenced code blocks)
│   ├── phase1_selector_source.md      ← React+Vite+Tailwind selector clone
│   ├── phase2_backend_source.md       ← FastAPI + Pydantic + cost engine + sample_data + tests
│   ├── phase2_frontend_source.md      ← dashboard HTML/JS/CSS + Chart.js
│   ├── phase2_config_ops.md           ← pinned requirements, Dockerfile, Makefile, run.sh, config, pyproject
│   ├── phase2_e2e_test.md             ← in-repo Playwright e2e test
│   ├── logic_guide_v1.md              ← backend spec
│   └── visual_architecture_101.md     ← UI/chart spec
├── screenshots/                       ← 7 PNGs
├── adal-workflow/                     ← contracts, plans, eval rounds
├── guardrails/                        ← guardrail code extracts (.md)
├── tests/                             ← pytest + e2e results + test source (.md)
└── reproducibility/
    ├── README.md                      ← how to reconstruct
    └── reconstruct.txt                ← script that rebuilds the real file tree
```

---

## ✅ Judging Criteria

### 1. Clear business value
TCO clarity for consumers/fleet managers. Select make/model/engine → deterministic 5-year cost (fuel + maintenance) + reliability radar. Merges 6,000-row European cars dataset + 1,728-row UCI Car Evaluation dataset. Concrete output: BMW 1 Series petrol → `€1,426.50 fuel + €500 maint → €9,632.50 / 5yr`.

### 2. AdaL workflow (start to finish)
Built entirely in AdaL engineer mode — supervisor orchestrating builder + evaluator workers. Evidence in `adal-workflow/`:
- **Frame & map** → supervisor reads specs, inspects data, installs infra (Playwright+Chromium to beat Cloudflare; Python+FastAPI+Pydantic).
- **Contract** → engineer-authored contract with verbatim goal, scope, ground-truth schema, 10–15 measurable ACs.
- **Investigate-first builder** → reads source, writes plan, implements, self-tests.
- **Adversarial evaluator** → separate worker, "this is broken — prove it", numeric checks.
- **Iterate to ACCEPT** → Phase 1: REJECT→ACCEPT (6 BLOCKERs fixed). Phase 2: ACCEPT round 1 (15/15). Polish rounds: all feedback addressed.

### 3. Guardrails
- Strict Pydantic schema; malformed → rejected. • `≤0` cost → HTTP 422. • `overall_vibe_score` clamped `[0,100]` (verified 20-brand sample). • `>€150,000` → cap + `flagged: true`. • Unknown selection → global-median fallback (never crashes). • Deterministic (no LLM in calc path). • **SRI** on Chart.js CDN. • **Zip integrity checks** in loader. • **NEW (v3): structured request logging** for audit.

### 4. System prompts effectively used
- **Engineer:** team lead who owns outcomes; delegates all labor; judges diffs at design level; independent validation before success.
- **Builder:** "You are the BUILDER. Discover helpers first. Propose done-criteria. Implement to spec. Self-test aggressively. Do NOT write the eval report." Pinned to model + `coding` mode at boot.
- **Evaluator:** "This code is BROKEN. Numeric evidence only. ACCEPT without numbers is invalid." Builder and evaluator NEVER the same worker.

---

## 🔧 Feedback Response (every item addressed in v3)

### Packaging for graders — FIXED
- **Markdown source** (gradable) + **`reconstruct.txt`** script that rebuilds the real file tree (reviewer-endorsed option). Run `python3 reproducibility/reconstruct.txt` → `./reconstructed/` with 19 real files.

### Observability — DONE
- Structured logging on `/api/evaluate`: `{"event":"evaluate","make":"BMW","model":"BMW 111","engine":"Petrol","match_type":"exact","matched_records":1,"elapsed_ms":0.49}` to stdout. (Sample captured during verification.)

### Performance/data UX — DONE
- Debounce (~250ms) + visible loading indicator (Autodoc-yellow spinner) on model + engine dropdowns while fetching.

### Security/hardening — DONE
- **CORS** documented in README: single-origin (FastAPI serves frontend); commented-out `CORSMiddleware` stanza in `main.py` with allowlist guidance.
- **Input contract** section in README: make/model/engine trimmed + case-insensitive; sub-model badges stripped on fallback; empty/whitespace → 422.

### Testing depth — DONE
- **Exact EV test:** `TestExactEVCalculation` — forces known `Efficiency (Wh/km)` + `ELECTRICITY_RATE`, asserts `annual_fuel_cost` equals `Efficiency × ANNUAL_KM / 1000 × ELECTRICITY_RATE` exactly.
- **In-repo e2e:** `e2e.mjs` (Playwright) — asserts dashboard renders below selector, 2 canvases have nonzero pixels, Chart.js datasets use brand colors `#ffd800`/`#ff8a00`. Passes.
- **13 pytest tests** total (12 + new exact EV). All pass.

### Datasets — DONE
- **Synthetic sample data** (`backend/sample_data.py`): tiny datasets mirroring real schemas. `USE_SAMPLE_DATA=true` env flag runs the app without the full archives. Verified on port 8001 → valid JSON.

### Reproducibility (versions) — DONE
- Python 3.11.2, Node v20.20.2, npm 10.8.2 (`.python-version` + this README).
- Exact-pinned `requirements.txt`: `fastapi==0.139.0`, `pydantic==2.13.4`, `uvicorn[standard]==0.51.0`, `openpyxl==3.1.5`, `python-multipart==0.0.32`.

---

## ▶️ How to run (one top-level section)

**Reconstruct + run (full stack, one command):**
```bash
python3 reproducibility/reconstruct.txt        # rebuild the file tree into ./reconstructed/
cd reconstructed/backend
pip install -r ../requirements.txt             # or: cd .. && make install
uvicorn main:app --port 8000                   # or: make run
# open http://127.0.0.1:8000/  →  select make/model/engine → Buscar → dashboard + charts
```

**Sample-data mode (no archives needed):**
```bash
USE_SAMPLE_DATA=true uvicorn main:app --port 8000
```

**Tests:**
```bash
make test     # pytest (13 passed)
make lint     # ruff (clean)
node e2e.mjs  # Playwright e2e (requires server running)
```

**Phase 1 (selector clone):**
```bash
cd autodoc-clone && npm install && npm run dev   # http://localhost:5173
```

---

## 📄 Licensing & data sources

- **Autodoc assets** (logo, fonts Inter/Montserrat, banners): copied from autodoc.es for hackathon demonstration; Autodoc retains all rights — replace with licensed equivalents before production.
- **European Cars Dataset** (`archive.zip` → xlsx, 6,000 rows): provided in the hackathon data vault; synthetic/representative.
- **UCI Car Evaluation Dataset** (`car+evaluation.zip` → `car.data`, 1,728 rows): public, by M. Bohanec & B. Zupan (1997), UCI ML Repository — research/educational use. Citation: Bohanec & Rajkovic (1988).
- **Chart.js** v4.4.0: MIT, via jsDelivr CDN with SRI.
- **Inter / Montserrat**: SIL Open Font License.

---

## 🧪 Verification status (post-v3 polish)

| Phase | Build | Tests | Eval |
|-------|-------|-------|------|
| 1 — selector | `npm run build` exit 0 | — | ACCEPT (R2) + MAJORs fixed |
| 2 — estimator | uvicorn serves; API 200 | pytest 13 passed; e2e passed; ruff clean | ACCEPT (15/15) + v3 polish (logging, debounce, sample data, exact EV test, reconstruct script) |

Independent supervisor verification confirmed: structured log line emitted (`match_type: exact`), sample-data mode returns valid JSON (€8,075), e2e passes, reconstruct writes 19 files.
