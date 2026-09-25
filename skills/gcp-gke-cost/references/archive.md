# gcp-gke-cost Historical & Evergreen Reference Vault

This archive vault contains foundational FinOps practices, Kubernetes resource management formulas, and billing export documentation for `gcp-gke-cost`.

---

### 💎 Evergreen GKE FinOps & Capacity Economics Masterclasses
- **Unallocated Cluster Cost Decomposition**:
  - The mathematics of unallocated GKE spend: $\text{Unallocated Cost} = \text{Total Node Cost} - \sum \text{Allocated Pod Requests}$.
  - Root causes: Node fragmentation (pods cannot fit on partially filled nodes), safety buffers, and oversized DaemonSets.

- **Committed Use Discounts (CUDs) vs Spot Heuristics**:
  - Blending 1-year or 3-year Compute CUDs for predictable baseline workloads with Spot VMs for fault-tolerant batch workers.
