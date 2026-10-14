#!/usr/bin/env python3
"""
Deterministic Terraform / HCL AST Parser (Enhanced ADK Parity)
Part of GeminiPostCutoff Architecture Review Engine
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

class HclParser:
    def __init__(self, required_labels: Optional[List[str]] = None, target_model: str = "flash-3.8"):
        self.required_labels = required_labels or ["environment", "team", "managed_by"]
        self.target_model = target_model
        self.multi_cloud_providers = ["aws", "azurerm", "azuread", "snowflake", "databricks", "alicloud", "oci", "kubernetes"]

    def parse_path(self, target_path: Path) -> Dict[str, Any]:
        target = Path(target_path)
        if target.is_file():
            return self.parse_file(target)

        results = {
            "files": [],
            "providers": [],
            "resources": [],
            "data_sources": [],
            "modules": [],
            "variables": [],
            "outputs": [],
            "backend": None,
            "multi_cloud": {
                "detected": False,
                "providers": [],
                "resources": [],
                "storage_uris": [],
                "connection_strings": [],
                "trigger_pod": None,
            },
            "governance_findings": [],
            "model_gaps": [],
            "remediation_diffs": [],
        }

        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if d not in [".git", ".terraform", "node_modules", ".venv"]]
            for f in files:
                if f.endswith(".tf") or f.endswith(".tfvars"):
                    full_p = Path(root) / f
                    parsed = self.parse_file(full_p)
                    results["files"].append(str(full_p))
                    results["providers"].extend(parsed["providers"])
                    results["resources"].extend(parsed["resources"])
                    results["data_sources"].extend(parsed["data_sources"])
                    results["modules"].extend(parsed["modules"])
                    results["variables"].extend(parsed["variables"])
                    results["outputs"].extend(parsed["outputs"])
                    if parsed["backend"]:
                        results["backend"] = parsed["backend"]
                    results["governance_findings"].extend(parsed["governance_findings"])
                    results["model_gaps"].extend(parsed["model_gaps"])
                    results["remediation_diffs"].extend(parsed["remediation_diffs"])

                    if parsed["multi_cloud"]["detected"]:
                        results["multi_cloud"]["detected"] = True
                        for p in parsed["multi_cloud"]["providers"]:
                            if p not in results["multi_cloud"]["providers"]:
                                results["multi_cloud"]["providers"].append(p)
                        results["multi_cloud"]["resources"].extend(parsed["multi_cloud"]["resources"])
                        results["multi_cloud"]["storage_uris"].extend(parsed["multi_cloud"]["storage_uris"])
                        results["multi_cloud"]["connection_strings"].extend(parsed["multi_cloud"]["connection_strings"])

        if results["multi_cloud"]["detected"]:
            results["multi_cloud"]["trigger_pod"] = "Pod 12: Cross-Cloud Modernization & Migration Pod (gcp-migrations)"

        return results

    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        content = file_path.read_text(encoding="utf-8")
        result = {
            "file": str(file_path),
            "providers": [],
            "resources": [],
            "data_sources": [],
            "modules": [],
            "variables": [],
            "outputs": [],
            "backend": None,
            "multi_cloud": {
                "detected": False,
                "providers": [],
                "resources": [],
                "storage_uris": [],
                "connection_strings": [],
            },
            "governance_findings": [],
            "model_gaps": [],
            "remediation_diffs": [],
        }

        # Backend
        b_match = re.search(r'backend\s+"([^"]+)"\s*\{([^}]*)\}', content, re.DOTALL)
        if b_match:
            result["backend"] = {"type": b_match.group(1), "body": b_match.group(2).strip()}

        # Storage URIs
        for m in re.finditer(r'(s3:\/\/[a-zA-Z0-9.\-_]+|wasbs?:\/\/[a-zA-Z0-9.\-_@]+|abfss?:\/\/[a-zA-Z0-9.\-_@]+)', content):
            uri = m.group(1)
            result["multi_cloud"]["detected"] = True
            result["multi_cloud"]["storage_uris"].append({"uri": uri, "file": str(file_path)})
            prov = "aws" if uri.startswith("s3://") else "azure"
            if prov not in result["multi_cloud"]["providers"]:
                result["multi_cloud"]["providers"].append(prov)

        # Connection strings
        for m in re.finditer(r'(snowflake:\/\/|jdbc:redshift:\/\/|jdbc:oracle:thin|databricks-instance)', content):
            result["multi_cloud"]["detected"] = True
            result["multi_cloud"]["connection_strings"].append({"match": m.group(1), "file": str(file_path)})

        # Providers
        for m in re.finditer(r'provider\s+"([^"]+)"\s*\{([^}]*)\}', content, re.DOTALL):
            name, body = m.group(1), m.group(2)
            result["providers"].append({"name": name, "raw_body": body.strip(), "file": str(file_path)})
            if name.lower() in self.multi_cloud_providers:
                result["multi_cloud"]["detected"] = True
                if name.lower() not in result["multi_cloud"]["providers"]:
                    result["multi_cloud"]["providers"].append(name.lower())

        # Resources
        for m in re.finditer(r'resource\s+"([^"]+)"\s+"([^"]+)"\s*\{', content):
            res_type, res_name = m.group(1), m.group(2)
            start_line = content[:m.start()].count("\n") + 1
            body = self._extract_block_body(content, m.end() - 1)
            result["resources"].append({
                "type": res_type,
                "name": res_name,
                "start_line": start_line,
                "file": str(file_path),
                "raw_body": body,
            })
            prefix = res_type.split("_")[0].lower()
            if prefix in ["aws", "azurerm", "snowflake", "databricks", "alicloud", "oci"]:
                result["multi_cloud"]["detected"] = True
                result["multi_cloud"]["resources"].append({"type": res_type, "name": res_name, "file": str(file_path)})
                if prefix not in result["multi_cloud"]["providers"]:
                    result["multi_cloud"]["providers"].append(prefix)

        # Variables & Outputs
        for m in re.finditer(r'variable\s+"([^"]+)"\s*\{([^}]*)\}', content, re.DOTALL):
            result["variables"].append({"name": m.group(1), "has_description": "description" in m.group(2), "file": str(file_path)})
        for m in re.finditer(r'output\s+"([^"]+)"\s*\{([^}]*)\}', content, re.DOTALL):
            result["outputs"].append({"name": m.group(1), "has_description": "description" in m.group(2), "file": str(file_path)})

        self._audit_governance(result)
        return result

    def _extract_block_body(self, content: str, open_brace_idx: int) -> str:
        depth = 0
        for i in range(open_brace_idx, len(content)):
            if content[i] == "{":
                depth += 1
            elif content[i] == "}":
                depth -= 1
                if depth == 0:
                    return content[open_brace_idx + 1:i]
        return content[open_brace_idx + 1:]

    def _audit_governance(self, result: Dict[str, Any]):
        if not result["backend"] and (result["resources"] or result["modules"]):
            result["governance_findings"].append({
                "pillar": "Pillar 1: IaC & Metadata Governance",
                "pod": "Pod 13: Platform Engineering & IaC Specialist",
                "severity": "MEDIUM",
                "rule": "MISSING_REMOTE_BACKEND_STATE_LOCKING",
                "resource": "terraform.backend",
                "file": result["file"],
                "message": "No remote Terraform backend declared. Risk of state collision.",
                "remediation": "Configure a remote GCS backend with state locking.",
            })

        for v in result["variables"]:
            if not v["has_description"]:
                result["governance_findings"].append({
                    "pillar": "Pillar 1: IaC & Metadata Governance",
                    "pod": "Pod 13: Platform Engineering & IaC Specialist",
                    "severity": "LOW",
                    "rule": "VARIABLE_MISSING_DESCRIPTION",
                    "resource": f"variable.{v['name']}",
                    "file": v["file"],
                    "message": f"Variable '{v['name']}' lacks description.",
                    "remediation": "Add 'description' attribute.",
                })

        for res in result["resources"]:
            # Authoritative IAM
            if "_iam_policy" in res["type"] or "_iam_binding" in res["type"]:
                result["governance_findings"].append({
                    "pillar": "Pillar 2: Zero-Trust Security & Hardening",
                    "pod": "Pod 13: Platform Engineering & IaC Specialist",
                    "severity": "HIGH_RISK",
                    "rule": "ANTI_PATTERN_AUTHORITATIVE_IAM",
                    "resource": f"{res['type']}.{res['name']}",
                    "file": res["file"],
                    "message": f"Authoritative IAM '{res['type']}' overwrites permissions. Replace with additive member.",
                    "remediation": "Change to additive 'google_*_iam_member'.",
                })

            # Static Keys
            if res["type"] == "google_service_account_key":
                result["governance_findings"].append({
                    "pillar": "Pillar 2: Zero-Trust Security & Hardening",
                    "pod": "Pod 6: Security Hardening & Zero-Trust Pod",
                    "severity": "CRITICAL",
                    "rule": "STATIC_SERVICE_ACCOUNT_KEY_DETECTED",
                    "resource": f"{res['type']}.{res['name']}",
                    "file": res["file"],
                    "message": "Static Service Account keys violate zero-trust.",
                    "remediation": "Migrate to Workload Identity Federation (WIF).",
                })

            # Deprecated Serverless Connector
            if res["type"] == "google_vpc_access_connector":
                result["governance_findings"].append({
                    "pillar": "Pillar 3: Compute FinOps & Workload Sizing",
                    "pod": "Pod 7: Cloud Networking & Connectivity Pod",
                    "severity": "HIGH_RISK",
                    "rule": "DEPRECATED_SERVERLESS_VPC_CONNECTOR",
                    "resource": f"{res['type']}.{res['name']}",
                    "file": res["file"],
                    "message": "Legacy VPC connector bottlenecks throughput and incurs 2-VM idle charges.",
                    "remediation": "Migrate to Cloud Run Direct VPC Egress.",
                })
                if self.target_model == "pro-3.1":
                    result["model_gaps"].append({
                        "topic": "Cloud Run Direct VPC Egress (GA mid-2025)",
                        "tier": "Tier 1B",
                    })

            # Cloud Run CPU Idle
            if res["type"] == "google_cloud_run_v2_service":
                if "cpu_idle = true" in res["raw_body"]:
                    result["governance_findings"].append({
                        "pillar": "Pillar 3: Compute FinOps & Workload Sizing",
                        "pod": "Pod 2: Cloud Run Serverless Pod",
                        "severity": "WARNING",
                        "rule": "CLOUD_RUN_CPU_THROTTLING_RISK",
                        "resource": f"{res['type']}.{res['name']}",
                        "file": res["file"],
                        "message": "Background worker has CPU throttling enabled.",
                        "remediation": "Set 'cpu_idle = false'.",
                    })

            # BigQuery Unpartitioned
            if res["type"] == "google_bigquery_table" and "time_partitioning" not in res["raw_body"]:
                result["governance_findings"].append({
                    "pillar": "Pillar 3: Compute FinOps & Workload Sizing",
                    "pod": "Pod 4: Unified BigQuery & Modern Data Pod",
                    "severity": "HIGH_RISK",
                    "rule": "BIGQUERY_UNPARTITIONED_TABLE",
                    "resource": f"{res['type']}.{res['name']}",
                    "file": res["file"],
                    "message": "BigQuery table lacks partitioning.",
                    "remediation": "Configure 'time_partitioning { type = \"DAY\" }'.",
                })

            # Labels
            labelable = ["google_compute_instance", "google_container_cluster", "google_cloud_run_v2_service", "google_bigquery_dataset", "google_storage_bucket"]
            if res["type"] in labelable and "labels =" not in res["raw_body"]:
                result["governance_findings"].append({
                    "pillar": "Pillar 1: IaC & Metadata Governance",
                    "pod": "Pod 13: Platform Engineering & IaC Specialist",
                    "severity": "MEDIUM",
                    "rule": "MISSING_RESOURCE_LABELS",
                    "resource": f"{res['type']}.{res['name']}",
                    "file": res["file"],
                    "message": f"Missing mandatory operational labels ({', '.join(self.required_labels)}).",
                    "remediation": "Add 'labels = { ... }'.",
                })
