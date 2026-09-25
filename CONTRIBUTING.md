# Contributing & Maintenance Policy

## 🔒 Project Governance: Sole Maintainer Notice

Thank you for your interest in **GeminiPostCutoff**!

This repository is a curated, verified knowledge base and expert operational runbook system authored and maintained **exclusively by CostaCloudSA** (`@CostaCloudSA`).

To maintain strict architectural fidelity, consistent operational standards, and mathematical chronological descending order across all indexed resources:

1. **External Pull Requests (PRs) Are Not Accepted**:
   - This repository is published as a **public, read-only reference distribution**.
   - Direct pull requests submitted by external contributors will be automatically closed without review.

2. **How to Suggest Changes or Report Issues**:
   - **Broken Links or Errata**: If you encounter an inaccessible URL or a factual error in an operational blueprint, please [open an Issue](https://github.com/CostaCloudSA/GeminiPostCutoff/issues).
   - **Article Recommendations**: If you have a recent post-cutoff Google Cloud Platform, Vertex AI, or Gemini article or codelab you would like considered for curation, open an issue using the `Article Recommendation` template.
   - The maintainer will evaluate, verify, and incorporate accepted items following the [Ingestion Protocol](skills/gcp-skills-index/INGESTION_PROTOCOL.md) and automated test suite.

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

# Run entire test suite
npm test
```
