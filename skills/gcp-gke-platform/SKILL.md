---
name: gcp-gke-platform
description: >-
  GKE cluster architecture (Standard/Autopilot), Gateway API, Dataplane V2,
  Agent Sandbox, Pod Snapshots, Zero-Touch OpenTelemetry, and Rollout Sequencing.
  Activate when designing Kubernetes infrastructure, migrating from Ingress-nginx, or hardening cluster security.
---

# GKE Platform, Scaling & Core Infrastructure Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Designing enterprise GKE topologies (Autopilot vs Standard, private clusters, multi-zone vs regional).
- Routing ingress traffic using the **GKE Gateway API** and Dataplane V2 (migrating from legacy `ingress-nginx`).
- Provisioning heterogeneous compute using **Autopilot Custom ComputeClasses** or Node Auto-Provisioning (NAP).
- Accelerating heavy pod cold starts (PyTorch, JVM, Ray) from 4 minutes down to sub-second using **GKE Pod Snapshots**.
- Sandboxing untrusted AI agent code execution using **Agent Sandbox** and gVisor on GKE.
- Enabling **Zero-Touch OpenTelemetry (OTel)** tracing and native custom metrics without modifying application source code.
- Managing safe cluster upgrades with **Rollout Sequencing** and minor version rollbacks.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Deploying Legacy Ingress-Nginx on Modern GKE [01.26, 12.25]**
> Deploying `ingress-nginx` introduces an unmanaged software proxy layer, single-point-of-failure controller pods, extra latency hops, and completely bypasses Google Cloud Armor, Cloud CDN, and Dataplane V2 optimizations.
> - **Mandatory Solution**: Use **GKE Gateway API** (`gateway.networking.k8s.io`) with Network Endpoint Groups (NEGs) for direct container pod routing.
> *Cites: [Migrating from ingress-nginx to Gateway API on GKE](./references/articles.md) and [A Deep Dive into GKE Gateway API, NEGs, and Dataplane V2](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: 4-Minute Container Cold Starts without Pod Snapshots [02.26]**
> Massive container images (AI model runtimes, large Java Spring heaps) spend 3–5 minutes downloading layers, initializing caches, and JIT-compiling before passing readiness probes, crippling horizontal autoscaling (HPA) during traffic spikes.
> - **Solution**: Use **GKE Pod Snapshots**, which capture memory and disk state at startup and restore ready-to-serve pods in sub-seconds.
> *Cites: [GKE Pod Snapshots Cut Startup Times for Heavy Workloads](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Untrusted Agent Code Execution Directly on Host Linux Kernel [05.26]**
> Allowing autonomous AI agents or users to execute generated Python/Bash scripts inside standard Docker/containerd pods risks container breakouts, host compromise, and lateral network movement across the VPC.
> - **Solution**: Deploy untrusted agent workloads inside **Agent Sandbox** or pods configured with `runtimeClassName: gke-sandbox` (Google gVisor user-space kernel virtualization).
> *Cites: [Agent Sandbox on GKE is now available for everyone](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Cluster Upgrade Cascading Outages without Rollout Sequencing [01.26, 11.25]**
> Upgrading GKE node pools without sequencing rules can drain multiple critical service nodes simultaneously, causing transient outages even with Pod Disruption Budgets.
> - **Solution**: Enforce **GKE Rollout Sequencing** across node pools and leverage **Minor Version Rollback** if health checks fail.
> *Cites: [GKE Upgrades: How Rollout Sequencing Makes Upgrades Predictable and Safe](./references/articles.md) and [Upgrading Kubernetes versions just got safer with minor version rollback](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 5: IP Masquerading (SNAT) Traps Dropping Cross-Subnet VPC Traffic [10.25]**
> Misconfigured `ip-masq-agent` policies inadvertently SNAT pod IPs to the node's external or internal IP when communicating with on-premises networks or peered VPCs, breaking mutual TLS and firewall audit rules.
> - **Solution**: Configure Dataplane V2 native non-masquerade CIDRs directly in GKE cluster networking specs.
> *Cites: [GCP GKE IP Masquerading (SNAT) — Understand It Once, Fix It Everywhere](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 6: Public Control Plane Exposure without Authorized Networks [08.26, 04.26]**
> Deploying GKE clusters with public endpoints accessible from `0.0.0.0/0` exposes the Kubernetes API server to brute-force credential stuffing and zero-day cluster compromise.
> - **Mandatory Standard**: Deploy **Private GKE Clusters** with `--enable-private-nodes` and `--enable-private-endpoint`, restricting control plane access strictly to authorized VPC admin subnets or an internal IAP bastion.
> *Cites: [Securing Kubernetes: How to Build a Private GKE Cluster on Google Cloud](./references/articles.md) and [Building a PCI-DSS Compliant GKE Framework for Financial Institutions](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Cluster Operating Mode: GKE Autopilot vs GKE Standard
| Dimension | GKE Autopilot (Google Managed) | GKE Standard (User Managed) |
| :--- | :--- | :--- |
| **Node Management** | Zero OS, kernel, or node pool patching | User configures OS images, kubelet, and node pools |
| **Billing Model** | Pay strictly for requested Pod CPU/RAM/Storage | Pay for full VM instance capacity regardless of pod fit |
| **Specialized Hardware** | Supported via ComputeClasses (L4, A100, TPU v5e) | Full manual GPU/TPU driver configuration |
| **Security Baseline** | Built-in CIS benchmarks, shielded VMs, enforced non-root | Requires manual cluster hardening and security scans |
| **Best For** | 90%+ of production microservices & AI agents | Specialized kernel modules, privileged host networking |

---

### 2. GKE Gateway API Classes Matrix [04.26, 12.25]
| GatewayClassName | Load Balancer Scope | Cloud Armor / WAF | Best For |
| :--- | :--- | :--- | :--- |
| `gke-l7-global-external-managed` | Global External Managed ALB | Yes (Full Edge WAF) | Public web apps, worldwide APIs |
| `gke-l7-regional-external-managed` | Regional External Managed ALB | Yes (Regional WAF) | Strict data residency, regional compliance |
| `gke-l7-rilb` | Regional Internal Managed ALB | Internal VPC only | Private microservice-to-microservice routing |
*Cites: [GKE Ingress: External vs Internal](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Production GKE Gateway API with Utilization-Based Balancing [03.26, 01.26]
Route ingress traffic directly to pods via Dataplane V2 NEGs with dynamic capacity balancing:
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: prod-external-gateway
  namespace: production
spec:
  gatewayClassName: gke-l7-global-external-managed
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    tls:
      mode: Terminate
      certificateRefs:
      - name: prod-cert-production-example-com
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-routing
  namespace: production
spec:
  parentRefs:
  - name: prod-external-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/v2
    backendRefs:
    - name: api-service
      port: 8080
```
*Cites: [Migrating from ingress-nginx to Gateway API on GKE](./references/articles.md) and [Supercharge your GKE Gateway: Introducing Utilization Based Load Balancing](./references/articles.md)*

---

### Blueprint 2: GKE Autopilot Custom ComputeClass for C3 Nodes [04.26, 10.25]
Declare workload affinity for Compute-Optimized C3 machine instances in Autopilot:
```yaml
apiVersion: cloud.google.com/v1
kind: ComputeClass
metadata:
  name: c3-highcpu-compute
spec:
  nodeSelector:
    cloud.google.com/machine-family: c3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: high-performance-worker
  namespace: production
spec:
  replicas: 5
  template:
    metadata:
      annotations:
        cloud.google.com/compute-class: c3-highcpu-compute
    spec:
      containers:
      - name: worker
        image: us-docker.pkg.dev/my-project/workers/c3-worker:v2.1
        resources:
          requests:
            cpu: "4"
            memory: "8Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
```
*Cites: [GKE Autopilot: Custom Compute Classes for Different Workload Types](./references/articles.md)*

---

### Blueprint 3: Sandboxing Untrusted AI Agent Code with gVisor [05.26]
Isolate autonomous code execution pods from the host kernel using GKE Sandbox:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-code-interpreter
  namespace: sandbox-env
spec:
  replicas: 2
  template:
    metadata:
      labels:
        app: agent-interpreter
    spec:
      runtimeClassName: gke-sandbox # Enforces gVisor user-space kernel sandbox
      containers:
      - name: python-runner
        image: python:3.11-slim
        command: ["python", "-c", "import time; time.sleep(3600)"]
        resources:
          requests:
            cpu: "1"
            memory: "2Gi"
          limits:
            cpu: "2"
            memory: "4Gi"
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
```
*Cites: [Agent Sandbox on GKE is now available for everyone](./references/articles.md)*

---

### Blueprint 4: Zero-Touch OpenTelemetry Auto-Instrumentation on Autopilot [01.26]
Automatically trace HTTP/gRPC requests into Cloud Trace without importing SDK libraries:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: checkout-service
  namespace: ecommerce
spec:
  template:
    metadata:
      annotations:
        # Injects OpenTelemetry auto-instrumentation sidecar/agent natively
        cloud.google.com/opentelemetry-instrumentation: "true"
    spec:
      containers:
      - name: app
        image: us-docker.pkg.dev/my-project/apps/checkout:v1.0
        ports:
        - containerPort: 8080
```
*Cites: [Stop Coding Your Traces: A Zero-Touch Guide to GKE Autopilot & OpenTelemetry](./references/articles.md)*

---

### Blueprint 5: Private GKE Cluster with Master Authorized Networks (Terraform) [08.26]
Provision a fully private GKE cluster isolated from the public internet:
```hcl
resource "google_container_cluster" "private_cluster" {
  name     = "prod-private-gke"
  location = "us-central1"

  enable_autopilot = true

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = true # Control plane accessible only within VPC
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "10.0.0.0/16"
      display_name = "VPC-Internal-Admin-CIDR"
    }
  }
}
```
*Cites: [Securing Kubernetes: How to Build a Private GKE Cluster on Google Cloud](./references/articles.md)*

---

### Blueprint 6: Enterprise Remote MCP Server on GKE Autopilot [06.26]
Deploy a scalable Model Context Protocol (MCP) server on GKE Autopilot exposed via Gateway API:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gke-remote-mcp-server
  namespace: mcp-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      serviceAccountName: mcp-runner-ksa
      containers:
      - name: mcp-server
        image: us-docker.pkg.dev/my-project/mcp/cloud-diagnostics:v1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "1"
            memory: "2Gi"
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: mcp-route
  namespace: mcp-system
spec:
  parentRefs:
  - name: internal-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /mcp
    backendRefs:
    - name: gke-remote-mcp-server
      port: 8080
```
*Cites: [Build and Deploy a Remote MCP Server to GKE in 30 Minutes](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[08.26]**: Cloud Run vs GKE Autopilot comparison for ADK Agent hosting; Private GKE cluster blueprints.
- **[07.26]**: Kubernetes Networking 101 on GKE; k8s-aibom launched for automated AI Bills of Materials.
- **[06.26]**: Deploying Remote MCP Servers on GKE in 30 minutes.
- **[05.26]**: Agent Sandbox on GKE launched; Faster node startup optimizations.
- **[04.26]**: Autopilot ComputeClasses supported on GKE Standard clusters; PCI-DSS compliance frameworks.
- **[03.26]**: Dynamic Resource Allocation (DRA); Multi-cluster GKE Inference Gateway; Utilization-Based Load Balancing (UBB).
- **[02.26]**: GKE Pod Snapshots cut container cold starts; In-Place Pod Resizing with VPA.
- **[01.26]**: Rollout sequencing for safe upgrades; Gateway API migration from ingress-nginx; Zero-touch OpenTelemetry on Autopilot.
- **[12.25]**: Dataplane V2 deep dive and native eBPF routing.
- **[11.25]**: Intelligent capacity failover and minor version rollbacks.
- **[09.25]**: GKE Inference Gateway GA; Autopilot workloads on GKE Standard.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen GKE Platform Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
