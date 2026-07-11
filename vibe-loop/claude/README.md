# Vibe-Loop Engineering with Claude Code — Multi-Agent Guide

> How to run the **loop-engineering workflow** (the same one that built Vibe-Auto-Cost across 3 submission rounds) using **Claude Code's** subagents, agent teams, and dynamic workflows.

![Loop Engineering Workflow](./workflow_diagram.png)

---

## 0. What is Loop Engineering?

Loop engineering is a repeatable cycle for shipping verified software with AI agents — instead of a single linear "ask → code" chat, you run a **contract-driven loop** with separated, adversarial roles:

```
Frame → Discover → Contract → Builder (investigate-first) → Adversarial Evaluator → Iterate to ACCEPT
```

**The core principles (apply to every tool in this series):**
1. **Separation of roles** — a *Lead* frames and judges; a *Builder* writes code; an *Evaluator* tries to break it. Builder and Evaluator are **never the same agent**.
2. **Contract before code** — a written spec with measurable acceptance criteria (ACs) that both sides agree to before any implementation.
3. **Adversarial, numeric verification** — "looks good" is rejected; every AC needs measurable evidence (pixel deltas, test pass/fail, computed-style equality).
4. **Iterate to ACCEPT** — Round 1 often returns REJECT; you fix the BLOCKERs and re-run until ACCEPT.
5. **Guardrails** — schema validation, input bounds, deterministic fallbacks so the agent can't produce unsafe output.

We used this to: clone an above-the-fold web UI to pixel parity (Phase 1, REJECT→ACCEPT in 2 rounds) and build a deterministic 5-year cost estimator with Pydantic guardrails (Phase 2, ACCEPT round 1).

---

## 1. Claude Code's Multi-Agent Primitives

