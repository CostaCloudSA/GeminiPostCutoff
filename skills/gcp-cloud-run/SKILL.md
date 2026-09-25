---
name: gcp-cloud-run
description: >-
  Cloud Run configuration, CPU throttling prevention, serverless MCP/A2A hosting,
  containerless deploys, Identity-Aware Proxy, and Temporal worker pools.
  Activate when deploying microservices, configuring serverless agents, or reviewing serverless architectures.
---

# Cloud Run Serverless, Microservices & Agent Backend Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Deploying serverless containers, Python/Go/Node.js microservices, or fullstack web applications to **Google Cloud Run**.
- Hosting remote **Model Context Protocol (MCP)** servers, **Agent-to-Agent (A2A)** gateways, or multi-agent backends.
- Architecting high-availability systems with **Cloud Run Multi-Region Services** and automated failover.
- Serving open-weights LLMs (Gemma 3) using serverless **NVIDIA L4 GPUs**.
- Deploying long-lived background workers (**Temporal Worker Pools**, Celery, Pub/Sub listeners).
- Hardening serverless security using **Identity-Aware Proxy (IAP)**, **Model Armor**, Secret Manager, and VPC Service Controls.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Default CPU Throttling Kills Background Threads & SSE Streams [03.26]**
> By default, Cloud Run dynamically throttles CPU to near-zero as soon as an HTTP response finishes transmitting (*"CPU only allocated during requests"*). If your service spawns background worker threads, persists database connection health checks, or streams LLM tokens over SSE, the throttled container instance will hang, turning an 18-second task into an 8-minute timeout!
> - **Mandatory Fix for Streaming / Agents / Workers**: Always set `--no-cpu-throttling` (always-on CPU allocation).
> *Cites: [How Cloud Run's Default CPU Throttling Turned an 18-Second Response Into an 8-Minute Timeout](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Unhandled `SIGTERM` During Auto-Scaling Inflight Request Dropping [02.26]**
> When Cloud Run scales down or rolls out a new revision, it sends a `SIGTERM` signal to the container, granting a **10-second grace period** before forcefully killing the process with `SIGKILL`. If your application does not catch `SIGTERM` to gracefully drain inflight requests, active database transactions are abruptly severed.
> - **Solution**: Register a `SIGTERM` signal listener to finish current HTTP responses and flush logs before exiting.
> *Cites: [5 Years of Cloud Run: What I'd Tell Myself on Day 1](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Exposing Unauthenticated MCP / Agent Endpoints to the Public Internet [08.26, 09.25]**
> Exposing remote MCP servers or Agent execution endpoints with `--allow-unauthenticated` allows anyone on the internet to invoke your agent tools, scan internal databases, or consume API quotas.
> - **Solution**: Enforce `--no-allow-unauthenticated`, authenticate callers using Google OIDC ID tokens (`Authorization: Bearer $(gcloud auth print-identity-token)`), and place public-facing UIs behind **Identity-Aware Proxy (IAP)**.
> *Cites: [Deploying Secure MCP Servers on Cloud Run](./references/articles.md) and [How to secure your remote MCP server on Google Cloud](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: High Concurrency Bottlenecks on GPU / AI Workloads [03.25]**
> Cloud Run defaults to concurrency = 80. Sending 80 concurrent LLM generation requests into a single container hosting a local model or heavy PyTorch pipeline will cause out-of-memory (OOM) crashes and GPU VRAM exhaustion.
> - **Rule**: Set `--concurrency 1` (or small integer) for GPU and local AI inference containers to force Cloud Run to scale out instance replicas horizontally rather than queuing inside a single instance.
> *Cites: [How to deploy serverless AI with Gemma 3 on Cloud Run](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 5: Single-Region Outage Exposure [07.26]**
> Hosting production workloads in a single GCP region leaves services vulnerable to regional network disruptions or datacenter maintenance.
> - **Solution**: Deploy across multiple regions using **Cloud Run Multi-Region Services** with automated regional failover and Cloud DNS health routing.
> *Cites: [Cloud Run multi-region services enhanced for high availability](./references/articles.md) and [GCP Cloud Run's New Automated Failover Is a Direct Answer to a Real Outage](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 6: In-Memory `/tmp` Filesystem Exhausting Container RAM [02.26]**
> In Cloud Run, the local writable filesystem (`/tmp`) is backed entirely by instance RAM. Downloading large model weights, audio buffers, or dataset exports directly into `/tmp` silently exhausts container memory, triggering instant `OOMKilled` (Exit Code 137).
> - **Solution**: Mount a Cloud Storage bucket directly using **Cloud Run Volume Mounts (Cloud Storage FUSE)** or stream large temporary payloads directly into GCS objects rather than writing to local `/tmp`.
> *Cites: [5 More Things I'd Tell Myself on Day 1 of using Cloud Run](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. CPU Allocation Model: Request-Based vs Always-Allocated
| Dimension | Request-Based CPU (Default) | Always-Allocated CPU (`--no-cpu-throttling`) |
| :--- | :--- | :--- |
| **CPU Behavior** | Throttled to ~0% when no active HTTP request | 100% full CPU available continuously |
| **Billing Model** | Billed strictly during request processing | Billed for container instance uptime |
| **Scaling to Zero** | Fully supported (zero cost when idle) | Supported (scales to 0 when `min-instances = 0`) |
| **Best For** | Synchronous REST APIs, Webhooks, CRUD apps | AI Agents, SSE streams, WebSockets, Temporal workers |

---

### 2. Ingress & Security Topology Matrix [03.26, 09.25]
| Topology | Ingress Setting | Auth Mechanism | Best For |
| :--- | :--- | :--- | :--- |
| **Public Authenticated** | `all` | Google OIDC Token | B2B APIs, Remote MCP Server endpoints |
| **Internal Protected** | `internal-and-cloud-load-balancing` | Identity-Aware Proxy (IAP) | Internal corporate dashboards, dbt docs, admin tools |
| **Private Microservice** | `internal` | VPC Service Mesh / Direct VPC | Service-to-service backend calls within GCP VPC |
| **Public Open** | `all` + Cloud Armor WAF | Rate limiting / reCAPTCHA | Public consumer web apps, landing pages |

---

## 🛠️ Production Blueprints

### Blueprint 1: Production Cloud Run Service with Automated Multi-Region Failover [07.26]
Provision a multi-region deployment with automated failover using Terraform:
```hcl
resource "google_cloud_run_v2_service" "primary_service" {
  name     = "app-service-us-central1"
  location = "us-central1"

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 50
    }
    containers {
      image = "us-docker.pkg.dev/my-project/apps/backend:v1.2.0"
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
        cpu_idle = false # Disables CPU throttling (--no-cpu-throttling)
      }
    }
  }
}

resource "google_cloud_run_v2_service" "backup_service" {
  name     = "app-service-us-east1"
  location = "us-east1"

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 50
    }
    containers {
      image = "us-docker.pkg.dev/my-project/apps/backend:v1.2.0"
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
        cpu_idle = false
      }
    }
  }
}
```
*Cites: [Cloud Run multi-region services enhanced for high availability](./references/articles.md)*

---

### Blueprint 2: Secure Remote MCP Server on Cloud Run with SSE Transport [08.26, 06.26]
Deploy an MCP server running on FastAPI / FastMCP over Server-Sent Events (SSE) with IAM authentication:
```python
import os
from fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("gcp-infrastructure-assistant")

@mcp.tool()
def get_service_health(service_name: str) -> dict:
    """Inspects service status in Cloud Run."""
    return {"service": service_name, "status": "READY", "traffic_percent": 100}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    # SSE transport ensures continuous connection for agent clients
    mcp.run(transport="sse", host="0.0.0.0", port=port)
```

Deploy via `gcloud`:
```bash
gcloud run deploy mcp-infra-server \
    --source . \
    --region us-central1 \
    --no-allow-unauthenticated \
    --no-cpu-throttling \
    --concurrency 10 \
    --min-instances 1 \
    --set-secrets="GCP_API_KEY=projects/my-proj/secrets/mcp-token:latest"
```
*Cites: [Deploying Secure MCP Servers on Cloud Run](./references/articles.md) and [Managing BigQuery with Google ADK, MCP, Cloud Run](./references/articles.md)*

---

### Blueprint 3: Serverless GPU Acceleration for Gemma 3 on Cloud Run [03.25]
Deploy open-source LLMs on Cloud Run using serverless NVIDIA L4 GPUs:
```bash
gcloud run deploy gemma-inference \
    --image us-docker.pkg.dev/my-project/llm/vllm-gemma-3:latest \
    --region us-central1 \
    --gpu 1 \
    --gpu-type nvidia-l4 \
    --no-cpu-throttling \
    --memory 32Gi \
    --cpu 8 \
    --concurrency 1 \
    --min-instances 0 \
    --max-instances 5 \
    --timeout 600s
```
*Cites: [How to deploy serverless AI with Gemma 3 on Cloud Run](./references/articles.md) and [Deploy your first LLM on GCP: Gemma with Cloud Run](./references/articles.md)*

---

### Blueprint 4: Temporal Worker Pool on Cloud Run [01.26]
Host continuous background polling workers on Cloud Run with zero dropped tasks:
```bash
gcloud run deploy temporal-worker-pool \
    --image us-docker.pkg.dev/my-project/workers/temporal-worker:latest \
    --region us-central1 \
    --no-cpu-throttling \
    --min-instances 2 \
    --max-instances 10 \
    --concurrency 10 \
    --timeout 3600s \
    --set-env-vars="TEMPORAL_HOST=temporal-cluster.internal:7233,TASK_QUEUE=financial-transactions"
```
*Cites: [The Surprising Simplicity of Temporal Worker Pools on Cloud Run](./references/articles.md)*

---

### Blueprint 5: Protecting AI Applications with Model Armor Sanitization Proxy [09.25]
Route incoming user prompts through Google Model Armor to sanitize prompt injections before invoking LLM engines:
```python
from google.cloud import modelarmor_v1

client = modelarmor_v1.ModelArmorClient()

def sanitize_user_prompt(prompt_text: str, project_id: str, template_id: str) -> bool:
    """Evaluates prompt against Model Armor security templates."""
    name = f"projects/{project_id}/locations/global/templates/{template_id}"
    response = client.sanitize_user_prompt(name=name, user_prompt_data=prompt_text)
    
    # Check if prompt injection or jailbreak was detected
    if response.sanitization_result.filter_match:
        return False # Reject malicious prompt
    return True # Safe to proceed to Gemini / Gemma
```
*Cites: [Running and Securing AI Applications on Cloud Run with Model Armor](./references/articles.md)*

---

### Blueprint 6: Batch AI Embedding Processing with Cloud Run Jobs [04.26]
Execute bounded, run-to-completion AI embedding generation and database sync with Cloud Run Jobs:
```bash
gcloud run jobs create vector-batch-sync \
    --image us-docker.pkg.dev/my-project/ai/batch-embedder:latest \
    --region us-central1 \
    --tasks 10 \
    --max-retries 3 \
    --task-timeout 1800s \
    --cpu 4 \
    --memory 8Gi \
    --set-env-vars="ALLOYDB_CLUSTER=alloydb-ai-cluster,BATCH_SIZE=5000" \
    --network default \
    --subnet default

# Trigger execution of batch job
gcloud run jobs execute vector-batch-sync --region us-central1
```
*Cites: [Building a Scalable RAG Backend with Cloud Run Jobs and AlloyDB](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[08.26]**: Secure Remote MCP Server deployments on Cloud Run with OIDC token validation.
- **[07.26]**: Cloud Run multi-region services enhanced with automated regional failover.
- **[06.26]**: ADK and MCP agent backends hosted on Cloud Run with Streamlit and OIDC.
- **[04.26]**: Scalable RAG backends combining Cloud Run Jobs with AlloyDB ScaNN indexes.
- **[03.26]**: Cloud Run native Identity-Aware Proxy (IAP) integration; CPU throttling failure post-mortems.
- **[02.26]**: Containerless deploy (`gcloud run deploy --source .`) GA; Cloud Service Mesh integration.
- **[01.26]**: Temporal worker pools on Cloud Run; Serverless cold-start performance optimizations.
- **[10.25]**: Custom MCP server hosting for Gemini CLI integration.
- **[09.25]**: Model Armor integration for Cloud Run AI workloads; Multi-region serverless architectures.
- **[03.25]**: Serverless GPU acceleration (NVIDIA L4) for Gemma 3 on Cloud Run.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Serverless Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
