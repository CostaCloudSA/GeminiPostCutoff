# Antigravity Global Knowledge & GCP Article Ingestion Protocol

## 🎯 Scope & Context
The repository maintains a 22-domain curated Google Cloud Platform (GCP) & AI Agent knowledge base located in `skills/` (plus the master router `gcp-skills-index`).

Whenever new links, articles, release notes, or codelabs are ingested into the knowledge base:

---

## ⚡ Mandatory Ingestion Workflow & Rules

### 1. Metadata Extraction & Model-Agnostic Chronological Storage
For every provided URL:
- Fetch or extract the **Canonical Article Title**.
- Determine the exact **Publication Date** (Year and Month in `MM.YY` format).
- **Model-Agnostic Vault Headers**: Store active releases (`>= 2025`) in `references/articles.md` under immutable chronological year headers:
  * `### 🌟 2026 Releases & Architectural Baselines (Chronological)`
  * `### 📅 2025 Releases & Deep Dives (Chronological)`
  * Foundational/historical resources (`<= 2024`) are stored in `references/archive.md`.
- **Dynamic Runtime Tier Classification ($\Delta_m$)**: Never hardcode model-specific tier headers inside `articles.md`. At runtime, `ModelCutoffResolver` classifies every `[MM.YY]` entry relative to the active model's cutoff ($\text{Cutoff}_{\text{MM.YY}}$) via $\Delta_m = (\text{Year}_A - \text{Year}_C) \times 12 + (\text{Month}_A - \text{Month}_C)$:
  * **Dynamic Tier 1 (Post-Cutoff Delta, $\Delta_m > 0$)**: Post-cutoff for the active model (e.g., `>= 04.26` for `03.26` cutoff models like **Gemini 4 Argon** and **Gemini 3.8 Flash**; `>= 02.25` for `01.25` cutoff models like **Gemini 3.1 Pro** or unverified fail-safe sessions).
  * **Dynamic Tier 2 (Boundary & Maturation Window, $-12 \le \Delta_m \le 0$)**: Released within 12 months prior to the active model's cutoff; used to verify GA syntax vs. pre-cutoff Preview habits.
  * **Dynamic Tier 3 (Absorbed & Timeless Foundations, $\Delta_m < -12$)**: Timeless mathematical crossover formulas and foundational trade-offs (`references/archive.md`).

### 2. Standardization & Formatting Syntax
Every reference link MUST follow this exact format:
- `- [[MM.YY Blogpost]: Canonical Title](https://...)`
- For academic/deep-dive articles: `- [[MM.YY Article]: Canonical Title](https://...)`
- For official documentation/guides: `- [[MM.YY Docs]: Canonical Title](https://...)`
- For codelabs: `- [Codelab: Title](https://...)`
- For GitHub repositories: `- [Repo Name: Description](https://github.com/...)`

