#!/usr/bin/env node
/**
 * Developer CLI Engine for GeminiPostCutoff Architecture Review
 * Part of GeminiPostCutoff Architecture Review Engine (Phase 4)
 */

const fs = require('fs');
const path = require('path');
const { ArchitectureReviewSupervisor } = require('./mesh/supervisor');

const VERSION = '1.1.0';

// ANSI Colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m'
};

function printHelp() {
  console.log(`
${C.bold}${C.cyan}GeminiPostCutoff Architecture Review CLI${C.reset} v${VERSION}
Authoritative 2025-2026 Google Cloud Platform & AI Agent Architecture Governance

${C.bold}USAGE:${C.reset}
  postcutoff <command> [options]

${C.bold}COMMANDS:${C.reset}
  ${C.green}review${C.reset} [path]       Run end-to-end 13-Pod multi-agent review & arbitration mesh
  ${C.green}audit${C.reset} [path]        Run deterministic AST Pre-Flight & 4-Pillar governance audit
  ${C.green}cache${C.reset}               Inspect Gemini Context Caching manifest across 21 runbooks
  ${C.green}version${C.reset}             Display version and model calibration metadata
  ${C.green}help${C.reset}                Show this help message

${C.bold}OPTIONS:${C.reset}
  ${C.yellow}--target <path>${C.reset}       Target directory to review (default: current directory)
  ${C.yellow}--model <name>${C.reset}        Model identifier (e.g., 'argon-4.0', 'flash-3.8', 'pro-3.1', or future model; omit for Fail-Safe Horizon)
  ${C.yellow}--cutoff <YYYY-MM>${C.reset}    Explicit model knowledge cutoff override (e.g., '2026-03', '03.26', '2026-09')
  ${C.yellow}--format <type>${C.reset}       Output format: 'terminal', 'json', or 'markdown' (default: 'terminal')
  ${C.yellow}--output <file>${C.reset}       Save output report to specified file path
  ${C.yellow}--min-score <n>${C.reset}       Fail with exit code 1 if composite score falls below <n>
  ${C.yellow}--fail-on-critical${C.reset}   Fail with exit code 1 if any CRITICAL severity violation is found
  ${C.yellow}--clean-check${C.reset}        Validate against verified 100/100 production blueprint

${C.bold}EXAMPLES:${C.reset}
  postcutoff review ./terraform --model argon-4.0
  postcutoff review ./terraform --model gemini-5-preview --cutoff 2026-09
  postcutoff review ./infra --format json --min-score 80
  postcutoff review . --format markdown --output ./review_report.md
`);
}

function parseArgs(args) {
  const options = {
    command: 'help',
    target: process.cwd(),
    model: null,
    cutoff: null,
    format: 'terminal',
    output: null,
    minScore: null,
    failOnCritical: false,
    cleanCheck: false
  };

  if (args.length === 0) return options;

  let pos = 0;
  if (!args[0].startsWith('--')) {
    options.command = args[0];
    pos = 1;
    if (args[1] && !args[1].startsWith('--')) {
      options.target = path.resolve(args[1]);
      pos = 2;
    }
  }

  for (let i = pos; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' && args[i + 1]) {
      options.target = path.resolve(args[++i]);
    } else if (arg === '--model' && args[i + 1]) {
      options.model = args[++i];
    } else if (arg === '--cutoff' && args[i + 1]) {
      options.cutoff = args[++i];
    } else if (arg === '--format' && args[i + 1]) {
      options.format = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      options.output = path.resolve(args[++i]);
    } else if (arg === '--min-score' && args[i + 1]) {
      options.minScore = parseInt(args[++i], 10);
    } else if (arg === '--fail-on-critical') {
      options.failOnCritical = true;
    } else if (arg === '--clean-check') {
      options.cleanCheck = true;
    } else if (arg === '--version' || arg === '-v') {
      options.command = 'version';
    } else if (arg === '--help' || arg === '-h') {
      options.command = 'help';
    }
  }

  return options;
}

