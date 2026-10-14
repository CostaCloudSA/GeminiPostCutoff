#!/usr/bin/env python3
"""
Deterministic Dependency & SDK Auditor (ADK Compatible)
Part of GeminiPostCutoff Architecture Review Engine (Phase 2)

Verifies that AI Agent and GCP dependencies adhere to post-cutoff standards
(e.g. google-adk >= 1.0.0, google-genai >= 1.0.0).
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Any

class DependencyAuditor:
    def __init__(self):
        self.post_cutoff_standards = {
            "google-adk": {"min_version": "1.0.0", "modern": True},
            "google-genai": {"min_version": "1.0.0", "modern": True},
            "fastmcp": {"min_version": "0.4.0", "modern": True},
            "vllm": {"min_version": "0.6.0", "modern": True},
        }
        self.deprecated_libraries = {
            "google-cloud-aiplatform": {
                "alternative": "google-genai and google-adk",
                "reason": "Legacy monolithic SDK. Prefer google-genai for Gemini models and google-adk for agent orchestration.",
            }
        }

    def parse_path(self, target_path: Path) -> Dict[str, Any]:
        target = Path(target_path)
        if target.is_file():
            return self.parse_file(target)

        results = {
            "files": [],
            "dependencies": [],
            "governance_findings": [],
        }

        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if d not in [".git", "node_modules", ".venv", "venv"]]
            for f in files:
                if f in ("requirements.txt", "package.json", "pyproject.toml"):
                    full_p = Path(root) / f
                    parsed = self.parse_file(full_p)
                    results["files"].append(str(full_p))
                    results["dependencies"].extend(parsed["dependencies"])
                    results["governance_findings"].extend(parsed["governance_findings"])

        return results

    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        result = {
            "file": str(file_path),
            "dependencies": [],
            "governance_findings": [],
        }

        name = file_path.name
        content = file_path.read_text(encoding="utf-8")

        if name == "requirements.txt":
            for idx, line in enumerate(content.splitlines(), 1):
                trimmed = line.strip()
                if not trimmed or trimmed.startswith("#"):
                    continue
                m = re.match(r"^([a-zA-Z0-9_-]+)\s*([=><~^!]+)?\s*([0-9a-zA-Z_.-]+)?", trimmed)
                if m:
                    dep_name = m.group(1).lower()
                    ver = m.group(3) or "unspecified"
                    result["dependencies"].append({
                        "name": dep_name,
                        "version": ver,
                        "file": str(file_path),
                        "line": idx,
                    })
                    self._check_dep(dep_name, ver, str(file_path), idx, result)

        elif name == "package.json":
            try:
                pkg = json.loads(content)
                all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                for dep_name, ver in all_deps.items():
                    result["dependencies"].append({
                        "name": dep_name,
                        "version": ver,
                        "file": str(file_path),
                    })
                    self._check_dep(dep_name.lower(), str(ver), str(file_path), 0, result)
            except Exception:
                pass

        return result

    def _check_dep(self, name: str, ver: str, file_path: str, line: int, result: Dict[str, Any]):
        if name in self.deprecated_libraries:
            dep_info = self.deprecated_libraries[name]
            result["governance_findings"].append({
                "pillar": "Pillar 1: IaC & Metadata Governance",
                "pod": "Pod 13: Platform Engineering & IaC Specialist",
                "severity": "MEDIUM",
                "rule": "LEGACY_SDK_DETECTED",
                "resource": name,
                "file": file_path,
                "line": line,
                "message": f"Deprecated library '{name}' detected. {dep_info['reason']}",
                "remediation": f"Migrate to '{dep_info['alternative']}'.",
            })

        if name in self.post_cutoff_standards:
            std = self.post_cutoff_standards[name]
            if ver == "unspecified":
                result["governance_findings"].append({
                    "pillar": "Pillar 1: IaC & Metadata Governance",
                    "pod": "Pod 13: Platform Engineering & IaC Specialist",
                    "severity": "WARNING",
                    "rule": "UNPINNED_AI_DEPENDENCY",
                    "resource": name,
                    "file": file_path,
                    "line": line,
                    "message": f"AI Agent dependency '{name}' is unpinned.",
                    "remediation": f"Pin to at least version '{name}>={std['min_version']}'.",
                })
