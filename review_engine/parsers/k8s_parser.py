#!/usr/bin/env python3
"""
Deterministic Kubernetes / GKE YAML AST Parser (ADK Compatible)
Part of GeminiPostCutoff Architecture Review Engine (Phase 2)

Extracts workloads, Gateway API vs Ingress, container resource requests/limits,
GKE Agent Sandbox annotations, and LLM serving specs for GKE Pod 1.
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

class K8sParser:
    def __init__(self, required_labels: Optional[List[str]] = None):
        self.required_labels = required_labels or ["environment", "team"]

    def parse_path(self, target_path: Path) -> Dict[str, Any]:
        target = Path(target_path)
        if target.is_file():
            return self.parse_file(target)

        results = {
            "files": [],
            "manifests": [],
            "workloads": [],
            "gateways": [],
            "routes": [],
            "legacy_ingresses": [],
            "inference_workloads": [],
            "governance_findings": [],
        }

        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if d not in [".git", ".terraform", "node_modules", ".venv"]]
            for f in files:
                if f.endswith(".yaml") or f.endswith(".yml"):
                    full_p = Path(root) / f
                    parsed = self.parse_file(full_p)
                    results["files"].append(str(full_p))
                    results["manifests"].extend(parsed["manifests"])
                    results["workloads"].extend(parsed["workloads"])
                    results["gateways"].extend(parsed["gateways"])
                    results["routes"].extend(parsed["routes"])
                    results["legacy_ingresses"].extend(parsed["legacy_ingresses"])
                    results["inference_workloads"].extend(parsed["inference_workloads"])
                    results["governance_findings"].extend(parsed["governance_findings"])

        return results

    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        content = file_path.read_text(encoding="utf-8")
        docs = re.split(r"^---$", content, flags=re.MULTILINE)

        result = {
            "file": str(file_path),
            "manifests": [],
            "workloads": [],
            "gateways": [],
            "routes": [],
            "legacy_ingresses": [],
            "inference_workloads": [],
            "governance_findings": [],
        }

        for idx, doc in enumerate(docs, 1):
            trimmed = doc.strip()
            if not trimmed:
                continue
            manifest = self._parse_yaml_doc(trimmed, str(file_path), idx)
            if manifest.get("kind"):
                result["manifests"].append(manifest)
                self._classify_manifest(manifest, result)

        return result

    def _parse_yaml_doc(self, doc_str: str, file_path: str, doc_index: int) -> Dict[str, Any]:
        manifest = {
            "file": file_path,
            "doc_index": doc_index,
            "apiVersion": "",
            "kind": "",
            "metadata": {"name": "", "namespace": "default", "labels": {}, "annotations": {}},
            "raw": doc_str,
        }

        lines = doc_str.splitlines()
        for idx, line in enumerate(lines):
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#"):
                continue

            top_m = re.match(r"^([a-zA-Z0-9]+):\s*(.*)$", line)
            if top_m and not line.startswith(" "):
                k, v = top_m.group(1), top_m.group(2).replace('"', "").replace("'", "").strip()
                if k == "apiVersion":
                    manifest["apiVersion"] = v
                elif k == "kind":
                    manifest["kind"] = v

            meta_m = re.match(r"^\s{2}([a-zA-Z0-9]+):\s*(.*)$", line)
            if meta_m:
                mk, mv = meta_m.group(1), meta_m.group(2).replace('"', "").replace("'", "").strip()
                if mk in ("name", "namespace"):
                    manifest["metadata"][mk] = mv

        return manifest

    def _classify_manifest(self, manifest: Dict[str, Any], result: Dict[str, Any]):
        kind = manifest["kind"]
        raw = manifest["raw"]

        if kind == "Ingress":
            result["legacy_ingresses"].append(manifest)
            result["governance_findings"].append({
                "pillar": "Pillar 1: IaC & Metadata Governance",
                "pod": "Pod 1: GKE Specialist Pod",
                "severity": "HIGH_RISK",
                "rule": "LEGACY_K8S_INGRESS_DETECTED",
                "resource": f"Ingress/{manifest['metadata']['name']}",
                "file": manifest["file"],
                "message": f"Legacy Kubernetes Ingress resource detected ('{manifest['metadata']['name']}'). Migrate to GKE Gateway API.",
                "remediation": "Migrate to Gateway API ('gateway.networking.k8s.io/v1' Gateway & HTTPRoute).",
            })
        elif kind == "Gateway":
            result["gateways"].append(manifest)
        elif kind in ("HTTPRoute", "GRPCRoute"):
            result["routes"].append(manifest)

        if kind in ("Deployment", "StatefulSet", "DaemonSet", "Job"):
            result["workloads"].append(manifest)

            # Check bounds
            if "requests:" not in raw or "limits:" not in raw:
                result["governance_findings"].append({
                    "pillar": "Pillar 3: Compute FinOps & Workload Sizing",
                    "pod": "Pod 1: GKE Specialist Pod & Pod 5: Compute FinOps",
                    "severity": "HIGH_RISK",
                    "rule": "MISSING_POD_RESOURCE_BOUNDS",
                    "resource": f"{kind}/{manifest['metadata']['name']}",
                    "file": manifest["file"],
                    "message": f"Workload '{manifest['metadata']['name']}' is missing CPU/Memory requests or limits.",
                    "remediation": "Define explicit 'resources.requests' and 'resources.limits'.",
                })

            # Check LLM / GPU
            if any(k in raw for k in ("vllm", "tgi", "ollama", "nvidia.com/gpu")):
                result["inference_workloads"].append(manifest)
                if "kueue.x-k8s.io" not in raw and "queue-name" not in raw:
                    result["governance_findings"].append({
                        "pillar": "Pillar 3: Compute FinOps & Workload Sizing",
                        "pod": "Pod 1: GKE Specialist Pod (LLM Inference)",
                        "severity": "RECOMMENDATION",
                        "rule": "GPU_WORKLOAD_WITHOUT_KUEUE",
                        "resource": f"{kind}/{manifest['metadata']['name']}",
                        "file": manifest["file"],
                        "message": f"GPU / LLM workload '{manifest['metadata']['name']}' is running without Kueue job queueing.",
                        "remediation": "Attach 'kueue.x-k8s.io/queue-name' label and configure Kueue LocalQueue.",
                    })

            # Privileged container check
            if "privileged: true" in raw:
                result["governance_findings"].append({
                    "pillar": "Pillar 2: Zero-Trust Security & Hardening",
                    "pod": "Pod 6: Security Hardening & Zero-Trust Pod",
                    "severity": "CRITICAL",
                    "rule": "PRIVILEGED_CONTAINER_DETECTED",
                    "resource": f"{kind}/{manifest['metadata']['name']}",
                    "file": manifest["file"],
                    "message": f"Workload '{manifest['metadata']['name']}' requests privileged container execution.",
                    "remediation": "Remove 'privileged: true' and enforce 'runAsNonRoot: true'.",
                })
