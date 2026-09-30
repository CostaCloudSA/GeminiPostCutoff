---
name: gcp-architecture-review
description: >-
  Orchestrator review skill for conducting end-to-end Google Cloud Platform (GCP) architectural audits.
  Detects project infrastructure components, identifies post-cutoff delta opportunities (2025-2026),
  flags critical anti-patterns, and produces phased implementation plans citing vetted production blueprints.
---

# GCP Architectural Review Engine Runbook

## 🎯 Domain Scope & Activation Triggers
* **Explicit Triggers**: `/gcp-review`, "audit our GCP architecture", "review cloud architecture", "evaluate GCP design against 2026 standards".
* **Scope**: Full-stack Google Cloud infrastructure, including Compute (GKE, Cloud Run), AI/Agent orchestration (ADK, GEAP), Data (BigQuery, Cloud SQL, AlloyDB), FinOps/Budgets, Networking, and IAM/Model Armor.

---

## 🚫 Critical Review Anti-Patterns
> [!CAUTION]
> **Trap: Universal Context Bloat (Loading All 20 Skills At Once)**  
> **Impact**: Overwhelms the model's context window, degrading reasoning quality and wasting token budget.  
> **Remediation**: Run pre-flight stack detection via `node scripts/detect_stack.js` to identify only the active infrastructure components (e.g. Cloud Run + BigQuery) and load only their respective domain runbooks.

> [!WARNING]
> **Trap: Ignoring Model Knowledge Cutoffs**  
> **Impact**: Gemini 3.1 Pro defaults to pre-2025 patterns; Flash models (3.6/3.7/3.8) miss post-March 2026 GA capabilities.  
> **Remediation**: Calibrate every architectural recommendation against the model cutoff matrix in [`config/model_cutoffs.json`](../../config/model_cutoffs.json), prioritizing Tier 1A (`>= 04.26`) for Flash and Tier 1A+1B (`>= 02.25`) for Pro.

---

## ⚖️ Review Phase Decision Matrix

| Phase | Objective | Tooling / Input | Output Artifact |
| :--- | :--- | :--- | :--- |
| **Phase 1: Pre-Flight Scan** | Identify in-scope GCP services without human bias. | `node scripts/detect_stack.js` | Identified Component Manifest |
| **Phase 2: Post-Cutoff Delta Audit** | Compare stack against Tier 1A (`>= 04.26`) and Tier 1B (`02.25-03.26`). | Target domain `SKILL.md` runbooks | Modernization Opportunities List |
| **Phase 3: FinOps & Evergreen Audit** | Validate against Tier 2 (`<= 01.25`) cost crossover formulas. | `gcp-bigquery-cost`, `gcp-gke-cost`, `gcp-finops-killswitch` | Waste Elimination & Spend Caps |
| **Phase 4: Synthesis & Plan** | Formulate actionable, phased roadmap. | Phased Implementation Template | Complete Markdown Implementation Plan |

---

## 🛠️ Operational Review Blueprint

### Step 1: Execute Pre-Flight Stack Detection
```bash
# Scan current workspace for Terraform, Docker, Kubernetes, and dependency manifests
node scripts/detect_stack.js
```

### Step 2: Progressive Domain Activation
Based on the detected components, activate only the relevant domain runbooks:
* If `google_cloud_run_*` detected $\to$ Activate [`gcp-cloud-run`](../gcp-cloud-run/SKILL.md).
* If `google_container_cluster` or `k8s/` detected $\to$ Activate [`gcp-gke-platform`](../gcp-gke-platform/SKILL.md) and [`gcp-gke-cost`](../gcp-gke-cost/SKILL.md).
* If `google_bigquery_*` detected $\to$ Activate [`gcp-bigquery-cost`](../gcp-bigquery-cost/SKILL.md) and [`gcp-bigquery-ai`](../gcp-bigquery-ai/SKILL.md).
* If AI agent code (`google-adk`, `langchain`) detected $\to$ Activate [`gcp-adk-agents`](../gcp-adk-agents/SKILL.md).

### Step 3: Mandatory Review Output Contract
Every architecture review MUST produce a structured implementation plan containing:
1. **Executive Workload Inventory**: Discovered services, deployment targets, and dependencies.
2. **Post-Cutoff Delta Opportunities**: Specific 2025–2026 features to adopt (e.g. Direct VPC Egress, Remote MCP, Model Armor).
3. **Operational Anti-Patterns Identified**: Flagged traps (e.g. CPU throttling during agent calls, unpartitioned BigQuery tables).
4. **Phased Implementation Roadmap**:
   * *Phase 1: Quick Wins* (Zero-downtime configuration fixes).
   * *Phase 2: Modernization* (Adopting post-cutoff APIs and protocols).
   * *Phase 3: FinOps Hardening* (Programmatic kill switches, reservation crossover).
5. **Verified Citations**: All referenced documentation must cite canonical external URLs (`https://...`).

---

## ⏱️ Chronological Evolution
- **[09.26]**: Formalized standard review engine with pre-flight stack detection and 3-tier model cutoff triage.
- **[08.26]**: Added Eval-Driven Development (EDD) criteria for validating agent tool execution.
- **[05.26]**: Integrated Agent Sandbox and A2UI protocols into GKE and Cloud Run review baselines.

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Architecture Masterclasses Vault (<= 2024)**:
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)

