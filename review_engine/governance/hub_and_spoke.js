/**
 * Hub-and-Spoke Architectural Governance Engine (Enhanced Phase 2)
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Aggregates AST inspection results across HCL, K8s, and Dependencies,
 * applies the 4 Hub Governance Pillars to the 13 Spoke Pods,
 * triggers Pod 12 on multi-cloud detection,
 * prunes dormant pods via dynamic pod dispatch,
 * annotates model cutoff gaps, and generates unified remediation diffs.
 */

const path = require('path');
const { HclParser } = require('../parsers/hcl_parser');
const { K8sParser } = require('../parsers/k8s_parser');
const { DependencyAuditor } = require('../parsers/dep_auditor');
const { ModelCutoffResolver } = require('../mesh/model_resolver');

class HubAndSpokeGovernanceEngine {
  constructor(options = {}) {
    this.modelProfile = ModelCutoffResolver.resolve({
      model: options.targetModel,
      cutoff: options.targetCutoff
    });
    this.targetModel = this.modelProfile.id;
    this.hclParser = new HclParser(options);
    this.k8sParser = new K8sParser(options);
    this.depAuditor = new DependencyAuditor();
  }

  auditDirectory(targetDir) {
    const hclResults = this.hclParser.parsePath(targetDir);
    const k8sResults = this.k8sParser.parsePath(targetDir);
    const depResults = this.depAuditor.parsePath(targetDir);

    const allFindings = [
      ...hclResults.governance_findings,
      ...k8sResults.governance_findings,
      ...depResults.governance_findings
    ];

    const allDiffs = [
      ...hclResults.remediation_diffs,
      ...k8sResults.remediation_diffs
    ];

    const allModelGaps = [
      ...hclResults.model_gaps,
      ...k8sResults.model_gaps
    ];

    // Pillar breakdown
    const pillars = {
      'Pillar 1: IaC & Metadata Governance': { findings: [], score: 100 },
      'Pillar 2: Zero-Trust Security & Hardening': { findings: [], score: 100 },
      'Pillar 3: Compute FinOps & Workload Sizing': { findings: [], score: 100 },
      'Pillar 4: Observability & Telemetry': { findings: [], score: 100 }
    };

    for (const f of allFindings) {
      if (pillars[f.pillar]) {
        pillars[f.pillar].findings.push(f);
        const penalty = f.severity === 'CRITICAL' ? 25 : f.severity === 'HIGH_RISK' ? 15 : f.severity === 'MEDIUM' ? 10 : 5;
        pillars[f.pillar].score = Math.max(0, pillars[f.pillar].score - penalty);
      }
    }

    // Dynamic Pod Dispatch Pruning (Token Optimizer for Phase 3)
    const activePods = new Set();
    activePods.add('Pod 13: Platform Engineering & IaC Specialist'); // Hub Anchor

    // GKE
    if (k8sResults.workloads.length > 0 || k8sResults.legacy_ingresses.length > 0 || hclResults.resources.some(r => r.type.includes('container_cluster'))) {
      activePods.add('Pod 1: GKE Specialist Pod');
    }
    // Cloud Run
    if (hclResults.resources.some(r => r.type.includes('cloud_run'))) {
      activePods.add('Pod 2: Cloud Run Serverless Pod');
    }
    // Pub/Sub
    if (hclResults.resources.some(r => r.type.includes('pubsub'))) {
      activePods.add('Pod 3: Event-Driven & Pub/Sub Pod');
    }
    // BigQuery
    if (hclResults.resources.some(r => r.type.includes('bigquery'))) {
      activePods.add('Pod 4: Unified BigQuery & Modern Data Pod');
    }
    // Compute FinOps
    if (hclResults.resources.some(r => r.type.includes('compute') || r.type.includes('container')) || k8sResults.workloads.length > 0) {
      activePods.add('Pod 5: GCP Compute FinOps Pod');
    }
    // Security & Zero-Trust
    if (hclResults.resources.some(r => r.type.includes('iam') || r.type.includes('service_account') || r.type.includes('armor')) || allFindings.some(f => f.pillar.includes('Security'))) {
      activePods.add('Pod 6: Security Hardening & Zero-Trust Pod');
    }
    // Networking
    if (hclResults.resources.some(r => r.type.includes('network') || r.type.includes('subnetwork') || r.type.includes('vpc') || r.type.includes('interconnect'))) {
      activePods.add('Pod 7: Cloud Networking & Connectivity Pod');
    }
    // Databases
    if (hclResults.resources.some(r => r.type.includes('sql') || r.type.includes('spanner') || r.type.includes('firestore'))) {
      activePods.add('Pod 8: Operational Databases & Cloud SQL Pod');
    }
    // Frontier / Gemma / TPU
    if (hclResults.resources.some(r => r.type.includes('tpu')) || k8sResults.inference_workloads.length > 0) {
      activePods.add('Pod 9: Frontier Models, Gemma & TPU Serving Pod');
    }
    // Cross-Cloud / Migrations (Pod 12)
    if (hclResults.multi_cloud.detected) {
      activePods.add('Pod 12: Cross-Cloud Modernization & Migration Pod');
    }

    const allKnownPods = [
      'Pod 1: GKE Specialist Pod',
      'Pod 2: Cloud Run Serverless Pod',
      'Pod 3: Event-Driven & Pub/Sub Pod',
      'Pod 4: Unified BigQuery & Modern Data Pod',
      'Pod 5: GCP Compute FinOps Pod',
      'Pod 6: Security Hardening & Zero-Trust Pod',
      'Pod 7: Cloud Networking & Connectivity Pod',
      'Pod 8: Operational Databases & Cloud SQL Pod',
      'Pod 9: Frontier Models, Gemma & TPU Serving Pod',
      'Pod 10: Generative Media & Conversational AI Pod',
      'Pod 11: Android XR & Spatial Computing Pod',
      'Pod 12: Cross-Cloud Modernization & Migration Pod',
      'Pod 13: Platform Engineering & IaC Specialist'
    ];

    const dormantPods = allKnownPods.filter(p => !activePods.has(p));
    const tokenSavingsPercent = Math.round((dormantPods.length / allKnownPods.length) * 100);

    const multiCloudTrigger = {
      activated: hclResults.multi_cloud.detected,
      pod: 'Pod 12: Cross-Cloud Modernization & Migration Pod',
      providers_detected: hclResults.multi_cloud.providers,
      foreign_resources: hclResults.multi_cloud.resources,
      storage_uris: hclResults.multi_cloud.storage_uris,
      connection_strings: hclResults.multi_cloud.connection_strings,
      recommendation: hclResults.multi_cloud.detected
        ? `Foreign cloud indicators detected (${hclResults.multi_cloud.providers.join(', ')}). Activating Pod 12 for automated cross-cloud modernization, S3-to-GCS Storage Transfer Service, and BigQuery SQL translation.`
        : 'Pure GCP stack detected. Pod 12 operates in passive standby.'
    };

    const globalScore = Math.round(
      (pillars['Pillar 1: IaC & Metadata Governance'].score +
       pillars['Pillar 2: Zero-Trust Security & Hardening'].score +
       pillars['Pillar 3: Compute FinOps & Workload Sizing'].score +
       pillars['Pillar 4: Observability & Telemetry'].score) / 4
    );

    const hasCritical = allFindings.some(f => f.severity === 'CRITICAL');

    return {
      timestamp: new Date().toISOString(),
      target_directory: targetDir,
      target_model: this.targetModel,
      summary: {
        total_terraform_resources: hclResults.resources.length,
        total_kubernetes_workloads: k8sResults.workloads.length,
        total_dependencies: depResults.dependencies.length,
        total_governance_findings: allFindings.length,
        critical_violations: allFindings.filter(f => f.severity === 'CRITICAL').length,
        high_risk_violations: allFindings.filter(f => f.severity === 'HIGH_RISK').length,
        global_ast_score: globalScore,
        ci_cd_status: globalScore >= 80 && !hasCritical ? 'PASS' : 'FAIL'
      },
      pillars,
      pod_dispatch: {
        active_pods: Array.from(activePods),
        dormant_pods: dormantPods,
        token_savings_percent: tokenSavingsPercent
      },
      multi_cloud_trigger: multiCloudTrigger,
      model_gaps: allModelGaps,
      remediation_diffs: allDiffs,
      raw_inventory: {
        terraform: hclResults,
        kubernetes: k8sResults,
        dependencies: depResults
      }
    };
  }

