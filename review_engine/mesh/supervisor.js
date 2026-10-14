/**
 * ADK 1.0 Multi-Agent Mesh Supervisor & Orchestrator (v2.0)
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Coordinates:
 * 1. Pre-Flight AST Governance Scan (HubAndSpokeGovernanceEngine)
 * 2. Model-Agnostic Cutoff & Dynamic Tier Resolution (ModelCutoffResolver)
 * 3. Dynamic Specialist Pod Activation (13-Pod Catalog)
 * 4. Gemini Context Caching & Dynamic Cutoff Slicing
 * 5. Adversarial Peer Critique & Mutual Arbitration (PeerArbitrationEngine)
 * 6. Deterministic Remediation Patch Generation
 */

const path = require('path');
const { HubAndSpokeGovernanceEngine } = require('../governance/hub_and_spoke');
const {
  GkeSpecialistPod,
  CloudRunServerlessPod,
  PubSubEventDrivenPod,
  UnifiedBigQueryPod,
  ComputeFinOpsPod,
  SecurityZeroTrustPod,
  CloudNetworkingPod,
  OperationalDatabasesPod,
  FrontierModelsGemmaPod,
  GenerativeMediaVoicePod,
  AndroidXrSpatialPod,
  CrossCloudMigrationPod,
  PlatformEngineeringIacPod
} = require('./pods');
const { PeerArbitrationEngine } = require('./arbitration');
const { ContextCacheManager } = require('./cache_manager');
const { ModelCutoffResolver } = require('./model_resolver');

class ArchitectureReviewSupervisor {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || path.resolve(__dirname, '..', '..');
    this.modelProfile = ModelCutoffResolver.resolve({
      model: options.targetModel,
      cutoff: options.targetCutoff
    });
    this.targetModel = this.modelProfile.id;
    this.targetCutoff = this.modelProfile.official_cutoff;

    this.hubEngine = new HubAndSpokeGovernanceEngine({
      targetModel: options.targetModel,
      targetCutoff: options.targetCutoff,
      requiredLabels: options.requiredLabels
    });
    this.arbitrationEngine = new PeerArbitrationEngine();
    this.cacheManager = new ContextCacheManager({
      targetModel: options.targetModel,
      targetCutoff: options.targetCutoff,
      repoRoot: this.repoRoot
    });