function formatScoreBar(score) {
  const width = 16;
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  const color = score >= 90 ? C.green : score >= 70 ? C.yellow : C.red;
  return `${color}[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${String(score).padStart(3)}/100${C.reset}`;
}

async function renderTerminalOutput(review, options) {
  console.log('\n' + C.bold + '='.repeat(78) + C.reset);
  console.log(`${C.bold}${C.cyan}GEMINIPOSTCUTOFF ARCHITECTURE REVIEW & ARBITRATION MESH${C.reset}`);
  console.log(C.bold + '='.repeat(78) + C.reset);
  console.log(`${C.bold}Target Codebase:${C.reset}    ${review.target_codebase}`);
  console.log(`${C.bold}Model Calibration:${C.reset}  ${C.magenta}${review.target_model.toUpperCase()}${C.reset} (Cutoff: ${review.cutoff_rule})`);
  console.log(`${C.bold}Execution Time:${C.reset}     ${review.execution_duration_ms}ms`);
  console.log(`${C.bold}Review Status:${C.reset}      ${review.final_consensus_status === 'APPROVED' ? C.bgGreen + ' APPROVED FOR DEPLOYMENT ' + C.reset : C.bgRed + ' ACTION REQUIRED - DEFECTS FOUND ' + C.reset}\n`);

  console.log(`${C.bold}--- 1. GOVERNANCE PILLAR SCORECARD ---${C.reset}`);
  for (const [pName, data] of Object.entries(review.ast_preflight.pillars)) {
    console.log(`  ${pName.padEnd(42)} ${formatScoreBar(data.score)} (${data.findings.length} findings)`);
  }
  console.log(`  ${C.bold}${'COMPOSITE ARCHITECTURE SCORE'.padEnd(42)} ${formatScoreBar(review.ast_preflight.summary.global_ast_score)}${C.reset}\n`);

  console.log(`${C.bold}--- 2. GEMINI CONTEXT CACHING TELEMETRY ---${C.reset}`);
  console.log(`  ${C.green}✓${C.reset} Cache Manifest:       ${C.cyan}${review.context_cache.cache_id}${C.reset}`);
  console.log(`  ${C.green}✓${C.reset} 21 Runbooks Cached:   ${review.context_cache.cached_runbook_tokens.toLocaleString()} tokens`);
  console.log(`  ${C.green}✓${C.reset} Token Cost Reduction: ${C.bold}${review.context_cache.net_tokens_conserved.toLocaleString()} tokens saved${C.reset} (${review.context_cache.efficiency_gain})\n`);

  console.log(`${C.bold}--- 3. DYNAMIC POD MESH DISPATCH ---${C.reset}`);
  console.log(`  🟢 Active Review Pods (${review.pod_evaluations.length}):`);
  review.pod_evaluations.forEach(p => console.log(`     - ${C.cyan}${p.name}${C.reset}`));

  if (review.peer_arbitration.arbitration_resolutions.length > 0) {
    console.log(`\n${C.bold}--- 4. ADVERSARIAL PEER CRITIQUE & MUTUAL ARBITRATION ---${C.reset}`);
    review.peer_arbitration.arbitration_resolutions.forEach(r => {
      console.log(`  ${C.yellow}⚖️  [${r.arbitration_pair}]${C.reset} Winner: ${C.bold}${r.winner}${C.reset}`);
      console.log(`     ${C.dim}Consensus:${C.reset} ${r.consensus}`);
      console.log(`     ${C.dim}Impact:${C.reset}    ${r.impact}\n`);
    });
  }

  const allFindings = review.ast_preflight.pillars
    ? Object.values(review.ast_preflight.pillars).flatMap(p => p.findings || [])
    : [];

  if (allFindings.length > 0) {
    console.log(`${C.bold}--- 5. TOP CRITICAL REMEDIATIONS DETECTED (${allFindings.length}) ---${C.reset}`);
    allFindings.slice(0, 5).forEach((f, idx) => {
      const sevColor = f.severity === 'CRITICAL' ? C.red : C.yellow;
      console.log(`  ${idx + 1}. ${sevColor}[${f.severity}]${C.reset} ${C.bold}${f.rule}${C.reset} on ${C.cyan}${f.file}${C.reset}`);
      console.log(`     ${C.dim}Message:${C.reset} ${f.message}`);
      console.log(`     ${C.green}Fix:${C.reset}     ${f.remediation}`);
    });
  }

  console.log('\n' + C.bold + '='.repeat(78) + C.reset);
  console.log(`${C.bold}FINAL VERDICT: ${review.final_consensus_status === 'APPROVED' ? C.green + '✓ APPROVED' : C.red + '✗ ACTION REQUIRED'}${C.reset} | Global Score: ${review.ast_preflight.summary.global_ast_score}/100`);
  console.log(C.bold + '='.repeat(78) + C.reset + '\n');
}

