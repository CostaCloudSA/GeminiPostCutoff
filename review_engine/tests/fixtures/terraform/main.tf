terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    snowflake = {
      source  = "Snowflake-Labs/snowflake"
      version = "~> 0.90"
    }
  }
}

# Undocumented Variable & Output (Pillar 1 violation)
variable "environment_tag" {
  type    = string
  default = "production"
}

output "cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}

# Anti-Pattern: Cloud Run Background Worker with CPU Throttling & Public Ingress
resource "google_cloud_run_v2_service" "async_worker" {
  name     = "pubsub-worker-service"
  location = "us-central1"
  template {
    scaling {
      cpu_idle = true
    }
    containers {
      image = "us-docker.pkg.dev/my-project/repo/worker:v1"
    }
  }
}

# Event-Driven Ingestion: Pub/Sub push subscription to Cloud Run worker
resource "google_pubsub_topic" "events" {
  name = "incoming-events-topic"
}

resource "google_pubsub_subscription" "worker_push" {
  name  = "events-to-worker"
  topic = google_pubsub_topic.events.id

  push_config {
    push_endpoint = "https://pubsub-worker-service-xyz.a.run.app/process"
  }
}

# Anti-Pattern: Legacy Serverless VPC Access Connector (Incurs idle VM fees & bottlenecks)
resource "google_vpc_access_connector" "legacy_connector" {
  name          = "vpc-conn"
  region        = "us-central1"
  ip_cidr_range = "10.8.0.0/28"
  network       = "default"
}

# GKE Cluster missing Dataplane V2, Private Master Endpoint, and Labels
resource "google_container_cluster" "primary" {
  name     = "app-cluster"
  location = "us-central1-a"
  initial_node_count = 3
}

# Anti-Pattern: Authoritative IAM Binding
resource "google_project_iam_binding" "cluster_admin" {
  project = "my-prod-project"
  role    = "roles/container.admin"
  members = ["user:dev@example.com"]
}

# Anti-Pattern: Static Service Account Key
resource "google_service_account_key" "ci_key" {
  service_account_id = "ci-deployer@my-prod-project.iam.gserviceaccount.com"
}

# Anti-Pattern: Unpartitioned Large BigQuery Table (FinOps full-scan risk)
resource "google_bigquery_table" "events_raw" {
  dataset_id = "analytics"
  table_id   = "events_raw"
  deletion_protection = false
}

# Observability Trap: Logging Sink lacking health check exclusions
resource "google_logging_project_sink" "audit_sink" {
  name        = "main-audit-sink"
  destination = "storage.googleapis.com/my-audit-bucket"
}

# Foreign Multi-Cloud Resources & Storage URIs (Triggers Pod 12)
resource "aws_s3_bucket" "data_lake" {
  bucket = "enterprise-legacy-data-lake"
}

resource "snowflake_database" "analytics" {
  name = "PROD_ANALYTICS"
}

locals {
  legacy_s3_backup     = "s3://enterprise-data-backup/archive"
  redshift_connection  = "jdbc:redshift://cluster.abc123xyz.us-east-1.redshift.amazonaws.com:5439/dev"
}
