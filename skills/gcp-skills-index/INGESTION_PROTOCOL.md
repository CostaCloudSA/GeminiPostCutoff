# Antigravity Global Knowledge & GCP Article Ingestion Protocol

## 🎯 Scope & Context
The user maintains a 20-domain curated Google Cloud Platform (GCP) & AI Agent knowledge base located at `~/.gemini/config/skills/`.

Whenever the user provides links/articles in conversation to be added to the knowledge base:

---

## ⚡ Mandatory Ingestion Workflow & Rules

### 1. Metadata Extraction
For every provided URL:
- Fetch or extract the **Canonical Article Title**.
- Determine the exact **Publication Date** (Year and Month).
- Extract core architectural insights, benchmarks, or code patterns.

### 2. Standardization & Formatting Syntax
Every reference link MUST follow this exact format:
- `- [[MM.YY Blogpost]: Canonical Title](https://...)`
- For academic/deep-dive articles: `- [[MM.YY Article]: Canonical Title](https://...)`
- For codelabs: `- [Codelab: Title](https://...)`
- For GitHub repositories: `- [Repo Name: Description](https://github.com/...)`

### 3. Target Domain Routing
Match each article to its primary skill vault in `~/.gemini/config/skills/<skill-name>/references/articles.md`:
- Multi-agent orchestration, ADK, A2A/A2UI, Memory Bank $\to$ `gcp-adk-agents`
- Cloud Run, serverless microservices, CPU throttling $\to$ `gcp-cloud-run`
- GKE Autopilot, networking, Dataplane V2, Gateway API $\to$ `gcp-gke-platform`
- GKE cost optimization, priority scheduling, right-sizing $\to$ `gcp-gke-cost`
- GKE LLM serving, vLLM, Agent Sandbox, Kueue, TPU serving $\to$ `gcp-gke-inference`
- BigQuery AI/ML, Vector SQL, Remote MCP server, Autonomous Embeddings $\to$ `gcp-bigquery-ai`
- BigQuery architecture, DTS, Fine-grained DML, Dataform $\to$ `gcp-bigquery-analytics`
- BigQuery slot economics, billing export, token attribution $\to$ `gcp-bigquery-cost`
- FinOps, Cloud Billing hard spend caps, kill switches, CUDs $\to$ `gcp-finops-killswitch`
- Robotics, Edge AI, Local AI, LiteRT, MediaPipe, Gemma family $\to$ `gcp-gemini-robotics`
- Model Armor, Agent Gateway, WIF, SecOps, private clusters $\to$ `gcp-security-compliance`
- Dialogflow CX, Live API, Voice Agents, Conversational AI $\to$ `gcp-conversational-ai`
- Gemini CLI, Antigravity IDE, Terraform Stacks, FastMCP $\to$ `gcp-gemini-tooling`
- Gemma 4 at scale, GEAP, Veo, AlphaFold, JAX TPU fine-tuning $\to$ `gcp-frontier-emerging`

### 4. Strict Mathematical Chronological Sorting
- Within every `references/articles.md`, links MUST be strictly ordered descending by date:
  $$\text{Sort Key} = (2000 + \text{Year}) \times 100 + \text{Month}$$
- `[09.26]` (202609) $\to$ `[08.26]` (202608) $\to$ `[07.26]` (202607) $\to$ ... $\to$ `[01.24]` (202401).

### 5. SKILL.md Operational Runbook Enrichment & Standard
When a new major feature, benchmark, or architecture pattern is ingested:
- Adhere strictly to the codified [SKILL.md Standard Specification](./SKILL_STANDARD.md).
- Ensure the 7 mandatory sections are populated: Domain Scope, Critical Anti-Patterns, Decision Matrices, Production Blueprints, Chronological Evolution, and Dual-Vault Reference Links.
- Meet extraction coverage quotas (minimum 4–6 anti-patterns, 2–3 decision matrices, and 4–8 runnable production blueprints citing their source articles).
- Report updates using the mandatory **Previous State vs. New State** metric breakdown.

### 6. Automated Validation Check
- Always verify the references with the automated audit script:
  ```bash
  node "C:/Users/campabadal/.gemini/antigravity/scratch/audit_skills.js"
  ```
- Ensure **0 sorting errors** and **100% active markdown links** before concluding.
