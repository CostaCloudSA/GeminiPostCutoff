# GeminiPostCutoff Architecture & Knowledge Ingestion Protocol

## 🎯 Scope & Context
This repository provides a curated, 20-domain Google Cloud Platform (GCP) and AI Agent operational runbook system maintained by CostaCloudSA.

---

## ⚡ Reference Formatting & Chronological Rules

### 1. Standardization & Formatting Syntax
Every reference link in `references/articles.md` MUST follow this exact format:
- `- [[MM.YY Blogpost]: Canonical Title](https://...)`
- `- [[MM.YY Article]: Canonical Title](https://...)`
- `- [Codelab: Title](https://...)`
- `- [Repo Name: Description](https://github.com/...)`

### 2. Strict Mathematical Chronological Sorting
- Within every `references/articles.md`, links MUST be strictly ordered descending by publication date:
  $$\text{Sort Key} = (2000 + \text{Year}) \times 100 + \text{Month}$$
- Example: `[09.26]` (202609) $\to$ `[08.26]` (202608) $\to$ `[07.26]` (202607) $\to$ ... $\to$ `[01.24]` (202401).

### 3. Structural Quotas (SKILL_STANDARD.md)
Every `SKILL.md` must strictly provide:
- Metadata frontmatter (`name`, `description`).
- `## 🎯 Domain Scope & Activation Triggers` (at least 5 triggers).
- `## 🚫 Critical Anti-Patterns & Architecture Traps` (4 to 6 items with callouts and citations).
- `## ⚖️ Architecture Decision Matrices` (2 to 4 comparison tables with citations).
- `## 🛠️ Production Blueprints` (4 to 8 complete, runnable code examples with citations).
- `## ⏱️ Chronological Evolution (2025–2026)` (chronological milestones).
- `## 📚 Reference Vaults & Portability Standard` (dual vaults for active articles and historical archive).

### 4. Automated Verification
Always verify using the repository test suite before committing:
```bash
node scripts/audit_skills.js
node scripts/lint_internal_links.js
node scripts/audit_skill_rules.js
```
