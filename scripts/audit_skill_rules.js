const fs = require('fs');
const path = require('path');

const skillsDir = process.env.SKILLS_DIR || path.resolve(__dirname, '..', 'skills');
if (!fs.existsSync(skillsDir)) {
  console.error(`[ERROR] Skills directory not found at: ${skillsDir}`);
  process.exit(1);
}

const batches = {
  'Batch A': ['gcp-bigquery-cost', 'gcp-bigquery-analytics', 'gcp-bigquery-ai', 'gcp-databases'],
  'Batch B': ['gcp-cloud-run', 'gcp-gke-platform', 'gcp-gke-inference', 'gcp-gke-cost'],
  'Batch C': ['gcp-adk-agents', 'gcp-conversational-ai', 'gcp-gemini-tooling', 'gcp-frontier-emerging'],
  'Batch D': ['gcp-computefinops', 'gcp-security-compliance', 'gcp-networking', 'gcp-migrations'],
  'Batch E': ['gcp-gemini-robotics', 'gcp-geospatial', 'gcp-android-xr', 'gcp-generative-media'],
  'Batch F': ['gcp-pubsub', 'gcp-architecture-review']
};

const requiredSections = [
  'Domain Scope & Activation Triggers',
  'Critical Anti-Patterns',
  'Architecture Decision Matrices',
  'Production Blueprints',
  'Chronological Evolution',
  'Reference Vaults'
];

