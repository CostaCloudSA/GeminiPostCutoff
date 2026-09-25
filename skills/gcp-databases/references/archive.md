# gcp-databases Historical & Evergreen Reference Vault

This archive vault contains foundational architecture patterns, replication guides, and storage performance documentation for `gcp-databases`.

---

### 💎 Evergreen Database Performance & High Availability Masterclasses
- **Cloud SQL High Availability & Cross-Region Replication**:
  - Regional HA instances with automated failover (< 60 seconds) using synchronous block-level storage replication.
  - Asynchronous cross-region read replicas for disaster recovery and read offloading.

- **Storage Engine Heuristics**:
  - Persistent Disk (PD) IOPS scaling rules: Standard PD vs Balanced PD vs SSD PD vs Hyperdisk.
  - Sizing disk capacity to guarantee required IOPS without paying for unneeded storage tiers.