Claude Code offers four parallelization mechanisms ([official docs](https://code.claude.com/docs/en/agents)):

| Approach | What it gives you | Loop-engineering role |
|----------|-------------------|----------------------|
| **[Subagents](https://code.claude.com/docs/en/sub-agents)** | Delegated workers in one session, own context, return summary | Builder + Evaluator (the two workers) |
| **[Agent view](https://code.claude.com/docs/en/agent-view)** | Dispatch + monitor background sessions | Running Builder & Evaluator in parallel |
| **[Agent teams](https://code.claude.com/docs/en/agent-teams)** | Lead + teammates, shared task list, inter-agent messaging | Full Lead-Builder-Evaluator loop (experimental) |
| **[Dynamic workflows](https://code.claude.com/docs/en/workflows)** | Scripted multi-subagent runs with cross-checking | Large audits / multi-round iteration |
| **[Worktrees](https://code.claude.com/docs/en/worktrees)** | Isolated git checkout per session | Keeps parallel agents from clobbering files |

**For the loop-engineering pattern, you'll use:** Subagents (define Builder + Evaluator) + Worktrees (isolate their edits) + Agent view (monitor). Agent teams automate the coordination if you're on a version where they're enabled.

---

## 2. Prerequisites

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Verify
claude --version

# Authenticate (interactive)
claude
```

You need Claude Opus 4 (or 4.5) for the Builder (complex code) and ideally a *different* strong model for the Evaluator to avoid shared blind spots. Claude Code supports per-agent model selection.

---

## 3. Step-by-Step: Set Up the Loop

### Step 1 — Create the agent definitions

Subagents in Claude Code are **markdown files with YAML frontmatter** ([guide](https://www.mindstudio.ai/blog/build-custom-sub-agents-claude-code-yaml)). They live in `.claude/agents/` (project-level, committed to git) or `~/.claude/agents/` (user-level).

```bash
mkdir -p .claude/agents
```

**`.claude/agents/builder.md`** — the implementer:
```markdown
---
name: builder
description: Implements code to spec. Investigates the codebase first, proposes done-criteria, then builds and self-tests. Use this agent for any feature implementation, bug fix, or code change. Does NOT self-evaluate against a rubric.
tools: Read, Write, Edit, Bash, Grep, Glob
model: claude-opus-4-5
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

**`.claude/agents/evaluator.md`** — the adversarial reviewer:
```markdown
---
name: evaluator
description: Adversarially verifies code against acceptance criteria. System belief: the code is BROKEN — prove it with numeric evidence. Use this agent after the builder reports done, to run targeted tests, measure pixel/style deltas, and produce a PASS/FAIL report. Never rubber-stamps.
tools: Read, Bash, Grep, Glob, WebFetch
model: claude-opus-4-5
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

> **Why two files?** The `description` field is what Claude Code's orchestrator uses to auto-route tasks. Be specific so the right agent gets called. ([docs](https://code.claude.com/docs/en/sub-agents))

### Step 2 — Write the contract

Create `docs/contract.md` in your project root. This is the source of truth both agents read:

```markdown
# Contract: [Feature Name]

## User Goal (verbatim)
> [paste the exact user request — every fidelity word maps to a measurable criterion]

## Scope
- IN: [what to build]
- OUT: [what NOT to build]

## Acceptance Criteria (each must be measurable)
1. [Observable behavior + how to verify it]
2. [e.g. "CTA bg is #0068D7 at rest, #0074F1 on hover — verify via getComputedStyle"]
3. ...

## Guardrails
- [e.g. "≤0 cost → HTTP 422", "score ∈ [0,100]"]
- [e.g. "deterministic: same input → identical output"]

## Validation commands
- `npm run build` → exit 0
- `pytest -q` → all pass
```

### Step 3 — Run the loop (Lead = you, in the main session)

Start Claude Code in your project root:
```bash
claude
```

**Turn 1 — Frame & discover:**
```
Read docs/contract.md. Use the builder subagent to investigate the codebase
and propose an implementation plan. Do NOT write code yet.
```
Claude Code auto-routes this to the `builder` subagent (based on its `description`). The builder returns a plan.

**Turn 2 — Adversarial plan review (optional but recommended):**
```
Use the evaluator subagent to critique the builder's plan. Find risks,
missing edge cases, and assumptions that could fail.
```

**Turn 3 — Build:**
```
Plan accepted. Builder: implement to the contract. Self-test until
build + tests pass. Report files changed.
```

**Turn 4 — Evaluate:**
```
Evaluator: the builder reports done. Prove whether it's correct.
Run every AC as a numeric check. Write docs/eval_round_1.md with
verdict ACCEPT or REJECT.
```

**Turn 5 — Iterate (if REJECT):**
```
Builder: read docs/eval_round_1.md. Fix every BLOCKER. Re-run self-tests.
```
Then re-evaluate (Turn 4 again) → `eval_round_2.md`. Repeat until ACCEPT.

### Step 4 — Use Worktrees to isolate parallel work

If Builder and Evaluator touch files simultaneously, give each a worktree ([docs](https://code.claude.com/docs/en/worktrees)):

```bash
# From within Claude Code
/worktree create builder-wt    # isolated checkout for the builder
/worktree create eval-wt       # isolated checkout for the evaluator
```
Agent view (`claude agents`) moves each dispatched session into its own worktree automatically.

### Step 5 — Monitor with Agent View

```bash
claude agents
```
Opens a screen showing every running session, its state, and which ones need your input. Use this to dispatch Builder + Evaluator in parallel and check back.

---

## 4. The Full Loop in One Diagram

```
  ┌─────────────────────────────────────────┐
  │  LEAD (you, main Claude Code session)    │
  │  Frame → write contract → judge diffs    │
  └──────────┬──────────────────┬───────────┘
             │                  │
     ┌───────▼───────┐  ┌──────▼──────────┐
     │  BUILDER       │  │  EVALUATOR       │
     │  subagent       │  │  subagent        │
     │  (opus-4-5)     │  │  (different mdl) │
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

## 5. Concrete Example: Cloning a UI + Building a Backend

This is exactly what we did with Vibe-Auto-Cost. Adapt it to your task:

**Phase 1 (UI clone):**
- Builder subagent: discovers design tokens via Playwright `getComputedStyle`, builds React components, self-tests with `npm run build`.
- Evaluator subagent: opens original + clone in separate tabs, compares computed styles / bounding rects at 1440×900, writes `eval_round_1.md` (REJECT — 6 BLOCKERs), then `eval_round_2.md` (ACCEPT after fixes).

**Phase 2 (backend + guardrails):**
- Builder subagent: builds FastAPI + Pydantic schema + guardrails, writes `test_engine.py`.
- Evaluator subagent: curls the API, verifies schema, checks guardrails (≤0→422, score∈[0,100], €150k cap), runs the e2e Playwright test, writes `eval_round_1.md` (ACCEPT).

**Guardrails are part of the contract** — never let the builder skip them:
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

## 6. Advanced: Agent Teams (experimental)

If agent teams are enabled in your Claude Code version ([docs](https://code.claude.com/docs/en/agent-teams)), you can automate the Lead role too:

1. Define a `lead` agent with the `Task` tool (so it can spawn others).
2. The lead reads the contract, assigns Builder + Evaluator as teammates, and coordinates via the shared task list + inter-agent messaging.
3. You just give the high-level goal; the lead runs the loop.

> ⚠️ Agent teams don't isolate teammates in worktrees — **partition the work** so each teammate owns different files.

---

## 7. Advanced: Dynamic Workflows for Large Jobs

For jobs too big for turn-by-turn coordination (codebase-wide audits, 500-file migrations), use **dynamic workflows** ([docs](https://code.claude.com/docs/en/workflows)):

```bash
/workflows
```
A workflow script runs many subagents and cross-checks their results — e.g. 3 agents audit security from different angles, then a 4th reconciles their findings. Use this when a single loop won't scale.

---

## 8. Checklist: Are You Doing It Right?

- [ ] Builder and Evaluator are **separate subagent files** with different system prompts.
- [ ] Evaluator's prompt says "this is broken — prove it" and requires **numeric evidence**.
- [ ] A **contract.md** exists with measurable ACs *before* any code is written.
- [ ] Each round produces a written **eval_round_N.md** (REJECT/ACCEPT + evidence).
- [ ] You **iterate** until ACCEPT — you don't accept the first build if the eval found BLOCKERs.
- [ ] **Guardrails** (schema, bounds, fallback) are in the contract and verified by the evaluator.
- [ ] Parallel agents use **worktrees** so they don't clobber each other's files.
- [ ] You (the Lead) **judge diffs at design level** — you don't write the code yourself.

---

## 9. Sources & Further Reading

- [Claude Code: Run agents in parallel](https://code.claude.com/docs/en/agents) — official overview of all 4 approaches.
- [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents) — custom subagent config.
- [Claude Code: Agent teams](https://code.claude.com/docs/en/agent-teams) — lead + teammates orchestration.
- [Claude Code: Dynamic workflows](https://code.claude.com/docs/en/workflows) — scripted multi-agent runs.
- [Claude Code: Worktrees](https://code.claude.com/docs/en/worktrees) — isolated checkouts for parallel sessions.
- [How to Build Custom Sub-Agents in Claude Code (MindStudio)](https://www.mindstudio.ai/blog/build-custom-sub-agents-claude-code-yaml) — YAML frontmatter format + examples.
- [My Claude Code Multi-Agent Orchestration Setup (Rezvani)](https://alirezarezvani.medium.com/my-claude-code-multi-agent-orchestration-setup-4-instances-in-parallel-d91ff11ffe86) — practical 4-instance parallel setup.
- [The Code Agent Orchestra (Addy Osmani)](https://addyosmani.com/blog/code-agent-orchestra/) — orchestrator-model patterns.
- [VS Code Multi-Agent Development](https://code.visualstudio.com/blogs/2026/02/05/multi-agent-development) — parallel subagents in VS Code.

---

## 10. Quick-Start Commands

```bash
# 1. Install
npm install -g @anthropic-ai/claude-code

# 2. Create agent files
mkdir -p .claude/agents
# → create .claude/agents/builder.md and .claude/agents/evaluator.md (see Step 1)

# 3. Write the contract
mkdir -p docs
# → create docs/contract.md (see Step 2)

# 4. Run the loop
claude
# → "Use the builder subagent to investigate + propose a plan for docs/contract.md"
# → "Builder: implement. Self-test until green."
# → "Evaluator: prove whether it's correct. Write docs/eval_round_1.md."
# → (if REJECT) "Builder: fix the BLOCKERs from eval_round_1.md"
# → (repeat) "Evaluator: re-evaluate. Write eval_round_2.md."
# → ACCEPT ✅

# 5. Monitor parallel agents
claude agents
```

Happy vibe-looping. 🚗
