---
name: gcp-networking
description: >-
  Use this skill when designing GCP VPC topologies, Cloud Interconnect, Cross-Site Interconnect,
  Private NAT, Serverless VPC Access, and Envoy AI networking.
---

# Google Cloud VPC Networking, Hybrid Connectivity & AI Proxy Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Designing global multi-region VPC topologies, Shared VPCs, and non-overlapping subnet allocations.
- Connecting serverless runtimes (Cloud Run, Cloud Functions) to private enterprise backends using **Direct VPC Egress**.
- Resolving IP address collisions and overlapping subnets in M&A or hybrid setups using **Private NAT**.
- Establishing wire-rate hybrid connectivity between on-premises datacenters with **Cross-Site Interconnect**.
- Securing media delivery and web assets via **Cloud CDN with Private Cloud Storage Buckets**.
- Routing generative AI API traffic and gRPC streaming through **Envoy AI Proxies**.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Provisioning Legacy Serverless VPC Access Connectors [10.25, 06.25]**
> Deploying legacy Serverless VPC Access Connectors (`vpcaccess.googleapis.com`) for Cloud Run or Cloud Functions introduces dedicated connector VM bottlenecks, adds \$25+/month minimum idle charges per connector, and caps throughput.
> - **Mandatory Standard**: Standardize exclusively on **Direct VPC Egress** (`--network` and `--subnet` flags). Direct VPC Egress delivers line-rate throughput, connects directly to VPC subnets without intermediate VMs, and incurs zero connector base fees.
> *Cites: [How I Used Serverless VPC Access to Connect Cloud Run with On-Prem SQL Server](./references/articles.md) and [Google Cloud Networking 101: Quick Reference Guide](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 2: Overlapping RFC 1918 CIDR Collisions across Peered VPCs [11.25]**
> Attempting to connect VPCs or on-premises networks that share identical RFC 1918 subnets via VPC Network Peering or Cloud VPN fails catastrophically due to IP route table collisions.
> - **Mandatory Standard**: Deploy **Google Cloud Private NAT** for overlapping IP spaces. Private NAT maps overlapping source subnets into dedicated, non-overlapping secondary NAT IP ranges without requiring network re-IPing.
> *Cites: [Conquering IP address scarcity: A deep dive into Google Cloud's private NAT](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 3: Recreating AWS Transit Gateway Hub-and-Spoke Topologies in GCP [09.25, 10.25]**
> Engineers accustomed to AWS often attempt to build complex Transit Gateway appliances and route tables in GCP. GCP VPC networks are **global by default**, allowing subnets in Tokyo and Iowa to communicate across Google's private backbone without gateway bottlenecks.
> - **Standard Protocol**: Use native **Global VPCs**, **Shared VPC**, and **Cross-Site Interconnect** for site-to-site WAN transport across external datacenters rather than deploying virtual router appliances.
> *Cites: [Why Google Cloud doesn't need a Transit Gateway? …multi-cloud Flexibility](./references/articles.md) and [Reimagine global network connectivity with Cross-Site Interconnect](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Exposing Cloud Storage Buckets Publicly for CDN Caching [07.26]**
> Making Cloud Storage buckets world-readable (`allUsers: objectViewer`) or generating short-lived signed URLs to distribute assets via Cloud CDN exposes storage buckets to unauthorized scraping and adds CPU signing overhead.
> - **Standard Protocol**: Configure Cloud CDN with native **Private Bucket Access**, using Google Cloud IAM origin authentication so only the CDN load balancer can read bucket contents while keeping the bucket strictly private.
> *Cites: [Cloud CDN Now Supports Private Bucket Access — No More Public Buckets or Signed URLs](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Serverless Network Egress Decision Matrix [10.25, 06.25]
| Dimension | Direct VPC Egress (Modern Standard) | Serverless VPC Connector (Legacy) | Private Service Connect (PSC) |
| :--- | :--- | :--- | :--- |
| **Provisioning** | Flags on Cloud Run service (`network`/`subnet`) | Requires `google_vpc_access_connector` | Requires PSC forwarding rule |
| **Idle Cost** | **$0.00** (Free base infrastructure) | ~$25 - $75+/mo (2x e2-micro VMs) | Pay per GB processed + hourly rule fee |
| **Throughput** | Line-rate interface throughput | Capped at connector VM capacity | Up to 100 Gbps line rate |
| **Best For** | All internal databases, Cloud SQL, on-prem VPC | Legacy deployments only | Multi-tenant SaaS & GCP Managed APIs |
*Cites: [Google Cloud Networking 101: Quick Reference Guide](./references/articles.md) and [How I Used Serverless VPC Access to Connect Cloud Run with On-Prem SQL Server](./references/articles.md)*

---

### 2. Hybrid & Enterprise Interconnect Matrix [10.25, 09.25]
| Connectivity Type | Bandwidth Capacity | Encryption | SLA | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Cross-Site Interconnect** | 10 Gbps – 100 Gbps | MACsec supported | 99.99% | Site-to-site WAN transport between external DCs |
| **Dedicated Interconnect** | 10 Gbps – 100 Gbps | MACsec supported | 99.99% | On-prem enterprise DC direct physical cross-connect |
| **Partner Interconnect** | 50 Mbps – 50 Gbps | Optional IPsec | 99.99% | Enterprise connectivity via supported colocation provider |
| **HA Cloud VPN** | Up to 3 Gbps / tunnel | IPsec (Mandatory) | 99.99% | Branch offices, low-throughput cloud-to-cloud tunnels |
*Cites: [Reimagine global network connectivity with Cross-Site Interconnect](./references/articles.md) and [Why Google Cloud doesn't need a Transit Gateway? …multi-cloud Flexibility](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Cloud Run with Direct VPC Egress (Terraform) [06.25, 10.25]
Deploy a Cloud Run microservice connected directly to internal VPC subnets without legacy connector VMs:
```hcl
resource "google_cloud_run_v2_service" "private_service" {
  name     = "internal-inventory-api"
  location = "us-central1"

  template {
    containers {
      image = "us-docker.pkg.dev/my-project/apps/inventory:v1"
      resources {
        limits = {
          cpu    = "1"
          memory = "2Gi"
        }
      }
    }

    # Direct VPC Egress configuration
    vpc_access {
      network_interfaces {
        network    = google_compute_network.main_vpc.name
        subnetwork = google_compute_subnetwork.workloads_subnet.name
        tags       = ["cloud-run-workload"]
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
  }
}
```
*Cites: [Google Cloud Networking 101: Quick Reference Guide](./references/articles.md) and [How I Used Serverless VPC Access to Connect Cloud Run with On-Prem SQL Server](./references/articles.md)*

---

### Blueprint 2: Private NAT for Overlapping IP Subnets (Terraform) [11.25]
Translate overlapping internal RFC 1918 subnets when connecting partner or acquired VPC networks:
```hcl
resource "google_compute_router" "nat_router" {
  name    = "private-nat-router"
  network = google_compute_network.main_vpc.name
  region  = "us-central1"
}

resource "google_compute_router_nat" "private_nat" {
  name                               = "enterprise-private-nat"
  router                             = google_compute_router.nat_router.name
  region                             = google_compute_router.nat_router.region
  type                               = "PRIVATE"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.overlapping_subnet.id
    source_ip_ranges_to_nat = ["PRIMARY_IP_RANGE"]
  }

  rules {
    rule_number = 100
    match       = "destination.ip == '10.200.0.0/16'"
    action {
      source_nat_active_ranges = [google_compute_subnetwork.nat_secondary_range.self_link]
    }
  }
}
```
*Cites: [Conquering IP address scarcity: A deep dive into Google Cloud's private NAT](./references/articles.md)*

---

### Blueprint 3: Cloud CDN with Private Cloud Storage Bucket Origin (Terraform) [07.26]
Distribute media through Cloud CDN while maintaining strict private bucket access:
```hcl
resource "google_storage_bucket" "media_origin" {
  name                        = "private-media-origin-bucket"
  location                    = "US"
  uniform_bucket_level_access = true
}

resource "google_compute_backend_bucket" "cdn_backend" {
  name        = "private-media-backend"
  bucket_name = google_storage_bucket.media_origin.name
  enable_cdn  = true

  # Native IAM origin access prevents public bucket exposure
  custom_response_headers = [
    "X-Cache-Status: {cdn_cache_status}"
  ]

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    client_ttl        = 3600
    max_ttl           = 86400
    negative_caching  = true
    serve_while_stale = 86400
  }
}
```
*Cites: [Cloud CDN Now Supports Private Bucket Access — No More Public Buckets or Signed URLs](./references/articles.md)*

---

### Blueprint 4: Private API Gateway with Internal Application Load Balancer [03.26]
Expose private microservices behind an internal Application Load Balancer with custom domain routing:
```hcl
resource "google_compute_region_network_endpoint_group" "api_serverless_neg" {
  name                  = "api-gateway-neg"
  network_endpoint_type = "SERVERLESS"
  region                = "us-central1"
  cloud_run {
    service = google_cloud_run_v2_service.private_service.name
  }
}

resource "google_compute_region_backend_service" "internal_backend" {
  name                  = "private-api-backend"
  region                = "us-central1"
  load_balancing_scheme = "INTERNAL_MANAGED"
  protocol              = "HTTP"

  backend {
    group = google_compute_region_network_endpoint_group.api_serverless_neg.id
  }
}
```
*Cites: [How to Build a Private API Gateway on GCP](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[07.26]**: Cloud CDN launches native Private Bucket Access, eliminating public storage buckets.
- **[04.26]**: Virgo scale-out network fabric for megascale AI clusters; Envoy AI networking integrations.
- **[03.26]**: Private API Gateway deployment architectures on GCP.
- **[11.25]**: Private NAT launched for overlapping IP address spaces; Protective ReRoute under the hood.
- **[10.25]**: Cross-Site Interconnect reaches GA; Serverless VPC Access migration playbooks.
- **[09.25]**: Global VPC architecture: why Google Cloud does not require a Transit Gateway.
- **[06.25]**: Google Cloud Networking 101 foundational reference architecture.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Networking Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
