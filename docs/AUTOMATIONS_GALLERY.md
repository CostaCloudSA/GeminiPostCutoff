# 🗓️ Google Antigravity Scheduled Prompt Automations Gallery

Instead of hardcoding brittle batch scrapers, cron workflows, or static regex ingestion scripts into CI/CD, **`GeminiPostCutoff`** offloads periodic maintenance, link health checks, Developer Knowledge API absorption evaluation, and model lifecycle rotation to **Google Antigravity Scheduled Prompt Automations** (`/automation` / `/schedule`).

Because scheduled automations live inside your local Antigravity configuration (`~/.gemini/config/sidecars/<sidecar-id>/sidecar.json`), this gallery serves as the **portable blueprint catalog** so you can re-create or restore every automation on any future machine in seconds.

---

## ⚡ Quick-Start Restoration on a New Machine

You can set up any automation below on a new machine using either method:

1. **Interactive Antigravity Command**: Type `/automation` or `/schedule` in Antigravity chat and paste the **Recommended Frequency** and **Ideal Prompt to Automate** from the gallery below.
2. **One-Command Restoration via Installer**: Run `pwsh scripts/install.ps1 -SyncRules` (Windows) or `bash scripts/install.sh --sync-rules` (Linux/macOS), then enable the automations in the **[Automations Dashboard](sidecar://dashboard)**.

---

## 🗂️ Overview of the 5 Core Maintenance Automations

| # | Automation Title & ID | Recommended Frequency | Cron Schedule (`America/Chicago`) | Legacy Hardcoded Process Replaced |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Incremental Slow Crawler: 404s, Content Quality & Deletion Candidates**<br>(`postcutoff-daily-slow-crawler`) | **Daily** at 8:30 AM (6 links/run, ~180 links/mo) | `CRON_TZ=America/Chicago 30 8 * * *` | `.github/workflows/monthly_link_check.yml` & `scripts/verify_external_links.js` |
| **2** | **Monthly Deletion, Compaction & Capture-Enrichment Gate**<br>(`postcutoff-monthly-compaction-gate`) | **Monthly** — 1st Monday at 9:30 AM | `CRON_TZ=America/Chicago 30 9 1-7 * 1` | Static "Unutilized Vault Articles" table in `verifier.js` |
| **3** | **Monthly Model Lifecycle & Oldest-Active Cutoff Rotation**<br>(`postcutoff-monthly-model-lifecycle`) | **Monthly** — 1st of Month at 9:00 AM | `CRON_TZ=America/Chicago 0 9 1 * *` | Hardcoded model strings (`flash-3.8` / static cutoff tables) |
| **4** | **Bi-Weekly Post-Cutoff GCP Release & FinOps Discovery**<br>(`postcutoff-biweekly-gcp-discovery`) | **Weekly / Bi-Weekly** — Mondays at 10:00 AM | `CRON_TZ=America/Chicago 0 10 * * 1` | Fragile regex URL scraper (`scripts/ingest.js`) |
| **5** | **Weekly `dev` vs. `prod` Drift & Provenance Sync Check**<br>(`postcutoff-weekly-dev-prod-sync`) | **Weekly** — Fridays at 4:00 PM | `CRON_TZ=America/Chicago 0 16 * * 5` | Manual drift checks between repo, `~/.gemini/config/`, and `origin/main` |

---

## 🔍 Detailed Automation Specifications & Prompts

### 1. Incremental Slow Crawler: 404s, Content Quality & Deletion Candidates
* **Automation ID**: `postcutoff-daily-slow-crawler`
* **Purpose**: Slowly crawls a rotating slice of **6 links per day** across all 22 skills (persisting cursor state in [`reports/crawler_state.json`](../reports/crawler_state.json)) to avoid WAF/bot rate limits. Evaluates each link across three dimensions:
  1. **Hard & Soft-404 Health**: Catches HTTP `404`/`410` errors, **Soft-404 HTML templates** (`HTTP 200 OK` pages rendering `"Page Not Found"` or Medium's `"Out of nothing, something"`), and **silent root redirects** (deep article URLs redirecting to `/blog` or `/`).
  2. **Content Quality vs. Original `SKILL.md` Ingestion Capture**: Compares live article headings and content against the exact `Anti-Pattern`, `Decision Matrix`, or `Blueprint` in `SKILL.md` that cites it.
  3. **Absorption into Developer Knowledge API & Oldest Active Model**: Dynamically resolves the **oldest available active model** via [`ModelCutoffResolver.resolveOldestActiveModel()`](../review_engine/mesh/model_resolver.js) (currently `gemini-3.1-pro`, `2025-01`, auto-advancing as older models deprecate) and checks whether the concept is already absorbed by `developerknowledge.googleapis.com` and the oldest active model. Strictly protects **Practitioner FinOps & SRE Moat** items (such as [`gcp-bigquery-cost`](../skills/gcp-bigquery-cost/SKILL.md) 690 TB/mo slot math and 90-day long-term storage DML resets).
* **Recommended Frequency**: **Daily** at 8:30 AM (`CRON_TZ=America/Chicago 30 8 * * *`).
* **Ideal Prompt to Automate**:
  ```text
  Run the daily incremental slow-crawler audit on the GeminiPostCutoff repository (c:/Users/campabadal/Documents/antigravity/postcutoff):
  1. Execute `node scripts/slow_crawler.js --batch-size 6 --model oldest-active` to inspect the next 6 least-recently-checked links across our 22 domain skills using the oldest active model in `config/model_cutoffs.json`.
  2. Read the generated batch dossier at `reports/latest_crawler_batch.md` and the updated ledger at `reports/deletion_candidates.md`.
  3. For any link in the batch flagged with `WAF_CHALLENGE_AGENT_VERIFY`, `CANDIDATE_DEAD_OR_SOFT_404`, `CANDIDATE_ABSORBED_BY_DK_AND_MODEL`, or `CANDIDATE_DK_API_COMPACTION_CHECK`:
     - Verify live URL reachability and content quality against the citing section in `skills/<domain>/SKILL.md`.
     - If the item is an official capability/syntax link (`OFFICIAL_CAPABILITY_OR_SYNTAX`) and NOT a protected practitioner FinOps/SRE anecdote (`PROTECTED_PRACTITIONER_MOAT`), check via `search_web` or the Developer Knowledge API (`developerknowledge.googleapis.com`) using the `Developer Knowledge API Probe Query` whether official Google docs and the oldest active model now fully cover the concept.
  4. Follow our 100% Advisory Posture (`rules/AGENTS.md`): do NOT autonomously delete or modify `SKILL.md` or `articles.md` during the daily crawl. Summarize the 6-link batch findings and any newly confirmed deletion or repair candidates in the chat response.
  ```

---

### 2. Monthly Deletion, Compaction & Capture-Enrichment Gate
* **Automation ID**: `postcutoff-monthly-compaction-gate`
* **Purpose**: Reviews the cumulative [`reports/deletion_candidates.md`](../reports/deletion_candidates.md) ledger compiled by the daily slow crawler over the past month and formulates a single human-approvable **Implementation Plan Artifact** (`RequestFeedback: true`) to prune duplicate/absorbed links, repair Soft-404s, and enrich under-captured blueprints.
* **Recommended Frequency**: **Monthly** — 1st Monday of every month at 9:30 AM (`CRON_TZ=America/Chicago 30 9 1-7 * 1`).
* **Ideal Prompt to Automate**:
  ```text
  Run the Monthly Deletion, Compaction & Capture-Enrichment Gate for GeminiPostCutoff (c:/Users/campabadal/Documents/antigravity/postcutoff):
  1. Read `reports/deletion_candidates.md` and `reports/crawler_state.json`.
  2. Run `node scripts/audit_skill_rules.js` to check each skill's current Anti-Pattern, Decision Matrix, and Blueprint buffer above the minimum floors defined in `skills/gcp-skills-index/SKILL_STANDARD.md`.
  3. Confirm that zero `PROTECTED_PRACTITIONER_MOAT` items (operational anecdotes, SRE postmortems, or FinOps math such as `gcp-bigquery-cost` 690 TB/mo slot crossover and 90-day long-term storage DML resets) are proposed for deletion unless their URL is an unrecoverable 404.
  4. Formulate an Implementation Plan Artifact (`RequestFeedback: true`) containing exact code diffs grouped into:
     - Batch A: Broken or Soft-404 URL Replacements / Removals (`CANDIDATE_DEAD_OR_SOFT_404`)
     - Batch B: Safe Deletions & MCP Pointer Compactions for concepts absorbed by both the Developer Knowledge API and our oldest active model (`CANDIDATE_ABSORBED_BY_DK_AND_MODEL`)
     - Batch C: Runbook Capture Enrichments where live articles contained high-value production constraints missing from `SKILL.md`
  5. Halt and await human approval (`Proceed`) before editing any skill or vault files.
  ```

---

### 3. Monthly Model Lifecycle & Oldest-Active Cutoff Rotation
* **Automation ID**: `postcutoff-monthly-model-lifecycle`
* **Purpose**: Keeps [`config/model_cutoffs.json`](../config/model_cutoffs.json) synchronized with Google's official Vertex AI / Gemini model deprecation schedule and new model launches. Because `slow_crawler.js` dynamically queries `ModelCutoffResolver.resolveOldestActiveModel()`, marking a retired model as `"deprecated": true` automatically advances the slow crawler's absorption horizon to the next oldest active model.
* **Recommended Frequency**: **Monthly** — 1st day of every month at 9:00 AM (`CRON_TZ=America/Chicago 0 9 1 * *`).
* **Ideal Prompt to Automate**:
  ```text
  Run the Monthly Gemini Model Lifecycle & Cutoff Rotation Audit for GeminiPostCutoff (c:/Users/campabadal/Documents/antigravity/postcutoff):
  1. Read `config/model_cutoffs.json` and check which model is currently resolved as the oldest active model via `ModelCutoffResolver.resolveOldestActiveModel()` (currently `gemini-3.1-pro` with cutoff `2025-01`).
  2. Use `search_web` to check official Google Cloud Vertex AI and Google AI Gemini model lifecycle, deprecation, and release notes (`cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions`).
  3. Determine if:
     - Any active model in `config/model_cutoffs.json` (especially the oldest active model, `gemini-3.1-pro`) has been officially deprecated or retired, OR
     - Any new Gemini frontier or Flash model has launched with a newer training cutoff date.
  4. Following our 100% Advisory Posture (`rules/AGENTS.md`), generate an Implementation Plan Artifact (`RequestFeedback: true`) proposing the exact updates to `config/model_cutoffs.json` and `rules/AGENTS.md` so our dynamic cutoff horizon stays 100% current.
  ```

---

### 4. Bi-Weekly Post-Cutoff GCP Release & FinOps Discovery
* **Automation ID**: `postcutoff-biweekly-gcp-discovery`
* **Purpose**: Replaces the legacy `scripts/ingest.js` scraper. Proactively scans for high-signal post-cutoff Google Cloud architectural shifts, service retirements, and practitioner FinOps/SRE deep dives that are **not** merely commodity documentation already served by the Developer Knowledge API.
* **Recommended Frequency**: **Weekly / Bi-Weekly** — Mondays at 10:00 AM (`CRON_TZ=America/Chicago 0 10 * * 1`).
* **Ideal Prompt to Automate**:
  ```text
  Run a Post-Cutoff GCP Architectural & Practitioner FinOps Discovery scan for GeminiPostCutoff (c:/Users/campabadal/Documents/antigravity/postcutoff):
  1. Use `search_web` to identify major Google Cloud architectural releases, breaking deprecations, and practitioner engineering/FinOps articles from the past 14 days across our 5 Architectural Pillars (ADK/Agents, GKE/Cloud Run/PubSub, BigQuery/Databases, Security/Networking/FinOps, Robotics/XR/GenMedia).
  2. Filter out routine minor releases or standard API reference updates that are already served by the Developer Knowledge API (`developerknowledge.googleapis.com`).
  3. Select only high-leverage items (AES Level 3–5): non-obvious failure traps, quantitative FinOps crossover math, SRE outage lessons, or major GA architectural shifts.
  4. Present an Implementation Plan Artifact (`RequestFeedback: true`) showing the proposed `[MM.YY]` entries in `references/articles.md` (strictly preserving descending mathematical sort order) and the corresponding `SKILL.md` Anti-Patterns or Production Blueprints for human approval.
  ```

---

### 5. Weekly `dev` vs. `prod` Drift & Provenance Sync Check
* **Automation ID**: `postcutoff-weekly-dev-prod-sync`
* **Purpose**: Ensures that updates made in the `dev` workspace (`c:\Users\campabadal\Documents\antigravity\postcutoff`) never silently drift from your `prod` global Antigravity environment (`~/.gemini/config/AGENTS.md`, `~/.gemini/config/GEMINI.md`, `~/.gemini/config/skills/`) or remote `origin/main`.
* **Recommended Frequency**: **Weekly** — Every Friday at 4:00 PM (`CRON_TZ=America/Chicago 0 16 * * 5`).
* **Ideal Prompt to Automate**:
  ```text
  Run the Weekly Dev-vs-Prod Drift and Provenance Audit for GeminiPostCutoff (c:/Users/campabadal/Documents/antigravity/postcutoff):
  1. Execute `npm test` and `npm run audit:provenance` to verify 0 chronological sorting errors, 0 broken internal relative links, and 100% citation grounding across all 22 skills.
  2. Compare the workspace `rules/AGENTS.md` and `skills/gcp-skills-index/INGESTION_PROTOCOL.md` against the global production files `~/.gemini/config/AGENTS.md` and `~/.gemini/config/GEMINI.md`.
  3. Check `git status` and compare local `HEAD` against `origin/main` to detect any unpromoted `dev` commits.
  4. If any test failure or `dev`-vs-`prod` drift is detected, generate an Implementation Plan Artifact (`RequestFeedback: true`) with the exact promotion commands (`pwsh scripts/install.ps1 -SyncRules` and `git push`) for approval.
  ```
