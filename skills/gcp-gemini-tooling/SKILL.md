---
name: gcp-gemini-tooling
description: >-
  Gemini CLI, Code Assist, Google Antigravity Agentic IDE workflows,
  FastMCP integrations, and Terraform for GCP agent infrastructure.
  Activate when customizing agentic IDE workflows, authoring Terraform for GCP, or integrating MCP servers.
---

# Gemini CLI, Antigravity IDE & GCP Terraform Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Mastering and configuring developer workflows with **Gemini CLI** (Plan mode, subagents, lifecycle hooks, and extensions).
- Customizing **Google Antigravity Agentic IDE** (declarative skills, operational rules in `GEMINI.md`, subagents, and memory sidecars).
- Building and hosting custom Model Context Protocol (MCP) servers using **FastMCP** and Google Cloud managed MCP integrations.
- Authoring infrastructure-as-code with **Terraform Stacks**, multi-environment GitHub Actions CI/CD, and GCP IAM bindings.
- Eliminating long-lived Service Account JSON keys in favor of **Workload Identity Federation (WIF)**.
- Configuring enterprise automated code reviews with **Gemini Code Assist** across GitHub and GitLab.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Terraform IAM Destructive Overwrites (`*_iam_binding` & `*_iam_policy`) [11.25]**
> Using `google_project_iam_binding` or `google_project_iam_policy` in multi-team enterprise GCP environments will **silently revoke** all existing users and service accounts assigned to that role outside your Terraform state!
> - **Mandatory Standard**: Always use `google_project_iam_member` for safe, additive role bindings.
> *Cites: [Terraform IAM in GCP: Understanding *_iam_member vs *_iam_binding vs *_iam_policy](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 2: Committing Service Account JSON Keys into CI/CD Pipelines [04.26, 01.26]**
> Storing downloaded service account keys in GitHub Secrets or GitLab variables creates severe exfiltration vulnerabilities.
> - **Mandatory Standard**: Authenticate CI/CD pipelines exclusively through **Workload Identity Federation (WIF)** using short-lived OIDC tokens.
> *Cites: [How to Remove Service Account Keys from GitHub Actions, GitLab, and Terraform in Google Cloud in 2026](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 3: Blind Refactoring without Gemini CLI Plan Mode [03.26]**
> Instructing AI agents to make sprawling cross-file edits without first exploring dependencies and dependencies leads to broken builds and hallucinated imports.
> - **Mandatory Standard**: Trigger **Plan Mode** (`/plan`) before non-trivial multi-file refactoring to review proposed changes and architecture blast radius.
> *Cites: [Plan mode is now available in Gemini CLI](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Shell Script Sprawl instead of Declarative Terraform Stacks [08.26, 05.26]**
> Deploying production infrastructure through ad-hoc bash scripts containing chains of `gcloud` commands causes configuration drift and unrepeatable staging environments.
> - **Solution**: Convert multi-week `gcloud` command sequences into modular, declarative **Terraform Stacks**.
> *Cites: [I Turned Three Weeks of gcloud Commands Into Terraform](./references/articles.md) and [Beyond the HCL: Trench Lessons from Deploying Critical Architectures on GCP](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 5: Uncached CI/CD Builds Sinking Pipeline Velocity & Budgets [04.26]**
> Compiling dependencies and re-building container layers from scratch on every commit in Cloud Build inflates pipeline duration from 3 minutes to 25+ minutes, consuming costly build-minutes.
> - **Solution**: Configure persistent dependency caches in Cloud Storage or use Artifact Registry remote repositories with Kaniko `--cache=true` and Docker Buildx cache backends.
> *Cites: [How We Reduced Cloud Build Time by 60% Using Maven Caching](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 6: Monolithic Subagent Sprawl without Role Scoping [04.26]**
> Spawning broad, unconstrained subagents equipped with every available tool causes agents to execute unnecessary filesystem scans, wander through irrelevant codebases, and exhaust context tokens.
> - **Solution**: Define specialized subagents with strictly scoped system prompts and minimal tool permissions (e.g. read-only researcher vs test runner).
> *Cites: [Subagents have arrived in Gemini CLI](./references/articles.md) and [Google Just Shipped 13 Agent Skills. I Plugged Them Into Gemini CLI and Watched Code Quality Jump](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Developer Assistant Tooling Comparison [12.25, 01.26]
| Dimension | Google Antigravity Agentic IDE | Gemini CLI | Gemini Code Assist Plugin |
| :--- | :--- | :--- | :--- |
| **Form Factor** | Full Agentic Desktop IDE | Terminal-based CLI tool | VS Code / IntelliJ IDE extension |
| **Agent System** | Native Subagents, Artifacts, Skills | Interactive terminal subagents & hooks | Inline code completion & chat panel |
| **Context Engine** | Full workspace awareness & graph memory | Directory context + Conductor | Active file & local workspace indexing |
| **Best For** | Complex pair programming, architectural audits | Terminal SRE ops, automated scripts, CI/CD | Low-friction inline tab completions |
*Cites: [Google Antigravity: The Agentic IDE Changing Development Work](./references/articles.md) and [Mastering Gemini CLI](./references/articles.md)*

---

### 2. Terraform IAM Resource Types Matrix [11.25]
| Resource Type | Scope | Behavior | Risk Level |
| :--- | :--- | :--- | :--- |
| `google_project_iam_member` | Single role + Single principal | Additive only; preserves all other members | **Safe (Standard)** |
| `google_project_iam_binding` | Single role + Member list | Overwrites ALL members for that specific role | **Dangerous (High Risk)** |
| `google_project_iam_policy` | Entire project IAM policy | Overwrites ALL roles and members across project | **Catastrophic (Avoid)** |

---

## 🛠️ Production Blueprints

### Blueprint 1: Keyless GitHub Actions Authentication with Workload Identity Federation [04.26, 01.26]
Provision WIF infrastructure in Terraform to allow GitHub Actions to deploy to GCP without JSON keys:
```hcl
resource "google_iam_workload_identity_pool" "github_pool" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Identity Pool"
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "ci_deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub CI/CD Service Account"
}

resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.ci_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool.name}/attribute.repository/my-org/my-repo"
}
```
*Cites: [How to Remove Service Account Keys from GitHub Actions in 2026](./references/articles.md) and [The only Terraform pipeline you will ever need](./references/articles.md)*

---

### Blueprint 2: FastMCP Server Integration for Developer Tools [09.25, 06.26]
Build a lightweight, type-safe MCP server exposing GCP diagnostics to Gemini CLI and Antigravity:
```python
from fastmcp import FastMCP
from google.cloud import logging_v2

mcp = FastMCP("GCP Log Auditor")
client = logging_v2.LoggingServiceV2Client()

@mcp.tool()
def search_recent_errors(project_id: str, limit: int = 10) -> list[str]:
    """Retrieves recent ERROR severity logs from Cloud Logging."""
    filter_str = 'severity >= ERROR AND timestamp >= "2026-09-01T00:00:00Z"'
    resource_names = [f"projects/{project_id}"]
    
    entries = client.list_log_entries(resource_names=resource_names, filter_=filter_str, page_size=limit)
    return [entry.text_payload or str(entry.json_payload) for entry in entries]

if __name__ == "__main__":
    mcp.run()
```
*Cites: [Gemini CLI 🤝 FastMCP: Simplifying MCP server development](./references/articles.md) and [Troubleshooting Google Cloud with Cloud Logging MCP](./references/articles.md)*

---

### Blueprint 3: Gemini CLI Lifecycle Hook (`hooks.json`) [01.26]
Enforce automatic linting and security scanning prior to code commits in Gemini CLI:
```json
{
  "hooks": {
    "pre_tool_call": [
      {
        "matcher": "run_command",
        "action": "validate_command",
        "script": "scripts/audit_command.sh"
      }
    ],
    "post_file_edit": [
      {
        "matcher": "*.py",
        "command": "ruff check --fix $FILE"
      },
      {
        "matcher": "*.tf",
        "command": "terraform fmt $FILE"
      }
    ]
  }
}
```
*Cites: [Tailor Gemini CLI to your workflow with hooks](./references/articles.md)*

---

### Blueprint 4: Automated Pull Request Review with Gemini Code Assist in GitHub Actions [10.25, 07.25]
Trigger automated architectural reviews on incoming pull requests:
```yaml
name: Gemini AI Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
    - uses: actions/checkout@v4
    - uses: google-github-actions/auth@v2
      with:
        workload_identity_provider: projects/12345/locations/global/workloadIdentityPools/github-pool/providers/github-provider
        service_account: github-deployer@my-proj.iam.gserviceaccount.com
    - name: Run Gemini Code Review
      uses: google-gemini/code-assist-action@v1
      with:
        strictness: high
```
*Cites: [Gemini Code Assist brings enterprise-grade AI code reviews to GitHub](./references/articles.md)*

---

### Blueprint 5: Multi-Agent Deployment with Terraform on Cloud Run [04.26]
Provision coordinated multi-agent services with least-privilege service accounts:
```hcl
resource "google_service_account" "agent_orchestrator" {
  account_id   = "agent-orchestrator-sa"
  display_name = "Agent Orchestrator Service Account"
}

resource "google_cloud_run_v2_service" "orchestrator" {
  name     = "agent-orchestrator"
  location = "us-central1"

  template {
    service_account = google_service_account.agent_orchestrator.email
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }
    containers {
      image = "us-docker.pkg.dev/my-project/agents/orchestrator:v1"
      resources {
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
        cpu_idle = false # Disables CPU throttling for background agent loops
      }
    }
  }
}
```
*Cites: [Create Expert Content: Deploying a Multi-Agent System with Terraform and Cloud Run](./references/articles.md)*

---

### Blueprint 6: Gemini CLI Subagent Configuration (`subagents.json`) [04.26]
Define scoped subagents for autonomous codebase exploration:
```json
{
  "subagents": [
    {
      "name": "codebase-researcher",
      "description": "Explores project directories and analyzes architectural patterns",
      "system_prompt": "You are a read-only architecture researcher. Inspect code and return structured summaries without editing files.",
      "tools": ["read_file", "search_files", "grep_code"],
      "model": "gemini-2.5-flash"
    },
    {
      "name": "test-generator",
      "description": "Generates isolated unit and integration tests for modified components",
      "system_prompt": "You are a specialized test engineer. Generate comprehensive pytest or Jest suites with 100% boundary test coverage.",
      "tools": ["read_file", "write_file", "run_tests"],
      "model": "gemini-2.5-pro"
    }
  ]
}
```
*Cites: [Subagents have arrived in Gemini CLI](./references/articles.md)*

---

### Blueprint 7: Eval-Driven Development (EDD) Skill Test Harness [08.26]
Validate that an Antigravity or Gemini CLI skill meets factual and deterministic requirements:
```python
import pytest
from google import genai
from google.genai import types

client = genai.Client()

def test_skill_deterministic_json():
    """Validates that skill prompt returns conforming structured JSON without natural language begging."""
    prompt = "Review this Terraform file and output severity, resource, and remediation."
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.0
        ),
    )
    assert response.text.startswith("{")
    assert "severity" in response.text
```
*Cites: [Eval-Driven Development for Agent Skills (Firebase Blog)](./references/articles.md) and [Structured Output with Gemini Models: Begging, Threatening, and JSON-ing](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[08.26]**: Eval-Driven Development (EDD) framework for agent skills; Turning 3 weeks of gcloud CLI scripts into modular Terraform Stacks.
- **[06.26]**: Antigravity Agent Skills deep dive; Building with Developer Knowledge API and Antigravity CLI.
- **[05.26]**: Gemini CLI DevOps Extension; Terraform trench lessons on production GCP.
- **[04.26]**: Subagents launched in Gemini CLI; Keyless CI/CD with WIF across GitHub and GitLab.
- **[03.26]**: Agent Plugins standard for packaging skills; Plan mode GA in Gemini CLI.
- **[02.26]**: 100K-line enterprise apps: why vibe-coding fails without rigorous SDLC harnesses.
- **[01.26]**: Declarative "Agents Are Files" specification; Gemini CLI Hooks system; Production multi-environment Terraform pipeline.
- **[12.25]**: Google Antigravity Agentic IDE launched; Conductor context-driven development; Iterative CSV analysis in Gemini CLI.
- **[11.25]**: Terraform IAM `*_iam_member` vs `*_iam_binding` safety rules; Code Assist memory.
- **[10.25]**: Versioned documentation discovery for MCP Toolbox.
- **[09.25]**: Gemini CLI and FastMCP integration for accelerated tool development.
- **[04.25]**: Structured output schemas eliminating natural language JSON prompt begging.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Developer Tooling Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
