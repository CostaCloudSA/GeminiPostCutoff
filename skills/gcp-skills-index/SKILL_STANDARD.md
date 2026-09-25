# Standard Specification for GCP & AI Agent `SKILL.md` Files

This specification establishes the mandatory quality, structural, and knowledge extraction standards for all skill files (`SKILL.md`) across the 20-domain curated GCP knowledge base.

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
<Strict descending chronological list of architectural shifts, feature releases, and deprecations>
<Format: - **[MM.YY]**: Description of release and practical architectural impact>

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Architecture Masterclasses Vault (<= 2024)**:
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
```

---

## 🔬 2. Knowledge Extraction & Harvesting Standard

To ensure that `SKILL.md` files are not superficial summaries, every skill must adhere to the following extraction quotas:

1. **Extraction Coverage Ratio**:
   - For vaults with **$\le 15$ articles**: Minimum **4 anti-patterns**, **2 decision matrices**, and **4 production blueprints**.
   - For vaults with **16–40 articles**: Minimum **5 anti-patterns**, **2–3 decision matrices**, and **5–6 production blueprints**.
   - For vaults with **$> 40$ articles** (e.g., `gcp-adk-agents`, `gcp-gemini-tooling`, `gcp-gke-platform`): Minimum **6 anti-patterns**, **3 decision matrices**, and **6–8 production blueprints**.
2. **Deep Pattern Harvesting**:
   - Do NOT just summarize product marketing announcements.
   - Extract **non-obvious failure modes** (e.g. CPU throttling during background threads, IAM binding overwrites, FreeSWITCH audio sample rate mismatch, BigQuery slot starvation).
   - Extract **hard architectural numbers** (e.g. crossover point of 690 TB/month for slots vs on-demand, 400ms vs 3000ms voice agent latency, 35% KV-cache routing latency improvement).
3. **Traceability Contract**:
   - Every single anti-pattern, decision matrix, and production blueprint MUST explicitly cite its supporting article using the relative link syntax: `*Cites: [Canonical Title](./references/articles.md)*` or `*Cites: [Canonical Title](./references/archive.md)*`.

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