function auditSkill(skillName) {
  const skillMdPath = path.join(skillsDir, skillName, 'SKILL.md');
  const articlesMdPath = path.join(skillsDir, skillName, 'references', 'articles.md');
  const archiveMdPath = path.join(skillsDir, skillName, 'references', 'archive.md');

  const report = {
    skill: skillName,
    exists: fs.existsSync(skillMdPath),
    hasArchive: fs.existsSync(archiveMdPath),
    activeArticlesCount: 0,
    tier: 'Small',
    sectionsFound: [],
    missingSections: [],
    antiPatternsCount: 0,
    decisionMatricesCount: 0,
    blueprintsCount: 0,
    hasCitations: false,
    citationsCount: 0,
    lineCount: 0,
    passed: true,
    failures: []
  };

  if (!report.exists) {
    report.passed = false;
    report.failures.push('SKILL.md does not exist');
    return report;
  }

  // Count active articles
  if (fs.existsSync(articlesMdPath)) {
    const articlesContent = fs.readFileSync(articlesMdPath, 'utf8');
    const matches = articlesContent.match(/^-\s*\[\[\d{2}\.\d{2}/gm);
    report.activeArticlesCount = matches ? matches.length : 0;
  }

  // Determine Minimum Floor Tier (Uncapped upper bounds)
  if (report.activeArticlesCount > 40) {
    report.tier = 'Large (>40, Uncapped)';
    report.reqAntiPatterns = 6;
    report.reqDecisionMatrices = 2;
    report.reqBlueprints = 6;
  } else if (report.activeArticlesCount >= 16) {
    report.tier = 'Medium (16-40, Uncapped)';
    report.reqAntiPatterns = 5;
    report.reqDecisionMatrices = 2;
    report.reqBlueprints = 5;
  } else {
    report.tier = 'Small (<=15, Uncapped)';
    report.reqAntiPatterns = 4;
    report.reqDecisionMatrices = 2;
    report.reqBlueprints = 4;
  }

  const content = fs.readFileSync(skillMdPath, 'utf8');
  report.lineCount = content.split('\n').length;

  // Check required sections
  for (const sec of requiredSections) {
    if (content.toLowerCase().includes(sec.toLowerCase())) {
      report.sectionsFound.push(sec);
    } else {
      report.missingSections.push(sec);
    }
  }
  if (report.missingSections.length > 0) {
    report.passed = false;
    report.failures.push(`Missing mandatory sections: ${report.missingSections.join(', ')}`);
  }

  // Count Anti-Patterns (Minimum floor only; no upper cap)
  const antiMatches = content.match(/\*\*Anti-Pattern\s+\d+:/gi);
  report.antiPatternsCount = antiMatches ? antiMatches.length : 0;
  if (report.antiPatternsCount < report.reqAntiPatterns) {
    report.passed = false;
    report.failures.push(`Anti-Patterns: ${report.antiPatternsCount} found, minimum ${report.reqAntiPatterns} required`);
  }

  // Count Decision Matrices (Minimum floor only; no upper cap)
  const matrixMatches = content.match(/\| :--- \| :--- \|/g);
  report.decisionMatricesCount = matrixMatches ? matrixMatches.length : 0;
  if (report.decisionMatricesCount < report.reqDecisionMatrices) {
    report.passed = false;
    report.failures.push(`Decision Matrices: ${report.decisionMatricesCount} tables found, minimum ${report.reqDecisionMatrices} required`);
  }

  // Count Blueprints (Minimum floor only; no upper cap)
  const bpMatches = content.match(/### Blueprint \d+:/gi);
  report.blueprintsCount = bpMatches ? bpMatches.length : 0;
  if (report.blueprintsCount < report.reqBlueprints) {
    report.passed = false;
    report.failures.push(`Blueprints: ${report.blueprintsCount} found, minimum ${report.reqBlueprints} required`);
  }

  // Check Citations (both articles.md and archive.md relative links supported)
  const citeMatches = content.match(/\*Cites:\s*\[[^\]]+\]\(\.\/references\/(?:articles|archive)\.md\)/gi);
  report.citationsCount = citeMatches ? citeMatches.length : 0;
  if (report.citationsCount < (report.antiPatternsCount + report.blueprintsCount)) {
    report.passed = false;
    report.failures.push(`Citations: ${report.citationsCount} found, expected citations for every anti-pattern and blueprint`);
  }

  // Check for deprecated pre-2026 model identifiers inside code blocks
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks = content.match(codeBlockRegex) || [];
  for (const block of codeBlocks) {
    if (/gemini-2\.5-(?:flash|pro)|gemini-1\.5-(?:flash|pro)/i.test(block)) {
      report.passed = false;
      report.failures.push('Deprecated model identifier (gemini-2.5-* or gemini-1.5-*) found inside production blueprint code block');
      break;
    }
  }

  // Check Archive Vault Presence
  if (!report.hasArchive) {
    report.passed = false;
    report.failures.push('Missing references/archive.md (Dual Vault Architecture required)');
  }

  return report;
}

console.log('======================================================================');
console.log('AUDITING GCP SKILLS AGAINST SKILL_STANDARD.MD SPECIFICATION (22 SKILLS)');
console.log('======================================================================\n');

let totalAudited = 0;
let totalPassed = 0;

for (const [batchName, skills] of Object.entries(batches)) {
  console.log(`### ${batchName}\n`);
  for (const s of skills) {
    totalAudited++;
    const rep = auditSkill(s);
    if (rep.passed) {
      totalPassed++;
      console.log(`✓ PASS: ${rep.skill} [Tier: ${rep.tier}, Articles: ${rep.activeArticlesCount}, Lines: ${rep.lineCount}]`);
      console.log(`  - Anti-Patterns: ${rep.antiPatternsCount}`);
      console.log(`  - Decision Matrices: ${rep.decisionMatricesCount}`);
      console.log(`  - Blueprints: ${rep.blueprintsCount}`);
      console.log(`  - Citations: ${rep.citationsCount}`);
      console.log(`  - Archive Vault: ${rep.hasArchive ? 'Present' : 'MISSING'}\n`);
    } else {
      console.error(`✗ FAIL: ${rep.skill} [Tier: ${rep.tier}]`);
      for (const f of rep.failures) {
        console.error(`  - ${f}`);
      }
      console.log('');
    }
  }
}

console.log(`Audited: ${totalAudited}, Passed: ${totalPassed}`);
if (totalPassed === totalAudited) {
  console.log(`✓ All ${totalAudited} skills fully satisfy SKILL_STANDARD.md minimum floors and zero-legacy-model rules!\n`);
} else {
  process.exit(1);
}
