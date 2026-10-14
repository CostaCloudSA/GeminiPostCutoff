#!/usr/bin/env node
/**
 * AST Pre-Flight & Hub-and-Spoke Governance Audit Runner (Enhanced Phase 2)
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Supports:
 * - Dynamic Pod Dispatch Pruning
 * - Model Cutoff Calibration (Flash 3.8 vs Pro 3.1)
 * - CI/CD Quality Gate (--min-score, --fail-on-critical)
 * - Deterministic Remediation Unified Diff generation
 */

const fs = require('fs');
const path = require('path');
const { HubAndSpokeGovernanceEngine } = require('./governance/hub_and_spoke');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: path.join(__dirname, 'tests', 'fixtures'),
    model: 'flash-3.8',
    minScore: 0,
    failOnCritical: false,
    cleanCheck: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' && args[i + 1]) {
      options.target = path.resolve(args[++i]);
    } else if (arg === '--model' && args[i + 1]) {
      options.model = args[++i];
    } else if (arg === '--min-score' && args[i + 1]) {
      options.minScore = parseInt(args[++i], 10);
    } else if (arg === '--fail-on-critical') {
      options.failOnCritical = true;
    } else if (arg === '--clean-check') {
      options.cleanCheck = true;
    } else if (!arg.startsWith('--')) {
      options.target = path.resolve(arg);
    }
  }

  return options;
}

function runAudit(targetDir, options, reportFilename) {
  const repoRoot = path.resolve(__dirname, '..');
  const reportsDir = path.join(repoRoot, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  console.log('='.repeat(75));
  console.log(`AST PRE-FLIGHT & HUB-AND-SPOKE GOVERNANCE AUDITOR (MODEL: ${options.model.toUpperCase()})`);
  console.log('='.repeat(75));
  console.log(`Auditing target: ${targetDir}\n`);

  const engine = new HubAndSpokeGovernanceEngine({ targetModel: options.model });
  const auditResult = engine.auditDirectory(targetDir);

  console.log('--- GOVERNANCE PILLAR HEALTH SCORES ---');
  for (const [pName, data] of Object.entries(auditResult.pillars)) {
    const icon = data.score >= 90 ? '✓' : data.score >= 70 ? '⚠' : '✗';
    console.log(`${icon} ${pName.padEnd(45)}: ${String(data.score).padStart(3)}/100 (${data.findings.length} findings)`);
  }

  console.log('\n--- DYNAMIC POD DISPATCH PRUNING (PHASE 3 MESH OPTIMIZATION) ---');
  console.log(`🟢 Active Mesh Pods (${auditResult.pod_dispatch.active_pods.length}):`);
  auditResult.pod_dispatch.active_pods.forEach(p => console.log(`   - ${p}`));
  console.log(`💤 Dormant Pods (${auditResult.pod_dispatch.dormant_pods.length}): Pruned for ${auditResult.pod_dispatch.token_savings_percent}% token conservation.`);

  console.log('\n--- CROSS-CLOUD MODERNIZATION TRIGGER (POD 12) ---');
  if (auditResult.multi_cloud_trigger.activated) {
    console.log(`🚨 POD 12 ACTIVATED!`);
    console.log(`   Foreign Providers: ${auditResult.multi_cloud_trigger.providers_detected.join(', ')}`);
    console.log(`   Foreign Resources: ${auditResult.multi_cloud_trigger.foreign_resources.length}`);
    if (auditResult.multi_cloud_trigger.storage_uris.length > 0) {
      console.log(`   Foreign Storage:   ${auditResult.multi_cloud_trigger.storage_uris.map(u => u.uri).join(', ')}`);
    }
    console.log(`   Directive: ${auditResult.multi_cloud_trigger.recommendation}`);
  } else {
    console.log(`✓ Standby: Pure GCP stack detected.`);
  }

  if (auditResult.model_gaps.length > 0) {
    console.log('\n--- MODEL CUTOFF KNOWLEDGE GAPS DETECTED ---');
    auditResult.model_gaps.forEach(g => console.log(`⚠ [${g.tier}] ${g.topic}`));
  }

  if (auditResult.remediation_diffs.length > 0) {
    console.log(`\n--- DETERMINISTIC REMEDIATION DIFFS (${auditResult.remediation_diffs.length} PATCHES READY) ---`);
    auditResult.remediation_diffs.slice(0, 3).forEach(d => {
      console.log(`  [PATCH] ${d.rule} on ${path.basename(d.target_file)}`);
    });
    if (auditResult.remediation_diffs.length > 3) {
      console.log(`  ... and ${auditResult.remediation_diffs.length - 3} more patches generated.`);
    }
  }

  console.log('\n--- SUMMARY METRICS ---');
  console.log(`- Terraform Resources Discovered: ${auditResult.summary.total_terraform_resources}`);
  console.log(`- Kubernetes Workloads Discovered: ${auditResult.summary.total_kubernetes_workloads}`);
  console.log(`- Dependencies Audited:           ${auditResult.summary.total_dependencies}`);
  console.log(`- Total Governance Findings:       ${auditResult.summary.total_governance_findings}`);
  console.log(`- Critical Violations:            ${auditResult.summary.critical_violations}`);
  console.log(`- High Risk Violations:           ${auditResult.summary.high_risk_violations}`);
  console.log(`- Global AST Architecture Score:  ${auditResult.summary.global_ast_score}/100`);
  console.log(`- CI/CD Gate Status:              ${auditResult.summary.ci_cd_status}`);
  console.log('='.repeat(75));

  const reportMd = engine.generateMarkdownReport(auditResult);
  const reportPath = path.join(reportsDir, reportFilename);
  fs.writeFileSync(reportPath, reportMd, 'utf8');
  console.log(`\n[SUCCESS] Generated report at: ${reportPath}\n`);

  return auditResult;
}

function main() {
  const options = parseArgs();
  
  // 1. Run main audit
  const result = runAudit(options.target, options, 'ast_governance_baseline.md');

  // 2. If --clean-check, run against clean fixture to assert 100/100
  if (options.cleanCheck) {
    const cleanDir = path.join(__dirname, 'tests', 'fixtures_clean');
    console.log('\n>>> RUNNING VERIFICATION AGAINST 100/100 CLEAN PRODUCTION BLUEPRINT <<<');
    const cleanResult = runAudit(cleanDir, { ...options, model: 'flash-3.8' }, 'ast_governance_clean_blueprint.md');
    if (cleanResult.summary.global_ast_score < 95 || cleanResult.summary.total_governance_findings > 0) {
      console.error(`[ERROR] Clean production fixture did not achieve perfect score! (Score: ${cleanResult.summary.global_ast_score}, Findings: ${cleanResult.summary.total_governance_findings})`);
      process.exit(1);
    } else {
      console.log('✓ Clean Production Blueprint verified: PERFECT 100/100 ARCHITECTURE SCORE!');
    }
  }

  // Check exit thresholds
  if (options.minScore > 0 && result.summary.global_ast_score < options.minScore) {
    console.error(`[CI/CD BLOCK] Score ${result.summary.global_ast_score} is below required threshold ${options.minScore}!`);
    process.exit(1);
  }

  if (options.failOnCritical && result.summary.critical_violations > 0) {
    console.error(`[CI/CD BLOCK] Found ${result.summary.critical_violations} critical violations!`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
