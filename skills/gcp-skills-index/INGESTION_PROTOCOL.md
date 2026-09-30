# Antigravity Global Knowledge & GCP Article Ingestion Protocol

## 🎯 Scope & Context
The repository maintains a 21-domain curated Google Cloud Platform (GCP) & AI Agent knowledge base located in `skills/`.

Whenever new links, articles, release notes, or codelabs are ingested into the knowledge base:

---

## ⚡ Mandatory Ingestion Workflow & Rules

### 1. Metadata Extraction & Model Cutoff Calibration
For every provided URL:
- Fetch or extract the **Canonical Article Title**.
- Determine the exact **Publication Date** (Year and Month in `MM.YY` format).
- Calibrate against the **Model Cutoff Matrix**:
  * **Tier 1A (`>= 04.26`, April 2026 – Present)**: Post-cutoff for ALL models (Gemini 3.1 Pro, 3.6 Flash, 3.7 Flash, 3.8 Flash). Must be prioritized for recent GA releases.
  * **Tier 1B (`02.25 – 03.26`, February 2025 – March 2026)**: Post-cutoff for Gemini 3.1 Pro; validation/refinement tier for Flash models.
  * **Tier 2 (`<= 01.25`)**: Timeless architectural mathematics and foundational trade-offs (routed to `references/archive.md`).

### 2. Standardization & Formatting Syntax
Every reference link MUST follow this exact format:
- `- [[MM.YY Blogpost]: Canonical Title](https://...)`
- For academic/deep-dive articles: `- [[MM.YY Article]: Canonical Title](https://...)`
- For codelabs: `- [Codelab: Title](https://...)`
- For GitHub repositories: `- [Repo Name: Description](https://github.com/...)`

### 3. Target Domain Routing
Match each article to its primary skill vault in `skills/<skill-name>/references/articles.md`:
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
- Cinematic generative media, Veo 3.1, Gemini Omni Flash $\to$ `gcp-generative-media`
- End-to-end architecture audits & pre-flight scans $\to$ `gcp-architecture-review`

### 4. Strict Mathematical Chronological Sorting
- Within every `references/articles.md` and `references/archive.md`, links MUST be strictly ordered descending by date:
  $$\text{Sort Key} = (2000 + \text{Year}) \times 100 + \text{Month}$$
- `[09.26]` (202609) $\to$ `[08.26]` (202608) $\to$ `[07.26]` (202607) $\to$ ... $\to$ `[01.24]` (202401).

---

## 🔬 5. Architectural Extraction Score (AES 1 to 5)

To guarantee that ingested articles provide actionable value and prevent superficial link hoarding, every article is evaluated against the **5-Tier AES Rubric**:

| Score | Level Name | Extraction Requirement | Target Destination |
| :---: | :--- | :--- | :--- |
| **Level 1** | **Cataloged Link** | Canonical title, date, URL formatted and chronologically sorted. | `references/articles.md` |
| **Level 2** | **Chronological Milestone** | Added to timeline with 1–2 sentence operational impact. | `SKILL.md` (`## ⏱️ Chronological Evolution`) |
| **Level 3** | **Architectural Rule** | Extracted non-obvious failure mode, anti-pattern, or quantitative decision threshold. | `SKILL.md` (`## 🚫 Anti-Patterns` or `## ⚖️ Decision Matrices`) |
| **Level 4** | **Production Blueprint** | Runnable, copy-pasteable Terraform, Python, Go, or Bash snippet directly citing the source. | `SKILL.md` (`## 🛠️ Production Blueprints`) |
| **Level 5** | **Golden Eval Verified** | Verified against an automated Antigravity agent eval prompt. | `evals/` test suite |

* **Ingestion Standard**: Routine blog posts must reach at least **AES Level 2**. Major GA announcements, breaking changes, or architectural shifts MUST achieve **AES Level 4**.

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
node scripts/audit_skills.js
node scripts/lint_internal_links.js
```
Ensure **0 sorting errors** and **100% valid relative links** before committing.