### 3. Target Domain Routing (22 Operational Domains)
Match each article to its primary skill vault in `skills/<skill-name>/references/articles.md`:
- Event-driven messaging, Pub/Sub, Pub/Sub Lite migration, Kafka, SMTs, DLQs, Eventarc $\to$ `gcp-pubsub`
- Multi-agent orchestration, ADK (Python/Go/Java), A2A/A2UI/AG-UI, Memory Bank $\to$ `gcp-adk-agents`
- Cloud Run, serverless microservices, CPU throttling, IAP, Temporal worker pools $\to$ `gcp-cloud-run`
- GKE Autopilot, networking, Dataplane V2, Gateway API, Pod Snapshots, ComputeClasses $\to$ `gcp-gke-platform`
- GKE cost optimization, priority scheduling, right-sizing, VPA $\to$ `gcp-gke-cost`
- GKE LLM serving, vLLM, Agent Sandbox, Kueue, TPU serving, Inference Gateway $\to$ `gcp-gke-inference`
- BigQuery AI/ML, Vector SQL, Remote MCP server, Autonomous Embeddings, MCP Toolbox $\to$ `gcp-bigquery-ai`
- BigQuery architecture, DTS, Fine-grained DML, Dataform, Continuous Queries, BigQuery Graph $\to$ `gcp-bigquery-analytics`
- BigQuery slot economics, billing export, token attribution, partition pruning $\to$ `gcp-bigquery-cost`
- Compute FinOps, right-sizing, spend caps, reservation math, CUDs, Flex-start VMs $\to$ `gcp-computefinops`
- Operational & AI databases, Cloud SQL, AlloyDB AI ScaNN, Firestore Pipelines & MCP $\to$ `gcp-databases`
- Cloud networking, Direct VPC Egress, Cross-Site Interconnect, Private NAT, Envoy AI $\to$ `gcp-networking`
- Cross-cloud migrations (AWS/Azure to GCP), Snowflake/Teradata/Databricks to BigQuery $\to$ `gcp-migrations`
- Geospatial pipelines, Earth Engine, AlphaEarth satellite embeddings, BigQuery GIS $\to$ `gcp-geospatial`
- Spatial computing, Android XR SDK, Jetpack XR Compose $\to$ `gcp-android-xr`
- Robotics, Edge AI, Local AI, LiteRT, MediaPipe, Gemma family $\to$ `gcp-gemini-robotics`
- Model Armor, Agent Gateway, WIF, SecOps, private clusters, GenAI security baseline $\to$ `gcp-security-compliance`
- Dialogflow CX, Live API, Voice Agents, Conversational AI, FreeSWITCH $\to$ `gcp-conversational-ai`
- Gemini CLI, Antigravity IDE, Terraform Stacks, FastMCP, Hooks, Subagents $\to$ `gcp-gemini-tooling`
- Gemma 4 at scale, GEAP, TimesFM, AlphaFold, JAX TPU fine-tuning $\to$ `gcp-frontier-emerging`
- Cinematic generative media, Veo 3.1, Gemini Omni Flash, DiffusionGemma $\to$ `gcp-generative-media`
- End-to-end architecture audits, Hub-and-Spoke governance, pre-flight scans $\to$ `gcp-architecture-review`

### 4. Strict Mathematical Chronological Sorting
- Within every `references/articles.md` and `references/archive.md`, links MUST be strictly ordered descending by date:
  $$\text{Sort Key} = (2000 + \text{Year}) \times 100 + \text{Month}$$
- `[09.26]` (202609) $\to$ `[08.26]` (202608) $\to$ `[07.26]` (202607) $\to$ ... $\to$ `[01.24]` (202401).

---

## 🔬 5. Architectural Extraction Score (AES 1 to 5)

To guarantee that ingested articles provide actionable value and prevent superficial link hoarding, every article is evaluated against the **5-Tier AES Rubric**:

| Score | Level Name | Extraction Requirement | Target Destination |
| :---: | :--- | :--- | :--- |
| **Level 1** | **Cataloged Link** | Canonical title, date, URL formatted and chronologically sorted under its year header. | `references/articles.md` |
| **Level 2** | **Chronological Milestone** | Added to timeline with 1–2 sentence operational impact. | `SKILL.md` (`## ⏱️ Chronological Evolution`) |
| **Level 3** | **Architectural Rule** | Extracted non-obvious failure mode, anti-pattern (`[MM.YY]`), or quantitative decision threshold. | `SKILL.md` (`## 🚫 Anti-Patterns` or `## ⚖️ Decision Matrices`) |
| **Level 4** | **Production Blueprint** | Runnable, copy-pasteable Terraform, Python, Go, Java, or Bash snippet (`[MM.YY]`) directly citing the source. | `SKILL.md` (`## 🛠️ Production Blueprints`) |
| **Level 5** | **Verifier & Eval Grounded** | Verified via `node review_engine/grounding/verifier.js` and golden eval suite. | `reports/grounding_baseline.md` & `evals/` |

* **Ingestion Standard**: Routine blog posts must reach at least **AES Level 2**. Major GA announcements, breaking changes, or architectural shifts MUST achieve **AES Level 4–5** (with uncapped runbook expansion).

---

## 🛠️ 6. Automated Tooling & Ingestion Assistant

Maintainers should utilize the automated ingestion script to eliminate manual sorting mistakes:

```bash
# Automated Ingestion CLI
node scripts/ingest.js --url "<URL>" --domain "<target-skill>" --date "MM.YY" --score 4
```

### Automated Verification:
Always verify the entire repository before concluding any ingestion session:
```bash
# Rapid local verification on commit (sorting, internal links, minimum floors, grounding)
npm test
node review_engine/grounding/verifier.js

# Monthly external URL health check (checks 739+ external HTTP endpoints)
npm run audit:external
```
Ensure **0 sorting errors**, **0 unresolved citations**, and **100% valid relative links** before committing.
