#!/usr/bin/env python3
"""
Knowledge Provenance & Extraction Verifier Agent (ADK Compatible)
Part of GeminiPostCutoff Architecture Review Engine (Phase 1)

Verifies document-by-document that claims, anti-patterns, and blueprints
in SKILL.md are grounded in canonical publications in references/articles.md.
"""

import os
import re
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

class GroundingVerifierAgent:
    """
    ADK 1.0-compatible agent that verifies claim grounding, chronological fidelity,
    and code block syntax across all skills.
    """

    def __init__(self, repo_root: Optional[Path] = None):
        self.repo_root = repo_root or Path(__file__).resolve().parent.parent.parent
        self.skills_dir = self.repo_root / "skills"
        self.reports_dir = self.repo_root / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def normalize_text(text: str) -> str:
        """Decodes entities and normalizes whitespace/punctuation for fuzzy title matching."""
        replacements = {
            "&#129309;": "🤝",
            "&hellip;": "...",
            "…": "...",
            "&mdash;": "-",
            "&ndash;": "-",
            "&amp;": "&",
            "&quot;": '"',
            "&#39;": "'",
            "&rsquo;": "'",
            "&lsquo;": "'",
            "&ldquo;": '"',
            "&rdquo;": '"',
        }
        for k, v in replacements.items():
            text = text.replace(k, v)
        text = text.lower()
        text = re.sub(r"[–—―-]", "-", text)
        text = re.sub(r"[\"\'’“”`]", "", text)
        text = re.sub(r"[^\w\s-]", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    def parse_articles(self, skill_path: Path) -> List[Dict[str, Any]]:
        """Parses references/articles.md and references/archive.md for indexed publications."""
        articles = []
        articles_file = skill_path / "references" / "articles.md"
        archive_file = skill_path / "references" / "archive.md"
        link_regex = re.compile(r"^-\s+\[\[(\d{2}\.\d{2})\s+([^\]]+)\]:\s+([^\]]+)\]\((https?://[^\)]+)\)")
        generic_regex = re.compile(r"^-\s+\[([^\]]+)\]\((https?://[^\)]+)\)")

        if articles_file.exists():
            for line in articles_file.read_text(encoding="utf-8").splitlines():
                m = link_regex.match(line.strip())
                if m:
                    articles.append({
                        "date": m.group(1),
                        "type": m.group(2).strip(),
                        "title": m.group(3).strip(),
                        "url": m.group(4).strip(),
                        "normalized": self.normalize_text(m.group(3).strip()),
                        "is_archive": False,
                    })

        if archive_file.exists():
            for line in archive_file.read_text(encoding="utf-8").splitlines():
                trimmed = line.strip()
                m = link_regex.match(trimmed)
                if m:
                    articles.append({
                        "date": m.group(1),
                        "type": m.group(2).strip(),
                        "title": m.group(3).strip(),
                        "url": m.group(4).strip(),
                        "normalized": self.normalize_text(m.group(3).strip()),
                        "is_archive": True,
                    })
                else:
                    gm = generic_regex.match(trimmed)
                    if gm:
                        articles.append({
                            "date": "ARCHIVE",
                            "type": "Archive",
                            "title": gm.group(1).strip(),
                            "url": gm.group(2).strip(),
                            "normalized": self.normalize_text(gm.group(1).strip()),
                            "is_archive": True,
                        })
        return articles

    def validate_code_snippet(self, code: str, lang: str) -> Dict[str, Any]:
        """Validates code snippet syntactic balance and structural validity."""
        errors = []
        pairs = {"{": "}", "(": ")", "[": "]"}
        stack = []
        for char in code:
            if char in pairs:
                stack.append(char)
            elif char in pairs.values():
                if not stack:
                    errors.append(f"Unmatched closing bracket '{char}'")
                    break
                expected = pairs[stack.pop()]
                if char != expected:
                    errors.append(f"Mismatched bracket: expected '{expected}', found '{char}'")
                    break

        if stack:
            errors.append(f"Unclosed open bracket(s): {', '.join(stack)}")

        lang = lang.lower().strip()
        if lang in ("bash", "sh", "shell"):
            lines = [l.strip() for l in code.splitlines() if l.strip() and not l.strip().startswith("#")]
            for l in lines[:-1]:
                if not l.endswith("\\") and not l.endswith(";") and not l.endswith("{") and not l.endswith("}"):
                    # Multi-line commands in shell scripts typically end with backslash
                    pass
        elif lang in ("tf", "terraform", "hcl"):
            if not re.search(r'\b(resource|data|variable|output|locals|terraform|module)\s+"[^"]+"', code):
                errors.append("Missing standard HCL block declaration keyword")
        elif lang in ("python", "py"):
            lines = [l for l in code.splitlines() if l.strip() and not l.strip().startswith("#")]
            if lines and lines[0].startswith(" ") or lines[0].startswith("\t"):
                errors.append("Python snippet has invalid leading indentation on first line")

        return {"valid": len(errors) == 0, "errors": errors}

    def audit_skill(self, skill_name: str) -> Dict[str, Any]:
        """Performs comprehensive provenance audit on a specific skill."""
        skill_path = self.skills_dir / skill_name
        skill_file = skill_path / "SKILL.md"

        articles = self.parse_articles(skill_path)
        content = skill_file.read_text(encoding="utf-8")
        lines = content.splitlines()

        claims = []
        code_blocks = []
        in_code = False
        curr_lang = ""
        curr_code = []
        curr_start = 0

        for idx, line in enumerate(lines, 1):
            if line.startswith("```"):
                if not in_code:
                    in_code = True
                    curr_lang = line[3:].strip()
                    curr_code = []
                    curr_start = idx
                else:
                    in_code = False
                    code_text = "\n".join(curr_code)
                    val = self.validate_code_snippet(code_text, curr_lang)
                    code_blocks.append({
                        "start_line": curr_start,
                        "end_line": idx,
                        "lang": curr_lang,
                        "valid": val["valid"],
                        "errors": val["errors"],
                    })
                continue
            if in_code:
                curr_code.append(line)
                continue

            # Anti-patterns
            ap_match = re.search(r"> \*\*Anti-Pattern \d+: ([^\]]+)\[([0-9.,\s]+)\]\*\*", line)
            if ap_match:
                dates = [d.strip() for d in ap_match.group(2).split(",")]
                claims.append({
                    "line": idx,
                    "type": "Anti-Pattern",
                    "title": ap_match.group(1).strip(),
                    "dates": dates,
                    "cites": [],
                })
                continue

            # Blueprints
            bp_match = re.search(r"^### Blueprint \d+: ([^\]]+)\[([0-9.,\s]+)\]", line)
            if bp_match:
                dates = [d.strip() for d in bp_match.group(2).split(",")]
                claims.append({
                    "line": idx,
                    "type": "Blueprint",
                    "title": bp_match.group(1).strip(),
                    "dates": dates,
                    "cites": [],
                })
                continue

            # Citations
            if "*Cites:" in line or "> *Cites:" in line:
                cited_titles = re.findall(r"\[([^\]]+)\]\(\./references/articles\.md\)", line)
                if claims:
                    claims[-1]["cites"].extend(cited_titles)
                else:
                    claims.append({
                        "line": idx,
                        "type": "Decision Matrix",
                        "title": "Decision Matrix Citation",
                        "dates": [],
                        "cites": cited_titles,
                    })

        # Resolve Citations Against Articles Vault
        total_cites = 0
        resolved_cites = 0
        unresolved_cites = []
        date_discrepancies = []
        operationalized_articles = set()

        for c in claims:
            for cite_title in c["cites"]:
                total_cites += 1
                norm_cite = self.normalize_text(cite_title)
                matched_article = None
                for a in articles:
                    if (norm_cite == a["normalized"] or
                        norm_cite in a["normalized"] or
                        a["normalized"] in norm_cite):
                        matched_article = a
                        break

                if matched_article:
                    resolved_cites += 1
                    operationalized_articles.add(matched_article["url"])
                    if matched_article["date"] != "ARCHIVE" and c["dates"]:
                        if matched_article["date"] not in c["dates"]:
                            date_discrepancies.append({
                                "claim": f"{c['type']}: {c['title']}",
                                "claim_dates": c["dates"],
                                "article_title": matched_article["title"],
                                "article_date": matched_article["date"],
                            })
                else:
                    unresolved_cites.append({
                        "line": c["line"],
                        "claim": f"{c['type']}: {c['title']}",
                        "cited_title": cite_title,
                    })

        grounding_score = round((resolved_cites / total_cites * 100)) if total_cites > 0 else 100
        code_errors = sum(len(b["errors"]) for b in code_blocks)

        return {
            "skill": skill_name,
            "articles_count": len(articles),
            "claims_count": len(claims),
            "total_cites": total_cites,
            "resolved_cites": resolved_cites,
            "grounding_score": grounding_score,
            "unresolved_cites": unresolved_cites,
            "date_discrepancies": date_discrepancies,
            "code_blocks_count": len(code_blocks),
            "code_errors": code_errors,
            "code_blocks": code_blocks,
            "operationalized_count": len(operationalized_articles),
            "unutilized_count": len(articles) - len(operationalized_articles),
        }

    def verify_all(self) -> Dict[str, Any]:
        """Runs audit across all skills in skills/ directory."""
        skills = [
            d.name for d in self.skills_dir.iterdir()
            if d.is_dir() and (d / "SKILL.md").exists() and d.name != "gcp-skills-index"
        ]
        skills.sort()
        results = [self.audit_skill(s) for s in skills]
        return {
            "timestamp": datetime.now().isoformat(),
            "skills": results,
            "totals": {
                "skills_audited": len(results),
                "total_articles": sum(r["articles_count"] for r in results),
                "total_claims": sum(r["claims_count"] for r in results),
                "total_cites": sum(r["total_cites"] for r in results),
                "resolved_cites": sum(r["resolved_cites"] for r in results),
                "unresolved_cites": sum(len(r["unresolved_cites"]) for r in results),
                "date_discrepancies": sum(len(r["date_discrepancies"]) for r in results),
                "code_blocks": sum(r["code_blocks_count"] for r in results),
                "code_errors": sum(r["code_errors"] for r in results),
            }
        }

if __name__ == "__main__":
    agent = GroundingVerifierAgent()
    data = agent.verify_all()
    totals = data["totals"]
    print("=" * 70)
    print("KNOWLEDGE PROVENANCE & EXTRACTION VERIFIER AGENT (ADK PYTHON)")
    print("=" * 70)
    for s in data["skills"]:
        status = "✓ PASS" if (s["grounding_score"] == 100 and not s["date_discrepancies"]) else "⚠ FLAG"
        print(f"{status}: {s['skill']:<28} [Grounding: {s['grounding_score']}%] | Articles: {s['articles_count']} | Cites: {s['total_cites']} | Date Diff: {len(s['date_discrepancies'])}")
    print("=" * 70)
    print(f"Total Reference Documents Vault: {totals['total_articles']}")
    print(f"Extracted Claims Cited:          {totals['total_cites']}")
    print(f"Resolved Citations:              {totals['resolved_cites']}")
    print(f"Unresolved Citations:            {totals['unresolved_cites']}")
    print(f"Date Discrepancies:              {totals['date_discrepancies']}")
    print(f"Code Blocks Validated:           {totals['code_blocks']} (Errors: {totals['code_errors']})")
    print("=" * 70)
