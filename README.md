# 🌌 GeminiPostCutoff: Modern Google Cloud Architecture & AI Systems Runbooks

[![Build Status](https://github.com/CostaCloudSA/GeminiPostCutoff/actions/workflows/audit.yml/badge.svg)](https://github.com/CostaCloudSA/GeminiPostCutoff/actions/workflows/audit.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/Architecture_Domains-20_Specializations-green.svg)](skills/gcp-skills-index/SKILL.md)
[![Resources](https://img.shields.io/badge/Knowledge_Base-540%2B_Resources-orange.svg)](skills/gcp-skills-index/SKILL.md)
[![Maintainer](https://img.shields.io/badge/Maintained%20By-CostaCloudSA-purple.svg)](https://github.com/CostaCloudSA)

An authoritative, production-grade operational knowledge system and architectural design assistant for **Google Cloud Platform (GCP)** and **Frontier AI Systems (2025–2026)**.

Designed for cloud enterprise architects, principal engineers, and agentic coding environments (**Google Antigravity**, **Gemini CLI**, **Claude Code**), this repository bridges the knowledge cutoff gap with vetted, field-tested architecture patterns, complete production blueprints, critical anti-patterns, and decision matrices across 20 specialized cloud domains.

---

## 🏛️ Modern GCP Architectural Assistance Framework

Every domain skill functions as an interactive, expert-level architectural runbook covering:

1. **Production-Ready Blueprints**: Complete, copy-pasteable Python, Terraform, and Bash implementations using modern SDKs (Vertex AI ADK 1.0, GKE Gateway API, BigQuery Remote MCP, Cloud Run Direct VPC Egress).
2. **Actionable Anti-Patterns & Architecture Traps**: High-impact failure modes, silent cost drains, and deprecations introduced in 2025–2026 (e.g. CPU throttling during agent calls, slot commitment cliffs, WIF token expiration).
3. **Architecture Decision Matrices**: Quantitative, side-by-side trade-off evaluations (Latency vs Cost vs Operational Overhead) to guide critical infrastructure and platform decisions.
4. **Dual-Vault Reference Engine**: Over 540 verified engineering deep-dives, official whitepapers, and production codelabs providing architectural evidence and citations for every design recommendation.
5. **Zero-Token Waste Design**: Modular and lazily loaded—your AI assistant consumes only the domain runbook relevant to your current architectural query, preserving context window and response speed.

---

## 💡 Designing Beyond the Knowledge Cutoff

Foundation models—including the Gemini family—have fixed training cutoff dates. In the rapidly advancing Google Cloud ecosystem, relying solely on pre-cutoff model memory may not provide the most up to date architectural advice.

**GeminiPostCutoff** acts as a live **delta architecture injection layer**. When paired with **Google Antigravity**, **Gemini CLI**, or agentic IDEs, it dynamically bridges this cutoff gap, updating the model's reasoning with 2025–2026 Google Cloud engineering realities.

### Interactive Post-Cutoff Design Scenarios

When you ask architectural questions, the assistant automatically pulls post-cutoff runbooks into its reasoning context:

* *"How should I host an autonomous customer support agent?"*  
  👉 **Without post-cutoff skills**: Gemini defaults to custom Python webhook servers and external Redis for session state.  
  👉 **With GeminiPostCutoff**: The assistant activates [`gcp-adk-agents`](skills/gcp-adk-agents/SKILL.md) and [`gcp-cloud-run`](skills/gcp-cloud-run/SKILL.md), producing a containerless, non-throttled Cloud Run service wired directly into Vertex AI Memory Bank and A2A multi-agent routing.

* *"How do we serve open-weights models across multiple GKE clusters?"*  
  👉 **Without post-cutoff skills**: Gemini suggests basic Kubernetes horizontal pod autoscalers behind standard Ingress.  
  👉 **With GeminiPostCutoff**: The assistant activates [`gcp-gke-inference`](skills/gcp-gke-inference/SKILL.md), generating a complete Gateway API manifest with body-based path matching, vLLM continuous batching, and TPU v6e scheduling.

* *"How do we lock down AI agent tool execution and eliminate static keys?"*  
  👉 **Without post-cutoff skills**: Gemini generates downloadable service account keys and basic IAM roles.  
  👉 **With GeminiPostCutoff**: The assistant activates [`gcp-security-compliance`](skills/gcp-security-compliance/SKILL.md), implementing Google Model Armor pre/post LLM inspection and Workload Identity Federation (WIF).


---

## 🧭 Curated Architecture Domain Catalog

| Architectural Domain | Key Capabilities & Post-Cutoff Innovations | Runbook |
| :--- | :--- | :---: |
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

### Method 1: Global Installation for Antigravity & Gemini CLI
To make all 20 skills globally available across every project and workspace:

```bash
# Clone directly into your global Gemini skills configuration
git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git ~/.gemini/config/skills/GeminiPostCutoff
```
Google Antigravity and Gemini CLI will automatically discover and index all runbooks upon startup.

---

### Method 2: Project-Level Workspace (Team Git Submodule)
To embed these runbooks directly into an enterprise repository:

```bash
# Inside your repository root:
git submodule add https://github.com/CostaCloudSA/GeminiPostCutoff.git .gemini/skills/GeminiPostCutoff
```

---

### Method 3: Antigravity Plugin Installation
To load the suite as a packaged plugin containing both skills and architectural directives:

```bash
git clone https://github.com/CostaCloudSA/GeminiPostCutoff.git ~/.gemini/config/plugins/GeminiPostCutoff
```

---

## 💬 Reporting Feedback

If you spot an erratum or wish to suggest a recent Google Cloud article or benchmark for ingestion, please [open a GitHub Issue](https://github.com/CostaCloudSA/GeminiPostCutoff/issues).

---

## 📄 License

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for details.  
Copyright (c) 2026 CostaCloudSA.
