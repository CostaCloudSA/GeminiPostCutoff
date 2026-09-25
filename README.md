# 🌌 GeminiPostCutoff: GCP & Frontier AI Skills System

[![Quality Audit](https://github.com/CostaCloudSA/GeminiPostCutoff/actions/workflows/audit.yml/badge.svg)](https://github.com/CostaCloudSA/GeminiPostCutoff/actions/workflows/audit.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/Skills-20_Domains-green.svg)](skills/gcp-skills-index/SKILL.md)
[![Resources](https://img.shields.io/badge/Resources-540%2B_Indexed-orange.svg)](skills/gcp-skills-index/SKILL.md)
[![Maintainer](https://img.shields.io/badge/Maintained%20By-CostaCloudSA-purple.svg)](https://github.com/CostaCloudSA)

A battle-tested, curated operational runbook system and link vault designed for **Google Antigravity**, **Gemini CLI**, and cloud enterprise architects. 

This repository bridges the gap between foundation model training cutoffs and the rapidly evolving 2025–2026 Google Cloud Platform (GCP) ecosystem, indexing **over 540 chronologically verified publications, codelabs, official documentation hubs, and production architecture blueprints**.

---

## 🏛️ Key System Architecture

Every domain skill follows the standardized **Dual-Vault & Production Runbook Specification**:

1. **Dual-Vault Reference Engine**:
   - `references/articles.md`: Active, post-cutoff delta publications strictly ordered descending by publication date (`[MM.YY]`).
   - `references/archive.md`: Historical foundation guides, official documentation hubs, and evergreen masterclasses.
2. **Production-Ready Blueprints**: Fully functional, non-truncated Python and Bash implementations with exact SDK syntax.
3. **Actionable Anti-Patterns**: Explicit technical traps, failure modes, and breaking changes introduced in 2025–2026.
4. **Architecture Decision Matrices**: Comparative engineering trade-offs (latency vs cost vs complexity).
5. **Continuous Automated Audit**: Every commit is validated via Node.js test harnesses guaranteeing 0 broken links and 100% mathematical date sort compliance.

---

## 🧭 Curated Skill Directory

| Skill | Domain & Key Capabilities | Active Resources |
| :--- | :--- | :---: |
| [**`gcp-adk-agents`**](skills/gcp-adk-agents/SKILL.md) | Agent Development Kit (ADK Python/Go/Java 1.0), Vertex AI Agent Engine, A2A/A2UI Protocols, Memory Bank | **92** |
| [**`gcp-gemini-tooling`**](skills/gcp-gemini-tooling/SKILL.md) | Gemini CLI Plan Mode, Antigravity IDE custom rules/skills, FastMCP, Terraform Stacks, Eval-Driven Development | **76** |
| [**`gcp-gke-platform`**](skills/gcp-gke-platform/SKILL.md) | GKE Autopilot vs Standard, Gateway API, Dataplane V2, Zero-Touch OpenTelemetry, Pod Snapshots | **48** |
| [**`gcp-cloud-run`**](skills/gcp-cloud-run/SKILL.md) | CPU throttling prevention (`--no-cpu-throttling`), Serverless MCP/A2A hosting, Identity-Aware Proxy, Temporal | **41** |
| [**`gcp-security-compliance`**](skills/gcp-security-compliance/SKILL.md) | Google Model Armor, Workload Identity Federation (WIF), Canary Tokens, SecOps detections, Workforce Federation | **35** |
| [**`gcp-bigquery-ai`**](skills/gcp-bigquery-ai/SKILL.md) | BigQuery Remote MCP Server, Vector SQL with IVF indexes, `ML.GENERATE_TEXT`, Autonomous Embeddings | **35** |
| [**`gcp-frontier-emerging`**](skills/gcp-frontier-emerging/SKILL.md) | Gemma open models (Gemma 4 12B, Gemma 3), Cloud TPUs (v5p/v6e), JAX distributed sharding, Supervised Fine-Tuning | **34** |
| [**`gcp-bigquery-cost`**](skills/gcp-bigquery-cost/SKILL.md) | Slots vs On-Demand crossover mathematics, partition pruning heuristics, BigQuery Cleaner, Token-Aware RAG | **32** |
| [**`gcp-bigquery-analytics`**](skills/gcp-bigquery-analytics/SKILL.md) | Native Dataform pipelines, BigFunctions, Continuous Queries, Data Mesh governance, Row/Column-level security | **30** |
| [**`gcp-gke-inference`**](skills/gcp-gke-inference/SKILL.md) | Multi-Cluster GKE Inference Gateway, vLLM, Ray on TPUs, Body-Based Routing, Agent Sandbox | **18** |
| [**`gcp-finops-killswitch`**](skills/gcp-finops-killswitch/SKILL.md) | Automated Cloud Monitoring Kill Switches, Pub/Sub budget alerts, Flex-start VMs, Spend-based CUDs | **17** |
| [**`gcp-generative-media`**](skills/gcp-generative-media/SKILL.md) | Veo 3.1 cinematic video, Gemini Omni Flash conversational editing, DiffusionGemma, Nano Banana prompting | **12** |
| [**`gcp-gemini-robotics`**](skills/gcp-gemini-robotics/SKILL.md) | Gemini Robotics SDK, Aloha Sim simulation, LiteRT / LiteRT-LM, MediaPipe GenAI, Edge & Local AI | **12** |
| [**`gcp-networking`**](skills/gcp-networking/SKILL.md) | Direct VPC Egress, Cross-Site Interconnect, Private NAT, Serverless VPC Access, Envoy AI proxies | **12** |
| [**`gcp-databases`**](skills/gcp-databases/SKILL.md) | Cloud SQL 3x throughput tuning, Firestore Remote MCP, AlloyDB AI ScaNN vector search | **11** |
| [**`gcp-conversational-ai`**](skills/gcp-conversational-ai/SKILL.md) | Gemini Live API (WebSockets/audio), Gemini 3.1 Flash TTS, FreeSWITCH PBX, CCAI Platform | **10** |
| [**`gcp-migrations`**](skills/gcp-migrations/SKILL.md) | AWS/Azure to GCP service mapping, Snowflake/Teradata SQL translation, Delta Lake sync | **9** |
| [**`gcp-gke-cost`**](skills/gcp-gke-cost/SKILL.md) | GKE Cost Allocation, unallocated cluster spend, BigQuery billing SQL export, VPA right-sizing | **7** |
| [**`gcp-geospatial`**](skills/gcp-geospatial/SKILL.md) | Earth Engine BigQuery integration, AlphaEarth satellite embeddings, BigQuery GIS | **5** |
| [**`gcp-android-xr`**](skills/gcp-android-xr/SKILL.md) | Android XR SDK, Jetpack XR Compose spatial UI, spatial audio, and panel immersion | **5** |
| [**`gcp-skills-index`**](skills/gcp-skills-index/SKILL.md) | Master navigation directory, ingestion protocol, and skill quality standard specification | **Index** |

---

## ⚡ Installation & Quickstart

### Method 1: Global Installation for Antigravity & Gemini CLI
To make all 20 skills globally available across every project and workspace:

```bash
# Clone directly into your global Gemini skills configuration
git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git ~/.gemini/config/skills/GeminiPostCutoff
```
Google Antigravity and Gemini CLI will automatically index all `SKILL.md` files upon startup.

---

### Method 2: Project-Level Workspace (Team Git Submodule)
To embed these runbooks into a specific enterprise repository:

```bash
# Inside your repository root:
git submodule add https://github.com/CostaCloudSA/GeminiPostCutoff.git .gemini/skills/GeminiPostCutoff
```

---

### Method 3: Antigravity Plugin Installation
To load the suite as a packaged plugin containing both skills and governance rules:

```bash
git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git ~/.gemini/config/plugins/GeminiPostCutoff
```

---

## 🧪 Automated Quality Harness

To run the local audit test suite across all 20 skills:

```bash
# Install dependencies (none required beyond Node.js runtime)
npm test

# Run individual audits:
npm run audit:dates   # Validates descending mathematical date ordering
npm run audit:links   # Validates all relative internal markdown links
npm run audit:rules   # Validates anti-pattern, blueprint, and matrix quotas
```

---

## 🔒 Maintenance & Governance Notice

This repository is maintained **exclusively by CostaCloudSA** (`@CostaCloudSA`). 

- **Public & Read-Only**: This repository is freely accessible to the community for reference, learning, and local installation.
- **External PRs**: To maintain rigorous chronological sorting and structural integrity, pull requests from external contributors are not accepted.
- **Reporting Issues / Feedback**: If you spot an erratum, a broken external link, or wish to suggest a recent Google Cloud article for ingestion, please [open a GitHub Issue](https://github.com/CostaCloudSA/GeminiPostCutoff/issues).

---

## 📄 License

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for details.  
Copyright (c) 2026 CostaCloudSA.
