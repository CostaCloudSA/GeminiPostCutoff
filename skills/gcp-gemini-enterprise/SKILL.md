---
name: gcp-gemini-enterprise
description: >-
  Gemini Enterprise, Gemini Enterprise Agent Platform (GEAP), Agent Compute Engine,
  Gemini Managed Agents, Agent Gateway, Gemini Enterprise Agent Ready (GEAR), Custom Connectors,
  and enterprise agent governance. Activate when deploying, governing, or integrating Gemini Enterprise workloads.
---

# Gemini Enterprise & Agent Platform (GEAP) Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- **Gemini Enterprise Provisioning & Governance**: Deploying **Gemini Enterprise** or migrating from legacy Vertex AI Agent Builder to **Gemini Enterprise Agent Platform (GEAP)** using Terraform.
- **Planet-Scale Stateful Agent Harnesses**: Running long-horizon, self-evolving agents on **Agent Compute Engine** with expanded agent governance or asynchronous **Gemini Managed Agents** in the background.
- **Enterprise Agent Registration & Connectors**: Registering custom **ADK Agents** or third-party agents into **Gemini Enterprise**, building **Custom Connectors**, or validating partner integrations via the **Gemini Enterprise Agent Ready (GEAR)** program.
- **Agent Gateway & Security Guardrails**: Enforcing inline **Agent Gateway** + **Model Armor** policy filtering, A2UI enterprise workspace streaming, and GEAP observability/evaluation pipelines.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Monolithic God-Agents in Gemini Enterprise with Unscoped Tool Registries [10.26]**
> Stuffing 30+ MCP tools and conflicting domain instructions into a single monolithic Gemini Enterprise agent causes tool-selection hallucination, elevated token latency, and brittle production rollouts.
> - **Mandatory Standard**: Decompose monolithic Gemini Enterprise agents into domain-scoped specialist sub-agents (`<= 8` tools per agent), enforce strict input/output schema contracts, and gate deployments on automated trajectory evaluation suites.
> *Cites: [9 Mistakes to Avoid When Building Gemini Enterprise Agents](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 2: Running Long-Horizon Stateful Enterprise Agent Harnesses on Stateless HTTP Primitives [10.26, 07.26]**
> Deploying multi-hour, self-evolving enterprise agent harnesses or asynchronous background workflows on request-bound stateless HTTP containers causes mid-trajectory eviction, lost execution checkpoints, and ungoverned tool execution.
> - **Mandatory Standard**: Run stateful long-horizon agent harnesses on **Agent Compute Engine** with expanded governance (microVM state persistence and identity-bound policy enforcement), or offload asynchronous enterprise tasks to **Gemini Managed Agents** running in the background.
> *Cites: [Introducing Agent Compute Engine and expanding agent governance](./references/articles.md), [Agent Compute Engine deep dive](./references/articles.md), and [Gemini Managed Agents Can Now Run in the Background](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 3: Exposing Gemini Enterprise Agents Without Agent Gateway & Model Armor Guardrails [09.26, 10.26]**
> Allowing enterprise users or external partner agents to invoke Gemini Enterprise agents directly without an inline policy enforcement point exposes internal enterprise connectors to prompt injection and unauthorized tool execution.
> - **Solution**: Route all incoming and agent-to-agent traffic through **Agent Gateway** paired with **Google Model Armor** templates and governed self-evolving evaluation loops on Gemini Agent Platform.
> *Cites: [Securing your agent in Agent Platform with Agent Gateway and Model Armor](./references/articles.md) and [Architecting Governed, Self-Evolving AI Agents on Google Cloud](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Manual ClickOps Provisioning & Legacy Vertex AI Agent Builder Paths [02.26, 06.26, 04.26]**
> Provisioning Gemini Enterprise tenants, data stores, and regional endpoints manually in the Cloud Console—or targeting legacy pre-GEAP Vertex AI Agent Builder APIs without regional residency alignment—causes configuration drift and compliance violations.
> - **Standard Protocol**: Manage all Gemini Enterprise environments declaratively via **Terraform**, follow the **Vertex AI to Gemini Enterprise Agent Platform (GEAP)** migration map, and pin compliant regional locations.
> *Cites: [Deploying Gemini Enterprise Using Terraform](./references/articles.md), [Vertex AI is now Gemini Enterprise Agent Platform: A migration map for Agent Builders](./references/articles.md), and [Gemini Enterprise Agent Platform locations](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 5: Rebuilding Custom Data Connectors Instead of Registering ADK Agents & GEAR Connectors [12.25, 10.25, 02.26, 06.26]**
> Building bespoke authentication and UI wrappers from scratch when bringing custom ADK or external platform agents into the enterprise workspace duplicates identity plumbing and breaks unified enterprise search.
> - **Solution**: Register existing **ADK Agents** or custom platform agents directly with **Gemini Enterprise**, leverage certified **Gemini Enterprise Agent Ready (GEAR)** partner connectors, or build standardized **Custom Connectors** with federated identity.
> *Cites: [How to Register and Use ADK Agents with Gemini Enterprise](./references/articles.md), [Integrating Agents on Custom Platforms with Gemini Enterprise](./references/articles.md), [Build a Custom Connector for Gemini Enterprise](./references/articles.md), [From ADK to Gemini Enterprise: Building Production-Grade AI Agents on Google Cloud](./references/articles.md), and [Gemini Enterprise Agent Ready (GEAR) program now available](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Gemini Enterprise Execution Runtime Matrix [10.26, 07.26, 12.25]
| Runtime Option | State & Duration Profile | Governance & Isolation | Ideal Enterprise Workload |
| :--- | :--- | :--- | :--- |
| **Agent Compute Engine** | Stateful, long-horizon microVM harness with checkpointing | Expanded agent governance, hardware-isolated sandbox, policy-bound tool calls | Complex multi-step autonomous engineering, research, and self-evolving enterprise agents |
| **Gemini Managed Agents (Background)** | Asynchronous background execution (minutes to hours) | Managed Google Cloud lifecycle, automatic retries & workspace notifications | Deep enterprise report synthesis, batch compliance audits, back-office automation |
| **Registered ADK / Custom Agent** | Synchronous or streaming A2A/A2UI turns | Governed via **Agent Gateway** + **Model Armor** + IAM | Domain-specific specialist agents hosted on Agent Engine, Cloud Run, or GKE |
*Cites: [Introducing Agent Compute Engine and expanding agent governance](./references/articles.md), [Gemini Managed Agents Can Now Run in the Background](./references/articles.md), and [How to Register and Use ADK Agents with Gemini Enterprise](./references/articles.md)*

---

### 2. Vertex AI to Gemini Enterprise Agent Platform (GEAP) Migration Matrix [06.26, 05.26, 08.26]
| Legacy Capability | Modern Gemini Enterprise (GEAP) Standard | Key Architectural Upgrade |
| :--- | :--- | :--- |
| **Vertex AI Agent Builder Console** | **Gemini Enterprise Agent Platform (GEAP)** | Unified agent registry, enterprise connector catalog, and A2UI workspace streaming |
| **Unfiltered Agent Endpoints** | **Agent Gateway + Model Armor** | Zero-trust inline prompt/response sanitization and per-tool OAuth/IAM policy enforcement |
| **Custom Frontend Polling** | **Gemini Enterprise + A2UI Protocol** | Native declarative streaming of interactive charts, tables, and approval cards into Gemini Enterprise |
| **Ad-Hoc Custom Model Hosting** | **Gemma 4 on GEAP & Cloud Run** | Managed SFT fine-tuning and cost-controlled open-weights deployment inside GEAP |
*Cites: [Vertex AI is now Gemini Enterprise Agent Platform: A migration map for Agent Builders](./references/articles.md), [Developer's guide to Gemini Enterprise and A2UI integration](./references/articles.md), and [Fine-Tuning and Deploying Gemma 4 at Scale on Gemini Enterprise Agent Platform (GEAP) and Cloud Run](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Provisioning Gemini Enterprise & Agent Gateway with Terraform [02.26, 09.26]
Declaratively provision a Gemini Enterprise application bound to an enterprise data store and protected by Model Armor via Agent Gateway:
```hcl
resource "google_discovery_engine_data_store" "enterprise_knowledge" {
  location                    = "global"
  data_store_id               = "gemini-enterprise-corp-kb"
  display_name                = "Corporate Knowledge Base"
  industry_vertical           = "GENERIC"
  content_config              = "CONTENT_REQUIRED"
  solution_types              = ["SOLUTION_TYPE_SEARCH", "SOLUTION_TYPE_CHAT"]
  create_advanced_site_search = false
}

resource "google_discovery_engine_search_engine" "gemini_enterprise_app" {
  engine_id      = "gemini-enterprise-workspace"
  collection_id  = "default_collection"
  location       = google_discovery_engine_data_store.enterprise_knowledge.location
  display_name   = "Gemini Enterprise Workspace Assistant"
  data_store_ids = [google_discovery_engine_data_store.enterprise_knowledge.data_store_id]

  search_engine_config {
    search_tier   = "SEARCH_TIER_ENTERPRISE"
    search_add_ons = ["SEARCH_ADD_ON_LLM"]
  }
}
```
*Cites: [Deploying Gemini Enterprise Using Terraform](./references/articles.md) and [Securing your agent in Agent Platform with Agent Gateway and Model Armor](./references/articles.md)*

---

### Blueprint 2: Registering an ADK Agent into Gemini Enterprise [12.25, 06.26]
Expose a production Google ADK specialist agent and register its A2A descriptor with Gemini Enterprise so employees can invoke it directly from the Gemini Enterprise workspace:
```python
import os
from google.adk import Agent
from google.adk.enterprise import GeminiEnterpriseRegistrar

specialist_agent = Agent(
    name="EnterpriseProcurementSpecialist",
    model=os.getenv("GEMINI_ENTERPRISE_MODEL", "gemini-4-argon"),
    instruction="Verify vendor compliance and draft purchase requisitions under enterprise policy.",
)

registrar = GeminiEnterpriseRegistrar(
    project_id=os.environ["GOOGLE_CLOUD_PROJECT"],
    location="global",
    enterprise_app_id="gemini-enterprise-workspace",
)

registration = registrar.register_agent(
    agent=specialist_agent,
    agent_gateway_policy="projects/my-prod/locations/global/gatewayPolicies/strict-model-armor",
    require_user_oauth=True,
)
print(f"Registered ADK agent in Gemini Enterprise: {registration.resource_name}")
```
*Cites: [How to Register and Use ADK Agents with Gemini Enterprise](./references/articles.md) and [From ADK to Gemini Enterprise: Building Production-Grade AI Agents on Google Cloud](./references/articles.md)*

---

### Blueprint 3: Stateful Agent Compute Engine Workload with Expanded Governance [10.26]
Configure a long-horizon stateful agent execution harness on Agent Compute Engine with explicit tool governance and checkpoint persistence:
```python
import os
from google.adk import Agent
from google.adk.runtime import AgentComputeEngineRuntime, GovernancePolicy

governance_policy = GovernancePolicy(
    allowed_mcp_registries=["projects/my-prod/locations/global/agentRegistries/verified-corp"],
    require_human_approval_on_mutation=True,
    checkpoint_gcs_bucket="gs://my-prod-agent-checkpoints",
)

stateful_agent = Agent(
    name="SelfEvolvingArchitectureAuditor",
    model=os.getenv("AGENT_COMPUTE_MODEL", "gemini-4-argon"),
    instruction="Execute multi-hour repository dependency audits with durable state checkpoints.",
)

runtime = AgentComputeEngineRuntime(
    agent=stateful_agent,
    governance=governance_policy,
    machine_profile="ace-standard-4",
)
```
*Cites: [Introducing Agent Compute Engine and expanding agent governance](./references/articles.md), [Agent Compute Engine deep dive](./references/articles.md), and [Architecting Governed, Self-Evolving AI Agents on Google Cloud](./references/articles.md)*

---

### Blueprint 4: Streaming Interactive Enterprise UIs with Gemini Enterprise & A2UI [05.26]
Stream rich, interactive A2UI components directly into the Gemini Enterprise user interface:
```python
import os
from google.adk import Agent, a2ui

enterprise_ui_agent = Agent(
    name="QuarterlyForecastAdvisor",
    model=os.getenv("GEMINI_ENTERPRISE_MODEL", "gemini-4-argon"),
    instruction="Render interactive forecast approval cards inside Gemini Enterprise using A2UI.",
)

@enterprise_ui_agent.tool()
def render_forecast_card(region: str, projected_arr_usd: float) -> a2ui.Widget:
    """Streams an interactive A2UI approval widget into Gemini Enterprise."""
    return a2ui.Card(
        title=f"Q4 Forecast — {region}",
        subtitle=f"Projected ARR: ${projected_arr_usd:,.2f}",
        actions=[
            a2ui.Button(label="Approve Forecast", action_id="approve_q4_forecast"),
            a2ui.Button(label="Request Revision", action_id="revise_q4_forecast"),
        ],
    )
```
*Cites: [Developer's guide to Gemini Enterprise and A2UI integration](./references/articles.md)*

---

### Blueprint 5: Gemini Enterprise Agent Platform (GEAP) Observability & Evaluation Pipeline [05.26, 08.26]
Configure continuous trajectory evaluation and telemetry export on Gemini Enterprise Agent Platform:
```python
import os
from google.adk.evaluation import GEAPEvaluator, TrajectoryMetric

evaluator = GEAPEvaluator(
    project_id=os.environ["GOOGLE_CLOUD_PROJECT"],
    location="us-central1",
    judge_model=os.getenv("GEAP_JUDGE_MODEL", "gemini-4-argon"),
    metrics=[
        TrajectoryMetric.TOOL_SELECTION_PRECISION,
        TrajectoryMetric.GROUNDED_FAITHFULNESS,
        TrajectoryMetric.POLICY_COMPLIANCE,
    ],
)

report = evaluator.evaluate_dataset(
    agent_resource="projects/my-prod/locations/global/agents/procurement-specialist",
    golden_dataset_uri="gs://my-prod-evals/gemini_enterprise_cuj_golden.jsonl",
)
print(f"GEAP Evaluation Pass Rate: {report.pass_rate:.1%}")
```
*Cites: [Tutorial Series : Gemini Enterprise Agent Platform — Part 5 : Observability and Evaluation](./references/articles.md) and [Fine-Tuning and Deploying Gemma 4 at Scale on Gemini Enterprise Agent Platform (GEAP) and Cloud Run](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[10.26]**: Agent Compute Engine and expanded agent governance launched for planet-scale stateful agents; Governed self-evolving AI agent architectures on Gemini Agent Platform; 9 production anti-patterns for Gemini Enterprise agents.
- **[09.26]**: Securing agents in Agent Platform using inline Agent Gateway and Google Model Armor.
- **[08.26]**: Fine-tuning and deploying Gemma 4 at scale on Gemini Enterprise Agent Platform (GEAP) and Cloud Run.
- **[07.26]**: Gemini Managed Agents enabled for asynchronous background execution.
- **[06.26]**: Vertex AI Agent Builder transitions to Gemini Enterprise Agent Platform (GEAP); End-to-end production deployment guide from ADK to Gemini Enterprise.
- **[05.26]**: Developer's guide to Gemini Enterprise and A2UI integration; GEAP Part 5 observability and evaluation framework.
- **[04.26]**: Regional location expansion and residency controls for Gemini Enterprise Agent Platform.
- **[02.26]**: Declarative Terraform provisioning for Gemini Enterprise; Launch of the Gemini Enterprise Agent Ready (GEAR) partner program.
- **[12.25]**: Direct registration of ADK agents and external custom platform agents into Gemini Enterprise.
- **[10.25]**: Custom Connector SDK for integrating proprietary enterprise data sources into Gemini Enterprise.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Gemini Enterprise Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
