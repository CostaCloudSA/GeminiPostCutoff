# Google Cloud Platform & AI Agent Directives

## 🔒 1. Human-Verified Model Confirmation & Zero Hardcoded Default Protocol
> [!IMPORTANT]
> **Anti-Hallucination & Zero-Default Directive**: Incorrect self-reporting is a common failure mode in LLMs, and new models with newer training cutoffs are released continuously. The assistant and review engine **MUST NEVER** assume, guess, self-report, or hardcode a default model identity or training cutoff.

* **Explicit Verification Gate**: Prior to calibrating post-cutoff deltas during an architecture consultation or review, the assistant must confirm the active model (or explicit `--cutoff YYYY-MM`) with the user, differentiating between **Newest** and **Older** model generations:
  * **Option A (Newest Generation — Frontier Reasoning)**: **Gemini 4 Argon** (`gemini-4-argon`, Official Cutoff: **March 2026 / `03.26`**) or future models via explicit `--cutoff YYYY-MM` $\to$ Compute **Dynamic Tier 1 ($\Delta_m > 0$)** and **Dynamic Tier 2 ($-12 \le \Delta_m \le 0$)** relative to the model's cutoff.
  * **Option B (Older Generation — High-Efficiency Flash)**: **Gemini 3.6 Flash / 3.7 Flash / 3.8 Flash** (`gemini-3.8-flash`, Official Cutoff: **March 2026 / `03.26`**) $\to$ Prioritize **Dynamic Tier 1 (`>= 04.26`)** and cross-check **Dynamic Tier 2 (`03.25 – 03.26`)**.
  * **Option C (Older Generation — Legacy Pro)**: **Gemini 3.1 Pro** (`gemini-3.1-pro`, Official Cutoff: **January 2025 / `01.25`**) $\to$ Prioritize **Dynamic Tier 1 (`>= 02.25`, February 2025 – Present)** to bridge its 20+ month knowledge gap.
* **Unverified Fail-Safe Fallback (`2025-01`)**: If neither a verified model ID nor an explicit `--cutoff YYYY-MM` is confirmed by the human, the assistant and `ModelCutoffResolver` **MUST default to the conservative Unverified Fail-Safe Horizon (`2025-01` / `01.25`, injecting all items `>= 02.25`)** to eliminate the risk of recommending deprecated pre-2025 syntax.

---

## 🛡️ 2. 100% Advisory Posture & Mandatory Human Approval Gate
> [!CAUTION]
> **Autonomous Modification Prohibition**: This knowledge system operates in a **100% advisory capacity**. The assistant is strictly prohibited from making autonomous, unreviewed modifications to infrastructure code, deployment manifests, environment files, database schemas, or IAM policies.

Every architectural recommendation or infrastructure change must strictly follow this 4-step gate:
1. **Advisory Formulation**: Analyze the architecture against relevant domain runbooks (`skills/`), identifying post-cutoff improvements, anti-patterns, and decision matrices.
2. **Implementation Plan Artifact**: Generate a structured markdown implementation plan artifact detailing:
   * **Workload Scope**: Specific GCP services, files, and resources impacted.
   * **Recommendations & Evidence**: Concrete architectural steps supported by canonical external URLs (`https://...`).
   * **Anti-Patterns & Blast Radius**: Operational risks, failure modes, and cost implications avoided.
   * **Code/Diff Previews**: Exact Terraform, YAML, Python, Go, Java, or shell snippets proposed.
3. **Explicit Human Approval Gate**: Set `RequestFeedback: true` on the implementation plan artifact, halt further tool calls, and await explicit human confirmation (`Proceed` or typed approval).
4. **Governed Execution**: Only upon receiving unambiguous human approval may the assistant make file edits or run commands.

---

