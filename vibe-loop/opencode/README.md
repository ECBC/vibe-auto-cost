# Vibe-Loop Engineering with OpenCode — Multi-Agent Guide

> How to run the **loop-engineering workflow** (the same one that built Vibe-Auto-Cost across 3 submission rounds) using **OpenCode's** agents, subagents, and multi-session parallelism.

![Loop Engineering Workflow](./workflow_diagram.png)

---

## 0. What is Loop Engineering?

Loop engineering is a repeatable cycle for shipping verified software with AI agents — instead of a single linear "ask → code" chat, you run a **contract-driven loop** with separated, adversarial roles:

```
Frame → Discover → Contract → Builder (investigate-first) → Adversarial Evaluator → Iterate to ACCEPT
```

**The core principles (apply to every tool in this series):**
1. **Separation of roles** — a *Lead* frames and judges; a *Builder* writes code; an *Evaluator* tries to break it. Builder and Evaluator are **never the same agent**.
2. **Contract before code** — a written spec with measurable acceptance criteria (ACs).
3. **Adversarial, numeric verification** — "looks good" is rejected; every AC needs measurable evidence.
4. **Iterate to ACCEPT** — Round 1 often returns REJECT; fix BLOCKERs and re-run until ACCEPT.
5. **Guardrails** — schema validation, input bounds, deterministic fallbacks.

We used this to: clone a web UI to pixel parity (Phase 1, REJECT→ACCEPT in 2 rounds) and build a deterministic cost estimator with Pydantic guardrails (Phase 2, ACCEPT round 1).

---

## 1. OpenCode's Multi-Agent Primitives

