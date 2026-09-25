---
name: gcp-skills-index
description: >-
  Master navigation index and domain directory for Google Cloud Platform (GCP), AI Agent systems
  (ADK/A2A/Agent Engine), BigQuery, GKE, Cloud Run, FinOps, Security, Networking, Databases, Geospatial,
  Robotics, and Android XR skills. Use to route to specialized GCP skills and navigate 2025-2026 chronological cloud architecture updates.
---

# Google Cloud Platform & AI Agent Skills Master Index

Welcome to the **Antigravity Google Cloud Platform (GCP) Expert Skills System**.
This catalog indexes **20 specialized, production-grade operational runbooks** containing over **545 chronologically sorted publications, codelabs, official guides, and architectural blueprints** spanning 2024–2026.

---

## 🧭 Master Navigation & Skill Routing Directory

| Skill Name | Domain Scope & Core Capabilities | Primary Keywords & Triggers |
| :--- | :--- | :--- |
| [`gcp-gke-platform`](../gcp-gke-platform/SKILL.md) | GKE Autopilot vs Standard, Gateway API, Dataplane V2, OTel, Pod Snapshots. | `gke`, `kubernetes`, `gateway-api`, `autopilot`, `compute-class` |
| [`gcp-gke-inference`](../gcp-gke-inference/SKILL.md) | Multi-Cluster GKE Inference Gateway, vLLM, Ray on TPUs, Body-Based Routing, Agent Sandbox. | `vllm`, `inference-gateway`, `ray-tpu`, `llm-serving`, `gpu` |
| [`gcp-gke-cost`](../gcp-gke-cost/SKILL.md) | GKE Cost Allocation, unallocated cluster spend, BigQuery billing SQL, VPA right-sizing. | `gke-cost`, `unallocated-cost`, `vpa`, `k8s-billing` |
| [`gcp-cloud-run`](../gcp-cloud-run/SKILL.md) | Cloud Run CPU throttling prevention (`--no-cpu-throttling`), MCP/A2A hosting, IAP, Temporal workers. | `cloud-run`, `serverless`, `mcp-host`, `iap`, `temporal` |
| [`gcp-adk-agents`](../gcp-adk-agents/SKILL.md) | Google ADK (Python, Go 1.0, Java 1.0), Vertex AI Agent Engine, A2A/A2UI protocols, Memory Bank. | `adk`, `agent-engine`, `a2a`, `a2ui`, `memory-bank`, `multi-agent` |
| [`gcp-conversational-ai`](../gcp-conversational-ai/SKILL.md) | Gemini Live API (WebSockets/audio), FreeSWITCH PBX, CCAI, BigQuery Conversational Analytics. | `gemini-live`, `dialogflow-cx`, `ccai`, `voice-agent`, `freeswitch` |
| [`gcp-gemini-tooling`](../gcp-gemini-tooling/SKILL.md) | Gemini CLI Plan Mode, Antigravity IDE custom rules/skills, FastMCP, Terraform Stacks. | `gemini-cli`, `antigravity`, `fastmcp`, `terraform-stacks` |
| [`gcp-bigquery-analytics`](../gcp-bigquery-analytics/SKILL.md) | Native Dataform pipelines, BigFunctions, Continuous Queries, Data Mesh, RLS/CLS security. | `bigquery`, `dataform`, `bigfunctions`, `continuous-queries`, `mesh` |
| [`gcp-bigquery-ai`](../gcp-bigquery-ai/SKILL.md) | BigQuery Remote MCP Server, `VECTOR_SEARCH` with IVF indexes, `ML.GENERATE_TEXT`, MCP Toolbox. | `bigquery-ai`, `vector-search`, `bigquery-mcp`, `sql-llm` |
| [`gcp-bigquery-cost`](../gcp-bigquery-cost/SKILL.md) | Slots vs On-Demand crossover math, partition pruning rules, BigQuery Cleaner, Token-Aware RAG. | `bq-cost`, `slots`, `partition-pruning`, `bq-cleaner`, `finops` |
| [`gcp-finops-killswitch`](../gcp-finops-killswitch/SKILL.md) | Automated Cloud Monitoring Kill Switches, Budget alerts, Flex-start VMs, Spend-based CUDs. | `kill-switch`, `cloud-budget`, `flex-start`, `cuds`, `finops` |
| [`gcp-security-compliance`](../gcp-security-compliance/SKILL.md) | Google Model Armor, Workload Identity Federation (WIF), Canary Tokens, SecOps detections. | `security`, `model-armor`, `wif`, `canary-tokens`, `scc` |
| [`gcp-networking`](../gcp-networking/SKILL.md) | Direct VPC Egress, Cross-Site Interconnect, Private NAT, Serverless VPC, Envoy AI proxies. | `networking`, `vpc`, `interconnect`, `private-nat`, `envoy` |
| [`gcp-databases`](../gcp-databases/SKILL.md) | Cloud SQL 3x write throughput tuning, Firestore Remote MCP, AlloyDB AI vector search. | `cloud-sql`, `postgres`, `firestore`, `alloydb`, `hyperdisk` |
| [`gcp-geospatial`](../gcp-geospatial/SKILL.md) | Earth Engine BigQuery integration, AlphaEarth satellite embeddings, BigQuery GIS. | `earth-engine`, `gis`, `alphaearth`, `geospatial` |
| [`gcp-migrations`](../gcp-migrations/SKILL.md) | AWS/Azure to GCP service mapping, Snowflake/Teradata SQL translation, Delta Lake sync. | `migration`, `aws-to-gcp`, `azure-to-gcp`, `snowflake-to-bq` |
| [`gcp-gemini-robotics`](../gcp-gemini-robotics/SKILL.md) | Gemini Robotics SDK, Aloha Sim, Edge AI, Local AI, LiteRT/LiteRT-LM, MediaPipe GenAI, Gemma model family (Gemma 2/3/4, PaliGemma, gemma.cpp). | `robotics`, `edge-ai`, `local-ai`, `litert`, `gemma`, `mediapipe`, `aloha-sim` |
| [`gcp-android-xr`](../gcp-android-xr/SKILL.md) | Android XR SDK, Jetpack XR Compose spatial UI, spatial audio, and panel immersion. | `android-xr`, `jetpack-xr`, `spatial-computing`, `xr` |
| [`gcp-frontier-emerging`](../gcp-frontier-emerging/SKILL.md) | Gemma open models (Gemma 4 12B, Gemma 3), Cloud TPUs (v5p/v6e), JAX distributed sharding, Supervised Fine-Tuning. | `gemma`, `tpu`, `jax`, `sft`, `hbm`, `geap` |
| [`gcp-generative-media`](../gcp-generative-media/SKILL.md) | Veo 3.1 cinematic video, Gemini Omni Flash conversational video editing, DiffusionGemma, Nano Banana prompting. | `veo`, `gemini-omni`, `diffusion-gemma`, `nano-banana`, `genmedia` |

---

## 💡 How to Use These Skills in Agent Workflows

- **Automatic Domain Activation**: The AI assistant automatically detects domain-specific keywords (e.g. `adk`, `gateway-api`, `bigquery-cost`, `kill-switch`) and activates the corresponding runbook.
- **Cross-Domain Architecture**: When architecting multi-service systems (e.g., ADK agent on Cloud Run with BigQuery AI and Model Armor), combine blueprints across [`gcp-adk-agents`](../gcp-adk-agents/SKILL.md), [`gcp-cloud-run`](../gcp-cloud-run/SKILL.md), [`gcp-bigquery-ai`](../gcp-bigquery-ai/SKILL.md), and [`gcp-security-compliance`](../gcp-security-compliance/SKILL.md).
- **Authoritative Blueprints**: Always prioritize the production blueprints and avoid the critical anti-patterns detailed in each specialized skill over generic pre-2025 suggestions.
- **Maintainer Specifications**: For repository maintainer standards, quotas, and ingestion protocols, refer to [SKILL_STANDARD.md](SKILL_STANDARD.md) and [INGESTION_PROTOCOL.md](INGESTION_PROTOCOL.md).
