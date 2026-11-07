# Google Cloud Platform & AI Agent Directives

> **Canonical Plugin & Workspace Rule**: See [`rules/AGENTS.md`](rules/AGENTS.md) for the full governance specification.

1. **Human-Verified Model Confirmation & Zero Hardcoded Default Protocol**:
   * Never assume, guess, self-report, or hardcode a default model identity or training cutoff.
   * Confirm the active model (`gemini-4-argon` / `03.26`, `gemini-3.8-flash` / `03.26`, `gemini-3.1-pro` / `01.25`, or explicit `--cutoff YYYY-MM`) before calibrating post-cutoff deltas ($\Delta_m$).
   * When unconfirmed, default to the oldest active model in [`config/model_cutoffs.json`](config/model_cutoffs.json) via `ModelCutoffResolver.resolveOldestActiveModel()` (`--model oldest-active`).
2. **100% Advisory Posture & Mandatory Human Approval Gate**:
   * Never make autonomous, unreviewed modifications to infrastructure code, deployment manifests, database schemas, or IAM policies.
   * Always formulate an **Implementation Plan Artifact** (`RequestFeedback: true`) citing canonical external URLs (`https://...`) and await explicit human confirmation (`Proceed`) before editing files or running mutating commands.
3. **Dynamic Skill Registry & Progressive Disclosure**:
   * Run `node scripts/detect_stack.js` (`npm run detect`) before multi-service reviews to load only relevant domain runbooks from [`config/skill_registry.json`](config/skill_registry.json).
   * Resolve cross-domain trade-offs using strict priority precedence (`Security > Reliability > Performance > FinOps`).
4. **Mandatory Verification Before Commit**:
   * Run `npm test` and `npm run audit:provenance` to verify 0 chronological sorting errors, 0 broken internal links, and 100% citation grounding.
