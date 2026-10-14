---
name: gcp-architecture-review
description: >-
  Orchestrator review skill for conducting end-to-end Google Cloud Platform (GCP) architectural audits.
  Detects project infrastructure components, computes dynamic cutoff-relative post-cutoff delta opportunities,
  flags critical anti-patterns, and produces phased implementation plans citing vetted production blueprints.
---

# GCP Architectural Review Engine Runbook

## 🎯 Domain Scope & Activation Triggers
* **Explicit Triggers**: `/gcp-review`, "audit our GCP architecture", "review cloud architecture", "evaluate GCP design against 2026 standards", `postcutoff review`, `run_mesh_review.js`.
* **Scope**: Full-stack Google Cloud infrastructure, including Compute (`gcp-gke-platform`, `gcp-gke-inference`, `gcp-cloud-run`), AI/Agent orchestration (`gcp-adk-agents`, `gcp-frontier-emerging`, `gcp-gemini-tooling`), Event-Driven Messaging (`gcp-pubsub`), Data (`gcp-bigquery-analytics`, `gcp-bigquery-ai`, `gcp-bigquery-cost`, `gcp-databases`), FinOps/Budgets (`gcp-computefinops`, `gcp-gke-cost`), Networking (`gcp-networking`), and Security (`gcp-security-compliance`).
* **Operational Mode**: **100% Advisory**. The orchestrator formulates implementation plans and code diffs with canonical citations but NEVER unilaterally applies changes without explicit human approval (`RequestFeedback: true`).

---

## 🚫 Critical Anti-Patterns & Operational Pitfalls

> [!CAUTION]
> **Anti-Pattern 1: Autonomous Modification & Skipping the Human Approval Gate [11.24]**
> - **Trap**: Directly modifying Terraform (`*.tf`), Kubernetes (`*.yaml`), IAM policies, or database schemas during an architecture review without presenting an advisory implementation plan first.
> - **Blast Radius**: Unreviewed infrastructure mutations can trigger destructive Terraform resource replacement (`-/+`), break production Workload Identity Federation bindings, or introduce unbudgeted GPU/TPU provisioning.
> - **Mandatory Standard**: Operate in a 100% advisory posture. Every review must produce an implementation plan artifact with `RequestFeedback: true` and halt execution until the human explicitly approves (`Proceed`).
> *Cites: [Google Cloud Architecture Framework: System Design and Operational Excellence](./references/archive.md)*

