---
name: gcp-skills-index
description: >-
  Master navigation index and domain directory for Google Cloud Platform (GCP), Gemini Enterprise, AI Agent systems
  (ADK/A2A/Agent Engine), BigQuery, Looker, GKE, Cloud Run, Pub/Sub, FinOps, Security, Networking, Databases, Geospatial,
  Robotics, and Android XR skills. Use to route to specialized GCP skills and navigate 2025-2026 chronological cloud architecture updates.
---

# Google Cloud Platform & AI Agent Skills Master Index

Welcome to the **Antigravity Google Cloud Platform (GCP) Expert Skills System**.
This catalog indexes **23 specialized, production-grade operational runbooks across 10 Architectural Pillars** (plus this Master Router Index) containing **811 chronologically sorted publications, codelabs, official guides, and architectural blueprints** spanning 2024–2026.

---

## 🧭 Model Generations & Cutoff-Relative Dynamic Tier Triage ($\Delta_m$)

Because new foundation models with newer training cutoff dates are continuously released, this system **never hardcodes a static default model** and **never locks vault files to static tier headers**. Instead, reference vaults (`references/articles.md`) are organized by chronological release year (`2026`, `2025`), and tiers are computed dynamically at runtime against the human-verified model cutoff ($\text{Cutoff}_{\text{MM.YY}}$) via month delta $\Delta_m = (\text{Year}_A - \text{Year}_C) \times 12 + (\text{Month}_A - \text{Month}_C)$:

| Model Generation Tier | Model in Antigravity / CLI | Official Cutoff | Dynamic Tier 1: Post-Cutoff Delta ($\Delta_m > 0$) | Dynamic Tier 2: Maturation Window ($-12 \le \Delta_m \le 0$) | Dynamic Tier 3: Timeless Foundations ($\Delta_m < -12$) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Newest Generation (Frontier Reasoning)** | **Gemini 4 Argon** (`gemini-4-argon`) | **03.26** (Mar 2026) | **`>= 04.26`** (Apr 2026 – Present) | **`03.25 – 03.26`** | **`<= 02.25`** (`archive.md`) |
| **Newest / Future Generation (Custom Horizon)** | Any Future Model (`--cutoff YYYY-MM`) | **`MM.YY`** (Dynamic) | **`> MM.YY`** ($\Delta_m > 0$) | **`[MM.YY - 12m, MM.YY]`** | **`< MM.YY - 12m`** |
| **Older Generation (High-Efficiency Flash)** | **Gemini 3.8 / 3.7 / 3.6 Flash** | **03.26** (Mar 2026) | **`>= 04.26`** (Apr 2026 – Present) | **`03.25 – 03.26`** | **`<= 02.25`** (`archive.md`) |
| **Older Generation (Legacy Pro)** | **Gemini 3.1 Pro** (`gemini-3.1-pro`) | **01.25** (Jan 2025) | **`>= 02.25`** (Feb 2025 – Present) | **`01.24 – 01.25`** | **`<= 12.23`** (`archive.md`) |
| **Unverified Session (Fail-Safe Fallback)** | *Unconfirmed / Omitted* | **01.25** (Fail-Safe) | **`>= 02.25`** (Full 2025–2026 Delta) | **`01.24 – 01.25`** | **`<= 12.23`** (`archive.md`) |

*For complete machine-readable cutoff schemas and dynamic tier math, see [`config/model_cutoffs.json`](../../config/model_cutoffs.json) and [`review_engine/mesh/model_resolver.js`](../../review_engine/mesh/model_resolver.js).*

---

## 🧭 Master Navigation & Skill Routing Directory (10 Pillars · 23 Operational Domain Skills)

