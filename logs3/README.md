# Logs & Thinking — All 3 Submission Rounds (Vibe-Auto-Cost)

Complete record of every AdaL session (engineer + builder + evaluator thinking + tool calls), eval artifacts, contracts, scripts, and screenshots across all three submission iterations (v1 → v2 → v3).

## Directory map

```
logs3/
├── README.md                          ← this index
├── sessions/                          ← raw JSONL transcripts (thinking + tool calls + results)
│   ├── 01_engineer_main.jsonl         ← engineer session spanning all 3 submissions (Turns 0→8)
│   ├── 02_engineer_prior_attempt.jsonl← first engineer attempt (Cloudflare/no-browser wall)
│   ├── 03_phase1_builder.jsonl        ← Phase-1 clone builder (opus-4-6)
│   ├── 04_phase1_evaluator.jsonl      ← Phase-1 evaluator (MiniMax-M3): REJECT→ACCEPT
│   ├── 05_phase1_builder_prior.jsonl  ← earlier Phase-1 builder attempt
│   ├── 06_phase1_evaluator_prior.jsonl← earlier Phase-1 evaluator attempt
│   ├── 07_phase2_builder.jsonl        ← Phase-2 estimator builder
│   ├── 08_phase2_evaluator.jsonl      ← Phase-2 evaluator: ACCEPT (15/15)
│   ├── 09_v2_polish_phase1.jsonl      ← v2 polish: Phase-1 CTA hover + overflow fixes
│   ├── 10_v2_polish_phase2.jsonl      ← v2 polish: SRI, config, tests, a11y, Dockerfile
│   ├── 11_v3_polish_phase2.jsonl      ← v3 polish: logging, debounce, sample data, e2e, reconstruct
│   └── metadata/                      ← session→role + model/agent-mode config
├── contracts/                         ← engineer-authored contracts
│   ├── phase1_contract.md
│   └── phase2_contract.md
├── artifacts/
│   ├── phase1/                        ← builder plan, test plan, tokens, eval rounds (REJECT→ACCEPT)
│   ├── phase2/                        ← build plan, eval (ACCEPT), e2e test, polish scripts
│   ├── scripts/                       ← all Playwright discovery + eval scripts (.mjs)
│   ├── submission_manifest.txt        ← v1 contents
│   ├── submission2_manifest.txt       ← v2 contents
│   └── submission3_manifest.txt       ← v3 contents
└── screenshots/                       ← all PNGs (original/clone/eval, dashboard before/after)
```

## Submission round summary

| Round | What changed | Key evidence |
|-------|-------------|--------------|
| **v1** | Phase 1 clone (REJECT→ACCEPT) + Phase 2 estimator (ACCEPT) | `sessions/03,04,07,08`; `artifacts/phase1/eval_round*`; `artifacts/phase2/eval_round1_ACCEPT` |
| **v2** | Fixed 2 Phase-1 MAJORs (CTA hover, 1280 overflow); Phase-2 polish (SRI, pinned deps, Dockerfile, config, a11y, 12 tests); gradable formats only | `sessions/09,10` |
| **v3** | Structured logging, debounce+loading, exact EV test, in-repo e2e, sample-data mode, reconstruct script, CORS/input-contract docs | `sessions/11`; `artifacts/phase2/e2e.mjs` |

## How to read the JSONL transcripts

Each `.jsonl` line is one message: `{"role":"user"|"assistant", "content":..., "thinking":..., "calls":[...]}`.
- `thinking` = the agent's private reasoning (the "thinking" you asked to save)
- `calls` = tool invocations + their `observation`/`output`
- Assistant `content` = the visible reply

Filter with `jq`:
```bash
jq -r 'select(.thinking) | .thinking' logs3/sessions/03_phase1_builder.jsonl    # builder reasoning
jq -r 'select(.role=="assistant") | .content' logs3/sessions/04_phase1_evaluator.jsonl
```

## Stats
- 92 files, 27 MB total
- 11 session transcripts (JSONL)
- 29 screenshots (PNG)
- 16 Playwright scripts (MJS)
- 9 Markdown docs + 3 manifests + 24 metadata/JSON
