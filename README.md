# 🌌 GeminiPostCutoff: Modern Google Cloud Architecture & AI Systems Runbooks

[![Build Status](https://github.com/CostaCloudSA/GeminiPostCutoff/actions/workflows/audit.yml/badge.svg)](https://github.com/CostaCloudSA/GeminiPostCutoff/actions/workflows/audit.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/Architecture_Domains-21_Specializations-green.svg)](skills/gcp-skills-index/SKILL.md)
[![Resources](https://img.shields.io/badge/Knowledge_Base-545%2B_Resources-orange.svg)](skills/gcp-skills-index/SKILL.md)
[![Maintainer](https://img.shields.io/badge/Maintained%20By-CostaCloudSA-purple.svg)](https://github.com/CostaCloudSA)

An authoritative, production-grade operational knowledge system and architectural design assistant for **Google Cloud Platform (GCP)** and **Frontier AI Systems (2025–2026)**.

Designed for cloud enterprise architects, principal engineers, and agentic coding environments (**Google Antigravity**, **Gemini CLI**, **Claude Code**), this repository bridges the knowledge cutoff gap with vetted, field-tested architecture patterns, complete production blueprints, critical anti-patterns, and decision matrices across 21 specialized cloud domains.

---

## 🏛️ Modern GCP Architectural Assistance Framework

Every domain skill functions as an interactive, expert-level architectural runbook covering:

1. **Production-Ready Blueprints**: Complete, copy-pasteable Python, Terraform, and Bash implementations using modern SDKs (Vertex AI ADK 1.0, GKE Gateway API, BigQuery Remote MCP, Cloud Run Direct VPC Egress).
2. **Actionable Anti-Patterns & Architecture Traps**: High-impact failure modes, silent cost drains, and deprecations introduced in 2025–2026 (e.g. CPU throttling during agent calls, slot commitment cliffs, WIF token expiration).
3. **Architecture Decision Matrices**: Quantitative, side-by-side trade-off evaluations (Latency vs Cost vs Operational Overhead) to guide critical infrastructure and platform decisions.
4. **Dual-Vault Reference Engine**: Over 545 verified engineering deep-dives, official whitepapers, and production codelabs providing architectural evidence and citations for every design recommendation.
5. **Zero-Token Waste Design**: Modular and lazily loaded—your AI assistant consumes only the domain runbook relevant to your current architectural query, preserving context window and response speed.

---

## 💡 Designing Beyond the Knowledge Cutoff

Foundation models—including the Gemini family—have fixed training cutoff dates. In the rapidly advancing Google Cloud ecosystem, relying solely on pre-cutoff model memory may not provide the most up to date architectural advice.

### 📅 Model Cutoff Matrix & Triage Framework

| Model in Antigravity | Official Cutoff | Degradation Threshold | Primary Triage Focus | Recommended Vault Inspection |
| :--- | :---: | :---: | :--- | :---: |
| **Gemini 3.1 Pro** | **January 2025** | Jan 2025 | **Full Delta Injection**: 20+ months post-cutoff. Needs all 2025 & 2026 updates. | **Tier 1A + Tier 1B** (`>= 02.25`) |
| **Gemini 3.6 Flash** | **March 2026** | Jan 2025 – Mar 2026 | **Frontier Delta**: 6+ months post-cutoff (GEAP, Gemma 4 12B, BigQuery Graph GA). | **Tier 1A** (`>= 04.26`) |
| **Gemini 3.7 Flash** | **March 2026** | Jan 2025 – Mar 2026 | **Frontier Delta**: Focus on Q2-Q3 2026 GA announcements. | **Tier 1A** (`>= 04.26`) |
| **Gemini 3.8 Flash** | **March 2026** | Jan 2025 – Mar 2026 | **Frontier Delta**: Apply latest blueprints and anti-patterns. | **Tier 1A** (`>= 04.26`) |

* **Tier 1A (Frontier Delta $\ge 04.26$)**: Mandatory for all models. Covers post-March 2026 releases (GEAP GA, Gemma 4 12B TPU serving, Cloud Run automated multi-region failover, BigQuery Graph).
* **Tier 1B (Intermediate Delta $02.25 - 03.26$)**: Post-cutoff for 3.1 Pro; serves as verification for Flash models in specialized infrastructure (ADK 1.0, Model Armor, GKE Inference Gateway).
* **Tier 2 (Evergreen $\le 01.25$)**: Timeless architectural mathematics (BigQuery slot commitment crossover at 690 TB/mo, GKE pod sizing).

---

## 🧭 Curated Architecture Domain Catalog

| Architectural Domain | Key Capabilities & Post-Cutoff Innovations | Runbook |
| :--- | :--- | :---: |
| **Architectural Review Orchestrator** | Pre-flight stack detection, phased implementation roadmaps, multi-domain audits | [**`gcp-architecture-review`**](skills/gcp-architecture-review/SKILL.md) |
| **Multi-Agent Orchestration** | Vertex AI Agent Engine, ADK Python/Go/Java 1.0, A2A/A2UI Protocols, Memory Bank | [**`gcp-adk-agents`**](skills/gcp-adk-agents/SKILL.md) |
| **Developer Tooling & Agent IDEs** | Gemini CLI Plan Mode, Antigravity IDE custom workflows, FastMCP, Eval-Driven Development | [**`gcp-gemini-tooling`**](skills/gcp-gemini-tooling/SKILL.md) |
| **Enterprise Kubernetes (GKE)** | GKE Autopilot vs Standard, Gateway API, Dataplane V2, Pod Snapshots, Zero-Touch OTel | [**`gcp-gke-platform`**](skills/gcp-gke-platform/SKILL.md) |
| **Serverless Microservices** | `--no-cpu-throttling`, Serverless MCP/A2A hosting, Identity-Aware Proxy, Temporal worker pools | [**`gcp-cloud-run`**](skills/gcp-cloud-run/SKILL.md) |
| **Security, IAM & Model Armor** | Google Model Armor, Workload Identity Federation (WIF), Canary Tokens, SecOps Detections | [**`gcp-security-compliance`**](skills/gcp-security-compliance/SKILL.md) |
| **In-Database AI & Vector Search** | BigQuery Remote MCP Server, Vector SQL with IVF indexes, `ML.GENERATE_TEXT`, Autonomous Embeddings | [**`gcp-bigquery-ai`**](skills/gcp-bigquery-ai/SKILL.md) |
| **Open Models & Distributed TPUs** | Gemma open models (Gemma 4 12B, Gemma 3), Cloud TPUs (v5p/v6e), JAX sharding, Supervised Fine-Tuning | [**`gcp-frontier-emerging`**](skills/gcp-frontier-emerging/SKILL.md) |
| **Data Warehouse Economics** | Slots vs On-Demand crossover mathematics, partition pruning heuristics, Token-Aware RAG | [**`gcp-bigquery-cost`**](skills/gcp-bigquery-cost/SKILL.md) |
| **Data Mesh & Modern Dataform** | Native Dataform pipelines, BigFunctions, Continuous Queries, Row/Column-level security | [**`gcp-bigquery-analytics`**](skills/gcp-bigquery-analytics/SKILL.md) |
| **LLM Inference Serving** | Multi-Cluster GKE Inference Gateway, vLLM, Ray on TPUs, Body-Based Routing, Agent Sandbox | [**`gcp-gke-inference`**](skills/gcp-gke-inference/SKILL.md) |
| **FinOps Spend Caps & Kill Switches** | Automated Cloud Monitoring Kill Switches, Pub/Sub budget alerts, Flex-start VMs, Spend CUDs | [**`gcp-finops-killswitch`**](skills/gcp-finops-killswitch/SKILL.md) |
| **Cinematic Generative Media** | Veo 3.1 video generation, Gemini Omni Flash video editing, DiffusionGemma, Nano Banana prompting | [**`gcp-generative-media`**](skills/gcp-generative-media/SKILL.md) |
| **Robotics & Local/Edge AI** | Gemini Robotics SDK, Aloha Sim simulation, LiteRT / LiteRT-LM, MediaPipe GenAI, Edge AI | [**`gcp-gemini-robotics`**](skills/gcp-gemini-robotics/SKILL.md) |
| **Cloud Networking Topologies** | Direct VPC Egress, Cross-Site Interconnect, Private NAT, Serverless VPC Access, Envoy AI proxies | [**`gcp-networking`**](skills/gcp-networking/SKILL.md) |
| **Operational & AI Databases** | Cloud SQL 3x throughput tuning, Firestore Remote MCP, AlloyDB AI ScaNN vector search | [**`gcp-databases`**](skills/gcp-databases/SKILL.md) |
| **Voice Agents & Conversational AI** | Gemini Live API (WebSockets/bidirectional audio), Gemini 3.1 Flash TTS, FreeSWITCH PBX, CCAI | [**`gcp-conversational-ai`**](skills/gcp-conversational-ai/SKILL.md) |
| **Cross-Cloud Migrations** | AWS/Azure to GCP service mapping, Snowflake/Teradata SQL translation, Delta Lake sync | [**`gcp-migrations`**](skills/gcp-migrations/SKILL.md) |
| **GKE Kubernetes FinOps** | GKE Cost Allocation, unallocated cluster spend, BigQuery billing SQL export, VPA right-sizing | [**`gcp-gke-cost`**](skills/gcp-gke-cost/SKILL.md) |
| **Geospatial & Planetary AI** | Earth Engine BigQuery integration, AlphaEarth satellite embeddings, BigQuery GIS | [**`gcp-geospatial`**](skills/gcp-geospatial/SKILL.md) |
| **Spatial Computing (Android XR)** | Android XR SDK, Jetpack XR Compose spatial UI, spatial audio, and panel immersion | [**`gcp-android-xr`**](skills/gcp-android-xr/SKILL.md) |
| **Master Navigation & Router** | Global domain catalog, architecture activation triggers, and skill routing index | [**`gcp-skills-index`**](skills/gcp-skills-index/SKILL.md) |

---

## ⚡ Installation & Quickstart

### Method 1: Antigravity Plugin Installation (Recommended)
Cloning as a native Antigravity Plugin automatically mounts all 21 skills, injects `rules/AGENTS.md` directives, and enables progressive disclosure across all your workspaces:

```bash
# Clone directly into your global Antigravity plugins directory
git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git ~/.gemini/config/plugins/GeminiPostCutoff
```
*Restart Antigravity or Gemini CLI after cloning. All runbooks are immediately available on-demand.*

---

### Method 2: Automated Installation Scripts
You can use the bundled cross-platform install script to set up the plugin or create direct skill symlinks:

* **Windows (PowerShell)**:
  ```powershell
  # Install as Plugin
  pwsh scripts/install.ps1

  # Or link flat skills directly to ~/.gemini/config/skills/
  pwsh scripts/install.ps1 -FlatSkills
  ```

* **Linux / macOS (Bash)**:
  ```bash
  # Install as Plugin
  bash scripts/install.sh

  # Or link flat skills directly
  bash scripts/install.sh --flat-skills
  ```

---

### Method 3: Project-Level Workspace (Team Git Submodule)
To embed these runbooks directly into an enterprise repository for your entire engineering team:

```bash
# Inside your repository root:
git submodule add https://github.com/CostaCloudSA/GeminiPostCutoff.git .agents/plugins/GeminiPostCutoff
```

---

## 💬 Reporting Feedback

If you spot an erratum or wish to suggest a recent Google Cloud article or benchmark for ingestion, please [open a GitHub Issue](https://github.com/CostaCloudSA/GeminiPostCutoff/issues).

---

## 📄 License

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for details.  
Copyright (c) 2026 CostaCloudSA.