| Pillar | Skill Name | Domain Scope & Core Capabilities | Primary Keywords & Triggers |
| :--- | :--- | :--- | :--- |
| **1. Gemini Enterprise** | [`gcp-gemini-enterprise`](../gcp-gemini-enterprise/SKILL.md) | Gemini Enterprise & Gemini Enterprise Agent Platform (GEAP), Agent Compute Engine, GEAR program, Gemini Managed Agents, Agent Gateway, Custom Connectors & Terraform. | `gemini-enterprise`, `geap`, `agent-compute-engine`, `gear`, `agent-gateway` |
| **2. AI Agents, ADK, Multimodal & Tooling** | [`gcp-adk-agents`](../gcp-adk-agents/SKILL.md) | Google ADK (Python, Go, TS, Java, Kotlin), Vertex AI Agent Engine, A2A/A2UI/AG-UI protocols, Memory Bank, Dynamic MCP Discovery. | `adk`, `agent-engine`, `a2a`, `a2ui`, `memory-bank`, `multi-agent` |
| **2. AI Agents, ADK, Multimodal & Tooling** | [`gcp-conversational-ai`](../gcp-conversational-ai/SKILL.md) | Gemini Live API (WebSockets/audio), Non-blocking ADK Voice Agents, Gemini 3.1 Flash TTS, FreeSWITCH PBX, CCAI, Dialogflow CX. | `gemini-live`, `dialogflow-cx`, `ccai`, `voice-agent`, `freeswitch` |
| **2. AI Agents, ADK, Multimodal & Tooling** | [`gcp-generative-media`](../gcp-generative-media/SKILL.md) | Veo 3.1 cinematic video, Gemini Omni Flash conversational video editing, DiffusionGemma, Nano Banana prompting, SAVE Framework. | `veo`, `gemini-omni`, `diffusion-gemma`, `nano-banana`, `genmedia` |
| **2. AI Agents, ADK, Multimodal & Tooling** | [`gcp-gemini-tooling`](../gcp-gemini-tooling/SKILL.md) | Gemini CLI Plan Mode & Hooks, Antigravity IDE custom rules/skills/subagents, `gcloud` Remote MCP, FastMCP, Eval-Driven Development. | `gemini-cli`, `antigravity`, `fastmcp`, `terraform-stacks`, `hooks` |
| **3. Frontier & Edge AI (Gemma & TPUs)** | [`gcp-frontier-emerging`](../gcp-frontier-emerging/SKILL.md) | Gemma open models (Gemma 4 12B, EmbeddingGemma 2, Gemma 3), Cloud TPUs (v5p/v6e), JAX distributed sharding, SFT, HBM tuning, biotech AI. | `gemma`, `embeddinggemma`, `tpu`, `jax`, `sft`, `hbm`, `biotech` |
| **4. Google Kubernetes Engine (GKE)** | [`gcp-gke-platform`](../gcp-gke-platform/SKILL.md) | GKE Autopilot vs Standard, Gateway API, Dataplane V2, OTel, Pod Snapshots, ComputeClasses, CPU Startup Boost, Multi-Regional DR. | `gke`, `kubernetes`, `gateway-api`, `autopilot`, `compute-class` |
| **4. Google Kubernetes Engine (GKE)** | [`gcp-gke-inference`](../gcp-gke-inference/SKILL.md) | Multi-Cluster GKE Inference Gateway, vLLM, Ray on TPUs, Body-Based Routing, Kueue, GKE Agent Sandbox (microVM isolation & RL). | `vllm`, `inference-gateway`, `ray-tpu`, `llm-serving`, `agent-sandbox` |
| **4. Google Kubernetes Engine (GKE)** | [`gcp-gke-cost`](../gcp-gke-cost/SKILL.md) | GKE Cost Allocation, unallocated cluster spend elimination, BigQuery billing SQL, VPA right-sizing, Cloud Logging FinOps. | `gke-cost`, `unallocated-cost`, `vpa`, `k8s-billing` |
| **5. GCP Classical Compute, Messaging, Networking & Databases** | [`gcp-cloud-run`](../gcp-cloud-run/SKILL.md) | Cloud Run CPU throttling prevention (`--no-cpu-throttling`), Compose, MCP/A2A hosting, IAP, Temporal workers, Cloud Swift SDK. | `cloud-run`, `serverless`, `mcp-host`, `iap`, `temporal` |
| **5. GCP Classical Compute, Messaging, Networking & Databases** | [`gcp-computefinops`](../gcp-computefinops/SKILL.md) | Compute Engine (U4 low-latency, Flex-start VMs), Google Cloud Spend Caps GA, Spend-based CUDs, Gemini API FinOps. | `finops`, `compute-finops`, `spend-caps`, `flex-start`, `cuds` |
| **5. GCP Classical Compute, Messaging, Networking & Databases** | [`gcp-pubsub`](../gcp-pubsub/SKILL.md) | Cloud Pub/Sub, Pub/Sub Lite migration, In-Flight SMTs, Direct Bigtable/BigQuery/GCS Export Subscriptions, DLQs, Eventarc, Managed Kafka. | `pubsub`, `eventarc`, `smt`, `dlq`, `managed-kafka`, `streaming` |
| **5. GCP Classical Compute, Messaging, Networking & Databases** | [`gcp-networking`](../gcp-networking/SKILL.md) | Direct VPC Egress, Shared VPC IPAM, Cross-Site Interconnect, Private NAT, API Gateway Streaming, Apigee Hybrid MCP. | `networking`, `vpc`, `interconnect`, `private-nat`, `envoy`, `ipam` |
| **5. GCP Classical Compute, Messaging, Networking & Databases** | [`gcp-databases`](../gcp-databases/SKILL.md) | Cloud SQL 3x write throughput tuning & autoscaling read pools, Firestore Pipelines, AlloyDB AI ScaNN vector search, Spanner, Hyperdisk. | `cloud-sql`, `postgres`, `firestore`, `alloydb`, `hyperdisk` |
| **6. BigQuery & Looker Analytics** | [`gcp-bigquery-ai`](../gcp-bigquery-ai/SKILL.md) | BigQuery AI (`ObjectRef`, `TimesFM 3.0`), Remote MCP Server, `VECTOR_SEARCH` with IVF indexes, Autonomous Embeddings, Knowledge Catalog. | `bigquery-ai`, `vector-search`, `bigquery-mcp`, `objectref`, `timesfm` |
| **6. BigQuery & Looker Analytics** | [`gcp-bigquery-analytics`](../gcp-bigquery-analytics/SKILL.md) | BigQuery global query engine, Looker & Conversational Analytics semantic layer, Dataform, Continuous Queries, BigQuery Graph, Iceberg. | `bigquery`, `looker`, `dataform`, `continuous-queries`, `iceberg` |
| **6. BigQuery & Looker Analytics** | [`gcp-bigquery-cost`](../gcp-bigquery-cost/SKILL.md) | Slots vs On-Demand crossover math (690 TB/mo), partition pruning rules, BigQuery Cleaner, Token-Aware RAG, daily GenAI token quotas. | `bq-cost`, `slots`, `partition-pruning`, `bq-cleaner`, `finops` |
| **7. Cloud & Data Warehouse Migrations** | [`gcp-migrations`](../gcp-migrations/SKILL.md) | AWS/Azure to GCP service mapping, Snowflake/Teradata/Databricks to BigQuery (AI dbt skills & ADK Cortex bridge), MongoDB to Firestore. | `migration`, `aws-to-gcp`, `azure-to-gcp`, `snowflake-to-bq` |
| **8. Geospatial & Earth Observation** | [`gcp-geospatial`](../gcp-geospatial/SKILL.md) | Google Earth Engine AI coding, AlphaEarth satellite embeddings, BigQuery GIS (`ST_*`), and Google Maps integrations. | `earth-engine`, `gis`, `alphaearth`, `geospatial` |
| **9. Emerging Technologies (Robotics & Android XR)** | [`gcp-gemini-robotics`](../gcp-gemini-robotics/SKILL.md) | Gemini Robotics Embodied Reasoning 2 (`gemini-robotics-er-2.0`), Physical AI with NVIDIA Isaac Sim, Aloha Sim, LiteRT, MediaPipe. | `robotics`, `edge-ai`, `local-ai`, `litert`, `mediapipe` |
| **9. Emerging Technologies (Robotics & Android XR)** | [`gcp-android-xr`](../gcp-android-xr/SKILL.md) | Android XR SDK, Jetpack XR Compose spatial UI, spatial audio, and panel immersion. | `android-xr`, `jetpack-xr`, `spatial-computing`, `xr` |
| **10. Security, Compliance & Governance** | [`gcp-security-compliance`](../gcp-security-compliance/SKILL.md) | Google Model Armor, Workload Identity Federation (WIF), IAM Helper Agent Skills, Sensitive Data Protection, SecOps, GenAI Security Baseline. | `security`, `model-armor`, `wif`, `canary-tokens`, `scc` |
| **10. Security, Compliance & Governance** | [`gcp-architecture-review`](../gcp-architecture-review/SKILL.md) | End-to-end GCP architecture review orchestrator, `ModelCutoffResolver`, Hub-and-Spoke governance, pre-flight stack detection. | `gcp-review`, `architecture-audit`, `postcutoff`, `hub-and-spoke` |

