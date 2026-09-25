---
name: gcp-databases
description: >-
  Cloud SQL (PostgreSQL/MySQL) performance tuning, autoscaling read pools, Firestore Pipelines,
  AlloyDB AI ScaNN vector indexes, Persistent Disk / Hyperdisk sizing, and Database MCP servers.
  Activate when tuning database throughput, configuring database replication, or architecting operational databases for AI.
---

# GCP Databases, Cloud SQL & Firestore Performance Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Tuning PostgreSQL or MySQL write throughput, transaction commit latency, and autovacuum on **Cloud SQL**.
- Scaling read traffic dynamically using **Cloud SQL Autoscaling Read Pools**.
- Executing cross-collection joins, full-text search, and vector search natively in **Cloud Firestore** via **Firestore Pipelines**.
- Deploying hybrid transactional and analytical (HTAP) systems or fast vector search using **AlloyDB AI** with ScaNN indexes.
- Sizing block storage volumes across **Hyperdisk Balanced**, **Hyperdisk Extreme**, and **Persistent Disk (PD)** tiers.
- Connecting AI agents securely to operational databases using the official **Cloud SQL Remote MCP Server** or **Firestore MCP Server**.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Default PostgreSQL Checkpoint & Autovacuum Traps on Cloud SQL [03.26]**
> Out-of-the-box Cloud SQL PostgreSQL settings use conservative checkpoint and autovacuum defaults. On write-heavy ingestion workloads, checkpoints trigger every few minutes, forcing intensive dirty buffer disk flushes that spike IOPS and freeze concurrent transactions.
> - **Mandatory Fix**: Set `checkpoint_completion_target = 0.9`, scale `max_wal_size` up to `16GB`, and reduce `autovacuum_vacuum_scale_factor` to `0.05` to prevent aggressive table bloat.
> *Cites: [Cloud SQL 3x Write Throughput Optimization](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Unbuffered MySQL InnoDB Write Bottlenecks [01.26]**
> Running MySQL on Cloud SQL without tuning the redo log capacity and flush semantics caps batch ingestion at a fraction of available hardware capacity.
> - **Solution**: Migrate from deprecated `innodb_log_file_size` to dynamic `innodb_redo_log_capacity`, configure `innodb_write_io_threads = 8`, and adjust `innodb_flush_log_at_trx_commit = 2` during large data imports.
> *Cites: [Unlocking 3x Write Performance: A Deep Dive into Cloud SQL MySQL Optimizations](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Static Manual Read Replicas vs Autoscaling Read Pools [03.26]**
> Provisioning static Cloud SQL read replicas for handling peak business hours wastes thousands of dollars during idle overnight windows. Additionally, client applications must implement custom DNS round-robin or client-side connection pooling to balance queries across replicas.
> - **Solution**: Deploy **Cloud SQL Autoscaling Read Pools**, which dynamically add/remove replicas based on real-time CPU utilization and provide a single load-balanced reader endpoint.
> *Cites: [Streamline read scalability with Cloud SQL autoscaling read pools](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Duplicating Firestore NoSQL Data to BigQuery for Simple JOINs [04.26]**
> Building complex continuous ETL pipelines to sync Firestore collections into BigQuery purely to perform entity lookups or vector searches adds infrastructure complexity, latency lag, and unnecessary BigQuery slot costs.
> - **Solution**: Use **Firestore Pipelines GA**, which brings native joins, aggregations, and HNSW vector search directly into Firestore.
> *Cites: [Firestore levels up: Bringing the power of search and JOINs to NoSQL](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 5: Sizing Persistent Disk Capacity Purely for IOPS Headroom [11.25]**
> On standard Persistent Disks (`pd-ssd`), IOPS scale linearly with disk size (30 IOPS per GB). Over-provisioning multi-terabyte disks solely to get higher IOPS wastes storage budget.
> - **Solution**: Transition to **Hyperdisk Balanced**, which allows decoupling storage capacity (GB) from provisioned IOPS and throughput (MB/s).
> *Cites: [Google Cloud Persistent Disks: A Comprehensive Tutorial](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Operational Database Engine Selection Matrix
| Workload Requirement | Cloud SQL (PostgreSQL/MySQL) | AlloyDB for PostgreSQL | Cloud Spanner |
| :--- | :--- | :--- | :--- |
| **Primary Architecture** | Managed single-node with HA replica | Disaggregated compute/storage engine | Globally distributed multi-region database |
| **Max Scale** | Up to 128 vCPUs, 64 TB storage | Up to 128 vCPUs, dynamically scaling | Virtually unlimited compute & petabyte storage |
| **Transaction Latency** | 1–3ms local regional | < 1ms transactional, columnar engine | Single-digit ms globally synchronized (TrueTime) |
| **Vector Search (RAG)** | `pgvector` extension (IVFFlat, HNSW) | **ScaNN vector index (up to 10x faster)** | Built-in Spanner vector search |
| **Best For** | Standard web apps, microservices, CMS | Enterprise HTAP, high-throughput RAG | Global SaaS, global consistency, high scale |

---

### 2. Block Storage Tier Matrix (Persistent Disk vs Hyperdisk) [11.25]
| Storage Tier | Max IOPS / Volume | Max Throughput | IOPS Provisioning Mode | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **pd-standard** | 7,500 | 1,200 MB/s | Coupled to capacity | Cold data, large sequential batch logs |
| **pd-balanced** | 80,000 | 1,200 MB/s | Coupled to capacity (6 IOPS/GB) | General VM boot disks, dev databases |
| **pd-ssd** | 100,000 | 1,200 MB/s | Coupled to capacity (30 IOPS/GB) | High-performance operational databases |
| **Hyperdisk Balanced** | **500,000** | **4,000 MB/s** | **Independently provisioned** | Modern Cloud SQL & GCE production databases |
| **Hyperdisk Extreme** | **1,000,000** | **10,000 MB/s** | **Independently provisioned** | Ultra-demanding SAP HANA, high-frequency finance |
*Cites: [Google Cloud Persistent Disks: A Comprehensive Tutorial](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Cloud SQL PostgreSQL High-Performance Parameter Patch [03.26]
Apply production-grade checkpoint, WAL, and autovacuum flags using `gcloud`:
```bash
gcloud sql instances patch prod-pg-instance \
    --project=my-prod-project \
    --database-flags \
    checkpoint_completion_target=0.9,\
    max_wal_size=16777216,\
    checkpoint_timeout=900,\
    autovacuum_vacuum_scale_factor=0.05,\
    autovacuum_analyze_scale_factor=0.02,\
    autovacuum_vacuum_cost_limit=1000,\
    shared_buffers=16777216,\
    work_mem=65536
```
*Cites: [Cloud SQL 3x Write Throughput Optimization](./references/articles.md)*

---

### Blueprint 2: Cloud SQL MySQL 8.0 Write Throughput Flags [01.26]
Optimize InnoDB redo log flushing and thread allocation for high-ingestion MySQL instances:
```bash
gcloud sql instances patch prod-mysql-instance \
    --project=my-prod-project \
    --database-flags \
    innodb_redo_log_capacity=17179869184,\
    innodb_buffer_pool_size=34359738368,\
    innodb_write_io_threads=8,\
    innodb_read_io_threads=8,\
    innodb_flush_neighbors=0,\
    innodb_io_capacity=10000,\
    innodb_io_capacity_max=20000
```
*Cites: [Unlocking 3x Write Performance: A Deep Dive into Cloud SQL MySQL Optimizations](./references/articles.md)*

---

### Blueprint 3: Cloud SQL Autoscaling Read Pool with Terraform [03.26]
Provision an autoscaling read replica pool that automatically balances read spikes under a single DNS endpoint:
```hcl
resource "google_sql_database_instance" "primary" {
  name             = "prod-primary-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-8-32768"
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_network_id
    }
  }
}

# Autoscaling Read Pool resource
resource "google_sql_database_instance" "read_pool" {
  name                 = "prod-read-pool"
  master_instance_name = google_sql_database_instance.primary.name
  database_version     = "POSTGRES_15"
  region               = "us-central1"

  replica_configuration {
    failover_target = false
  }

  settings {
    tier = "db-custom-8-32768"
    
    # Read pool autoscaler configuration
    read_pool_autoscaling {
      min_node_count = 2
      max_node_count = 10
      target_cpu_utilization = 0.70 # Scale out when CPU exceeds 70%
    }
  }
}
```
*Cites: [Streamline read scalability with Cloud SQL autoscaling read pools](./references/articles.md)*

---

### Blueprint 4: Firestore Pipelines: Cross-Collection JOIN and Vector Search [04.26]
Execute native queries joining collections and finding nearest vector neighbors directly in Firestore NoSQL:
```python
from google.cloud import firestore
from google.cloud.firestore_v1.vector import Vector

db = firestore.Client(project="my-project")

# Query products collection with vector search
query_vector = Vector([0.024, -0.115, 0.452, 0.821]) # 768-dim embedding
products_ref = db.collection("products")

# Find 5 nearest neighbors using cosine distance
vector_query = products_ref.find_nearest(
    vector_field="embedding",
    query_vector=query_vector,
    distance_measure=firestore.DistanceMeasure.COSINE,
    limit=5
)

results = vector_query.get()
for doc in results:
    print(f"Product: {doc.to_dict()['name']}, Distance: {doc.get('distance')}")
```
*Cites: [Firestore levels up: Bringing the power of search and JOINs to NoSQL](./references/articles.md)*

---

### Blueprint 5: AlloyDB ScaNN Vector Index Creation [04.26]
Create an ultra-high performance Google ScaNN index on AlloyDB for vector retrieval:
```sql
-- Connect to AlloyDB PostgreSQL database with pgvector and alloydb_scann extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS alloydb_scann;

-- Create ScaNN approximate nearest neighbor index
CREATE INDEX idx_knowledge_embeddings ON corporate_knowledge
USING scann (embedding cosine)
WITH (
  num_leaves = 1000,
  quantizer = 'sq8'
);

-- Query nearest vectors
SELECT doc_id, content
FROM corporate_knowledge
ORDER BY embedding <=> '[0.012, 0.451, -0.219, ...]'
LIMIT 5;
```
*Cites: [Building a Scalable RAG Backend with Cloud Run Jobs and AlloyDB](./references/articles.md)*

---

### Blueprint 6: Cloud SQL Remote MCP Server for Agent Tool Calling [02.26]
Run the official Cloud SQL MCP server with IAM Workload Identity:
```json
{
  "mcpServers": {
    "cloudsql": {
      "command": "npx",
      "args": [
        "-y",
        "@google/mcp-cloudsql",
        "--instance=my-project:us-central1:prod-primary-db",
        "--database=ecommerce",
        "--read-only=true"
      ],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/secrets/db-agent-sa.json"
      }
    }
  }
}
```
*Cites: [Cloud SQL remote MCP Server in Action](./references/articles.md) and [Powering the next generation of agents with Google Cloud databases](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[04.26]**: Firestore Pipelines GA: native cross-collection joins, aggregations, and HNSW vector search in Firestore; MCP Toolbox v1.0.
- **[04.26]**: AlloyDB ScaNN vector index integration with Cloud Run Jobs RAG backends.
- **[03.26]**: Cloud SQL Autoscaling Read Pools with single load-balanced reader endpoint; Cloud SQL 3x PostgreSQL write throughput tuning.
- **[02.26]**: Cloud SQL Remote MCP Server and Firestore MCP Server release for agentic natural language database management.
- **[01.26]**: Cloud SQL MySQL 8.0 write performance optimization with redo log capacity and thread tuning.
- **[12.25]**: Firestore development with MCP and Gemini CLI integrations.
- **[11.25]**: Google Cloud Hyperdisk independent IOPS and throughput provisioning deep-dive.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Database Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
