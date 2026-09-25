# gcp-bigquery-cost Historical & Evergreen Reference Vault

This archive vault contains foundational, historical, and timeless cost-control publications for `gcp-bigquery-cost` published prior to 2025.

---

### 💎 Evergreen Architectural & Cost-Control Masterclasses
These articles provide timeless, battle-tested problem-solving techniques, architectural heuristics, and slot governance patterns that remain essential across all BigQuery deployments:

- [Controlling your Bigquery Costs](https://cloud.google.com/blog/topics/developers-practitioners/controlling-your-bigquery-costs)
  - **Core Mechanism**: Organization-wide project isolation, daily export auditing, and slot reservation hierarchies.
  - **When to Use**: Establishing enterprise FinOps governance across multi-tenant GCP organizations.
  - **Anti-Pattern / Trap**: Relying on alerts alone rather than combining custom quotas with billing export alerting.
  - **Impact / Metric**: Prevents multi-thousand-dollar runaway ad-hoc query spikes.

- [BigQuery Cost Optimization with slot management](https://medium.com/google-cloud/bigquery-cost-optimization-with-slot-management-e6eb50697265)
  - **Core Mechanism**: Workload segmentation (`admin`, `etl`, `ad-hoc`) and dynamic idle slot borrowing (`ignore_idle_slots = false`).
  - **When to Use**: Multi-department organizations balancing scheduled ETL against sporadic analytical querying.
  - **Anti-Pattern / Trap**: Setting baseline capacity too low causes queue latency spikes during morning report ingestion.
  - **Impact / Metric**: Achieves 90%+ average slot utilization without paying for peak capacity 24/7.

---

### 📜 Historical Pre-Cutoff Reference
- [Monitoring BQ Costs at Plum: A Breakdown](https://medium.com/plum-fintech/monitoring-bigquery-costs-at-plum-a-detailed-breakdown-ebee226b0deb)
  - **Core Mechanism**: Automated Slack webhooks querying `INFORMATION_SCHEMA.JOBS_BY_ORGANIZATION` to alert engineering teams of queries exceeding 1TB scanned.