---

## 🌐 Cross-Cutting Technology Matrix

When designing modern systems, specific architectural themes span multiple domains. Use this lookup matrix to synthesize end-to-end solutions:

| Cross-Cutting Technology | Participating Domain Skills | Architectural Intersection |
| :--- | :--- | :--- |
| **Gemini Enterprise & Multi-Agent Governance** | [`gcp-gemini-enterprise`](../gcp-gemini-enterprise/SKILL.md)<br>[`gcp-adk-agents`](../gcp-adk-agents/SKILL.md)<br>[`gcp-security-compliance`](../gcp-security-compliance/SKILL.md) | Registering ADK agents into Gemini Enterprise (GEAP), running stateful harnesses on Agent Compute Engine, and enforcing inline Agent Gateway + Model Armor policies. |
| **Model Context Protocol (MCP)** | [`gcp-bigquery-ai`](../gcp-bigquery-ai/SKILL.md)<br>[`gcp-cloud-run`](../gcp-cloud-run/SKILL.md)<br>[`gcp-databases`](../gcp-databases/SKILL.md)<br>[`gcp-gemini-tooling`](../gcp-gemini-tooling/SKILL.md) | Hosting remote MCP servers on Cloud Run (`--no-cpu-throttling`), database toolboxes for Cloud SQL/Firestore, and BigQuery SQL agent access. |
| **Asynchronous Event-Driven AI Pipelines** | [`gcp-pubsub`](../gcp-pubsub/SKILL.md)<br>[`gcp-cloud-run`](../gcp-cloud-run/SKILL.md)<br>[`gcp-adk-agents`](../gcp-adk-agents/SKILL.md)<br>[`gcp-bigquery-analytics`](../gcp-bigquery-analytics/SKILL.md) | Decoupling long-running ADK agents via Pub/Sub push/pull subscriptions (`ack_deadline_seconds = 600`), DLQ + backoff, in-flight SMTs, and Direct Bigtable/BigQuery/GCS export sinks. |
| **Identity & Zero-Trust (WIF + Model Armor)** | [`gcp-security-compliance`](../gcp-security-compliance/SKILL.md)<br>[`gcp-adk-agents`](../gcp-adk-agents/SKILL.md)<br>[`gcp-cloud-run`](../gcp-cloud-run/SKILL.md) | Eliminating static JSON service account keys via Workload Identity Federation (WIF), SPIFFE agent identities, and inline Model Armor prompt filtering. |
| **FinOps & Hard Spend Controls** | [`gcp-computefinops`](../gcp-computefinops/SKILL.md)<br>[`gcp-bigquery-cost`](../gcp-bigquery-cost/SKILL.md)<br>[`gcp-gke-cost`](../gcp-gke-cost/SKILL.md) | Google Cloud Spend Caps GA, slot reservation crossover formulas (690 TB/mo), daily BigQuery AI token quotas, and GKE unallocated spend attribution. |
| **Open Weights & TPU Serving** | [`gcp-frontier-emerging`](../gcp-frontier-emerging/SKILL.md)<br>[`gcp-gke-inference`](../gcp-gke-inference/SKILL.md)<br>[`gcp-gemini-robotics`](../gcp-gemini-robotics/SKILL.md) | Gemma 4 12B & EmbeddingGemma 2 fine-tuning with JAX on TPU v5p/v6e, vLLM multi-cluster serving, and LiteRT edge execution. |