    this.podRegistry = new Map([
      ['Pod 1: GKE Specialist Pod', new GkeSpecialistPod(this.repoRoot)],
      ['Pod 2: Cloud Run Serverless Pod', new CloudRunServerlessPod(this.repoRoot)],
      ['Pod 3: Event-Driven & Pub/Sub Pod', new PubSubEventDrivenPod(this.repoRoot)],
      ['Pod 4: Unified BigQuery & Modern Data Pod', new UnifiedBigQueryPod(this.repoRoot)],
      ['Pod 5: GCP Compute FinOps Pod', new ComputeFinOpsPod(this.repoRoot)],
      ['Pod 6: Security Hardening & Zero-Trust Pod', new SecurityZeroTrustPod(this.repoRoot)],
      ['Pod 7: Cloud Networking & Connectivity Pod', new CloudNetworkingPod(this.repoRoot)],
      ['Pod 8: Operational Databases & Cloud SQL Pod', new OperationalDatabasesPod(this.repoRoot)],
      ['Pod 9: Frontier Models, Gemma & TPU Serving Pod', new FrontierModelsGemmaPod(this.repoRoot)],
      ['Pod 10: Generative Media & Conversational AI Pod', new GenerativeMediaVoicePod(this.repoRoot)],
      ['Pod 11: Android XR & Spatial Computing Pod', new AndroidXrSpatialPod(this.repoRoot)],
      ['Pod 12: Cross-Cloud Modernization & Migration Pod', new CrossCloudMigrationPod(this.repoRoot)],
      ['Pod 13: Platform Engineering & IaC Specialist', new PlatformEngineeringIacPod(this.repoRoot)]
    ]);
  }

  /**
   * Executes the full 5-phase ADK Multi-Agent Mesh Review
   */
  async runReview(targetPath) {
    const startTime = Date.now();
    const resolvedTarget = path.resolve(targetPath);

    // Phase 1: Deterministic AST Pre-Flight
    const preflightReport = this.hubEngine.auditDirectory(resolvedTarget);
    const allFindings = Object.values(preflightReport.pillars).flatMap(p => p.findings || []);

    // Phase 2: Dynamic Pod Activation & Parallel Evaluation
    const activePodsList = [];
    const activePodsMap = new Map();
    const podEvaluations = [];

    for (const podName of preflightReport.pod_dispatch.active_pods) {
      const pod = this.podRegistry.get(podName);
      if (pod) {
        activePodsList.push(pod);
        activePodsMap.set(pod.id, pod);
        const evaluation = pod.evaluate(preflightReport.raw_inventory, allFindings, this.modelProfile);
        podEvaluations.push(evaluation);
      }
    }

    // Phase 2.5: Context Caching Telemetry (Dynamic Cutoff-Relative Slicing)
    const contextCacheReport = this.cacheManager.buildCachedContext(activePodsList);

    // Phase 3: Adversarial Peer Critique & Mutual Arbitration
    const arbitrationReport = this.arbitrationEngine.executeArbitration(
      activePodsMap,
      preflightReport.raw_inventory,
      allFindings
    );

    const executionDurationMs = Date.now() - startTime;
    const finalStatus = preflightReport.summary.ci_cd_status === 'PASS'
      ? 'APPROVED'
      : 'REJECTED_ACTION_REQUIRED';

    return {
      supervisor_version: '2.0.0-adk-mesh',
      timestamp: new Date().toISOString(),
      execution_duration_ms: executionDurationMs,
      target_codebase: resolvedTarget,
      target_path: resolvedTarget,
      target_model: this.modelProfile.id,
      model_calibration: this.modelProfile,
      cutoff_rule: this.modelProfile.label,
      context_cache: contextCacheReport,
      ast_preflight: preflightReport,
      pod_evaluations: podEvaluations,
      peer_arbitration: arbitrationReport,
      final_consensus_status: finalStatus
    };
  }

  /**
   * Generates a rich Markdown Implementation Plan / Review Artifact
   */
  generateReviewArtifact(reviewResult) {
    const lines = [];
    const preflight = reviewResult.ast_preflight;
    const cache = reviewResult.context_cache;
    const profile = reviewResult.model_calibration;

    lines.push(`# 🏛️ GCP Multi-Agent Mesh Architecture Review Report`);
    lines.push(`**Generated**: ${reviewResult.timestamp}`);
    lines.push(`**Target Workload**: \`${reviewResult.target_codebase}\``);
    lines.push(`**Model Calibration**: ${profile.label}`);
    lines.push(`**Generation Classification**: \`${profile.generation_status.toUpperCase()}\` (${profile.generation}) | **Verified**: \`${profile.is_verified}\``);
    lines.push(`**Consensus Status**: **${reviewResult.final_consensus_status}** (Composite Governance Score: **${preflight.summary.global_ast_score}/100**)\n`);

    if (!profile.is_verified) {
      lines.push(`> [!WARNING]`);
      lines.push(`> **Unverified Model Fail-Safe Active**: No active model or cutoff was explicitly specified. Defaulting to the conservative Fail-Safe Horizon (\`${profile.official_cutoff}\`, treating all releases \`>= ${profile.post_cutoff_start}\` as Dynamic Tier 1).\n`);
    }

    if (cache) {
      lines.push(`> [!TIP]`);
      lines.push(`> **Gemini Context Caching & Dynamic Cutoff Slicing Active (\`${cache.cache_id}\`)**: Loaded **${cache.skills_cached} domain runbooks** under policy **${cache.tier_policy}** (Tier 1 Post-Cutoff Articles: **${cache.dynamic_article_telemetry.tier_1_post_cutoff_count}**, Tier 2 Boundary: **${cache.dynamic_article_telemetry.tier_2_boundary_count}**). Multi-Pod token consumption reduced from **${cache.uncached_multi_pod_tokens.toLocaleString()}** to **${cache.effective_billed_tokens.toLocaleString()} effective tokens** (**${cache.efficiency_gain} cost savings**).\n`);
    }

    // 1. Executive Pillar Scorecard
    lines.push(`## 📊 1. Four-Pillar Governance Scorecard\n`);
    lines.push(`| Governance Pillar | Score | Status | Findings |`);
    lines.push(`| :--- | :---: | :---: | :---: |`);
    for (const [pName, p] of Object.entries(preflight.pillars)) {
      const icon = p.score >= 85 ? '🟢' : (p.score >= 70 ? '🟡' : '🔴');
      lines.push(`| **${pName}** | **${p.score}/100** | ${icon} | ${p.findings.length} |`);
    }
    lines.push('');

    // 2. Activated Specialist Pods
    lines.push(`## 🤖 2. Activated ADK Specialist Pods (${reviewResult.pod_evaluations.length} Active)\n`);
    lines.push(`| Pod ID | Specialist Pod | Findings Addressed | Recommendations | Status |`);
    lines.push(`| :--- | :--- | :---: | :---: | :---: |`);
    for (const pod of reviewResult.pod_evaluations) {
      lines.push(`| \`${pod.pod_id}\` | **${pod.name}** | ${pod.findings_addressed || 0} | ${(pod.recommendations || []).length} | \`${pod.status}\` |`);
    }
    lines.push('');

    // 3. Peer Arbitration & Cross-Domain Trade-Off Resolutions
    lines.push(`## ⚖️ 3. Adversarial Peer Arbitration & Trade-Off Resolutions\n`);
    if (reviewResult.peer_arbitration.arbitration_resolutions.length === 0) {
      lines.push(`*No cross-pod conflicts detected.*\n`);
    } else {
      for (const arb of reviewResult.peer_arbitration.arbitration_resolutions) {
        lines.push(`### 🔄 [${arb.arbitration_pair}] Winner: ${arb.winner}`);
        lines.push(`- **Consensus Decision**: ${arb.consensus}`);
        lines.push(`- **Operational Impact**: ${arb.impact}\n`);
      }
    }

    // 4. Detailed AST Findings by Severity
    lines.push(`## 🚨 4. Detailed Architectural Findings & Remediations\n`);
    const allFindings = Object.values(preflight.pillars).flatMap(p => p.findings || []);
    if (allFindings.length === 0) {
      lines.push(`✅ **Zero architectural violations detected.**\n`);
    } else {
      lines.push(`| Severity | Rule ID | Resource | Finding & Remediation |`);
      lines.push(`| :---: | :--- | :--- | :--- |`);
      for (const f of allFindings) {
        lines.push(`| **${f.severity}** | \`${f.rule}\` | \`${f.resource}\` | ${f.message}<br>👉 **Fix**: ${f.remediation} |`);
      }
      lines.push('');
    }

    // 5. Deterministic Auto-Remediation Code Diffs
    if (preflight.remediation_diffs && preflight.remediation_diffs.length > 0) {
      lines.push(`## 🛠️ 5. Deterministic Auto-Remediation Code Diffs\n`);
      for (const item of preflight.remediation_diffs) {
        const relFile = path.relative(reviewResult.target_codebase, item.target_file) || path.basename(item.target_file);
        lines.push(`### 📄 \`${relFile}\` (\`${item.rule}\`)`);
        lines.push('```diff');
        lines.push(item.diff);
        lines.push('```\n');
      }
    }

    return lines.join('\n');
  }
}

module.exports = { ArchitectureReviewSupervisor };
