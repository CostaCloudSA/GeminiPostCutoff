---
name: gcp-security-compliance
description: >-
  Use this skill when implementing Google Model Armor, Workload Identity Federation,
  IAM security, SecOps detections, Cloud Armor, and penetration testing.
---

# GCP Security, IAM, Model Armor & Compliance Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Hardening LLMs and autonomous agent meshes against prompt injections using **Google Model Armor** and **Agent Gateway**.
- Eliminating long-lived service account JSON keys using **Workload Identity Federation (WIF)** for GitHub Actions, GitLab, and external clouds.
- Defending web endpoints and APIs against volumetric attacks and OWASP Top 10 using **Cloud Armor CRS v4.22** and Custom Header Client IP identification.
- Provisioning cryptographic identities for multi-agent workflows using **SPIFFE** and scoped token exchanges.
- Auditing organization-wide attack surfaces with **Cloud Asset Inventory streaming to BigQuery** and Canary Token intrusion traps.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Distributing Long-Lived Service Account JSON Keys [04.26, 01.26]**
> Storing downloaded service account keys (`credentials.json`) in CI/CD secrets (GitHub Secrets, GitLab CI) or local developer laptops introduces high-severity exfiltration risks. Once compromised, these keys provide persistent access without expiring.
> - **Mandatory Standard**: Eliminate service account keys entirely. Enforce the `iam.disableServiceAccountKeyCreation` Organization Policy and authenticate CI/CD pipelines exclusively through **Workload Identity Federation (WIF)** using short-lived OpenID Connect (OIDC) tokens.
> *Cites: [How to Remove Service Account Keys from GitHub Actions, GitLab, and Terraform in Google Cloud in 2026](./references/articles.md) and [Building a Secure, Serverless CI/CD Pipeline on GCP](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 2: Exposing LLM & Agent Endpoints without Model Armor Sanitization [09.26, 01.26]**
> Ingesting untrusted user input directly into LLMs allows malicious actors to execute jailbreaks, system prompt extractions, and indirect prompt injections that hijack agent tool executions.
> - **Mandatory Standard**: Wrap all generative model API calls and agent ingress routers in **Google Model Armor** filter templates to intercept prompt attacks, toxic content, and PII leakage before token generation occurs.
> *Cites: [Securing your agent in Agent Platform with Agent Gateway and Model Armor](./references/articles.md) and [Guarding the Gates: A Technical Deep Dive into Model Armor](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 3: Inadvertent Client IP Masking behind External CDNs in Cloud Armor [04.26, 03.26]**
> Placing an external CDN (e.g. Cloudflare, Fastly) in front of a GCP Global Application Load Balancer without configuring `userIpRequestHeaders` forces Cloud Armor to evaluate the CDN's egress proxy IP rather than the true client IP, causing rate-limiting rules to ban entire CDN points of presence.
> - **Standard Protocol**: Configure Cloud Armor security policies with `userIpRequestHeaders = ["True-Client-IP", "X-Forwarded-For"]` and enable CRS v4.22 rulesets in preview mode before production enforcement.
> *Cites: [Using Cloud Armor with an External CDN: Identifying the Real Client IP](./references/articles.md) and [Google Cloud Armor's CRS v4.22: What Changed and How to Roll It Out Safely](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 4: Monolithic Identity Sharing across Autonomous AI Agent Swarms [08.26, 06.26]**
> Assigning a single broad service account to all agents in an Agent-to-Agent (A2A) mesh destroys security boundaries. A prompt injection against a frontend customer concierge agent grants lateral movement into backend databases.
> - **Mandatory Standard**: Issue granular **SPIFFE IDs** to each agent worker. Require mutual OIDC authentication and scoped least-privilege IAM roles for every cross-agent invocation.
> *Cites: [Build Zero-Trust AI Agents with Google's Agent Development Kit](./references/articles.md) and [SPIFFE: Why Google's New Agent Identity is the Future of AI Security](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 5: Lack of Decoy Canary Credentials for Intrusion Detection [12.25, 02.26]**
> Relying exclusively on signature-based SIEM alerts fails to detect sophisticated attackers who compromise internal git repositories or developer endpoints and quietly harvest GCP credentials.
> - **Standard Protocol**: Deploy **GCP Canary Tokens**—decoy service accounts and mock Cloud Storage buckets configured with high-priority Cloud Audit Log alert sinks—to trigger immediate security response upon unauthorized enumeration.
> *Cites: [GCP Canary Tokens](./references/articles.md) and [GCP Penetration Testing: A Step-by-Step Attack Guide](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Workload Identity Authentication Matrix [04.26, 06.26]
| Authentication Method | Long-Lived Secrets | Secret Exfiltration Risk | Best Suited For |
| :--- | :--- | :--- | :--- |
| **Workload Identity Federation (WIF)** | None (OIDC tokens) | Near Zero | GitHub Actions, GitLab CI, AWS/Azure workloads calling GCP |
| **GKE Workload Identity** | None (K8s ServiceAccount) | Near Zero | Microservices, pods, and containerized agents on GKE |
| **SPIFFE Agent Identity** | None (Cryptographic SVIDs) | Near Zero | Multi-agent A2A meshes with dynamic ephemeral agent instances |
| **Service Account JSON Keys** | Static JSON file | **Extreme (Banned)** | **Forbidden** in enterprise environments; violates zero-trust baseline |
*Cites: [How to Remove Service Account Keys from GitHub Actions, GitLab, and Terraform in Google Cloud in 2026](./references/articles.md) and [SPIFFE: Why Google's New Agent Identity is the Future of AI Security](./references/articles.md)*

---

### 2. Edge & AI Perimeter Defense Matrix [09.26, 04.26]
| Defense Layer | Primary Target | Technology Platform | Key Protection Capabilities |
| :--- | :--- | :--- | :--- |
| **Google Model Armor** | LLMs, Agent Prompts | Vertex AI / Cloud Run | Intercepts prompt injections, jailbreaks, PII leakage, toxicity |
| **Cloud Armor (CRS v4.22)** | Web Applications, APIs | Global External HTTP(S) LB | Mitigates DDoS, SQLi, XSS, RCE, and Layer 7 bot attacks |
| **Agent Gateway** | Multi-Agent Swarms | Enterprise Agent Platform | Enforces mTLS, token validation, rate-limiting, and routing |
| **Cloud Fraud Defense** | Public Forms, Login Portals | Managed Edge Service | Stops credential stuffing, automated bots, and account fraud |
*Cites: [Securing your agent in Agent Platform with Agent Gateway and Model Armor](./references/articles.md) and [Introducing Google Cloud Fraud Defense](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Workload Identity Federation for GitHub Actions (Terraform) [04.26]
Provision keyless authentication for GitHub Actions CI/CD pipelines:
```hcl
resource "google_iam_workload_identity_pool" "github_pool" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"

  attribute_condition = "assertion.repository_owner == 'my-org'"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.ci_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/my-org/my-repo"
}
```
*Cites: [How to Remove Service Account Keys from GitHub Actions, GitLab, and Terraform in Google Cloud in 2026](./references/articles.md)*

---

### Blueprint 2: Google Model Armor Real-Time Prompt Sanitization (Python) [09.26, 01.26]
Sanitize untrusted user prompts before sending them to Gemini or autonomous agents:
```python
from google.cloud import modelarmor_v1

client = modelarmor_v1.ModelArmorClient()

def sanitize_and_execute_agent_prompt(
    project_id: str, 
    template_id: str, 
    user_prompt: str
) -> dict:
    """Evaluates user prompt against Google Model Armor security templates."""
    template_path = f"projects/{project_id}/locations/global/templates/{template_id}"
    
    response = client.sanitize_user_prompt(
        name=template_path,
        user_prompt_data=user_prompt
    )
    
    sanitization_result = response.sanitization_result
    
    # Check if malicious attack, jailbreak, or injection was flagged
    if sanitization_result.filter_match:
        return {
            "status": "REJECTED",
            "reason": f"Security policy violation: {sanitization_result.match_metadata}",
            "sanitized_prompt": None
        }
        
    return {
        "status": "APPROVED",
        "reason": "Clean prompt",
        "sanitized_prompt": user_prompt
    }
```
*Cites: [Securing your agent in Agent Platform with Agent Gateway and Model Armor](./references/articles.md) and [Guarding the Gates: A Technical Deep Dive into Model Armor](./references/articles.md)*

---

### Blueprint 3: Cloud Armor Security Policy with CRS v4.22 & CDN Header Parsing (Terraform) [04.26, 03.26]
Enforce OWASP Core Rule Set v4.22 with accurate client IP inspection behind external CDNs:
```hcl
resource "google_compute_security_policy" "waf_policy" {
  name        = "enterprise-waf-policy"
  description = "Cloud Armor policy enforcing CRS v4.22 with custom CDN IP identification"

  # Inspect real client IP behind Cloudflare or Fastly CDN
  user_ip_request_headers = ["True-Client-IP", "X-Forwarded-For"]

  # OWASP ModSecurity Core Rule Set v4.22
  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('sqli-v4.22-stable', {'sensitivity': 1}) || evaluatePreconfiguredWaf('xss-v4.22-stable', {'sensitivity': 1})"
      }
    }
    description = "Enforce SQL injection and XSS CRS v4.22 rules"
  }

  # Rate limiting rule: max 100 requests per minute per IP
  rule {
    action   = "rate_based_ban"
    priority = 2000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
    }
    description = "Rate limit traffic per client IP"
  }

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }
}
```
*Cites: [Google Cloud Armor's CRS v4.22: What Changed and How to Roll It Out Safely](./references/articles.md) and [Using Cloud Armor with an External CDN: Identifying the Real Client IP](./references/articles.md)*

---

### Blueprint 4: SPIFFE Workload Identity Token Exchange for AI Agents [06.26]
Issue scoped, cryptographic credentials for inter-agent communication:
```python
import requests
from google.auth.transport.requests import Request
from google.oauth2 import id_token

def get_spiffe_agent_assertion(spiffe_id: str, audience: str) -> str:
    """Exchanges agent SPIFFE identity for a scoped GCP OIDC token."""
    # Queries the local SPIRE agent sidecar UNIX socket
    spire_endpoint = "http://localhost:8080/v1/workload-identity"
    payload = {
        "spiffe_id": spiffe_id,
        "audience": audience
    }
    resp = requests.post(spire_endpoint, json=payload, timeout=5)
    resp.raise_fail_for_status()
    svid = resp.json()["svid"]
    return svid
```
*Cites: [SPIFFE: Why Google's New Agent Identity is the Future of AI Security](./references/articles.md)*

---

### Blueprint 5: Continuous Asset Inventory Export to BigQuery for Compliance Audits (Terraform) [04.26]
Export live organization assets and IAM permissions directly into BigQuery for automated compliance SQL queries:
```hcl
resource "google_cloud_asset_organization_feed" "iam_asset_feed" {
  billing_project = "my-secops-admin-project"
  org_id          = "123456789012"
  feed_id         = "daily-org-iam-feed"
  content_type    = "IAM_POLICY"

  asset_types = [
    "cloudresourcemanager.googleapis.com/Organization",
    "cloudresourcemanager.googleapis.com/Folder",
    "cloudresourcemanager.googleapis.com/Project"
  ]

  feed_output_config {
    pubsub_destination {
      topic = google_pubsub_topic.asset_feed_topic.id
    }
  }
}
```
*Cites: [Reading a Google Cloud Organization Like a Database: Asset Inventory to BigQuery](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[09.26]**: Agent Gateway and Model Armor integration for multi-agent platform security.
- **[08.26]**: Zero-trust AI agent architectures with ADK; Autonomous agent security governance frameworks.
- **[07.26]**: k8s-aibom launched for automated AI supply chain Bill of Materials verification on GKE.
- **[06.26]**: SPIFFE identity standards adopted for cryptographic AI agent authentication.
- **[05.26]**: MCP Authorization protocols launched; DevSecOps and SRE forensic response playbooks.
- **[04.26]**: Cloud Armor CRS v4.22 ruleset GA; Keyless CI/CD with Workload Identity Federation; Cloud Fraud Defense.
- **[03.26]**: Cloud Armor CDN client IP extraction; Recommended enterprise security baseline checklist.
- **[02.26]**: Firebase app security hardening; GCP Penetration testing and adversarial AI attack guides.
- **[01.26]**: Model Armor technical architecture deep dive for prompt injection defense.
- **[12.25]**: Cloud CISO Perspectives 2025 AI review; GCP Canary Tokens; Model Armor Service Extensions.
- **[11.25]**: Workforce Identity Federation attribute mapping for Entra ID & SAML; Keyless WIF security.
- **[10.25]**: Agent Factory production security blueprints for AI agents; Privileged Account Monitoring (PAM).
- **[03.25]**: Google SecOps anonymization pipelines.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Security Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
