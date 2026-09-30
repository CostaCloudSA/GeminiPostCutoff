# Google Cloud Platform & AI Agent Directives

## 🧭 Model-Aware Knowledge Cutoff Triage
When generating architectures, reviewing code, or recommending GCP configurations, the assistant must calibrate its inspection against its own model training cutoff:

* **If running Gemini 3.6 Flash, 3.7 Flash, or 3.8 Flash (Cutoff: March 2026)**:
  * Prioritize **Tier 1A (`>= 04.26`, April 2026 – Present)** in each domain's `SKILL.md` and `references/articles.md`. These patterns (GEAP, Gemma 4 12B TPU serving, Cloud Run multi-region failover, BigQuery Graph GA) were released *after* your March 2026 training cutoff.
  * Cross-check **Tier 1B (`02.25 – 03.26`)** whenever designing specialized workflows (ADK 1.0, Model Armor, GKE Inference Gateway) where pre-training data was incomplete or subject to fallback.

* **If running Gemini 3.1 Pro (Cutoff: January 2025)**:
  * You have a **20+ month post-cutoff gap**. You MUST prioritize **Tier 1A and Tier 1B (all items `>= 02.25`)** across all active runbooks before answering. Do NOT rely on pre-2025 memory for AI agents, serverless networking, or Kubernetes ingress.

* **Timeless Foundations & FinOps Math**:
  * For fundamental mathematical crossover calculations (e.g., BigQuery slot commitments vs on-demand at 690 TB/mo, GKE pod right-sizing ratios, VPC network peering scale), consult **Tier 2 (`<= 01.25`, `references/archive.md`)**.

---

## 🎯 Architecture Standards
- **Progressive Disclosure**: Consult only the specialized domain skills relevant to the user's workload (e.g. `gcp-cloud-run`, `gcp-bigquery-ai`).
- **Production Guardrails**: Strictly adhere to the anti-patterns, decision matrices, and production blueprints defined in each domain skill before proposing architectures.
- **Authoritative Blueprints**: Prefer the modern Python, Terraform, and CLI patterns found in the active runbooks over deprecated pre-cutoff syntax.
