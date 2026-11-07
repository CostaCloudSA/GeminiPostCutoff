# 🌌 GeminiPostCutoff

[![Build Status](https://github.com/CostaCloudSA/GeminiPostCutoff/actions/workflows/audit.yml/badge.svg)](https://github.com/CostaCloudSA/GeminiPostCutoff/actions/workflows/audit.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/Domains-22%2B_Architecture_Skills-green.svg)](skills/gcp-skills-index/SKILL.md)
[![Sources](https://img.shields.io/badge/Sources-756%2B_Dated_Citations-orange.svg)](skills/gcp-skills-index/SKILL.md)

Post-cutoff **Google Cloud Platform (GCP)** & **AI Agent** architectural runbooks for **Google Antigravity** and **Gemini CLI**.

Built to complement Google's **[Developer Knowledge MCP](https://developers.google.com/knowledge/api)** (`developerknowledge.googleapis.com/mcp`): while Developer Knowledge lets your agent **look up** official documentation on demand, `GeminiPostCutoff` **proactively flags** architectural anti-patterns, service retirements, cross-service trade-offs (`Security > Reliability > Performance > FinOps`), and practitioner FinOps cost traps.

```mermaid
flowchart LR
    U["Prompt or /plan Audit"] --> D["Loads Only Relevant Domain Skills"]
    D --> M["Filters by Your Model's Cutoff Date"]
    M --> P["100% Advisory Plan Artifact (Awaits Approval)"]
```

---

## ⚙️ How It Works

* **Zero-Bloat Progressive Disclosure**: Antigravity indexes only lightweight skill descriptions at startup. Full runbooks (`SKILL.md`) and dated reference vaults (`references/articles.md`) load on-demand only when your prompt or stack requires them.
* **Model-Aware Cutoff Filtering**: Every reference is tagged with its publication month and year (`[MM.YY]`). Based on which Gemini model you use ([`config/model_cutoffs.json`](config/model_cutoffs.json)), the system automatically prioritizes features released *after* your model's training cutoff, double-checks syntax from the 12 months right before its cutoff (where Preview and GA syntax often get mixed up), and uses older references strictly for timeless FinOps math. If your model isn't confirmed, it safely defaults to the oldest active model (`gemini-3.1-pro`, Jan 2025 cutoff) so no recent changes are missed.
* **100% Advisory Governance ([`rules/AGENTS.md`](rules/AGENTS.md))**: Never modifies your Terraform, Kubernetes, IAM, or application files autonomously. Always generates a cited **Implementation Plan Artifact** and waits for your approval (`Proceed`).

---

## ⚡ Quick-Start Setup

```bash
# Option 1: Global Antigravity Plugin (Recommended — mounts rules, 22+ skills, and auditor subagent):
git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git ~/.gemini/config/plugins/GeminiPostCutoff

# Option 2: Team Workspace Submodule (shared across a project repo):
git submodule add https://github.com/CostaCloudSA/GeminiPostCutoff.git .agents/plugins/GeminiPostCutoff

# Option 3: Local Installer Script (Plugin or Flat Skill Symlinks):
pwsh scripts/install.ps1              # Windows (append -FlatSkills for symlinks)
bash scripts/install.sh               # Linux/macOS (append --flat-skills for symlinks)
```

* **Selective Domain Mounting**: Load only specific skills in a workspace via `.agents/skills.json` (`include_only: ["gcp-adk-agents", "gcp-cloud-run", ...]`).
* **Pair with Google Developer Knowledge MCP**: Merge [`mcp_config.example.json`](mcp_config.example.json) into `~/.gemini/config/mcp_config.json` to combine live official Google docs with `GeminiPostCutoff` FinOps and SRE guardrails.

---

## 🗂️ Architectural Pillars (22+ Domain Skills)

| Pillar | Domain Skills (`skills/<domain>/SKILL.md`) | Core Post-Cutoff Coverage & FinOps Guardrails |
| :--- | :--- | :--- |
| **1. AI Agents, ADK & Frontier** | [`gcp-adk-agents`](skills/gcp-adk-agents/SKILL.md) · [`gcp-frontier-emerging`](skills/gcp-frontier-emerging/SKILL.md) · [`gcp-conversational-ai`](skills/gcp-conversational-ai/SKILL.md) · [`gcp-generative-media`](skills/gcp-generative-media/SKILL.md) · [`gcp-gemini-tooling`](skills/gcp-gemini-tooling/SKILL.md) | ADK 1.0 (Python/Go/Java), Agent Engine, A2A/A2UI/AG-UI, Memory Bank, Gemma 4 on TPU v5p/v6e, JAX FSDP, Gemini Live WebSockets, Veo 3.1, Antigravity IDE & FastMCP |
| **2. Compute, GKE, Serverless & Events** | [`gcp-gke-platform`](skills/gcp-gke-platform/SKILL.md) · [`gcp-gke-inference`](skills/gcp-gke-inference/SKILL.md) · [`gcp-cloud-run`](skills/gcp-cloud-run/SKILL.md) · [`gcp-pubsub`](skills/gcp-pubsub/SKILL.md) | Gateway API (`ingress-nginx` retirement), Dataplane V2, Pod Snapshots, GKE Inference Gateway, vLLM/Kueue, Agent Sandbox, Cloud Run `--no-cpu-throttling` & IAP, Pub/Sub Lite migration & SMTs |
| **3. BigQuery, Databases & Migrations** | [`gcp-bigquery-ai`](skills/gcp-bigquery-ai/SKILL.md) · [`gcp-bigquery-analytics`](skills/gcp-bigquery-analytics/SKILL.md) · [`gcp-databases`](skills/gcp-databases/SKILL.md) · [`gcp-migrations`](skills/gcp-migrations/SKILL.md) | BigQuery Remote MCP, Vector SQL (`VECTOR_SEARCH`), Continuous Queries, BigQuery Graph, Dataform, Cloud SQL 3x tuning, AlloyDB ScaNN, Firestore Pipelines, AWS/Azure/Snowflake migrations |
| **4. Security, Networking & FinOps** | [`gcp-security-compliance`](skills/gcp-security-compliance/SKILL.md) · [`gcp-networking`](skills/gcp-networking/SKILL.md) · [`gcp-computefinops`](skills/gcp-computefinops/SKILL.md) · [`gcp-bigquery-cost`](skills/gcp-bigquery-cost/SKILL.md) · [`gcp-gke-cost`](skills/gcp-gke-cost/SKILL.md) | Model Armor, WIF, Direct VPC Egress, Private Service Connect, Envoy AI Gateway, BigQuery 690 TB/mo slot crossover & 90-day storage DML resets, Spend CUDs, GKE Cost Allocation |
| **5. Orchestration & Specialized** | [`gcp-architecture-review`](skills/gcp-architecture-review/SKILL.md) · [`gcp-gemini-robotics`](skills/gcp-gemini-robotics/SKILL.md) · [`gcp-geospatial`](skills/gcp-geospatial/SKILL.md) · [`gcp-android-xr`](skills/gcp-android-xr/SKILL.md) · [`gcp-skills-index`](skills/gcp-skills-index/SKILL.md) | Multi-Domain Architecture Audit Orchestrator, Gemini Robotics & LiteRT, Earth Engine + AlphaEarth GIS, Android XR Jetpack Compose, Master Navigation Router |

---

## 💬 Feedback & License

* **Issues & Article Nominations**: Found an erratum or want to nominate a recent Google Cloud engineering post? [Open a GitHub Issue](https://github.com/CostaCloudSA/GeminiPostCutoff/issues).
* **License**: Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for details. Copyright (c) 2026 [CostaCloudSA](https://github.com/CostaCloudSA).