async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

  if (options.command === 'help') {
    printHelp();
    return 0;
  }

  if (options.command === 'version') {
    console.log(`gemini-post-cutoff v${VERSION}`);
    console.log(`Node: ${process.version} | Architecture Review Engine Phase 4`);
    return 0;
  }

  if (options.command === 'cache') {
    const { ContextCacheManager } = require('./mesh/cache_manager');
    const mgr = new ContextCacheManager({ targetModel: options.model, targetCutoff: options.cutoff });
    const cache = mgr.getOrCreateRunbookCache ? mgr.getOrCreateRunbookCache() : mgr.get_or_create_runbook_cache();
    console.log(JSON.stringify(cache, null, 2));
    return 0;
  }

  if (options.command === 'review' || options.command === 'audit') {
    const supervisor = new ArchitectureReviewSupervisor({
      targetModel: options.model,
      targetCutoff: options.cutoff,
      repoRoot: path.resolve(__dirname, '..')
    });

    const review = await supervisor.runReview(options.target);

    // Render output
    if (options.format === 'json') {
      console.log(JSON.stringify(review, null, 2));
    } else if (options.format === 'markdown') {
      const md = supervisor.generateReviewArtifact(review);
      console.log(md);
      if (options.output) {
        fs.writeFileSync(options.output, md, 'utf8');
      }
    } else {
      await renderTerminalOutput(review, options);
      if (options.output) {
        const md = supervisor.generateReviewArtifact(review);
        fs.writeFileSync(options.output, md, 'utf8');
        console.log(`[SAVED] Markdown artifact saved to: ${options.output}\n`);
      }
    }

    // Check exit thresholds
    let exitCode = 0;
    const allFindings = review.ast_preflight.pillars
      ? Object.values(review.ast_preflight.pillars).flatMap(p => p.findings || [])
      : [];

    if (options.failOnCritical) {
      const hasCritical = allFindings.some(f => f.severity === 'CRITICAL') || 
        (review.ast_preflight.summary && review.ast_preflight.summary.critical_violations > 0);
      if (hasCritical) {
        if (options.format === 'terminal') {
          console.error(`${C.red}[CI/CD GATE BLOCKED] Critical severity violations detected.${C.reset}`);
        }
        exitCode = 1;
      }
    }

    if (options.minScore !== null) {
      const score = review.ast_preflight.summary ? review.ast_preflight.summary.global_ast_score : 0;
      if (score < options.minScore) {
        if (options.format === 'terminal') {
          console.error(`${C.red}[CI/CD GATE BLOCKED] Score ${score} is below minimum threshold ${options.minScore}.${C.reset}`);
        }
        exitCode = 1;
      }
    }

    return exitCode;
  }

  console.error(`Unknown command: ${options.command}. Run 'postcutoff --help' for usage.`);
  return 1;
}

if (require.main === module) {
  runCli().then(code => process.exit(code)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runCli, parseArgs };