OpenCode is an open-source terminal/IDE/desktop coding agent ([opencode.ai](https://opencode.ai)) with first-class multi-agent support ([docs](https://opencode.ai/docs/agents/)):

| Primitive | What it is | Loop-engineering role |
|-----------|-----------|----------------------|
| **Primary agents** (`Build`, `Plan`) | Main agents you interact with; switch with `Tab` | `Build` = your Builder; you (the human) = Lead |
| **Subagents** (`General`, `Explore`, `Scout` + custom) | Specialized assistants the primary agent invokes via `@mention` or `Task` tool | Custom `evaluator` subagent = your Evaluator |
| **Multi-session** | Start multiple agents in parallel on the same project | Run Builder + Evaluator concurrently |
| **Permissions** | Per-agent `allow`/`ask`/`deny` for read/edit/bash/task | Lock the Evaluator to read-only; gate the Builder's bash |
| **Task tool** | Lets a primary agent spawn subagents (nesting) | Lead delegates to Builder + Evaluator |

**Key config facts** ([docs](https://opencode.ai/docs/agents/#configure)):
- Agents are defined in `opencode.json` (JSON) **or** as markdown files in `.opencode/agents/` (project) / `~/.config/opencode/agents/` (global).
- Each agent has: `description` (required), `mode` (`primary`/`subagent`/`all`), `model`, `prompt`, `permission`, `temperature`, `steps`.
- Subagents are invoked **automatically** (by description match) or **manually** via `@agent-name`.

---

## 2. Prerequisites

```bash
# Install OpenCode
curl -fsSL https://opencode.ai/install | bash
# (or: npm install -g opencode-ai)

# Verify
opencode --version

# Start
opencode
```

Configure a provider + model in `opencode.json` or via the TUI. For the loop you want a strong coding model (e.g. `anthropic/claude-sonnet-4-20250514` or `anthropic/claude-opus-4`) for the Builder, ideally a different one for the Evaluator.

---

## 3. Step-by-Step: Set Up the Loop

### Step 1 — Define the Builder + Evaluator agents

Create `.opencode/agents/` in your project root and add two markdown files. The filename becomes the agent name ([docs](https://opencode.ai/docs/agents/#markdown)).

**`.opencode/agents/builder.md`**:
```markdown
---
description: Implements code to spec. Investigates the codebase first, proposes done-criteria, then builds and self-tests. Use for any feature implementation or code change. Does NOT self-evaluate against a rubric.
mode: primary
model: anthropic/claude-opus-4-5
temperature: 0.2
permission:
  edit: allow
  bash: allow
  task: allow
---
You are the BUILDER. Your job:
1. Read the cited files and trace the call chain BEFORE writing code.
2. Propose done-criteria + validation steps.
3. After the lead accepts the plan, implement to spec — surgical edits only.
4. Self-test aggressively: build, lint, test, fix, repeat until all pass.
5. Do NOT self-evaluate against the acceptance criteria. Do NOT write an eval report.
6. Report: files changed, test results, build output. Stop at "compiles and passes tests."

Keep diffs minimal. Never revert files you didn't touch. Trust the live system over memory.
```

**`.opencode/agents/evaluator.md`**:
```markdown
---
description: Adversarially verifies code against acceptance criteria. System belief: the code is BROKEN — prove it with numeric evidence. Use after the builder reports done, to run targeted tests, measure deltas, and produce a PASS/FAIL report. Never rubber-stamps.
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
permission:
  edit: deny
  bash:
    "*": allow
  webfetch: allow
  task: deny
---
You are the EVALUATOR. Your system belief: THIS CODE IS BROKEN — prove it.

Rules:
1. Read the contract + the builder's diff.
2. For every acceptance criterion, run a programmatic, numeric check.
3. "Looks similar" is NOT evidence. Use measurable thresholds: pixel-diff %, test pass/fail, computed-style equality, exact hex matches.
4. An ACCEPT verdict WITHOUT numeric evidence is INVALID.
5. Write a report: per-AC PASS/FAIL table with numbers, prioritized fix list (BLOCKER→NIT), final verdict ACCEPT or REJECT.
6. You and the builder are NEVER the same session. Find failures, don't rubber-stamp.
```

> **Why `edit: deny` on the Evaluator?** An evaluator that can edit code will "fix" things instead of reporting them. Read-only forces honest reporting. ([permissions docs](https://opencode.ai/docs/agents/#permissions))

> **Why `mode: primary` for Builder, `mode: subagent` for Evaluator?** You drive the Builder directly (switch with `Tab`); the Evaluator is invoked by the Builder/Lead via `@evaluator` or the `Task` tool.

### Step 2 — Write the contract

Create `docs/contract.md` in your project root:

```markdown
# Contract: [Feature Name]

## User Goal (verbatim)
> [exact user request]

## Scope
- IN: [what to build]
- OUT: [what NOT to build]

## Acceptance Criteria (each measurable)
1. [Observable behavior + verification method]
2. [e.g. "API returns 200 + schema-valid JSON for /api/evaluate?make=BMW..."]
3. ...

## Guardrails
- [e.g. "≤0 cost → 422", "score ∈ [0,100]", "deterministic fallback"]

## Validation commands
- `npm run build` → exit 0
- `pytest -q` → all pass
```

### Step 3 — Run the loop

Start OpenCode in your project root:
```bash
opencode
```

**Turn 1 — Investigate-first (Builder):**
Switch to the `builder` primary agent (`Tab`), then:
```
Read docs/contract.md. Investigate the codebase and propose an implementation
plan. Do NOT write code yet — report the plan + done-criteria.
```

**Turn 2 — Adversarial plan critique (Evaluator):**
```
@evaluator critique the builder's plan. Find risks, missing edge cases,
and assumptions that could fail.
```
The `@evaluator` mention invokes the subagent ([docs](https://opencode.ai/docs/agents/#usage)).

**Turn 3 — Build:**
```
Plan accepted. Implement to the contract. Self-test until build + tests pass.
Report files changed.
```

**Turn 4 — Evaluate:**
```
@evaluator the builder reports done. Prove whether it's correct.
Run every AC as a numeric check. Write docs/eval_round_1.md with
verdict ACCEPT or REJECT.
```

**Turn 5 — Iterate (if REJECT):**
```
Builder: read docs/eval_round_1.md. Fix every BLOCKER. Re-run self-tests.
```
Re-evaluate → `eval_round_2.md`. Repeat until ACCEPT.

### Step 4 — Navigate between sessions

When subagents create child sessions, OpenCode lets you navigate them ([docs](https://opencode.ai/docs/agents/#usage)):
- `<Leader>+Down` — enter the first child session
- `Right` / `Left` — cycle child sessions
- `Up` — return to parent

### Step 5 — Run Builder + Evaluator in parallel (multi-session)

OpenCode supports starting multiple agents in parallel on the same project ([opencode.ai](https://opencode.ai/)). For the loop:
- **Session A** = Builder (writes code, runs tests).
- **Session B** = Evaluator (read-only, runs checks against Session A's output).
They share the same files, so run the Evaluator *after* the Builder reports done (or use git branches/worktrees to isolate concurrent edits).

For a fully autonomous fire-and-forget version, see [this OpenCode workflow gist](https://gist.github.com/ppries/f07fd6316bbd45807dd7a1896555b05b) — it takes an issue ID and autonomously plans, tests, implements, and opens a draft PR with TDD baked in.

---

## 4. The Full Loop in One Diagram

```
  ┌─────────────────────────────────────────┐
  │  LEAD (you, OpenCode Build session)      │
  │  Frame → write contract → judge diffs    │
  └──────────┬──────────────────┬───────────┘
             │                  │
     ┌───────▼───────┐  ┌──────▼──────────┐
     │  BUILDER       │  │  EVALUATOR       │
     │  primary agent  │  │  subagent        │
     │  (opus, edit+)  │  │  (sonnet, RO)    │
     │  investigate →  │  │  "code is BROKEN"│
     │  plan → build → │  │  numeric checks →│
     │  self-test      │  │  ACCEPT/REJECT   │
     └───────┬────────┘  └──────┬───────────┘
             │                  │
             │   ← eval_round_N.md →
             │                  │
     ┌───────▼──────────────────▼───────────┐
     │  ITERATE: REJECT → fix BLOCKERs →     │
     │  re-evaluate → ... → ACCEPT            │
     └───────────────────────────────────────┘
```

---

## 5. Concrete Example: UI Clone + Backend (What We Did)

**Phase 1 (UI clone to pixel parity):**
- Builder: discovers design tokens via Playwright `getComputedStyle`, builds React components, self-tests with `npm run build`.
- Evaluator (read-only subagent): opens original + clone in browser tabs, compares computed styles / bounding rects at 1440×900, writes `eval_round_1.md` (REJECT — 6 BLOCKERs: wrong tab count, gray CTA, missing semantic header, banner width, hover), then `eval_round_2.md` (ACCEPT after fixes).

**Phase 2 (backend + guardrails):**
- Builder: builds FastAPI + Pydantic schema + guardrails, writes `test_engine.py`.
- Evaluator: curls the API, verifies schema, checks guardrails (≤0→422, score∈[0,100], €150k cap), runs e2e Playwright test, writes `eval_round_1.md` (ACCEPT).

**Guardrails go in the contract** — the Builder can't skip them:
```markdown
## Guardrails (in contract.md)
- Pydantic schema validation on every response; malformed → rejected
- ≤0 cost → HTTP 422
- score clamped to [0,100]
- >€150,000 → cap + flagged
- unknown input → fallback (never crash)
- deterministic: same input → identical output
```

---

## 6. Advanced: Agent Teams in OpenCode

For deeper orchestration (a lead that spawns teammates with inter-agent messaging), OpenCode can emulate Claude Code's agent-teams pattern — see [Building Agent Teams in OpenCode (dev.to)](https://dev.to/uenyioha/porting-claude-codes-agent-teams-to-opencode-4hol):
- Define a `lead` primary agent with `task: allow` (so it can spawn subagents).
- The lead reads the contract, spawns `builder` + `evaluator` subagents, and coordinates via message passing.
- Each teammate gets its own context window.

For a **multi-agent code review** pattern (one reviewer, three lenses), see [One Reviewer, Three Lenses (ai.sulat.com)](https://ai.sulat.com/one-reviewer-three-lenses-building-a-multi-agent-code-review-system-with-opencode-21ceb28dde10) — the lead spawns subagents in parallel for each review category.

---

## 7. Checklist: Are You Doing It Right?

- [ ] Builder and Evaluator are **separate agent files** (`.opencode/agents/builder.md` + `evaluator.md`).
- [ ] Evaluator has `edit: deny` (read-only) and its prompt says "this is broken — prove it."
- [ ] A **contract.md** exists with measurable ACs *before* any code is written.
- [ ] Each round produces a written **eval_round_N.md** (REJECT/ACCEPT + numeric evidence).
- [ ] You **iterate** until ACCEPT — you don't accept the first build if the eval found BLOCKERs.
- [ ] **Guardrails** (schema, bounds, fallback) are in the contract and verified by the evaluator.
- [ ] The Evaluator uses a **different model** than the Builder (avoids shared blind spots).
- [ ] You (the Lead) **judge diffs at design level** — you don't write the code yourself.

---

## 8. Sources & Further Reading

- [OpenCode: Agents (official docs)](https://opencode.ai/docs/agents/) — primary/subagent config, permissions, JSON + markdown formats.
- [OpenCode homepage](https://opencode.ai/) — multi-session, install.
- [Building Agent Teams in OpenCode (dev.to)](https://dev.to/uenyioha/porting-claude-codes-agent-teams-to-opencode-4hol) — porting Claude Code's agent teams.
- [One Reviewer, Three Lenses (ai.sulat.com)](https://ai.sulat.com/one-reviewer-three-lenses-building-a-multi-agent-code-review-system-with-opencode-21ceb28dde10) — multi-agent code review.
- [Autonomous multi-agent workflow for OpenCode (gist)](https://gist.github.com/ppries/f07fd6316bbd45807dd7a1896555b05b) — fire-and-forget TDD pipeline.
- [OpenCode Multi-Agent Setup (Amir Teymoori)](https://amirteymoori.com/opencode-multi-agent-setup-specialized-ai-coding-agents/) — 3 specialized agents.
- [OpenCode AI Agent Setup (YouTube)](https://www.youtube.com/watch?v=vHkLrDD2xrU) — setup walkthrough.

---

## 9. Quick-Start Commands

```bash
# 1. Install OpenCode
curl -fsSL https://opencode.ai/install | bash

# 2. Create agent files
mkdir -p .opencode/agents
# → create .opencode/agents/builder.md and .opencode/agents/evaluator.md (see Step 1)

# 3. Write the contract
mkdir -p docs
# → create docs/contract.md (see Step 2)

# 4. Run the loop
opencode
# (Tab → switch to builder primary agent)
# → "Read docs/contract.md. Investigate + propose a plan. No code yet."
# → "Plan accepted. Implement. Self-test until green."
# (@evaluator)
# → "@evaluator prove whether it's correct. Write docs/eval_round_1.md."
# → (if REJECT) "Builder: fix the BLOCKERs from eval_round_1.md"
# → (repeat) "@evaluator re-evaluate. Write eval_round_2.md."
# → ACCEPT ✅
```

Happy vibe-looping. 🚗
