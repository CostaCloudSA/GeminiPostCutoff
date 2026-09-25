---
name: gcp-migrations
description: >-
  Use this skill for AWS/Azure to GCP cloud migrations, data warehouse modernization
  (Snowflake/Teradata/Databricks to BigQuery), and Delta Lake transfers.
---

# Cloud Modernization & Multi-Cloud Migration Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Migrating compute, storage, and networking from **AWS** or **Azure** to Google Cloud Platform.
- Modernizing enterprise data warehouses (Snowflake, Teradata, Amazon Redshift) to **BigQuery**.
- Transferring large-scale object storage datasets and Delta Lake tables to Google Cloud Storage.
- Establishing secure cross-cloud federated authentication from AWS EKS or Azure AKS using **Workload Identity Federation**.
- Transitioning legacy Vertex AI Agent Builder deployments to the **Gemini Enterprise Agent Platform (GEAP)**.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Naive "Lift-and-Shift" of Teradata / Snowflake Queries into BigQuery [07.25]**
> Executing transpiled Teradata or Snowflake SQL scripts directly in BigQuery without schema redesign causes massive query performance degradation and runaway slot consumption. Teradata relies on `PRIMARY INDEX` hashing, whereas BigQuery requires explicit column-level partitioning and clustering.
> - **Mandatory Standard**: Eliminate procedural cursor loops. Restructure tables with `PARTITION BY DATE(timestamp_col)` and `CLUSTER BY (entity_id, category)` to prune scanned bytes and reduce query expenses by 35%+.
> *Cites: [How We Cut BigQuery Costs by 35% During a Teradata-to-GCP Migration](./references/articles.md) and [This migration from Snowflake to BigQuery accelerated model building and cut costs in half](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 2: Unmanaged S3-to-GCS File Transfers via Ad-Hoc Scripts [10.25]**
> Writing bespoke Python or bash scripts to transfer terabytes of data from AWS S3 or Databricks Delta Lake to Google Cloud Storage introduces silent data corruption, lacks automatic checksum validation, and fails to resume on network timeouts.
> - **Mandatory Standard**: Deploy **Google Cloud Storage Transfer Service (STS)**. STS executes managed, parallelized multi-part transfers directly between cloud object stores with automated CRC32C / MD5 checksum verification and scheduled delta syncs.
> *Cites: [Migrating Delta Lake Tables to Google Cloud Storage using Storage Transfer Service](./references/articles.md) and [Cloud migrations made easy: a guide to migrating from AWS to Google Cloud](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Storing GCP Service Account Keys in AWS/Azure Multi-Cloud Clusters [12.25]**
> Generating static `service-account-key.json` files and injecting them as Kubernetes secrets into AWS EKS or Azure AKS for cross-cloud ingestion creates persistent credential leakage risks and violates zero-trust principles.
> - **Mandatory Standard**: Authenticate multi-cloud workloads via **Workload Identity Federation (WIF)**. Federate Azure AD / Microsoft Entra or AWS IAM OIDC tokens with a GCP Workload Identity Pool to issue short-lived OAuth2 tokens without static keys.
> *Cites: [A Practical Guide to Secure, Passwordless Authentication with AKS and Workload Identity Federation](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Cold-Dump Relational Database Migration Incurring Protracted Downtime [12.25]**
> Attempting to migrate operational production databases (PostgreSQL/MySQL/Oracle) to Cloud SQL or AlloyDB via offline backup/restore tools (`pg_dump`, `mysqldump`) forces multiple hours of catastrophic application downtime.
> - **Standard Protocol**: Utilize Google Cloud **Database Migration Service (DMS)** with continuous Change Data Capture (CDC) replication. Apply custom migration directives for schema rules and switch DNS records only during the sub-second final cutover window.
> *Cites: [Your Schema, Your Rules: Control Database Migrations with New Directives](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Cross-Cloud Infrastructure Mapping Matrix [01.25, 04.25]
| AWS Service | Azure Service | Google Cloud Modernized Standard | Strategic Migration Advantage |
| :--- | :--- | :--- | :--- |
| **AWS Lambda** | Azure Functions | **Cloud Run Functions / Cloud Run** | Zero cold-start concurrency; container native |
| **Amazon EKS / ECS** | Azure AKS | **GKE Autopilot** | Hands-off node pool management; pod-level billing |
| **Amazon S3** | Azure Blob Storage | **Google Cloud Storage (GCS)** | Global bucket namespace; Turbo Replication SLA |
| **Amazon Redshift** | Azure Synapse | **Google BigQuery** | Serverless slot elasticity; native Gemini AI SQL |
| **Amazon RDS (Postgres)** | Azure Database for PG | **AlloyDB for PostgreSQL** | Up to 4x transactional throughput; ScaNN vector search |
| **Amazon DynamoDB** | Azure Cosmos DB | **Cloud Firestore / Bigtable** | Multi-region 99.999% availability; real-time sync |
*Cites: [Cloud migrations made easy: a guide to migrating from AWS to Google Cloud](./references/articles.md) and [Migration from Amazon Web Services provider to Google Cloud Platform](./references/articles.md)*

---

### 2. Data Warehouse Migration Modernization Matrix [07.25, 06.25]
| Source System | Primary Migration Tool | Architecture Bottleneck to Avoid | Modernization Pattern |
| :--- | :--- | :--- | :--- |
| **Snowflake** | BigQuery Migration Service | Emulating Snowflake virtual warehouse sizing | Migrate to BigQuery Autoscaling Slots with BI Engine |
| **Teradata** | BigQuery Transpiler & DMS | Migrating procedural cursor loops directly | Rewrite into set-based SQL with table partitioning |
| **Databricks / Delta** | Storage Transfer Service + Dataplex | Re-encoding parquet into custom formats | Register external Delta Lake tables via BigLake |
| **Amazon Redshift** | BigQuery Data Transfer Service (DTS) | Retaining vacuum / sort key maintenance jobs | Replace with BigQuery automatic background clustering |
*Cites: [How We Cut BigQuery Costs by 35% During a Teradata-to-GCP Migration](./references/articles.md) and [Migrating Databricks to BigQuery](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Storage Transfer Service for AWS S3 to GCS Migration (Terraform) [10.25, 01.25]
Deploy an automated, checksum-verified cloud storage transfer job from Amazon S3 to Cloud Storage:
```hcl
resource "google_storage_transfer_job" "s3_to_gcs_migration" {
  description = "Automated high-throughput transfer from AWS S3 to Google Cloud Storage"
  project     = "my-migration-project"

  transfer_spec {
    aws_s3_data_source {
      bucket_name = "enterprise-aws-data-lake"
      aws_access_key {
        access_key_id     = var.aws_access_key_id
        secret_access_key = var.aws_secret_access_key
      }
    }

    gcs_data_sink {
      bucket_name = google_storage_bucket.migrated_landing_bucket.name
    }

    transfer_options {
      overwrite_when               = "DIFFERENT"
      delete_objects_unique_in_sink = false
    }
  }

  schedule {
    schedule_start_date {
      year  = 2026
      month = 10
      day   = 1
    }
    start_time_of_day {
      hours   = 2
      minutes = 0
      seconds = 0
      nanos   = 0
    }
  }
}
```
*Cites: [Migrating Delta Lake Tables to Google Cloud Storage using Storage Transfer Service](./references/articles.md) and [Cloud migrations made easy: a guide to migrating from AWS to Google Cloud](./references/articles.md)*

---

### Blueprint 2: Azure AKS to Google Cloud Workload Identity Federation (Terraform) [12.25]
Enable passwordless, secure authentication from Azure Kubernetes Service into Google Cloud APIs:
```hcl
resource "google_iam_workload_identity_pool" "azure_pool" {
  workload_identity_pool_id = "azure-aks-pool"
  display_name              = "Azure AKS Federated Identity Pool"
}

resource "google_iam_workload_identity_pool_provider" "azure_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.azure_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "azure-aks-provider"
  display_name                       = "Azure AKS OIDC Provider"

  attribute_mapping = {
    "google.subject" = "assertion.sub"
    "attribute.tid"  = "assertion.tid"
  }

  oidc {
    # Azure AKS cluster OIDC issuer URL
    issuer_uri = "https://eastus.oic.prod-aks.azure.com/00000000-0000-0000-0000-000000000000/"
  }
}

resource "google_service_account_iam_member" "aks_federated_binding" {
  service_account_id = google_service_account.cloud_storage_reader.name
  role               = "roles/storage.objectViewer"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.azure_pool.name}/attribute.tid/${var.azure_tenant_id}"
}
```
*Cites: [A Practical Guide to Secure, Passwordless Authentication with AKS and Workload Identity Federation](./references/articles.md)*

---

### Blueprint 3: Snowflake to BigQuery Migration Query Refactoring & Clustering (SQL) [07.25]
Modernize Snowflake unclustered tables into high-performance partitioned BigQuery tables:
```sql
-- Before (Snowflake pattern): Full scans on massive transactional log
-- After (BigQuery optimized DDL):
CREATE OR REPLACE TABLE `my_project.analytics.customer_events`
PARTITION BY DATE(event_timestamp)
CLUSTER BY customer_id, event_type
OPTIONS(
  description = "Modernized customer events migrated from Snowflake with native partition pruning",
  require_partition_filter = TRUE
) AS
SELECT
  event_id,
  customer_id,
  event_type,
  payload,
  event_timestamp
FROM `my_project.raw_migration.snowflake_import`;
```
*Cites: [This migration from Snowflake to BigQuery accelerated model building and cut costs in half](./references/articles.md) and [How We Cut BigQuery Costs by 35% During a Teradata-to-GCP Migration](./references/articles.md)*

---

### Blueprint 4: Registering Databricks Delta Lake in BigQuery via BigLake External Table [06.25]
Query Databricks Delta Lake parquet files directly in BigQuery without moving or duplicating data:
```sql
CREATE EXTERNAL TABLE `my_project.analytics.databricks_delta_lake_external`
WITH CONNECTION `us-central1.delta_lake_connection`
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://migrated-databricks-delta-lake/sales_table/*'],
  max_staleness = INTERVAL 30 MINUTE
);
```
*Cites: [Migrating Databricks to BigQuery](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[06.26]**: Vertex AI Agent Builder migration mapping to Gemini Enterprise Agent Platform (GEAP).
- **[12.25]**: Passwordless Workload Identity Federation for Azure AKS; Database Migration Service directives.
- **[10.25]**: Migrating Databricks Delta Lake tables to Cloud Storage using Storage Transfer Service.
- **[07.25]**: Slashing query costs by 35% in Teradata-to-BigQuery migrations; Snowflake-to-BigQuery modernization.
- **[06.25]**: Databricks to BigQuery migration with Delta Sharing and BigLake.
- **[04.25]**: Multi-cloud migration playbook from AWS provider to GCP.
- **[01.25]**: Cloud migrations made easy: official Google Cloud AWS-to-GCP architectural blueprints.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Multi-Cloud Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
