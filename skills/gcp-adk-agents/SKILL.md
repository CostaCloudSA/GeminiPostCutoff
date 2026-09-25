---
name: gcp-adk-agents
description: >-
  Agent Development Kit (ADK Python/Go/Java 1.0), Vertex AI Agent Engine,
  A2A Protocol, A2UI Protocol, Memory Bank, and multi-agent coordination.
  Activate when architecting multi-agent systems, designing agent protocols, or deploying autonomous workflows.
---

# Google Agent Development Kit (ADK) & Multi-Agent Architecture Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Designing and developing multi-agent systems with **Google ADK (Python, Go 1.0, Java 1.0.0)** or migrating to **google-adk 2.0**.
- Deploying enterprise agents to **Gemini Enterprise Agent Platform** (formerly Vertex AI Agent Engine) or Cloud Run / GKE Autopilot.
- Implementing the **Agent-to-Agent (A2A)** JSON-RPC communication protocol for cross-team or cross-cloud agent collaboration.
- Streaming declarative interactive widgets directly to client applications using the **Agent-to-UI (A2UI)** protocol.
- Architecting persistent episodic and semantic long-term memory using **Memory Bank** and Firestore / Cloud SQL.
- Enforcing Zero-Trust security for agents with **SPIFFE identity**, **Agent Gateway**, and **Model Armor**.
- Tracing and evaluating multi-turn agent runs with the **BigQuery Agent Analytics Plugin**.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Sub-Agent vs Agent-as-a-Tool Architecture Confusion [11.25]**
> - **Sub-Agent**: Use when the delegated task requires an independent context window, its own autonomous reasoning loop, or distinct system instructions.
> - **Agent-as-a-Tool**: Use when the primary agent needs a deterministic, single-turn answer returned directly into its existing context without branching off a parallel conversation.
> Wrapping everything as tools causes severe context pollution and context window overflow.
> *Cites: [ADK architecture: When to use sub-agents versus agents as tools](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Unbounded Context Accumulation & Missing CachedContent [11.25]**
> Passing continuous multi-turn raw transcripts and entire tool schemas into models inflates per-turn latency by up to 300% and rapidly degrades instruction adherence.
> - **Mandatory Fixes**:
>   1. Leverage Gemini Context Caching (`CachedContent`) for static system instructions and multi-agent schema definitions.
>   2. Filter tool definitions dynamically per turn so agents only see relevant tools.
>   3. Apply sliding-window summarization on past interaction turns.
> *Cites: [Being a (context) Control Freak: 4 optimizations that made my ADK agent 2.7x faster](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Shared Static Service Account Keys for Multi-Agent Meshes [08.26, 06.26]**
> Using a single monolithic service account key across all agents in an A2A mesh destroys auditability and allows a compromised worker agent to access root databases.
> - **Solution**: Assign unique cryptographic identities to each agent using **SPIFFE IDs** and **Workload Identity Federation (WIF)**, scoped with least-privilege IAM roles.
> *Cites: [Build Zero-Trust AI Agents with Google's Agent Development Kit](./references/articles.md) and [SPIFFE: Why Google's New Agent Identity is the Future of AI Security](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Synchronous Blocking HTTP Loops for Long-Running Tasks [07.26]**
> Running multi-step planning or external batch pipelines inside synchronous HTTP request threads causes client timeouts and dropped connections.
> - **Solution**: Use **Gemini Managed Agents Background Execution** or asynchronous Cloud Run jobs with event-driven Webhook callbacks.
> *Cites: [Gemini Managed Agents Can Now Run in the Background](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 5: Unvalidated Destructive Tool Execution without Human-in-the-Loop Approval [06.26, 05.26]**
> Allowing autonomous agents to execute irreversible mutations (database drops, financial transactions, infrastructure teardowns) without deterministic policy checks risks catastrophic data loss.
> - **Solution**: Implement **Tool Approval Middleware** in ADK/Genkit, intercepting high-risk tool calls and routing them to a human-in-the-loop review queue or requiring signed cryptographic confirmation.
> *Cites: [Genkit Middleware in Python: Retries, Fallbacks, Tool Approval](./references/articles.md) and [Securing AI agents with MCP Authorization](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 6: Direct Ingress Exposure without Agent Gateway Sanitization [09.26, 08.26]**
> Exposing internal multi-agent tools directly to public client applications allows adversarial prompt injections to bypass application logic and extract sensitive tool parameters.
> - **Solution**: Route all external agent requests through **Agent Gateway with Google Model Armor**, applying real-time prompt sanitization and strict token authorization before invoking ADK tools.
> *Cites: [Securing your agent in Agent Platform with Agent Gateway and Model Armor](./references/articles.md) and [Architecting Secure Enterprise AI Agents with MCP Toolbox](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Agent Hosting Platform Matrix [08.26, 06.26]
| Dimension | Cloud Run | GKE Autopilot | Gemini Enterprise Agent Platform |
| :--- | :--- | :--- | :--- |
| **Control Level** | Full code container runtime (Python, Go, Java) | Full Kubernetes orchestration, custom sidecars | Fully managed Google serverless agent runtime |
| **Cold Starts** | < 2s with containerless deploy | Sub-second with Pod Snapshots | Near-instant managed warm pools |
| **Sandbox Execution** | Standard gVisor container | **Agent Sandbox (microVM isolation)** | Built-in managed code interpreter |
| **Best For** | Custom A2A/A2UI microservices, MCP servers | High-scale multi-agent clusters, GPU/TPU models | Rapid enterprise deployment with native IAM |
*Cites: [Cloud Run vs GKE Autopilot: A Comparison for ADK Agents](./references/articles.md)*

---

### 2. Multi-Agent Coordination Topology Matrix [12.25]
| Topology | Communication Mechanism | Failure Domain | Best For |
| :--- | :--- | :--- | :--- |
| **Supervisor / Router** | Central orchestrator dispatches to workers | Single point of failure (Supervisor) | Customer support triage, sequential workflows |
| **Hierarchical Trees** | Multi-level managers delegate to specialists | Partitioned by domain department | Complex research, software engineering tasks |
| **Decentralized A2A Mesh** | Peer-to-peer over A2A JSON-RPC protocol | Resilient; isolated agent failures | Cross-organizational or cross-cloud agent collaboration |
*Cites: [Developer's guide to multi-agent patterns in ADK](./references/articles.md) and [How A2A is Building a World of Collaborative Agents](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Production ADK 2.0 Multi-Agent Workflow with Tool Approvals [06.26]
Define a multi-agent system with human-in-the-loop tool approval and fallback retries:
```python
from google.adk import Agent, Tool, Runner
from google.adk.workflows import SequentialWorkflow, FallbackRetry

# 1. Specialized Worker Agent
sql_analyst = Agent(
    name="SQLAnalyst",
    model="gemini-2.5-flash",
    instruction="Translate business questions into BigQuery SQL queries.",
    tools=[Tool.from_mcp("bigquery_mcp")]
)

# 2. Executive Coordinator with Tool Confirmation
coordinator = Agent(
    name="Supervisor",
    model="gemini-2.5-pro",
    instruction="Coordinate user requests and seek approval before executing mutating actions.",
    sub_agents=[sql_analyst]
)

# 3. Middleware configuration for retries and human approval
workflow = SequentialWorkflow(
    agents=[coordinator],
    middleware=[
        FallbackRetry(max_retries=3, backoff_seconds=2),
    ]
)

runner = Runner(workflow=workflow)
```
*Cites: [google-adk 2.0 Is Now Stable](./references/articles.md) and [Genkit Middleware in Python: Retries, Fallbacks, Tool Approval](./references/articles.md)*

---

### Blueprint 2: A2A Protocol Decentralized Agent Server [06.26, 01.26]
Expose an agent as an interoperable service using the official A2A JSON-RPC protocol:
```python
from google.adk import Agent
from google.adk.protocols.a2a import A2AServer

data_engineering_agent = Agent(
    name="BigQueryDataEngineer",
    model="gemini-2.5-pro",
    instruction="Execute data pipeline operations and table schema migrations."
)

# Expose agent over standard A2A JSON-RPC interface
server = A2AServer(
    agent=data_engineering_agent,
    host="0.0.0.0",
    port=8080,
    auth_provider="google-oidc" # Requires valid OIDC tokens
)

if __name__ == "__main__":
    server.start()
```
*Cites: [A2A ecosystem: BigQuery Data Engineering Agent](./references/articles.md) and [How A2A is Building a World of Collaborative Agents](./references/articles.md)*

---

### Blueprint 3: A2UI Declarative Dynamic UI Streaming [05.26, 03.26]
Stream interactive structured UI components directly to client web applications:
```python
from google.adk import Agent, a2ui

agent = Agent(
    name="FinancialAdvisor",
    model="gemini-2.5-pro",
    instruction="Provide spending analysis and stream UI charts directly to the user interface."
)

@agent.tool()
def render_budget_chart(categories: list[str], amounts: list[float]) -> a2ui.Widget:
    """Generates an interactive A2UI bar chart for client rendering."""
    return a2ui.BarChart(
        title="Monthly Spend by Category",
        labels=categories,
        values=amounts,
        action_button=a2ui.Button(label="Download CSV", action_id="export_budget")
    )
```
*Cites: [Developer's guide to Gemini Enterprise and A2UI integration](./references/articles.md) and [Agent to UI Protocol (A2UI) with ADK](./references/articles.md)*

---

### Blueprint 4: Zero-Trust Agent Security with SPIFFE & Model Armor [09.26, 06.26]
Wrap agent execution with SPIFFE workload identity and Model Armor prompt validation:
```python
from google.adk.security import SpiffeIdentity, ModelArmorGuardrail

# Configure SPIFFE Agent Identity
agent_identity = SpiffeIdentity(
    spiffe_id="spiffe://prod.internal/ns/agents/sa/billing-agent",
    audience="gcp-agent-platform"
)

# Attach Model Armor guardrails to sanitize incoming user prompts
guardrail = ModelArmorGuardrail(
    template_name="projects/my-prod/locations/global/templates/enterprise-anti-injection",
    block_on_violation=True
)

secure_agent = Agent(
    name="SecureBillingAgent",
    model="gemini-2.5-pro",
    identity=agent_identity,
    guardrails=[guardrail]
)
```
*Cites: [Securing your agent in Agent Platform with Agent Gateway and Model Armor](./references/articles.md) and [SPIFFE: Why Google's New Agent Identity is the Future of AI Security](./references/articles.md)*

---

### Blueprint 5: Long-Term Memory Bank with Firestore [03.26, 11.25]
Equip an agent with semantic and episodic memory that persists across independent user sessions:
```python
from google.adk.memory import MemoryBank, FirestoreMemoryStore

memory_store = FirestoreMemoryStore(
    collection="user_agent_memories",
    project_id="my-gcp-project"
)

memory_bank = MemoryBank(
    store=memory_store,
    embedding_model="text-embedding-005",
    top_k_relevant_memories=5
)

agent = Agent(
    name="PersonalAssistant",
    model="gemini-2.5-pro",
    memory=memory_bank,
    instruction="Recall user preferences and previous project decisions during reasoning."
)
```
*Cites: [Architect A Personalized Multi-Agent System with Long-Term Memory](./references/articles.md)*

---

### Blueprint 6: Enterprise High-Throughput Microservice with ADK Go 1.0 [03.26]
Build memory-efficient, low-latency microservices with ADK Go 1.0:
```go
package main

import (
	"context"
	"log"
	"net/http"

	"github.com/google/adk-go/adk"
	"github.com/google/adk-go/protocols/a2a"
)

func main() {
	ctx := context.Background()

	agent, err := adk.NewAgent(ctx, adk.AgentConfig{
		Name:        "GoLogAuditor",
		Model:       "gemini-2.5-flash",
		Instruction: "High-throughput log auditing and anomaly detection.",
	})
	if err != nil {
		log.Fatalf("Failed to initialize agent: %v", err)
	}

	handler := a2a.NewHandler(agent)
	http.Handle("/a2a", handler)
	log.Println("ADK Go agent listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```
*Cites: [ADK Go 1.0 Arrives!](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[09.26]**: Securing Agent Platform with Agent Gateway and Model Armor.
- **[08.26]**: Zero-Trust AI agents with SPIFFE workload identity; MCP Toolbox security patterns.
- **[07.26]**: Gemini Managed Agents run background asynchronous workflows.
- **[06.26]**: google-adk 2.0 release with workflow runtimes; A2A protocol BigQuery Data Engineering Agent.
- **[05.26]**: Agent-to-UI (A2UI) protocol integration with Gemini Enterprise; MCP Authorization.
- **[04.26]**: Gemini CLI subagents launch; 50+ managed MCP servers released.
- **[03.26]**: ADK Go 1.0 and ADK Java 1.0.0 released; Multi-agent memory architectures.
- **[02.26]**: Complete guide to the anatomy of an AI agent on Google Cloud.
- **[01.26]**: BigQuery Agent Analytics Plugin for evaluation; Collaborative multi-agent ecosystems.
- **[12.25]**: Developer's guide to multi-agent patterns in ADK; Advanced tool governance in Agent Builder; Interactions API.
- **[11.25]**: Context control optimizations (2.7x speedup); Sub-agents vs agents-as-tools guidelines; Life sciences R&D workflows.
- **[10.25]**: Vertex AI Agent Engine scalable design patterns; Slashed ADK importer cold start in half.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Multi-Agent Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
