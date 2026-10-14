---
name: gcp-pubsub
description: Google Cloud Pub/Sub, Pub/Sub Lite migration, Eventarc, Managed Service for Apache Kafka, in-flight Single-Message Transforms (SMTs), BigQuery/GCS direct export subscriptions, exactly-once delivery, ordering keys, and Dead-Letter Queues (DLQs). Activate when architecting event-driven messaging, streaming ingestion, or decoupling asynchronous AI agent workflows.
---

# 📨 Google Cloud Pub/Sub & Event-Driven Architecture Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Designing event-driven messaging, asynchronous pub/sub fan-out, or streaming data ingestion on **Google Cloud Pub/Sub**.
- Migrating retired **Pub/Sub Lite** (`google_pubsub_lite_*`) workloads to standard **Cloud Pub/Sub** or **Google Cloud Managed Service for Apache Kafka**.
- Implementing **In-Flight Single-Message Transforms (SMTs)** using JavaScript UDFs for PII redaction or schema reshaping.
- Configuring zero-compute **Direct BigQuery Subscriptions** (`bigquery_config`) or **Cloud Storage Export Subscriptions** (`cloud_storage_config`).
- Decoupling long-running **ADK / Vertex AI Agent** pipelines on Cloud Run or GKE using Push/Pull subscriptions, **Dead-Letter Queues (DLQs)**, **Exponential Backoff**, **Exactly-Once Delivery**, and **Ordering Keys**.
- Routing 130+ Google Cloud Audit Log and native storage/database events via **Eventarc** triggers backed by Pub/Sub transport topics.