---

## 💡 How to Use These Skills in Agent Workflows

- **100% Advisory Governance**: This skill system functions exclusively in an advisory capacity. The AI assistant is strictly prohibited from making autonomous infrastructure edits. Every proposal must be delivered as a structured implementation plan artifact with external citations, awaiting explicit human approval before any code or config files are modified.
- **Human-Verified Model Identity & Zero Hardcoded Defaults**: The assistant must never guess or self-report its own model cutoff, nor rely on a hardcoded default model. It must confirm the active model (**Newest Generation** like `gemini-4-argon` or future `--cutoff YYYY-MM` vs. **Older Generation** like `gemini-3.8-flash` or `gemini-3.1-pro`) with the user prior to selecting triage tiers. Unconfirmed sessions default to the conservative Fail-Safe Horizon (`2025-01` / `>= 02.25`).
- **Automatic Domain Activation**: Run `node scripts/detect_stack.js` or use domain keywords (e.g. `gemini-enterprise`, `adk`, `pubsub`, `gateway-api`, `bigquery-cost`) to activate only the in-scope runbooks.
- **Uncapped Runbooks & Authoritative Blueprints**: Always prioritize the modern production blueprints (`gemini-4-argon`, `gemini-3.8-flash`, `gemma-4-12b-it`) and avoid the critical anti-patterns detailed in each specialized skill over deprecated pre-2026 suggestions.
- **Maintainer Specifications**: For repository maintainer standards, minimum floors, and ingestion protocols, refer to [SKILL_STANDARD.md](SKILL_STANDARD.md) and [INGESTION_PROTOCOL.md](INGESTION_PROTOCOL.md).
