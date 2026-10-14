# Standard Specification for GCP & AI Agent `SKILL.md` Files

This specification establishes the mandatory quality, structural, and knowledge extraction standards for all skill files (`SKILL.md`) across the 22-domain curated GCP knowledge base.

---

## 🎯 1. Mandatory Anatomy & Structure
Every `SKILL.md` MUST strictly contain the following 6 core sections in order (with **uncapped depth**—no artificial line-count ceilings or maximum section caps):

```markdown
---
name: <skill-name>
description: >-
  <Concise 2-4 sentence summary of capabilities, frameworks, and activation triggers>
---

# <Descriptive Domain Title> Runbook

## 🎯 Domain Scope & Activation Triggers
<Bullet points listing exact infrastructure components, code frameworks, CLI tools, and architecture review triggers>

## 🚫 Critical Anti-Patterns & Operational Pitfalls
<Uncapped high-risk traps (minimum 4–6+ based on vault size) formatted with GitHub callout blocks (> [!CAUTION] or > [!WARNING])>
<Each anti-pattern header MUST include its [MM.YY] release tag: > **Anti-Pattern N: Title [MM.YY]**>
<Each anti-pattern MUST state:
 1. The Trap / Anti-Pattern
 2. The Operational Impact / Blast Radius
 3. The Mandatory Standard / Remediation
 4. Direct Citation to source article: *Cites: [Canonical Title](./references/articles.md)* (or ./references/archive.md)>

## ⚖️ Architecture Decision Matrices
<Uncapped quantitative comparison Markdown tables (minimum 2–3+) with concrete metrics (latency, cost, throughput, SLA)>
<Each table MUST provide actionable crossover thresholds (e.g. "Use X when QPS < 50, switch to Y when QPS > 50")>

## 🛠️ Production Blueprints & Implementation Patterns
<Uncapped complete, syntactically valid, production-grade code snippets (minimum 4–6+ across Terraform, Python, SQL, Go, Java, YAML, Shell)>
<Zero vague pseudo-code and zero deprecated pre-2026 model identifiers (never use gemini-1.5-* or gemini-2.5-*).>
<Each blueprint header MUST include its [MM.YY] release tag: ### Blueprint N: Title [MM.YY]>
<Each blueprint MUST cite its source article: *Cites: [Canonical Title](./references/articles.md)* (or ./references/archive.md)>

## ⏱️ Chronological Evolution (2024–2026)
<Chronological bullet items ordered descending from newest [MM.YY] to oldest [MM.YY]>

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Architecture Masterclasses Vault (<= 2024)**:
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
```

---

## 🔬 2. Knowledge Extraction & Architectural Extraction Score (AES)

To ensure that `SKILL.md` files are deep, comprehensive operational runbooks rather than superficial summaries, every skill and ingested resource must adhere to the **5-Tier AES Standard**:

| AES Level | Requirement | Mandatory Ingestion Target |
| :---: | :--- | :--- |
| **Level 1** | Cataloged Link | Entry inserted into `references/articles.md` under its chronological year header (`### 🌟 2026 ...` or `### 📅 2025 ...`) in strict descending `[MM.YY]` order. |
| **Level 2** | Chronological Milestone | Timeline entry in `## ⏱️ Chronological Evolution` with date and practical impact. |
| **Level 3** | Architectural Rule | Concrete Anti-Pattern with remediation or quantitative Decision Matrix threshold. |
| **Level 4** | Production Blueprint | Copy-pasteable Terraform, Python, Go, Java, or Bash snippet citing the article. |
| **Level 5** | Eval & Verifier Grounded | Validated via `node review_engine/grounding/verifier.js` (100% citation resolution, 0 date discrepancies, 0 AST snippet errors). |

### Minimum Floor Coverage (Uncapped Upper Bounds):
> [!IMPORTANT]
> **No Artificial Upper Caps**: Runbooks must NEVER be truncated to fit an arbitrary line limit (e.g., 400 lines) or capped at a fixed number of anti-patterns or blueprints. As reference vaults grow, runbooks must expand proportionally to codify every major architectural pattern.

- For vaults with **$\le 15$ articles**: Minimum floor of **4 anti-patterns**, **2 decision matrices**, and **4 production blueprints** (Uncapped maximum).
- For vaults with **16–40 articles**: Minimum floor of **5 anti-patterns**, **2 decision matrices**, and **5 production blueprints** (Uncapped maximum).
- For vaults with **$> 40$ articles** (e.g., `gcp-adk-agents`, `gcp-gemini-tooling`, `gcp-gke-platform`, `gcp-cloud-run`): Minimum floor of **6 anti-patterns**, **2–3 decision matrices**, and **6 production blueprints** (Uncapped maximum).

---

## 📊 3. Reporting Standard: Previous State vs. New State

Whenever a skill or batch of skills is audited and updated, the delivery report to the user MUST explicitly present a **Previous State vs. New State** breakdown containing:

| Metric | Required Report Details |
| :--- | :--- |
| **Line Count & Expansion** | Before vs. After line count (no upper ceiling). |
| **Anti-Patterns Codified** | Before vs. After count of critical anti-patterns with `[MM.YY]` tags and citations. |
| **Decision Matrices** | Before vs. After trade-off matrices with quantitative thresholds. |
| **Production Blueprints** | Before vs. After runnable, multi-language blueprints (`gemini-4-argon` / `gemini-3.8-flash` parameterized). |
| **Active vs. Archived Vault** | Exact count of active vault links (`articles.md`) vs. evergreen archive links (`archive.md`). |
| **Audit & Grounding Verification** | Status of `audit_skills.js`, `audit_skill_rules.js`, and `review_engine/grounding/verifier.js` (100% grounding, 0 unresolved citations, 0 date diffs). |

---

## 🛡️ 4. Advisory Governance, Dynamic Cutoff Triage & Human Approval Gate

Every skill in this repository serves an **exclusively advisory function**. Assistants referencing these runbooks must comply with the following governance rules:

1. **Human-Verified Model Identity & Zero Hardcoded Defaults**: The assistant must never guess, self-report, or hardcode a default model cutoff. It must confirm the active model with the user—differentiating between **Newest Generation** models (`gemini-4-argon` or future models via `--cutoff YYYY-MM`) and **Older Generation** models (`gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.1-pro`). Unconfirmed sessions automatically fall back to the conservative **Unverified Fail-Safe Horizon (`2025-01` / `>= 02.25`)**.
2. **Cutoff-Relative Dynamic Tiers ($\Delta_m$)**: Tiers are calculated dynamically relative to the active model's cutoff ($\Delta_m > 0$ for **Dynamic Tier 1**, $-12 \le \Delta_m \le 0$ for **Dynamic Tier 2**, and $\Delta_m < -12$ for **Dynamic Tier 3**).
3. **Zero Autonomous Infrastructure Edits**: The assistant is strictly prohibited from modifying Terraform configurations, Cloud Run settings, GKE manifests, IAM roles, or database schemas without prior explicit human approval.
4. **Mandatory Implementation Plan Deliverable & Sign-Off**: Any proposed change must be presented as an implementation plan artifact with `RequestFeedback: true`, external documentation links (`https://...`), blast radius analysis, and code diff previews, awaiting explicit user approval (`Proceed`) before execution.