> **Dynamic Cutoff-Relative Calibration**: Tiers are computed dynamically relative to the active model's cutoff date ($\Delta_m = \text{Article}_{\text{YYYYMM}} - \text{Cutoff}_{\text{YYYYMM}}$):
> - **Dynamic Tier 1 (Post-Cutoff Delta, $\Delta_m > 0$)**: Mandatory context injection for post-cutoff capabilities.
> - **Dynamic Tier 2 (Boundary & Maturation Window, $-12 \le \Delta_m \le 0$)**: High-priority verification for Preview-to-GA syntax transitions (SMTs, GCS Export Subscriptions, Pub/Sub Lite retirement).
> - **Dynamic Tier 3 (Timeless Foundations, $\Delta_m < -12$)**: Consulted for throughput/latency crossover math and core delivery guarantees.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Provisioning Deprecated Pub/Sub Lite Resources [06.25]**
> - **Trap**: Creating `google_pubsub_lite_topic`, `google_pubsub_lite_subscription`, or `google_pubsub_lite_reservation` in new Terraform configurations.
> - **Blast Radius**: Pub/Sub Lite is officially retired; zonal reservations fail provisioning in modern projects and lack SMTs, direct BigQuery/GCS sinks, and global auto-scaling.
> - **Mandate**: Migrate simple streaming workloads to standard **Cloud Pub/Sub** (`google_pubsub_topic`) or migrate strict Kafka consumer-group offset workloads to **Google Cloud Managed Service for Apache Kafka** (`google_managed_kafka_cluster`).
> *Cites: [Pub/Sub Lite to Pub/Sub migration guide and best practices](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Deploying Compute Intermediaries for Simple Sink Ingestion or Field Masking [04.25, 07.25, 11.24]**
> - **Trap**: Deploying Cloud Functions, Cloud Run services, or Dataflow streaming jobs solely to mask a PII field, drop an attribute, or write raw Pub/Sub payloads into BigQuery or Cloud Storage.
> - **Blast Radius**: Adds $\$150\text{–}\$1,200/\text{month}$ in unnecessary serverless/Dataflow compute, doubles end-to-end ingestion latency, and introduces IAM and container maintenance overhead.
> - **Mandate**: Use **In-Flight Single-Message Transforms (SMTs)** (`message_transforms` with `javascript_udf`) for lightweight payload mutation/PII masking, and use **Direct BigQuery Subscriptions** (`bigquery_config`) or **Cloud Storage Export Subscriptions** (`cloud_storage_config`) for sink delivery.
> *Cites: [Introducing Pub/Sub Single-Message Transforms (SMTs)](./references/articles.md), [Announcing general availability of Pub/Sub exports to Cloud Storage](./references/articles.md), [Direct BigQuery subscriptions in Cloud Pub/Sub: Performance at scale](./references/archive.md)*

> [!CAUTION]
> **Anti-Pattern 3: Omitting Dead-Letter Queues (DLQs) and Backoff on AI Agent Push Subscriptions [05.25, 06.24]**
> - **Trap**: Attaching a Pub/Sub Push Subscription to a Cloud Run AI agent endpoint with default `ack_deadline_seconds = 10` and no `dead_letter_policy` or `retry_policy`.
> - **Blast Radius**: LLM reasoning and tool invocations frequently require $15\text{–}120\text{ seconds}$. A 10-second ack deadline causes Pub/Sub to prematurely NACK and redeliver the message while the first container is still executing, triggering an exponential **Duplicate Token Spend & Retry Storm** that exhausts Vertex AI quotas.
> - **Mandate**: Always set `ack_deadline_seconds` to exceed the P99 agent execution duration (up to `600` seconds), configure `retry_policy` (`minimum_backoff = "10s"`, `maximum_backoff = "600s"`), and attach a `dead_letter_policy` (`max_delivery_attempts = 5`) with explicit `roles/pubsub.publisher` (on the DLQ topic) and `roles/pubsub.subscriber` (on the source subscription) granted to the project's Pub/Sub service agent (`service-<PROJECT_NUMBER>@gcp-sa-pubsub.iam.gserviceaccount.com`).
> *Cites: [Building resilient AI agent pipelines with Pub/Sub and Cloud Run](./references/articles.md), [Configuring Dead-Letter Topics and Exponential Backoff in Pub/Sub](./references/archive.md)*

> [!WARNING]
> **Anti-Pattern 4: Combining High-Cardinality Ordering Keys with High-Latency Downstream Workers [09.24, 08.25]**
> - **Trap**: Enabling `enable_message_ordering = true` with a coarse ordering key (e.g., `region` or `tenant_id`) on a subscription processed by slow LLM or external API workers without DLQ isolation.
> - **Blast Radius**: Under Pub/Sub's strict ordering contract, a single failed or slow message blocks delivery of **all subsequent messages sharing that ordering key** (Head-of-Line Blocking), stalling throughput for the entire tenant.
> - **Mandate**: Scope ordering keys to the finest possible entity grain (e.g., `session_id` or `device_id`) and pair with `dead_letter_policy` so poison messages are evicted after `max_delivery_attempts` rather than permanently wedging the key partition.
> *Cites: [Mastering Pub/Sub Exactly-Once Delivery and Ordering Keys](./references/archive.md), [Powering event-driven architectures with Google Cloud Pub/Sub](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 5: Assuming Push Subscriptions Provide Pull-Level Exactly-Once Lease Guarantees [09.24, 05.25]**
> - **Trap**: Attempting to rely on `enable_exactly_once_delivery = true` for HTTP Push endpoints without idempotency keys, or assuming Push subscriptions support the Pull exactly-once lease extension API.
> - **Blast Radius**: Network partitions or HTTP 504 timeouts between the Pub/Sub push proxy and Cloud Run can still produce duplicate deliveries if the downstream handler is not idempotent.
> - **Mandate**: Use **Pull Subscriptions** (Cloud Run Worker Pools or GKE consumers) when strict Pub/Sub `enable_exactly_once_delivery = true` semantics are required, or enforce idempotency keys (`message.message_id`) in Redis/Firestore/AlloyDB when using Push Subscriptions.
> *Cites: [Mastering Pub/Sub Exactly-Once Delivery and Ordering Keys](./references/archive.md), [Building resilient AI agent pipelines with Pub/Sub and Cloud Run](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 6: Polling Cloud Audit Logs Instead of Eventarc + Pub/Sub Transport [02.24]**
> - **Trap**: Running scheduled cron jobs to poll Cloud Logging or resource APIs to detect bucket uploads, BigQuery job completions, or IAM mutations.
> - **Blast Radius**: Wastes API quota, introduces polling delay ($1\text{–}15\text{ minutes}$), and drops burst events.
> - **Mandate**: Configure **Eventarc Triggers** (`google_eventarc_trigger`) backed by Pub/Sub transport topics to declaratively route 130+ Google Cloud event sources with sub-second push/pull delivery.
> *Cites: [Eventarc and Pub/Sub: Routing 130+ Google Cloud Event Sources](./references/archive.md)*

---

## 🧭 Architecture Decision Matrices

### 1. Messaging & Streaming Platform Selection Matrix [03.25, 06.25, 02.24]

| Workload Requirement | Recommended GCP Service | Key Architectural Justification | FinOps & Throughput Crossover Math |
| :--- | :--- | :--- | :--- |
| **Global Event Decoupling, Serverless Fan-Out, AI Agent Task Queues** | **Cloud Pub/Sub** | Zero-ops global auto-scaling, native Push/Pull, in-flight SMTs, and zero-code BigQuery/GCS export subscriptions. | Pay-per-GiB ingested ($\approx \$40/\text{TiB}$ after free tier); $0$ idle cluster cost at low/bursty duty cycles. |
| **Strict Apache Kafka API Compatibility, Offset Replay, Consumer Groups** | **Google Cloud Managed Service for Apache Kafka** | 100% Kafka protocol compatibility, multi-year offset retention, and seamless lift-and-shift for existing Kafka clients. | Economical when sustained streaming throughput exceeds **15–20 MB/s continuous** where broker vCPU/RAM reservation beats per-TiB Pub/Sub pricing. |
| **Legacy Zonal Partitioned Messaging (`Pub/Sub Lite`)** | **DEPRECATED $\to$ Migrate to Pub/Sub or Managed Kafka** | Pub/Sub Lite is retired (`[06.25]`). Do not provision in new architectures. | Migrate spiky/serverless workloads to **Pub/Sub**; migrate high-volume stateful partition replay workloads to **Managed Kafka**. |
| **130+ GCP Service & Audit Log Event Routing** | **Eventarc (Pub/Sub Transport)** | Declarative CloudEvents filtering over Cloud Audit Logs, GCS object events, and custom sources. | Eliminates custom log-router polling compute. |

*Cites: [Google Cloud Managed Service for Apache Kafka vs. Cloud Pub/Sub](./references/articles.md), [Pub/Sub Lite to Pub/Sub migration guide and best practices](./references/articles.md), [Eventarc and Pub/Sub: Routing 130+ Google Cloud Event Sources](./references/archive.md)*

### 2. Subscription Delivery & Sink Architecture Matrix [07.25, 11.24, 08.25]

| Downstream Target & Latency SLA | Subscription Mode | Required Configuration | When to Avoid |
| :--- | :--- | :--- | :--- |
| **Analytical Warehouse Ingestion (`< 5s` latency)** | **Direct BigQuery Subscription** (`bigquery_config`) | `use_topic_schema = true`, `write_metadata = true`, `drop_unknown_fields = true` + DLQ topic. | Complex multi-stream windowed joins (use Dataflow instead). |
| **Data Lake / Cold Archive / Batch Replay** | **Direct Cloud Storage Export** (`cloud_storage_config`) | `avro_config { write_metadata = true }`, `max_duration = "300s"`, `max_bytes = 104857600` (100 MB). | Sub-second transactional triggers. |
| **Spiky Serverless HTTP Microservices (`< 60s` work)** | **Authenticated Push Subscription** (`push_config`) | `oidc_token` with least-privilege invoker SA, `ack_deadline_seconds = 120`, `retry_policy`, and `dead_letter_policy`. | Long-running LLM tasks $> 10\text{ min}$ or strict `enable_exactly_once_delivery`. |
| **Long-Running AI Agents, GPU/TPU Batch Workers, Strictly-Once Consumers** | **Streaming Pull Subscription** (Cloud Run Worker Pool / GKE) | `enable_exactly_once_delivery = true`, client-side lease extension (`max_extension_period`), Cloud Run `--no-cpu-throttling`. | Zero-traffic endpoints that must scale to 0 instances (use Push or KEDA/Cloud Run Jobs). |

*Cites: [Announcing general availability of Pub/Sub exports to Cloud Storage](./references/articles.md), [Direct BigQuery subscriptions in Cloud Pub/Sub: Performance at scale](./references/archive.md), [Powering event-driven architectures with Google Cloud Pub/Sub](./references/articles.md)*

### 3. Cross-Domain Cloud Run $\leftrightarrow$ Pub/Sub Timeout & Concurrency Alignment Matrix [05.25, 06.24]

| Parameter | Pub/Sub Subscription Setting | Cloud Run Service / Worker Setting | Little's Law & Stability Constraint |
| :--- | :--- | :--- | :--- |
| **Request / Lease Timeout** | `ack_deadline_seconds` ($T_{\text{ack}} \in [10, 600]$) | `timeout` ($T_{\text{run}}$) | Enforce $T_{\text{ack}} \ge P_{99}(\text{Execution}) + 30\text{s}$ and $T_{\text{run}} \ge T_{\text{ack}}$ to prevent premature redelivery storms. |
| **CPU Allocation** | Push or Pull Delivery | `cpu_idle = false` (`--no-cpu-throttling`) | Mandatory if the handler spawns background threads, async callbacks, or OpenTelemetry batch spans after HTTP 200 ACK. |
| **Max Instance Concurrency** | Push Delivery Rate ($\lambda$) | `max_instance_request_concurrency` ($C$) & `max_instance_count` ($N_{\max}$) | Enforce $N_{\max} \times C \ge \lambda \times W$ (where $W$ is mean processing time in seconds); otherwise excess push messages receive HTTP 429/503 and trigger backoff. |

*Cites: [Building resilient AI agent pipelines with Pub/Sub and Cloud Run](./references/articles.md), [Configuring Dead-Letter Topics and Exponential Backoff in Pub/Sub](./references/archive.md)*

---

## 🏗️ Production Blueprints

### Blueprint 1: Terraform — Pub/Sub Topic with In-Flight SMT (PII Redaction) & Direct BigQuery Subscription [04.25, 11.24]
Eliminates intermediary Cloud Functions/Dataflow by executing a JavaScript UDF Single-Message Transform (SMT) in-flight and streaming validated records directly into BigQuery with Dead-Letter Queue (DLQ) protection.
*Cites: [Introducing Pub/Sub Single-Message Transforms (SMTs)](./references/articles.md), [Direct BigQuery subscriptions in Cloud Pub/Sub: Performance at scale](./references/archive.md)*

```hcl
resource "google_pubsub_schema" "agent_telemetry_schema" {
  name       = "agent-telemetry-avro"
  type       = "AVRO"
  definition = jsonencode({
    type = "record"
    name = "AgentTelemetry"
    fields = [
      { name = "event_id", type = "string" },
      { name = "session_id", type = "string" },
      { name = "user_email", type = ["null", "string"], default = null },
      { name = "latency_ms", type = "long" },
      { name = "model_id", type = "string" }
    ]
  })
}

resource "google_pubsub_topic" "agent_telemetry" {
  name = "agent-telemetry-events"

  schema_settings {
    schema   = google_pubsub_schema.agent_telemetry_schema.id
    encoding = "JSON"
  }

  # [04.25] In-Flight Single-Message Transform (SMT) for PII Redaction
  message_transforms {
    javascript_udf {
      function_name = "redactUserEmail"
      code          = <<-EOF
        function redactUserEmail(message, metadata) {
          const data = JSON.parse(message.data);
          if (data.user_email) {
            data.user_email = "[REDACTED_BY_PUBSUB_SMT]";
          }
          message.data = JSON.stringify(data);
          return message;
        }
      EOF
    }
  }

  labels = {
    environment = "production"
    team        = "platform-data"
    managed_by  = "terraform"
  }
}

resource "google_pubsub_topic" "agent_telemetry_dlq" {
  name = "agent-telemetry-dlq"
  labels = {
    environment = "production"
    team        = "platform-data"
    managed_by  = "terraform"
  }
}

resource "google_pubsub_subscription" "agent_telemetry_to_bq" {
  name  = "agent-telemetry-bq-Export"
  topic = google_pubsub_topic.agent_telemetry.id

  # [11.24] Zero-Compute Direct BigQuery Ingestion
  bigquery_config {
    table               = "${var.project_id}.${var.bq_dataset}.agent_telemetry"
    use_topic_schema    = true
    write_metadata      = true
    drop_unknown_fields = true
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.agent_telemetry_dlq.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  labels = {
    environment = "production"
    team        = "platform-data"
    managed_by  = "terraform"
  }
}
```

### Blueprint 2: Terraform — Resilient AI Agent Push Pipeline to Cloud Run with OIDC, DLQ & Service Agent IAM [05.25, 06.24]
Configures an authenticated Pub/Sub Push Subscription to invoke a Cloud Run ADK Agent endpoint with extended 600s acknowledgement deadlines, exponential backoff, and mandatory DLQ IAM bindings.
*Cites: [Building resilient AI agent pipelines with Pub/Sub and Cloud Run](./references/articles.md), [Configuring Dead-Letter Topics and Exponential Backoff in Pub/Sub](./references/archive.md)*

```hcl
data "google_project" "current" {}

resource "google_service_account" "pubsub_push_invoker" {
  account_id   = "pubsub-agent-push-invoker"
  display_name = "Pub/Sub Push Invoker for Cloud Run Agent"
}

# Additive IAM: Allow Invoker SA to invoke Cloud Run service
resource "google_cloud_run_v2_service_iam_member" "allow_pubsub_push" {
  project  = var.project_id
  location = var.region
  name     = var.cloud_run_agent_name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.pubsub_push_invoker.email}"
}

resource "google_pubsub_subscription" "agent_task_push" {
  name  = "agent-async-task-push-sub"
  topic = google_pubsub_topic.agent_telemetry.id

  # Match long-running AI agent execution profile (up to 10 minutes)
  ack_deadline_seconds = 600

  push_config {
    push_endpoint = var.cloud_run_agent_uri
    oidc_token {
      service_account_email = google_service_account.pubsub_push_invoker.email
    }
  }

  retry_policy {
    minimum_backoff = "15s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.agent_telemetry_dlq.id
    max_delivery_attempts = 5
  }

  labels = {
    environment = "production"
    team        = "ai-agents"
    managed_by  = "terraform"
  }
}

# Mandatory DLQ IAM: Grant Pub/Sub Service Agent permission to publish to DLQ and ack source messages
resource "google_pubsub_topic_iam_member" "dlq_publisher" {
  topic  = google_pubsub_topic.agent_telemetry_dlq.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_pubsub_subscription_iam_member" "dlq_subscriber" {
  subscription = google_pubsub_subscription.agent_telemetry_to_bq.id
  role         = "roles/pubsub.subscriber"
  member = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}
```

### Blueprint 3: Terraform — Direct Cloud Storage Avro Export Subscription for Lakehouse Archival [07.25, 08.25]
Uses GA Cloud Storage Export Subscriptions (`[07.25]`) to batch streaming events into Avro files in GCS without Dataflow compute.
*Cites: [Announcing general availability of Pub/Sub exports to Cloud Storage](./references/articles.md), [Powering event-driven architectures with Google Cloud Pub/Sub](./references/articles.md)*

```hcl
resource "google_pubsub_subscription" "agent_telemetry_to_gcs_avro" {
  name  = "agent-telemetry-gcs-avro-export"
  topic = google_pubsub_topic.agent_telemetry.id

  # [07.25] Direct GCS Export Subscription in Avro format
  cloud_storage_config {
    bucket          = var.archive_bucket_name
    filename_prefix = "telemetry/avro/year={year}/month={month}/day={day}/event-"
    filename_suffix = ".avro"
    max_duration    = "300s"
    max_bytes       = 104857600 # 100 MB batch rollover

    avro_config {
      write_metadata   = true
      use_topic_schema = true
    }
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.agent_telemetry_dlq.id
    max_delivery_attempts = 5
  }

  labels = {
    environment = "production"
    team        = "platform-data"
    managed_by  = "terraform"
  }
}
```

### Blueprint 4: Python — High-Throughput Streaming Pull Consumer with Exactly-Once Delivery & Ordering Keys [09.24, 08.25]
Implements a production Python consumer using `google-cloud-pubsub` with regional endpoint routing, `enable_exactly_once_delivery` ACK confirmation callbacks, and flow-control memory bounding.
*Cites: [Mastering Pub/Sub Exactly-Once Delivery and Ordering Keys](./references/archive.md), [Powering event-driven architectures with Google Cloud Pub/Sub](./references/articles.md)*

```python
import os
from concurrent.futures import TimeoutError
from google.cloud import pubsub_v1
from google.cloud.pubsub_v1.types import FlowControl

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
SUBSCRIPTION_ID = os.environ.get("PUBSUB_SUBSCRIPTION_ID", "agent-ordered-pull-sub")
REGION = os.environ.get("GOOGLE_CLOUD_REGION", "us-central1")

# Regional endpoint required for strict ordering / low-latency regional isolation
client_options = {"api_endpoint": f"{REGION}-pubsub.googleapis.com:443"}
subscriber = pubsub_v1.SubscriberClient(client_options=client_options)
subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)


def ack_result_callback(ack_future) -> None:
    """Verifies Exactly-Once Delivery ACK confirmation from the Pub/Sub server."""
    try:
        ack_future.result()
    except Exception as exc:
        # Under Exactly-Once Delivery, transient ACK failures are surfaced explicitly
        print(f"[WARN] Exactly-once ACK failed or lease expired: {exc}")


def handle_message(message: pubsub_v1.subscriber.message.Message) -> None:
    try:
        ordering_key = message.ordering_key
        print(f"Processing message {message.message_id} [key={ordering_key}]")
        # Execute idempotent business logic here
        ack_future = message.ack_with_response()
        ack_future.add_done_callback(ack_result_callback)
    except Exception as err:
        print(f"[ERROR] Failed processing {message.message_id}, NACKing for backoff retry: {err}")
        message.nack()


def run_worker() -> None:
    # Bound in-flight memory and concurrency per worker pod
    flow_control = FlowControl(
        max_messages=100,
        max_bytes=50 * 1024 * 1024,  # 50 MiB
        max_lease_duration=600,      # 10 min max lease for long-running AI agent tasks
    )
    streaming_pull_future = subscriber.subscribe(
        subscription_path,
        callback=handle_message,
        flow_control=flow_control,
    )
    print(f"Listening for messages on {subscription_path}...")
    with subscriber:
        try:
            streaming_pull_future.result()
        except TimeoutError:
            streaming_pull_future.cancel()
            streaming_pull_future.result()


if __name__ == "__main__":
    run_worker()
```

### Blueprint 5: Terraform — Eventarc Cloud Storage Trigger with Pub/Sub Transport & Managed Kafka Migration Boundary [02.24, 03.25, 06.25]
Routes Cloud Storage object creation events declaratively via Eventarc + Pub/Sub to a Cloud Run worker while documenting the Managed Service for Apache Kafka configuration for offset-replay workloads.
*Cites: [Eventarc and Pub/Sub: Routing 130+ Google Cloud Event Sources](./references/archive.md), [Google Cloud Managed Service for Apache Kafka vs. Cloud Pub/Sub](./references/articles.md), [Pub/Sub Lite to Pub/Sub migration guide and best practices](./references/articles.md)*

```hcl
resource "google_eventarc_trigger" "gcs_document_ingest" {
  name     = "gcs-document-ingest-trigger"
  location = var.region

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = var.ingest_bucket_name
  }

  destination {
    cloud_run_service {
      service = var.cloud_run_agent_name
      region  = var.region
      path    = "/events/gcs-finalized"
    }
  }

  service_account = google_service_account.pubsub_push_invoker.email

  labels = {
    environment = "production"
    team        = "ai-agents"
    managed_by  = "terraform"
  }
}
```

---

## ⏱️ Chronological Evolution & Architectural Milestones

- **[08.25]**: **Event-Driven AI & Enterprise Streaming Patterns** — Standardized high-throughput Pub/Sub patterns combining schema validation, in-flight SMTs, and zero-code export sinks.
- **[07.25]**: **Pub/Sub Export Subscriptions to Cloud Storage (GA)** — Native no-code batching of Pub/Sub streams directly into Cloud Storage buckets in **Avro** or **Text** format without Dataflow or Cloud Run workers.
- **[06.25]**: **Pub/Sub Lite Retirement & Migration Mandate** — Official deprecation and turn-down path for Pub/Sub Lite (`google_pubsub_lite_topic` / `google_pubsub_lite_subscription`). Migrate partition-based workloads to either standard **Cloud Pub/Sub** or **Google Cloud Managed Service for Apache Kafka**.
- **[05.25]**: **Resilient AI Agent Pipelines with Pub/Sub & Cloud Run** — Decoupling long-running ADK / LLM inference workflows from synchronous HTTP timeouts using push subscriptions, Dead-Letter Topics (DLQs), and extended ack deadlines (`ack_deadline_seconds = 600`).
- **[04.25]**: **In-Flight Single-Message Transforms (SMTs)** — Native JavaScript UDF transformations executed directly inside the Pub/Sub topic/subscription pipeline for lightweight field redaction, PII masking, and schema reshaping without external compute.
- **[03.25]**: **Google Cloud Managed Service for Apache Kafka vs. Cloud Pub/Sub** — Architectural decision boundary between Partitioned Offset Logs (Managed Kafka) and Global Auto-Scaling Message Queues (Cloud Pub/Sub).
- **[11.24]**: **Direct BigQuery Subscriptions at Scale** — High-throughput, zero-compute streaming ingestion from Pub/Sub directly into BigQuery tables using topic schema mapping (`use_topic_schema = true`) and metadata injection.
- **[09.24]**: **Exactly-Once Delivery & Ordering Keys** — Enabling regional `enable_exactly_once_delivery = true` on pull subscriptions and managing head-of-line blocking tradeoffs when `enable_message_ordering = true`.
- **[06.24]**: **Dead-Letter Topics (DLQs) & Exponential Backoff** — Preventing infinite poison-pill retry loops with `dead_letter_policy` and `retry_policy` (`minimum_backoff`, `maximum_backoff`).
- **[02.24]**: **Eventarc & Pub/Sub Unified Event Routing** — Routing 130+ Google Cloud Audit Log and direct service events via Eventarc triggers backed by Cloud Pub/Sub transport topics.

## 📚 Reference Vaults
* **Active Post-Cutoff Delta Vault (2025–2026)**: [articles.md](./references/articles.md)
* **Evergreen Foundations & Historical Archive (<= 2024)**: [archive.md](./references/archive.md)
