terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  backend "gcs" {
    bucket = "prod-corp-tfstate"
    prefix = "terraform/prod/state"
  }
}

variable "project_id" {
  description = "The Google Cloud Project ID hosting production workloads"
  type        = string
  default     = "prod-enterprise-ai"
}

output "service_url" {
  description = "Direct HTTPS URI for the Cloud Run microservice"
  value       = google_cloud_run_v2_service.api_gateway.uri
}

# Production Standard: Cloud Run with Direct VPC Egress & continuous CPU
resource "google_cloud_run_v2_service" "api_gateway" {
  name     = "api-gateway"
  location = "us-central1"

  labels = {
    environment = "prod"
    team        = "platform"
    managed_by  = "terraform"
  }

  template {
    scaling {
      cpu_idle          = false
      min_instance_count = 1
      max_instance_count = 10
    }
    vpc_access {
      network_interfaces {
        network    = "projects/prod-enterprise-ai/global/networks/prod-vpc"
        subnetwork = "projects/prod-enterprise-ai/regions/us-central1/subnetworks/run-subnet"
      }
      egress = "ALL_TRAFFIC"
    }
    containers {
      image = "us-central1-docker.pkg.dev/prod-enterprise-ai/services/gateway:v1"
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
    }
  }
}

# Production Standard: GKE Autopilot with Dataplane V2 & Private Endpoints
resource "google_container_cluster" "primary" {
  name     = "prod-primary-cluster"
  location = "us-central1"

  enable_autopilot = true
  datapath_provider = "ADVANCED_DATAPATH"

  labels = {
    environment = "prod"
    team        = "platform"
    managed_by  = "terraform"
  }

  private_cluster_config {
    enable_private_endpoint = true
    enable_private_nodes    = true
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }
}

# Production Standard: Additive IAM Member (Zero-overwrite risk)
resource "google_project_iam_member" "adk_agent_runner" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:adk-agent@prod-enterprise-ai.iam.gserviceaccount.com"
}

# Production Standard: Partitioned & Clustered BigQuery Table
resource "google_bigquery_table" "telemetry" {
  dataset_id = "analytics"
  table_id   = "telemetry_events"
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "event_timestamp"
  }

  clustering = ["user_id", "status_code"]
}

# Production Standard: Logging Sink with Health Check Exclusions
resource "google_logging_project_sink" "cold_storage_sink" {
  name        = "cold-storage-sink"
  destination = "storage.googleapis.com/prod-audit-archive"

  exclusions {
    name   = "suppress-healthchecks"
    filter = "httpRequest.status = 200 AND httpRequest.requestUrl =~ '/healthz'"
  }
}
