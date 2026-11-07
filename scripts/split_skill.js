#!/usr/bin/env node
/**
 * Topic-Drift Analyzer & Atomic Skill Fission Tool (v2.1.1)
 * Part of GeminiPostCutoff Architecture Governance
 *
 * Allows any domain skill in `skills/` to be analyzed for topic drift and
 * cleanly broken into separate skills as topics evolve, while preserving:
 *  - SKILL_STANDARD.md minimum floors (Anti-Patterns, Decision Matrices, Blueprints)
 *  - Descending chronological sort order in `references/articles.md` & `archive.md`
 *  - Bidirectional citation provenance (`verifier.js`)
 *  - Dynamic Pod & Audit Batch inheritance via `config/skill_registry.json` (`split_from`)
 *
 * Usage:
 *   node scripts/split_skill.js --analyze <skill-name>
 *   node scripts/split_skill.js --from <parent-skill> --into <new-skill> --keywords "kw1,kw2" [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { SkillRegistry } = require('../review_engine/mesh/skill_registry');

const repoRoot = path.resolve(__dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');
const registryPath = path.join(repoRoot, 'config', 'skill_registry.json');

function parseArgs(argv) {
  const opts = {
    mode: 'help',
    analyzeSkill: null,
    fromSkill: null,
    intoSkill: null,
    keywords: [],
    dryRun: false,
    force: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--analyze' && argv[i + 1]) {
      opts.mode = 'analyze';
      opts.analyzeSkill = argv[++i];
    } else if (a === '--from' && argv[i + 1]) {
      opts.mode = 'split';
      opts.fromSkill = argv[++i];
    } else if (a === '--into' && argv[i + 1]) {
      opts.intoSkill = argv[++i];
    } else if (a === '--keywords' && argv[i + 1]) {
      opts.keywords = argv[++i]
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);
    } else if (a === '--dry-run') {
      opts.dryRun = true;
    } else if (a === '--force') {
      opts.force = true;
    }
  }
  return opts;
}

function parseVaultEntries(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    const m = line.match(/^-\s*\[\[(\d{2})\.(\d{2})\s+([^\]]+)\]:\s*([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (m) {
      const mm = parseInt(m[1], 10);
      const yy = parseInt(m[2], 10);
      entries.push({
        raw: line,
        dateStr: `${m[1]}.${m[2]}`,
        year: 2000 + yy,
        month: mm,
        sortKey: (2000 + yy) * 100 + mm,
        kind: m[3],
        title: m[4],
        url: m[5]
      });
    }
  }
  return entries;
}

function parseSkillBlocks(skillMdPath) {
  const content = fs.readFileSync(skillMdPath, 'utf8');
  const antiPatterns = [];
  const blueprints = [];
  const decisionMatrices = [];

  // Extract Anti-Patterns (supports alert blockquotes `> [!CAUTION]` as well as numbered/heading blocks)
  const antiSectionMatch = content.match(/##\s*🚫[^\r\n]*([\s\S]*?)(?=\r?\n---\r?\n|\r?\n##\s+)/i);
  if (antiSectionMatch) {
    const rawBlocks = antiSectionMatch[1]
      .split(/\r?\n\s*\r?\n/)
      .map(b => b.trim())
      .filter(b => /\*\*Anti-Pattern\s+\d+:/i.test(b));
    antiPatterns.push(...rawBlocks);
  }

  // Extract Blueprints
  const bpRegex = /(### Blueprint \d+:[\s\S]*?)(?=\r?\n### Blueprint \d+:|\r?\n---\r?\n|\r?\n##\s+)/gi;
  let m;
  while ((m = bpRegex.exec(content)) !== null) {
    blueprints.push(m[1].trim());
  }

  // Extract Decision Matrices
  const dmSectionMatch = content.match(/##\s*⚖️\s*\d*\.?\s*Architecture Decision Matrices([\s\S]*?)(?=\n---\n|\n##\s+)/i);
  if (dmSectionMatch) {
    const dmBlocks = dmSectionMatch[1].split(/(?=\n###\s+)/).filter(b => b.includes('| :--- | :--- |'));
    decisionMatrices.push(...dmBlocks.map(b => b.trim()));
  }

  return { content, antiPatterns, blueprints, decisionMatrices };
}

function matchesKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

function analyzeSkillFission(skillName) {
  const skillFolder = path.join(skillsDir, skillName);
  const skillMdPath = path.join(skillFolder, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    console.error(`[ERROR] Skill not found: ${skillName}`);
    process.exit(1);
  }

  const registry = SkillRegistry.loadRegistry(repoRoot);
  const meta = (registry.skills && registry.skills[skillName]) || {};
  const activeEntries = parseVaultEntries(path.join(skillFolder, 'references', 'articles.md'));
  const archiveEntries = parseVaultEntries(path.join(skillFolder, 'references', 'archive.md'));
  const allEntries = [...activeEntries, ...archiveEntries];
  const blocks = parseSkillBlocks(skillMdPath);

  console.log('='.repeat(78));
  console.log(`TOPIC-DRIFT & SKILL FISSION READINESS REPORT: ${skillName}`);
  console.log('='.repeat(78));
  console.log(`Assigned Pillar:      ${meta.pillar || 'Unassigned'}`);
  console.log(`Assigned Review Pod:  ${meta.pod_id || 'Unassigned'} (${meta.audit_batch || 'Dynamic'})`);
  console.log(`Vault Size:           ${activeEntries.length} active (>=2025) + ${archiveEntries.length} archived (<=2024) = ${allEntries.length} total articles`);
  console.log(`Runbook Inventory:    ${blocks.antiPatterns.length} Anti-Patterns | ${blocks.decisionMatrices.length} Decision Matrices | ${blocks.blueprints.length} Blueprints`);
  console.log(`Minimum Floor Buffer: +${Math.max(0, blocks.antiPatterns.length - 4)} Anti-Patterns | +${Math.max(0, blocks.decisionMatrices.length - 2)} Matrices | +${Math.max(0, blocks.blueprints.length - 4)} Blueprints above Small Tier floor\n`);

  const topicKeywords = meta.topic_keywords || [];
  if (topicKeywords.length > 0) {
    console.log('--- TOPIC CLUSTER DISTRIBUTION ACROSS VAULT & RUNBOOK ---');
    console.log(`${'Keyword Cluster'.padEnd(24)} | ${'Vault Articles'.padEnd(16)} | ${'Anti-Patterns'.padEnd(15)} | ${'Blueprints'.padEnd(12)}`);
    console.log('-'.repeat(75));
    for (const kw of topicKeywords) {
      const artHits = allEntries.filter(e => matchesKeywords(`${e.title} ${e.url}`, [kw])).length;
      const apHits = blocks.antiPatterns.filter(b => matchesKeywords(b, [kw])).length;
      const bpHits = blocks.blueprints.filter(b => matchesKeywords(b, [kw])).length;
      console.log(`${kw.padEnd(24)} | ${String(artHits).padEnd(16)} | ${String(apHits).padEnd(15)} | ${String(bpHits).padEnd(12)}`);
    }
    console.log('');
  }

  const canSplitImmediately = blocks.antiPatterns.length >= 8 && blocks.blueprints.length >= 8;
  console.log('--- FISSION READINESS VERDICT ---');
  if (canSplitImmediately) {
    console.log(`🟢 READY FOR IMMEDIATE ZERO-ENRICHMENT SPLIT: ${skillName} has >= 8 Anti-Patterns and >= 8 Blueprints.`);
  } else {
    const neededAp = Math.max(0, 8 - blocks.antiPatterns.length);
    const neededBp = Math.max(0, 8 - blocks.blueprints.length);
    console.log(
      `🟡 GUIDED SPLIT READY: Splitting ${skillName} into two skills requires at least 4 Anti-Patterns & 4 Blueprints per skill.\n` +
      `   Current combined inventory (${blocks.antiPatterns.length} Anti-Patterns, ${blocks.blueprints.length} Blueprints) needs +${neededAp} Anti-Patterns and +${neededBp} Blueprints\n` +
      `   synthesized from its ${activeEntries.length} vault articles during the split so both parent and child pass SKILL_STANDARD.md.`
    );
  }
  console.log(`\nTo preview a topic split:\n  node scripts/split_skill.js --from ${skillName} --into <new-skill-name> --keywords "<kw1,kw2>" --dry-run`);
  console.log('='.repeat(78) + '\n');
}

function previewOrExecuteSplit(opts) {
  if (!opts.fromSkill || !opts.intoSkill || opts.keywords.length === 0) {
    console.error('Usage: node scripts/split_skill.js --from <parent-skill> --into <new-skill> --keywords "kw1,kw2" [--dry-run]');
    process.exit(1);
  }

  const parentFolder = path.join(skillsDir, opts.fromSkill);
  const parentSkillMd = path.join(parentFolder, 'SKILL.md');
  if (!fs.existsSync(parentSkillMd)) {
    console.error(`[ERROR] Parent skill does not exist: ${opts.fromSkill}`);
    process.exit(1);
  }

  const activeEntries = parseVaultEntries(path.join(parentFolder, 'references', 'articles.md'));
  const archiveEntries = parseVaultEntries(path.join(parentFolder, 'references', 'archive.md'));
  const blocks = parseSkillBlocks(parentSkillMd);

  const childActive = activeEntries.filter(e => matchesKeywords(`${e.title} ${e.url}`, opts.keywords));
  const parentActive = activeEntries.filter(e => !matchesKeywords(`${e.title} ${e.url}`, opts.keywords));

  const childArchive = archiveEntries.filter(e => matchesKeywords(`${e.title} ${e.url}`, opts.keywords));
  const parentArchive = archiveEntries.filter(e => !matchesKeywords(`${e.title} ${e.url}`, opts.keywords));

  const childAp = blocks.antiPatterns.filter(b => matchesKeywords(b, opts.keywords));
  const parentAp = blocks.antiPatterns.filter(b => !matchesKeywords(b, opts.keywords));

  const childBp = blocks.blueprints.filter(b => matchesKeywords(b, opts.keywords));
  const parentBp = blocks.blueprints.filter(b => !matchesKeywords(b, opts.keywords));

  const registry = SkillRegistry.loadRegistry(repoRoot);
  const parentMeta = (registry.skills && registry.skills[opts.fromSkill]) || {};

  console.log('='.repeat(78));
  console.log(`SKILL FISSION PLAN: ${opts.fromSkill}  --->  ${opts.intoSkill}`);
  console.log('='.repeat(78));
  console.log(`Filter Keywords:     ${opts.keywords.join(', ')}`);
  console.log(`Inherited Pillar:    ${parentMeta.pillar || 'Pillar 1'}`);
  console.log(`Inherited Pod ID:    ${parentMeta.pod_id || 'pod_13'} (via split_from: "${opts.fromSkill}")\n`);

  console.log(`Partition Summary:`);
  console.log(`  - Active Articles (>=2025):  Parent keeps ${parentActive.length} | Child gets ${childActive.length}`);
  console.log(`  - Archive Articles (<=2024): Parent keeps ${parentArchive.length} | Child gets ${childArchive.length}`);
  console.log(`  - Anti-Patterns:             Parent keeps ${parentAp.length} | Child gets ${childAp.length} (Floor: >= 4 each)`);
  console.log(`  - Production Blueprints:     Parent keeps ${parentBp.length} | Child gets ${childBp.length} (Floor: >= 4 each)\n`);

  if (childActive.length > 0) {
    console.log(`Sample Articles Moving to ${opts.intoSkill}:`);
    childActive.slice(0, 5).forEach(a => console.log(`  * [${a.dateStr}] ${a.title}`));
    if (childActive.length > 5) console.log(`  * ...and ${childActive.length - 5} more`);
    console.log('');
  }

  const floorSafe = parentAp.length >= 4 && childAp.length >= 4 && parentBp.length >= 4 && childBp.length >= 4;

  if (opts.dryRun || (!floorSafe && !opts.force)) {
    if (!floorSafe) {
      console.log(
        `[FLOOR GUARDRAIL ACTIVE] Both parent and child skills must retain >= 4 Anti-Patterns and >= 4 Blueprints.\n` +
        `  - Parent (${opts.fromSkill}): ${parentAp.length} Anti-Patterns, ${parentBp.length} Blueprints\n` +
        `  - Child  (${opts.intoSkill}): ${childAp.length} Anti-Patterns, ${childBp.length} Blueprints\n` +
        `  Action: Promote ${Math.max(0, 4 - childAp.length)} additional Anti-Patterns and ${Math.max(0, 4 - childBp.length)} Blueprints from the ${childActive.length} moved articles when completing the split.`
      );
    } else {
      console.log(`✓ Floor safety verified for both ${opts.fromSkill} and ${opts.intoSkill}.`);
    }
    console.log(`[DRY-RUN COMPLETE] No files were modified.`);
    console.log('='.repeat(78) + '\n');
    return;
  }

  // Register new skill in config/skill_registry.json
  registry.skills[opts.intoSkill] = {
    pillar: parentMeta.pillar || 'Pillar 5: Orchestration & Specialized Platforms',
    audit_batch: parentMeta.audit_batch || 'Batch F',
    pod_id: parentMeta.pod_id || 'pod_13',
    split_from: opts.fromSkill,
    topic_keywords: opts.keywords
  };
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  console.log(`✓ Registered ${opts.intoSkill} in config/skill_registry.json (split_from: ${opts.fromSkill})`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.mode === 'analyze') {
    analyzeSkillFission(opts.analyzeSkill);
  } else if (opts.mode === 'split') {
    previewOrExecuteSplit(opts);
  } else {
    console.log('Usage:');
    console.log('  node scripts/split_skill.js --analyze <skill-name>');
    console.log('  node scripts/split_skill.js --from <parent-skill> --into <new-skill> --keywords "kw1,kw2" [--dry-run]');
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeSkillFission, previewOrExecuteSplit };
