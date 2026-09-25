---
name: gcp-gke-cost
description: >-
  GKE cost tracking, managing unallocated cluster spend, right-sizing pod requests,
  Cloud Logging cost reduction, and optimizing Kubernetes budgets on GCP.
  Activate when reviewing GKE spend, resolving unallocated node waste, or implementing FinOps cost allocation.
---

# GKE Cost Control, Allocation & Budget Management Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Analyzing multi-tenant Kubernetes costs per namespace, label, cluster, or deployment in BigQuery.
- Resolving **unallocated cluster spend** caused by over-provisioned node pools, memory fragmentation, or idle headroom.
- Right-sizing pod CPU and memory requests using **Vertical Pod Autoscaler (VPA)** and Size Recommenders.
- Slashing non-production cluster costs by 33% through resource governance and automated off-peak scale-down.
- Slashing AI agent execution costs by 75% using **GKE Agent Sandbox**.
- Preventing runaway Google Cloud Logging bills caused by high-volume container stdout streams.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Unallocated Node Waste Exceeding 25% of Total Compute [09.25]**
> In GKE Standard, clusters pay for 100% of the underlying VM capacity. When pods have mismatched CPU/memory request ratios or when nodes suffer from fragmentation, 25%–50% of the node's capacity remains unallocated (slack capacity), burning thousands of dollars monthly.
> - **Solution**: Query unallocated cost SKUs in BigQuery. If unallocated spend > 20%, migrate variable workloads to **GKE Autopilot** (where you only pay for pod requests) or enable **Node Auto-Provisioning (NAP)** with tighter bin-packing.
> *Cites: [Understanding unallocated costs in GKE](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: The "Hidden Cost of Cloud Logging" Trap [04.26]**
> Kubernetes containers streaming verbose JSON logs (debug traces, health check pings) directly to stdout get ingested into Google Cloud Logging at **$0.50 per GiB**. For high-traffic microservices, Cloud Logging bills frequently exceed the cost of the actual GKE compute nodes!
> - **Solution**: Create Cloud Logging **Exclusion Filters** at the project or log sink level to drop health check logs and verbose debug streams before ingestion.
> *Cites: [The Hidden Cost of GCP Cloud Logging — And the Open Source Stack We Replaced It With](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Static "Guess-timated" Pod Requests without Usage Profiling [05.26, 08.26]**
> Developers routinely specify static requests of 4 vCPUs and 8GB RAM for services that average 120m vCPU and 600MB RAM. In Autopilot, this directly inflates the per-second pod bill by 800%.
> - **Solution**: Deploy **Vertical Pod Autoscaler (VPA)** in `updateMode: "Off"` to capture empirical p95 resource usage and right-size requests.
> *Cites: [How a Rails and K8s Newcomer Cut GKE Costs by 60%](./references/articles.md) and [How We Reduced GKE Costs by 33%](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Running Non-Production Clusters 24/7 at Full Scale [08.26]**
> Development, staging, and QA clusters running 24/7 incur 168 hours of compute per week, despite engineers only actively testing for ~45 hours.
> - **Solution**: Implement scheduled night and weekend scale-down policies to shrink non-production deployments to 0 replicas, instantly saving ~65% on non-prod compute.
> *Cites: [How We Reduced GKE Costs by 33% Through Smarter Scheduling](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Kubernetes Compute Cost Model: Autopilot vs Standard
| Dimension | GKE Autopilot | GKE Standard |
| :--- | :--- | :--- |
| **Billing Basis** | Pod Requests (CPU, Memory, Ephemeral Storage) | Full Node VM capacity + $0.10/hr cluster management fee |
| **Unallocated Waste** | **0% (Google absorbs slack & bin-packing waste)** | Typically 15%–40% depending on bin-packing efficiency |
| **Idle Pods Cost** | High (if requests are oversized) | Bound to node capacity |
| **Best For** | Variable traffic, microservices, AI agents | Homogeneous predictable batch jobs, specialized kernel needs |

---

### 2. GKE Compute Discount Tier Comparison [06.25]
| Commitment Type | Discount Percentage | Flexibility | Best For |
| :--- | :--- | :--- | :--- |
| **On-Demand** | 0% | Maximum (cancel / resize anytime) | Short-term spikes, early prototypes |
| **Spot VMs** | **60%–91%** | Preemptible with 30s notice | Batch processing, stateless worker pools |
| **1-Year CUD** | ~37% | Committed hourly dollar spend | Predictable production baseline services |
| **3-Year CUD** | ~55% | Committed hourly dollar spend | Core foundational workloads |

---

## 🛠️ Production Blueprints

### Blueprint 1: Granular GKE Cost Attribution Query in BigQuery [10.25, 09.25]
Analyze exact compute spend grouped by namespace, workload, and unallocated cluster waste:
```sql
SELECT
  project.id AS gcp_project,
  labels.value AS k8s_namespace,
  k8s_labels.value AS workload_name,
  ROUND(SUM(cost), 2) AS total_cost_usd,
  ROUND(SUM(CASE WHEN sku.description LIKE '%Unallocated%' THEN cost ELSE 0 END), 2) AS unallocated_cost_usd,
  ROUND(SUM(cost) - SUM(CASE WHEN sku.description LIKE '%Unallocated%' THEN cost ELSE 0 END), 2) AS allocated_pod_cost_usd
FROM
  `my_gcp_project.billing_export.gcp_billing_export_resource_v1_XXXXXX`,
  UNNEST(labels) AS labels,
  UNNEST(kubernetes_labels) AS k8s_labels
WHERE
  service.description = 'Kubernetes Engine'
  AND labels.key = 'k8s-namespace'
  AND k8s_labels.key = 'k8s-app'
  AND _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY
  1, 2, 3
ORDER BY
  total_cost_usd DESC;
```
*Cites: [Stop Guessing: How to Actually Track Your GKE Costs](./references/articles.md) and [Understanding unallocated costs in GKE](./references/articles.md)*

---

### Blueprint 2: Cloud Logging Exclusion Filter to Block Container Noise [04.26]
Prevent high-volume health checks and debug logs from generating hundreds of dollars in Cloud Logging fees:
```bash
gcloud logging sinks update _Default \
    --add-exclusion="name=exclude-k8s-healthchecks,filter=resource.type=\"k8s_container\" AND (jsonPayload.path=\"/healthz\" OR jsonPayload.path=\"/ready\" OR severity=\"DEBUG\")"
```
*Cites: [The Hidden Cost of GCP Cloud Logging — And the Open Source Stack We Replaced It With](./references/articles.md)*

---

### Blueprint 3: Vertical Pod Autoscaler (VPA) in Recommendation Mode [05.26]
Observe empirical p95 resource usage to safely right-size container requests without restarting pods:
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-service-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: customer-api
  updatePolicy:
    updateMode: "Off" # Generate recommendations only; does not mutate live pods
  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      minAllowed:
        cpu: 50m
        memory: 128Mi
      maxAllowed:
        cpu: 2000m
        memory: 4Gi
```
*Cites: [How a Rails and K8s Newcomer Cut GKE Costs by 60% by Looking Across the Stack](./references/articles.md)*

---

### Blueprint 4: Scheduled Off-Peak Scale-Down for Non-Production Workloads [08.26]
Automatically scale dev/staging deployments down to 0 replicas overnight using a Kubernetes CronJob:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-scale-down
  namespace: staging
spec:
  schedule: "0 20 * * 1-5" # 8:00 PM Monday through Friday
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: cluster-scaler-sa
          restartPolicy: OnFailure
          containers:
          - name: kubectl
            image: bitnami/kubectl:latest
            command:
            - /bin/sh
            - -c
            - "kubectl scale deployment --all --replicas=0 -n staging"
```
*Cites: [How We Reduced GKE Costs by 33% Through Smarter Scheduling and Resource Governance](./references/articles.md)*

---

### Blueprint 5: Enable GKE Cost Allocation on Cluster [10.25]
Turn on granular container cost allocation to enable pod-level attribution in Cloud Billing:
```bash
gcloud container clusters update prod-cluster \
    --region=us-central1 \
    --enable-cost-allocation
```
*Cites: [Stop Guessing: How to Actually Track Your GKE Costs](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[08.26]**: 33% cost reduction case study using priority classes, smarter scheduling, and governance.
- **[07.26]**: GKE Agent Sandbox cuts AI agent execution spend by 75% compared to dedicated VMs.
- **[05.26]**: Full-stack GKE optimization cuts 60% compute waste across Rails and K8s runtimes.
- **[04.26]**: Hidden costs of GCP Cloud Logging exposed; log exclusion filter architectures.
- **[10.25]**: Granular GKE Cost Allocation in Cloud Billing and BigQuery export schema.
- **[09.25]**: Mathematical decomposition of unallocated costs in GKE clusters.
- **[06.25]**: GKE cost management practical guide; Spot VM and CUD strategies.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen GKE FinOps Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
