# 🔄 Vibe-Loop Engineering — Multi-Agent Guides

Step-by-step instructions for running **loop engineering** (the contract-driven, adversarial multi-agent workflow used to build Vibe-Auto-Cost) in three popular AI coding tools.

![Loop Engineering Workflow](./workflow_diagram.png)

## What is Loop Engineering?

A repeatable cycle for shipping **verified** software with AI agents — instead of a single linear "ask → code" chat:

```
Frame → Discover → Contract → Builder (investigate-first) → Adversarial Evaluator → Iterate to ACCEPT
```

**Five principles (every tool):**
1. **Separation of roles** — Lead frames/judges; Builder writes code; Evaluator breaks it. Builder & Evaluator are **never the same agent**.
2. **Contract before code** — written spec with measurable acceptance criteria.
3. **Adversarial, numeric verification** — "looks good" is rejected; every AC needs measurable evidence.
4. **Iterate to ACCEPT** — Round 1 often REJECTs; fix BLOCKERs and re-run until ACCEPT.
5. **Guardrails** — schema validation, input bounds, deterministic fallbacks.

## Guides

| Tool | Directory | Multi-agent primitive used |
|------|-----------|---------------------------|
| **Google Antigravity** | [`./antigravity/`](./antigravity/README.md) | Async subagents (`invoke_subagent` / `define_subagent`) + worktree isolation + `/teamwork-preview` |
| **OpenCode** | [`./opencode/`](./opencode/README.md) | Primary agents + custom subagents (`.opencode/agents/`) + permissions + multi-session |
| **Claude Code** | [`./claude/`](./claude/README.md) | Subagents (`.claude/agents/` YAML) + worktrees + agent view + agent teams |

Each guide has: prerequisites, step-by-step setup (define Builder + Evaluator, write contract, run the loop, iterate), a concrete example from Vibe-Auto-Cost, a checklist, source links, and quick-start commands.

## The Proof It Works

We ran this exact loop with **AdaL** (the same pattern) to build Vibe-Auto-Cost:
- **Phase 1** (UI clone): Round 1 REJECT (6 BLOCKERs) → fixed → Round 2 ACCEPT.
- **Phase 2** (cost estimator): ACCEPT round 1 (15/15 ACs), + 3 polish rounds addressing reviewer feedback.

Full transcripts + eval reports are in `../logs3/`. The final app is in `../auto-evaluation/app/`.

## Diagram

The workflow diagram (`workflow_diagram.png`, also copied into each tool's folder) shows the 5-stage loop with the Lead orchestrating parallel Builder + Evaluator workers.

---

Pick your tool and start looping. 🚗