## 🧭 3. Cutoff-Relative Dynamic Tier Triage ($\Delta_m$)
Instead of static model-coupled headers, reference vaults (`references/articles.md`) are organized by immutable chronological release years (`2026`, `2025`, etc.), and every article (`MM.YY`) is dynamically classified at runtime relative to the active model's cutoff ($\text{Cutoff}_{\text{MM.YY}}$) via month delta:
$$\Delta_m = (\text{Year}_{\text{Article}} - \text{Year}_{\text{Cutoff}}) \times 12 + (\text{Month}_{\text{Article}} - \text{Month}_{\text{Cutoff}})$$

* **Dynamic Tier 1 — Post-Cutoff Delta ($\Delta_m > 0$)**:
  * **Meaning**: Released *after* the active model's training cutoff (`Article SortKey > Cutoff SortKey`).
  * **Action**: **Mandatory Primary Injection**. The model has zero pre-training exposure to these releases (e.g., `>= 04.26` for `03.26` cutoff models like Gemini 4 Argon and 3.8 Flash; `>= 02.25` for `01.25` cutoff models like Gemini 3.1 Pro).
* **Dynamic Tier 2 — Boundary & Maturation Window ($-12 \le \Delta_m \le 0$)**:
  * **Meaning**: Released within the 12 months *prior* to the active model's cutoff.
  * **Action**: **Selective Guardrail Verification**. Cross-check when designing specialized workflows (ADK 1.0, Model Armor, GKE Inference Gateway, Pub/Sub SMTs & GCS Export Subscriptions) where pre-cutoff training data mixed Preview and GA syntax.
* **Dynamic Tier 3 — Absorbed & Timeless Foundations ($\Delta_m < -12$)**:
  * **Meaning**: Released more than 12 months before the model's cutoff (`references/archive.md`).
  * **Action**: **FinOps & Crossover Reference Only**. Consult for timeless mathematical crossover formulas (e.g., BigQuery slot commitments vs on-demand at 690 TB/mo, GKE pod right-sizing ratios, VPC peering limits).

---

## 🎯 4. Argon Governance & Production Engineering Rules
1. **Uncapped Runbook Depth**: Runbooks (`SKILL.md`) are never artificially capped in line count or restricted in the number of Anti-Patterns, Decision Matrices, or Production Blueprints they codify. Every high-value architectural constraint in `references/articles.md` should be operationalized.
2. **Pre-Flight Stack Detection & Progressive Disclosure**: Before executing a multi-service architecture review, run `node scripts/detect_stack.js` (or `ContextCacheManager`) to identify in-scope GCP components and load only the relevant domain skills—never loading all 22 skills simultaneously.
3. **Cross-Domain Dependency & Arbitration Rule**: Multi-domain architectures must resolve cross-spoke trade-offs using strict priority precedence (`Security > Reliability > Performance > FinOps`):
   * `gcp-adk-agents` on Cloud Run $\to$ co-apply `gcp-cloud-run` (`cpu_idle = false` / `--no-cpu-throttling`) and `gcp-security-compliance` (Model Armor + WIF).
   * `gcp-pubsub` pushing to Cloud Run AI agents $\to$ enforce `ack_deadline_seconds = 600`, `retry_policy`, and `dead_letter_policy` with explicit Pub/Sub Service Agent IAM bindings.
   * `gcp-gke-inference` $\to$ co-apply `gcp-gke-platform` (Gateway API / `ComputeClass`) and `gcp-gke-cost` (GKE Cost Allocation).
4. **Zero-Hallucination Model Identifier & SDK Pinning**: Never emit deprecated pre-2026 model strings (`gemini-1.5-*`, `gemini-2.0-*`, `gemini-2.5-flash`, `gemini-2.5-pro`) in new production blueprints. Always parameterize model IDs via environment variables (`os.environ.get("VERTEX_MODEL_ID", "gemini-4-argon")`) or use current verified generation IDs (`gemini-4-argon`, `gemini-3.8-flash`, `gemma-4-12b-it`).
5. **Mandatory Bidirectional Citation Grounding**: Every architectural claim, anti-pattern, and blueprint must include a verified citation to `references/articles.md` or `references/archive.md` and pass `node review_engine/grounding/verifier.js` with 100% grounding and 0 date discrepancies.
