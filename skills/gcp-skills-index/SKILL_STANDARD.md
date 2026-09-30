# Standard Specification for GCP & AI Agent `SKILL.md` Files

This specification establishes the mandatory quality, structural, and knowledge extraction standards for all skill files (`SKILL.md`) across the 21-domain curated GCP knowledge base.

---

## 🎯 1. Mandatory Anatomy & Structure
Every `SKILL.md` MUST strictly contain the following 7 sections in order:

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
<4–8 high-risk traps formatted with GitHub callout blocks (> [!CAUTION] or > [!WARNING])>
<Each anti-pattern MUST state:
 1. The Trap / Anti-Pattern
 2. The Operational Impact / Blast Radius
 3. The Mandatory Standard / Remediation
 4. Direct Citation to source article: *Cites: [Canonical Title](./references/articles.md)*>

## ⚖️ Architecture Decision Matrices
<2–3 quantitative comparison Markdown tables with concrete metrics (latency, cost, throughput, SLA)>
<Each table MUST provide actionable crossover thresholds (e.g. "Use X when QPS < 50, switch to Y when QPS > 50")>

## 🛠️ Production Blueprints & Implementation Patterns
<4–8 complete, syntactically valid, production-grade code snippets (Terraform, Python, SQL, Go, YAML, Shell)>
<Zero vague pseudo-code. Must include real parameters, IAM roles, resource blocks, or error handlers>
<Each blueprint MUST cite its source article: *Cites: [Canonical Title](./references/articles.md)*>

## ⏱️ Chronological Evolution (2024–2026)
<!-- Tier 1A: Frontier Delta (>= 04.26) - Post-cutoff for ALL models -->
<Bullet items for releases >= 04.26>

<!-- Tier 1B: Intermediate Delta (02.25 - 03.26) - Post-cutoff for Gemini 3.1 Pro -->
<Bullet items for releases 02.25 to 03.26>

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Architecture Masterclasses Vault (<= 2024)**:
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
```

---

## 🔬 2. Knowledge Extraction & Architectural Extraction Score (AES)

To ensure that `SKILL.md` files are not superficial summaries, every skill and ingested resource must adhere to the **5-Tier AES Standard**:

| AES Level | Requirement | Mandatory Ingestion Target |
| :---: | :--- | :--- |
| **Level 1** | Cataloged Link | Entry inserted into `references/articles.md` in strict chronological order. |
| **Level 2** | Chronological Milestone | Timeline entry in `## ⏱️ Chronological Evolution` with date and practical impact. |
| **Level 3** | Architectural Rule | Concrete Anti-Pattern with remediation or quantitative Decision Matrix threshold. |
| **Level 4** | Production Blueprint | Copy-pasteable Terraform, Python, Go, or Bash snippet citing the article. |
| **Level 5** | Eval Verified | Validated with automated prompt eval in Antigravity or Gemini CLI. |

### Quota Coverage:
- For vaults with **$\le 15$ articles**: Minimum **4 anti-patterns**, **2 decision matrices**, and **4 production blueprints**.
- For vaults with **16–40 articles**: Minimum **5 anti-patterns**, **2–3 decision matrices**, and **5–6 production blueprints**.
- For vaults with **$> 40$ articles** (e.g., `gcp-adk-agents`, `gcp-gemini-tooling`, `gcp-gke-platform`): Minimum **6 anti-patterns**, **3 decision matrices**, and **6–8 production blueprints**.

---

## 📊 3. Reporting Standard: Previous State vs. New State

Whenever a skill or batch of skills is audited and updated, the delivery report to the user MUST explicitly present a **Previous State vs. New State** breakdown containing:

| Metric | Required Report Details |
| :--- | :--- |
| **Line Count & Expansion** | Before (e.g., 60 lines) vs. After (e.g., 245 lines). |
| **Anti-Patterns Codified** | Before (e.g., 0 traps) vs. After (e.g., 4 critical anti-patterns with callouts). |
| **Decision Matrices** | Before (e.g., 0 tables) vs. After (e.g., 2 trade-off matrices with quantitative thresholds). |
| **Production Blueprints** | Before (e.g., 1 basic snippet) vs. After (e.g., 5 runnable, multi-language blueprints). |
| **Active vs. Archived Vault** | Exact count of post-cutoff active delta links vs. pre-cutoff evergreen/doc links. |
| **Key Missing Knowledge Added** | Bullet points explicitly detailing the major architectural mechanisms harvested from the articles that were completely absent from the old version. |
| **Audit Verification** | Status of `audit_skills.js` (total links checked, sorting errors: 0, broken links: 0). |

---

## 🛡️ 4. Advisory Governance & Human Approval Gate

Every skill in this repository serves an **exclusively advisory function**. Assistants referencing these runbooks must comply with the following governance rules:

1. **Human-Verified Model Identity**: The assistant must never guess or self-report its model cutoff. It must confirm the active model with the user (Gemini 3.1 Pro vs. 3.6/3.7/3.8 Flash) before selecting triage tiers. Unconfirmed sessions default to the stricter Tier 1A + Tier 1B standard (`>= 02.25`).
2. **Zero Autonomous Infrastructure Edits**: The assistant is strictly prohibited from modifying Terraform configurations, Cloud Run settings, GKE manifests, IAM roles, or database schemas without prior explicit human approval.
3. **Mandatory Implementation Plan Deliverable**: Any proposed change must be presented as an implementation plan artifact containing:
   - Recommendations and rationale.
   - Verified external documentation links (`https://...`).
   - Anti-patterns avoided and blast radius analysis.
   - Code diff previews.
4. **Explicit Human Sign-Off**: The artifact must set `RequestFeedback: true` and await explicit user approval (`Proceed` or typed confirmation) before modifying any infrastructure files.
