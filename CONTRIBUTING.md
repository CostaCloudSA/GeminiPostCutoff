# Contributing & Maintenance Policy

## 🔒 Project Governance: Sole Maintainer Notice

Thank you for your interest in **GeminiPostCutoff**!

This repository is a curated, verified knowledge base and expert operational runbook system authored and maintained **exclusively by CostaCloudSA** (`@CostaCloudSA`).

To maintain strict architectural fidelity, consistent operational standards, and mathematical chronological descending order across all indexed resources:

1. **External Pull Requests (PRs) Are Not Accepted**:
   - This repository is published as a **public, read-only reference distribution**.
   - Direct pull requests submitted by external contributors will be automatically closed without review.

2. **100% Advisory Capacity**:
   - All runbooks and AI agent skills operate in a **purely advisory capacity**.
   - Autonomous edits to infrastructure, Terraform, Cloud Run, GKE, or BigQuery schemas are strictly prohibited. All changes must be presented via structured implementation plans awaiting human approval.

3. **How to Suggest Changes or Report Issues**:
   - **Broken Links or Errata**: If you encounter an inaccessible URL or a factual error in an operational blueprint, please [open an Issue](https://github.com/CostaCloudSA/GeminiPostCutoff/issues).
   - **Article Recommendations**: If you have a recent post-cutoff Google Cloud Platform, Vertex AI, or Gemini article or codelab you would like considered for curation, open an issue using the `Article Recommendation` template.
   - The maintainer evaluates and incorporates accepted items following the [Ingestion Protocol](skills/gcp-skills-index/INGESTION_PROTOCOL.md) and automated test suite.

---

## 🔬 Ingestion & Quality Standards: Architectural Extraction Score (AES)

Every accepted article must achieve a minimum rating under the **5-Tier AES Rubric**:

| Score | Level | Ingestion Requirement | Target Location |
| :---: | :--- | :--- | :--- |
| **Level 1** | Cataloged Link | Formatted entry in mathematical descending date order. | `references/articles.md` |
| **Level 2** | Chronological Milestone | Timeline entry with date (`MM.YY`) and practical impact. | `SKILL.md` (`## ⏱️ Chronological Evolution`) |
| **Level 3** | Architectural Rule | Concrete Anti-Pattern with remediation or Decision Matrix threshold. | `SKILL.md` (`## 🚫 Anti-Patterns` or `## ⚖️ Decision Matrices`) |
| **Level 4** | Production Blueprint | Copy-pasteable Terraform, Python, Go, or Bash snippet citing the article. | `SKILL.md` (`## 🛠️ Production Blueprints`) |
| **Level 5** | Eval Verified | Validated with automated prompt eval in Antigravity or Gemini CLI. | `evals/` test suite |

---

## 🧪 Maintenance & Verification Standards

All updates committed by the maintainer must satisfy the repository test harness:

```bash
# Verify chronological sorting and link formatting
npm run audit:dates

# Verify internal markdown cross-references
npm run audit:links

# Verify anti-pattern, decision matrix, and blueprint quotas
npm run audit:rules

# Run entire local test suite
npm test

# Run monthly external URL health check (checks 546+ external HTTP endpoints)
npm run audit:external
```