> [!CAUTION]
> **Anti-Pattern 2: Hardcoded Default Model Cutoffs & Unverified Self-Reporting [05.25]**
> - **Trap**: Hardcoding a static default model (e.g., assuming `gemini-3.8-flash` or `gemini-4-argon` without verification) or allowing the LLM to guess its own training cutoff date.
> - **Blast Radius**: LLMs frequently hallucinate their own release date or cutoff horizon. Assuming a newer cutoff when running on an older model (such as `gemini-3.1-pro` with a `01.25` cutoff) suppresses critical 2025 architectural remediations; conversely, static tier headers break as newer models with later cutoffs are released.
> - **Mandatory Standard**: Never hardcode a default model in CLI or server entrypoints. Resolve the active model or `--cutoff YYYY-MM` via `ModelCutoffResolver` (`config/model_cutoffs.json`). When unverified, automatically fall back to the **Unverified Fail-Safe Horizon (`2025-01` / `01.25`)** and compute **Dynamic Tiers** via $\Delta_m = \text{Article}_{\text{YYYYMM}} - \text{Cutoff}_{\text{YYYYMM}}$.
> *Cites: [Building Cost-Effective and Secure Enterprise AI Architectures on Vertex AI](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 3: Universal Context Bloat (Loading All 22 Domain Skills Simultaneously) [08.24]**
> - **Trap**: Injecting all 22 domain `SKILL.md` runbooks and 730+ reference links into a single prompt context window for every review.
> - **Blast Radius**: Consumes $>120,000$ tokens per invocation, degrades attention over domain-specific constraints ("lost-in-the-middle" phenomenon), and inflates inference cost by $4\times\text{–}6\times$.
> - **Mandate**: Execute pre-flight stack detection (`node scripts/detect_stack.js`) and progressive disclosure via `ContextCacheManager`, loading only the detected domain skills and slicing `articles.md` dynamically by the active model's cutoff sort key.
> *Cites: [Google Cloud Architecture Framework: Cost Optimization Principles](./references/archive.md)*

> [!CAUTION]
> **Anti-Pattern 4: Reviewing Generative AI Workloads Without a Minimum Security Baseline [05.26, 04.24]**
> - **Trap**: Auditing Vertex AI, ADK, or Cloud Run agent deployments for functional correctness while ignoring prompt injection filtering, egress controls, and identity federation.
> - **Blast Radius**: Exposes production agent endpoints to indirect prompt injection, data exfiltration via unrestricted tool calls, and static Service Account key leakage.
> - **Mandatory Standard**: Enforce the 2026 Generative AI Minimum Security Baseline on every AI workload review: mandatory Google Model Armor templates (`INSPECT_AND_BLOCK`), Workload Identity Federation (zero JSON keys), and VPC Service Controls / Direct VPC Egress.
> *Cites: [The Minimum Security Baseline for Generative AI on Google Cloud](./references/articles.md), [Google Cloud Architecture Framework: Security, Privacy, and Compliance](./references/archive.md)*

> [!WARNING]
> **Anti-Pattern 5: Siloed Single-Domain Audits Ignoring Cross-Domain Contradictions [06.26, 10.25]**
> - **Trap**: Evaluating compute, security, and FinOps in isolation without cross-domain arbitration (e.g., a FinOps check recommending spot preemption or CPU throttling while the ADK agent domain requires `--no-cpu-throttling` for background MCP tool loops).
> - **Blast Radius**: Produces contradictory architectural recommendations where cost optimizations actively break reliability or security guarantees.
> - **Mandatory Standard**: Run multi-agent peer arbitration (`PeerArbitrationEngine`) and Hub-and-Spoke governance (`HubAndSpokeGovernanceEngine`) to resolve conflicts using strict priority precedence: `Security > Reliability > Performance > FinOps`.
> *Cites: [Deploying Multi-Agent Production Systems with Terraform and Cloud Run](./references/articles.md), [Designing Resilient Serverless Architectures on Google Cloud](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 6: Auditing GKE Clusters Against Legacy Pre-2026 Ingress and Compute Baselines [04.26]**
> - **Trap**: Reviewing GKE manifests without checking for `ingress-nginx` retirement (March 2026), missing Custom Compute Classes (`ComputeClass`), or unconfigured Agent Sandbox (`gvisor`) isolation for untrusted code execution.
> - **Blast Radius**: Leaves clusters running unpatched community ingress controllers and causes pod scheduling failures during regional GPU/TPU capacity shortages.
> - **Mandatory Standard**: Flag all `kubernetes.io/ingress.class: nginx` annotations for migration to GKE Gateway API (`gke-l7-global-external-managed`) and require `ComputeClass` fallback priorities on GKE workloads.
> *Cites: [What's New in GKE at Google Cloud Next '26 Architecture Guide](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Cutoff-Relative Dynamic Tier Triage Matrix
Instead of static model-coupled headers, every article with publication date `MM.YY` is dynamically classified against the active model's verified cutoff date ($\text{Cutoff}_{\text{MM.YY}}$) using month delta $\Delta_m = (\text{Year}_A - \text{Year}_C) \times 12 + (\text{Month}_A - \text{Month}_C)$:

| Dynamic Tier | Mathematical Rule ($\Delta_m$) | Example: Newest Model (`03.26` Cutoff) | Example: Older Pro (`01.25` Cutoff) | Example: Future Model (`09.26` Cutoff) | Review Engine Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dynamic Tier 1: Post-Cutoff Delta** | $\Delta_m > 0$ | `>= 04.26` (Apr 2026 – Present) | `>= 02.25` (Feb 2025 – Present) | `>= 10.26` (Oct 2026 – Present) | **Mandatory Primary Injection**: Full zero-shot knowledge gap. Inject 100% of matching articles and blueprints. |
| **Dynamic Tier 2: Boundary & Maturation Window** | $-12 \le \Delta_m \le 0$ | `03.25 – 03.26` | `01.24 – 01.25` | `09.25 – 09.26` | **Selective Guardrail Verification**: Validate GA promotions, flag deprecations, and override pre-cutoff habits. |
| **Dynamic Tier 3: Absorbed & Timeless Foundations** | $\Delta_m < -12$ | `<= 02.25` | `<= 12.23` | `<= 08.25` | **FinOps & Crossover Reference Only**: Omit from default context cache; load only for mathematical crossover formulas. |

### 2. Review Execution Topology Selection Matrix

| Workload Complexity | Detected IaC & Code Footprint | Recommended Review Mode | Active Engine Components | Latency / Token Overhead |
| :--- | :--- | :--- | :--- | :--- |
| **Single-Service Microservice** | $1\text{–}2$ Terraform/YAML files, single domain (e.g., Cloud Run only) | **CLI Deterministic AST Audit** (`node review_engine/cli.js`) | `HCLParser` / `K8sManifestParser` + `ModelCutoffResolver` + `CitationVerifier` | $< 150\text{ ms}$ local AST scan; $0$ redundant skill tokens |
| **Multi-Service Application** | $3\text{–}10$ files across Compute + Data + Messaging (e.g., Cloud Run + Pub/Sub + BigQuery) | **Supervisor Mesh Review** (`node review_engine/run_mesh_review.js`) | `SupervisorAgent` + `PeerArbitrationEngine` + `ContextCacheManager` | $\sim 65\text{–}75\%$ token savings via cutoff-sliced context cache |
| **Enterprise Regulated Platform** | $> 10$ files, multi-region GKE/Cloud Run, Vertex AI agents, IAM/VPC-SC | **Full Hub-and-Spoke Governed Audit** (`--model <verified-model> --format markdown`) | Full AST + `HubAndSpokeGovernanceEngine` + `BidirectionalGrounder` + Mandatory Approval Gate | Enforces `Security > Reliability > Performance > FinOps` across all spokes |

### 3. Cross-Domain Arbitration Priority Matrix

| Conflict Scenario | Spoke A Recommendation | Spoke B Recommendation | Winning Precedence | Arbitrated Production Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **Serverless Agent CPU Allocation** | `gcp-computefinops`: Enable CPU throttling (`cpu_idle = true`) to reduce idle billing | `gcp-cloud-run` / `gcp-adk-agents`: Set `cpu_idle = false` (`--no-cpu-throttling`) | **Reliability > FinOps** | Enforce `cpu_idle = false` for async A2A/MCP agents; cap cost via `max_instance_count` and Cloud Billing spend alerts. |
| **LLM Endpoint Security vs. Latency** | `gcp-gke-inference`: Direct client-to-pod routing for lowest TTFT | `gcp-security-compliance`: Route through Model Armor & Agent Gateway | **Security > Performance** | Enforce Model Armor inline inspection (`INSPECT_AND_BLOCK`) with regional endpoint colocation (`< 15\text{ ms}$ overhead). |
| **Event Ingestion Durability** | `gcp-bigquery-cost`: Batch load from GCS every 6 hours | `gcp-pubsub`: BigQuery Direct Subscription with DLQ and SMT | **Architecture Requirement Dependent** | Use Pub/Sub BigQuery Direct Subscription when SLA $< 5\text{ min}$; use GCS Export Subscription when SLA $> 15\text{ min}$ for zero ingestion cost. |

---

## 🛠️ Production Blueprints & Implementation Patterns

### Blueprint 1: Model-Agnostic CLI & Mesh Review Invocation [06.26, 11.24]
Never rely on a hardcoded default model. Always pass the human-verified `--model` identifier (differentiating between **Newest Generation** models like `gemini-4-argon` and **Older Generation** models like `gemini-3.8-flash` or `gemini-3.1-pro`) or an explicit `--cutoff YYYY-MM` horizon:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Pre-flight stack detection across Terraform, K8s, Python, Go, and Java manifests
node scripts/detect_stack.js --dir ./

# 2. Execute governed architecture review for a confirmed Newest-Generation model (Cutoff: 03.26)
node review_engine/cli.js \
  --dir ./infrastructure \
  --model gemini-4-argon \
  --format markdown \
  --out ./artifacts/argon_architecture_review.md

# 3. Execute review for a future or custom model using an explicit cutoff horizon (Zero code changes required)
node review_engine/cli.js \
  --dir ./infrastructure \
  --cutoff 2026-09 \
  --format json \
  --out ./artifacts/future_cutoff_review.json
```
*Cites: [Deploying Multi-Agent Production Systems with Terraform and Cloud Run](./references/articles.md), [Google Cloud Architecture Framework: System Design and Operational Excellence](./references/archive.md)*

---

### Blueprint 2: Programmatic Cutoff-Relative Tier Resolution (`ModelCutoffResolver`) [05.25]
Use `ModelCutoffResolver` to dynamically classify vault articles into **Dynamic Tier 1** ($\Delta_m > 0$), **Dynamic Tier 2** ($-12 \le \Delta_m \le 0$), and **Dynamic Tier 3** ($\Delta_m < -12$) for any model generation:

```javascript
const { ModelCutoffResolver } = require('../../review_engine/mesh/model_resolver');

const resolver = new ModelCutoffResolver();

// Resolve human-verified model or explicit cutoff (falls back to 2025-01 fail-safe if omitted)
const profile = resolver.resolve({
  modelId: process.env.VERIFIED_GEMINI_MODEL, // e.g., 'gemini-4-argon' or 'gemini-3.1-pro'
  cutoff: process.env.EXPLICIT_CUTOFF         // e.g., '2026-03'
});

console.log(`Active Profile: ${profile.display_name} (${profile.generation_tier})`);
console.log(`Cutoff Sort Key: ${profile.cutoff_sort_key} (${profile.cutoff_mm_yy})`);

// Classify an article published in 05.26 against the resolved profile
const tierInfo = resolver.classifyArticleTier('05.26', profile.cutoff_sort_key);
console.log(`Article [05.26] -> ${tierInfo.tier} (${tierInfo.label}, delta_months=${tierInfo.delta_months})`);
```
*Cites: [Building Cost-Effective and Secure Enterprise AI Architectures on Vertex AI](./references/articles.md)*

---

### Blueprint 3: Multi-Agent Supervisor Review with Hub-and-Spoke Governance [05.26, 04.24]
Execute a complete multi-agent review across Terraform and Kubernetes files with automatic peer arbitration, hub-and-spoke security/reliability validation, and context caching:

```javascript
const { SupervisorAgent } = require('../../review_engine/mesh/supervisor');

async function runEnterpriseAudit() {
  const supervisor = new SupervisorAgent({
    modelId: 'gemini-4-argon',
    cutoff: '2026-03'
  });

  const report = supervisor.executeReview({
    hclFiles: ['infra/main.tf', 'infra/iam.tf'],
    k8sFiles: ['k8s/inference-deployment.yaml']
  });

  console.log(`Status: ${report.status}`);
  console.log(`Generation Tier: ${report.metadata.generation_tier}`);
  console.log(`Total Findings: ${report.summary.total_findings}`);
  console.log(`Cache Efficiency Gain: ${report.cache_telemetry.efficiency_gain}`);
  console.log(`Hub Governance ViolationsBlocked: ${report.governance_validation.violations_detected}`);
}

runEnterpriseAudit();
```
*Cites: [The Minimum Security Baseline for Generative AI on Google Cloud](./references/articles.md), [Google Cloud Architecture Framework: Security, Privacy, and Compliance](./references/archive.md)*

---

### Blueprint 4: Resilient Multi-Region Serverless & GKE Reference Baseline (Terraform) [04.26, 10.25, 08.24]
When remediating compute findings flagged by the review engine, enforce non-throttled Cloud Run CPU allocation, Direct VPC Egress, and GKE Gateway API with Custom Compute Classes:

```hcl
resource "google_cloud_run_v2_service" "governed_agent_service" {
  name                = "governed-adk-orchestrator"
  location            = "us-central1"
  deletion_protection = true

  template {
    # Mandatory for ADK/MCP agents with asynchronous background loops
    annotations = {
      "run.googleapis.com/cpu-throttling" = "false"
    }

    scaling {
      min_instance_count = 1
      max_instance_count = 25
    }

    vpc_access {
      network_interfaces {
        network    = "projects/my-enterprise-prod/global/networks/prod-vpc"
        subnetwork = "projects/my-enterprise-prod/regions/us-central1/subnetworks/agent-subnet"
      }
      egress = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = "us-central1-docker.pkg.dev/my-enterprise-prod/agents/orchestrator:v2.4.0"
      resources {
        cpu_idle = false
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
      }
    }
  }
}
```
*Cites: [What's New in GKE at Google Cloud Next '26 Architecture Guide](./references/articles.md), [Designing Resilient Serverless Architectures on Google Cloud](./references/articles.md), [Google Cloud Architecture Framework: Cost Optimization Principles](./references/archive.md)*

---

## ⏱️ Chronological Evolution (2024–2026)
- **[10.26]**: Upgraded Review Engine to v2.0 with `ModelCutoffResolver`, Dynamic Cutoff-Relative Tiers ($\Delta_m$), Newest vs. Older model generation classification, and zero hardcoded model defaults.
- **[06.26]**: Standardized multi-agent production deployment baselines using Terraform and Cloud Run ([06.26 Blogpost](https://cloud.google.com/blog/topics/developers-practitioners/create-expert-content-deploying-a-multi-agent-system-with-terraform-and-cloud-run/)).
- **[05.26]**: Codified the 2026 Minimum Security Baseline for Generative AI on Google Cloud, including Model Armor, WIF, and VPC-SC ([05.26 Blogpost](https://medium.com/google-cloud/how-to-secure-vertex-ai-in-2026-the-minimum-security-baseline-for-generative-ai-on-google-ai-cf7982b9ed7a)).
- **[04.26]**: Integrated GKE Next '26 architectural baselines including Gateway API, ComputeClasses, and Agent Sandbox ([04.26 Blogpost](https://cloud.google.com/blog/products/containers-kubernetes/whats-new-in-gke-at-next26/)).
- **[10.25]**: Added multi-region serverless resilience patterns and Direct VPC Egress baselines ([10.25 Blogpost](https://cloud.google.com/blog/products/serverless/building-resilient-serverless-architectures)).
- **[05.25]**: Established Vertex AI enterprise cost-efficiency and security architecture review criteria ([05.25 Blogpost](https://cloud.google.com/blog/products/ai-machine-learning/build-a-robust-and-cost-effective-gen-ai-strategy/)).
- **[11.24]**: Codified foundational Google Cloud Architecture Framework system design, cost optimization, and security pillars ([11.24 Article](https://cloud.google.com/architecture/framework), [08.24 Article](https://cloud.google.com/architecture/framework/cost-optimization), [04.24 Article](https://cloud.google.com/architecture/framework/security)).

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Architecture Masterclasses Vault (<= 2024)**:
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
