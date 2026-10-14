#!/usr/bin/env python3
"""
Hub-and-Spoke Architectural Governance Engine (ADK Compatible)
Part of GeminiPostCutoff Architecture Review Engine (Phase 2)

Aggregates AST inspection results across HCL, K8s, and Dependencies,
applies the 4 Hub Governance Pillars to the 13 Spoke Pods,
triggers Pod 12 on multi-cloud detection, and generates structured audit scorecards.
"""

from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
from review_engine.parsers.hcl_parser import HclParser
from review_engine.parsers.k8s_parser import K8sParser
from review_engine.parsers.dep_auditor import DependencyAuditor

class HubAndSpokeGovernanceEngine:
    def __init__(self, required_labels: Optional[List[str]] = None):
        self.hcl_parser = HclParser(required_labels)
        self.k8s_parser = K8sParser(required_labels)
        self.dep_auditor = DependencyAuditor()

    def audit_directory(self, target_dir: Path) -> Dict[str, Any]:
        target = Path(target_dir)
        hcl_results = self.hcl_parser.parse_path(target)
        k8s_results = self.k8s_parser.parse_path(target)
        dep_results = self.dep_auditor.parse_path(target)

        all_findings = [
            *hcl_results["governance_findings"],
            *k8s_results["governance_findings"],
            *dep_results["governance_findings"],
        ]

        pillars = {
            "Pillar 1: IaC & Metadata Governance": {"findings": [], "score": 100},
            "Pillar 2: Zero-Trust Security & Hardening": {"findings": [], "score": 100},
            "Pillar 3: Compute FinOps & Workload Sizing": {"findings": [], "score": 100},
            "Pillar 4: Observability & Telemetry": {"findings": [], "score": 100},
        }

        for f in all_findings:
            p_name = f.get("pillar")
            if p_name in pillars:
                pillars[p_name]["findings"].append(f)
                sev = f.get("severity")
                penalty = 25 if sev == "CRITICAL" else 15 if sev == "HIGH_RISK" else 10 if sev == "MEDIUM" else 5
                pillars[p_name]["score"] = max(0, pillars[p_name]["score"] - penalty)

        multi_cloud = hcl_results["multi_cloud"]
        multi_cloud_trigger = {
            "activated": multi_cloud["detected"],
            "pod": "Pod 12: Cross-Cloud Modernization & Migration Pod",
            "providers_detected": multi_cloud["providers"],
            "foreign_resources": multi_cloud["resources"],
            "recommendation": (
                f"Foreign cloud providers detected ({', '.join(multi_cloud['providers'])}). "
                "Activating Pod 12 for automated cross-cloud modernization, S3-to-GCS Storage Transfer Service, "
                "and BigQuery SQL translation."
                if multi_cloud["detected"]
                else "Pure GCP stack detected. Pod 12 operates in passive standby."
            ),
        }

        global_score = round(sum(p["score"] for p in pillars.values()) / 4)

        return {
            "timestamp": datetime.now().isoformat(),
            "target_directory": str(target),
            "summary": {
                "total_terraform_resources": len(hcl_results["resources"]),
                "total_kubernetes_workloads": len(k8s_results["workloads"]),
                "total_dependencies": len(dep_results["dependencies"]),
                "total_governance_findings": len(all_findings),
                "global_ast_score": global_score,
            },
            "pillars": pillars,
            "multi_cloud_trigger": multi_cloud_trigger,
            "raw_inventory": {
                "terraform": hcl_results,
                "kubernetes": k8s_results,
                "dependencies": dep_results,
            },
        }
