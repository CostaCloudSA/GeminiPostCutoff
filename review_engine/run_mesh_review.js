#!/usr/bin/env node
/**
 * 13-Pod ADK Mesh Architecture Review Runner (Phase 3)
 * Part of GeminiPostCutoff Architecture Review Engine
 */

const fs = require('fs');
const path = require('path');
const { ArchitectureReviewSupervisor } = require('./mesh/supervisor');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: path.join(__dirname, 'tests', 'fixtures'),
    model: null,
    cutoff: null,
    output: 'architecture_review_report.md',
    cleanCheck: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' && args[i + 1]) {
      options.target = path.resolve(args[++i]);
    } else if (arg === '--model' && args[i + 1]) {
      options.model = args[++i];
    } else if (arg === '--cutoff' && args[i + 1]) {
      options.cutoff = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === '--clean-check') {
      options.cleanCheck = true;
    } else if (!arg.startsWith('--')) {
      options.target = path.resolve(arg);
    }
  }

  return options;
}

async function runReview(targetDir, options, outputFilename) {
  const repoRoot = path.resolve(__dirname, '..');
  const reportsDir = path.join(repoRoot, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const supervisor = new ArchitectureReviewSupervisor({
    targetModel: options.model,
    targetCutoff: options.cutoff,
    repoRoot
  });
  const review = await supervisor.runReview(targetDir);

  console.log('='.repeat(78));
  console.log('ENTERPRISE 13-POD ADK ARCHITECTURE REVIEW & ARBITRATION MESH (PHASE 3)');
  console.log('='.repeat(78));
  console.log(`Target Codebase: ${targetDir}`);
  console.log(`Active Model:    ${review.model_calibration.label}`);
  console.log(`Time:            ${new Date().toISOString()}\n`);

  console.log('--- SUPERVISOR GOVERNANCE POSTURE ---');
  for (const [pName, data] of Object.entries(review.ast_preflight.pillars)) {
    const icon = data.score >= 90 ? '✓' : data.score >= 70 ? '⚠' : '✗';
    console.log(`${icon} ${pName.padEnd(45)}: ${String(data.score).padStart(3)}/100 (${data.findings.length} findings)`);
  }

  console.log('\n--- GEMINI CONTEXT CACHING TELEMETRY ---');
  console.log(`✓ Cache Manifest:       ${review.context_cache.cache_id}`);
  console.log(`✓ Cached 21 Runbooks:   ${review.context_cache.cached_runbook_tokens.toLocaleString()} tokens`);
  console.log(`✓ Token Cost Reduction: ${review.context_cache.net_tokens_conserved.toLocaleString()} tokens conserved (${review.context_cache.efficiency_gain})`);

  console.log('\n--- DYNAMIC POD MESH DISPATCH ---');
  console.log(`🟢 Active Review Pods (${review.pod_evaluations.length}):`);
  review.pod_evaluations.forEach(p => console.log(`   - ${p.name}`));

  console.log('\n--- ADVERSARIAL PEER CRITIQUE & MUTUAL ARBITRATION ---');
  if (review.peer_arbitration.arbitration_resolutions.length > 0) {
    review.peer_arbitration.arbitration_resolutions.forEach(r => {
      console.log(`⚖️  [${r.arbitration_pair}] Winner: ${r.winner}`);
      console.log(`    Consensus: ${r.consensus.substring(0, 110)}...`);
    });
  } else {
    console.log('✓ Pure single-tier stack. No cross-tier arbitration conflicts.');
  }

  console.log('\n--- SUPERVISOR VERDICT ---');
  console.log(`Status: ${review.final_consensus_status === 'APPROVED' ? '🟢 APPROVED' : '🔴 ACTION REQUIRED'}`);
  console.log(`Composite AST Score: ${review.ast_preflight.summary.global_ast_score}/100`);
  console.log('='.repeat(78));

  const artifactMd = supervisor.generateReviewArtifact(review);
  const outPath = path.join(reportsDir, outputFilename);
  fs.writeFileSync(outPath, artifactMd, 'utf8');
  console.log(`\n[SUCCESS] Generated Phased Architecture Review Artifact at:\n  ${outPath}\n`);

  return review;
}

async function main() {
  const options = parseArgs();
  
  // 1. Run main review
  const review = await runReview(options.target, options, options.output);

  // 2. If --clean-check, also run against clean blueprint
  if (options.cleanCheck) {
    const cleanDir = path.join(__dirname, 'tests', 'fixtures_clean');
    console.log('\n>>> RUNNING REVIEW AGAINST 100/100 CLEAN PRODUCTION BLUEPRINT <<<');
    const cleanReview = await runReview(cleanDir, { ...options }, 'architecture_review_clean_report.md');
    if (cleanReview.final_consensus_status !== 'APPROVED') {
      console.error('[ERROR] Clean production blueprint did not receive APPROVED status!');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