  generateMarkdownReport(auditResult) {
    const s = auditResult.summary;
    const p = auditResult.pillars;
    const mc = auditResult.multi_cloud_trigger;
    const pd = auditResult.pod_dispatch;

    let md = `# AST Pre-Flight & Hub-and-Spoke Governance Audit Report\n\n`;
    md += `> **Audit Engine**: review_engine/governance/hub_and_spoke.js (Dynamic Cutoff v2.0)\n`;
    md += `> **Audit Timestamp**: ${auditResult.timestamp}\n`;
    md += `> **Target Directory**: \`${auditResult.target_directory}\`\n`;
    md += `> **Active Review Model Calibration**: ${this.modelProfile.label}\n`;
    md += `> **CI/CD Quality Gate**: ${s.ci_cd_status === 'PASS' ? '🟢 PASSED' : '🔴 BLOCKED'} (Min Score: 80, Zero Criticals)\n\n`;

    md += `## 📊 Executive AST & Governance Scorecard\n\n`;
    md += `| Governance Pillar | Discovered Findings | Pillar Health Score | Status |\n`;
    md += `| :--- | :---: | :---: | :--- |\n`;
    for (const [pName, data] of Object.entries(p)) {
      const statusIcon = data.score >= 90 ? '🟢 HEALTHY' : data.score >= 70 ? '🟡 CAUTION' : '🔴 REMEDIATION REQUIRED';
      md += `| **${pName}** | ${data.findings.length} | **${data.score}/100** | ${statusIcon} |\n`;
    }
    md += `| **Overall AST Architecture Score** | **${s.total_governance_findings}** | **${s.global_ast_score}/100** | ${s.ci_cd_status === 'PASS' ? '🟢 PRODUCTION READY' : '🔴 ACTION REQUIRED'} |\n\n`;

    md += `## 🎯 Dynamic Pod Dispatch Pruning (Phase 3 Mesh Optimization)\n\n`;
    md += `* **Active Review Mesh**: ${pd.active_pods.length} pods dispatched for LLM reasoning.\n`;
    for (const ap of pd.active_pods) {
      md += `  - 🟢 \`${ap}\`\n`;
    }
    md += `* **Dormant Pods Pruned**: ${pd.dormant_pods.length} pods placed in standby (Token savings: **${pd.token_savings_percent}%**).\n`;
    for (const dp of pd.dormant_pods) {
      md += `  - 💤 \`${dp}\`\n`;
    }
    md += `\n`;

    md += `## 🌐 Cross-Cloud Modernization Trigger (Pod 12 Status)\n\n`;
    if (mc.activated) {
      md += `> [!IMPORTANT]\n`;
      md += `> **Pod 12 ACTIVATED**: Foreign cloud indicators detected: **${mc.providers_detected.join(', ')}**\n`;
      md += `> - Foreign Resources Discovered: ${mc.foreign_resources.length}\n`;
      if (mc.storage_uris.length > 0) {
        md += `> - Foreign Storage URIs: ${mc.storage_uris.map(u => u.uri).join(', ')}\n`;
      }
      md += `> - **Architectural Directive**: ${mc.recommendation}\n\n`;
    } else {
      md += `> [!NOTE]\n`;
      md += `> **Pod 12 Inactive (Standby)**: ${mc.recommendation}\n\n`;
    }

    if (auditResult.model_gaps.length > 0) {
      md += `## 🧠 Dynamic Cutoff Knowledge Gaps (${this.modelProfile.display_name} — Cutoff ${this.modelProfile.official_cutoff})\n\n`;
      for (const mg of auditResult.model_gaps) {
        md += `> [!WARNING]\n`;
        md += `> **${mg.topic}** [${mg.tier}]\n`;
        md += `> ${mg.context}\n\n`;
      }
    }

    md += `## 🛠️ Detailed Deterministic Findings\n\n`;
    let count = 1;
    for (const [pName, data] of Object.entries(p)) {
      if (data.findings.length === 0) continue;
      md += `### ${pName}\n\n`;
      for (const f of data.findings) {
        const alertTag = f.severity === 'CRITICAL' ? 'CAUTION' : f.severity === 'HIGH_RISK' ? 'WARNING' : 'NOTE';
        md += `> [!${alertTag}]\n`;
        md += `> **Finding ${count++}: ${f.rule}** [${f.severity}]\n`;
        md += `> - **Responsible Pod**: ${f.pod}\n`;
        md += `> - **Resource**: \`${f.resource}\` (${f.file}${f.line ? `:${f.line}` : ''})\n`;
        md += `> - **Issue**: ${f.message}\n`;
        md += `> - **Mandatory Remediation**: ${f.remediation}\n\n`;
      }
    }

    if (auditResult.remediation_diffs.length > 0) {
      md += `## 🩹 Deterministic Remediation Unified Diffs\n\n`;
      md += `The following advisory diffs resolve discovered AST violations with zero hallucination risk:\n\n`;
      for (const rd of auditResult.remediation_diffs) {
        md += `### Fix: \`${rd.rule}\` on \`${path.basename(rd.target_file)}\`\n\n`;
        md += `\`\`\`diff\n${rd.diff}\n\`\`\`\n\n`;
      }
    }

    return md;
  }
}

module.exports = { HubAndSpokeGovernanceEngine };
