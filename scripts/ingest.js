#!/usr/bin/env node

/**
 * Automated Article Ingestion Assistant (scripts/ingest.js)
 * 
 * Enforces the Antigravity Ingestion Protocol:
 * 1. Validates canonical metadata & publication date (MM.YY)
 * 2. Calculates mathematical sort key: (2000 + YY) * 100 + MM
 * 3. Routes to Active Delta (>= 2025) or Archive (<= 2024)
 * 4. Inserts into references/articles.md or archive.md in strict descending order
 * 5. Validates 5-tier Architectural Extraction Score (AES)
 * 6. Executes audit verification
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      const key = process.argv[i].slice(2);
      const val = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

const args = parseArgs();

if (!args.url || !args.domain) {
  console.log(`
Usage:
  node scripts/ingest.js --url <URL> --domain <domain-skill> [options]

Options:
  --title <Title>       Canonical title (extracted if omitted)
  --date <MM.YY>        Publication date in MM.YY format (e.g. 09.26)
  --score <1-5>         Architectural Extraction Score (default: 2)
  --type <Blogpost|Article|Codelab> (default: Blogpost)
  --dry-run             Preview insertion without modifying files

Example:
  node scripts/ingest.js --url "https://cloud.google.com/blog/..." --domain gcp-adk-agents --date 09.26 --title "Agent Registry GA" --score 4
`);
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');
const skillDir = path.join(repoRoot, 'skills', args.domain);

if (!fs.existsSync(skillDir)) {
  console.error(`❌ Error: Domain skill "${args.domain}" does not exist in ${path.join(repoRoot, 'skills')}`);
  process.exit(1);
}

async function fetchMetadata(targetUrl) {
  return new Promise((resolve) => {
    try {
      const client = targetUrl.startsWith('https') ? https : http;
      client.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let title = '';
          const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) {
            title = titleMatch[1].replace(/\s*\|\s*Google Cloud Blog.*$/i, '')
                                .replace(/\s*-\s*Medium.*$/i, '')
                                .trim();
          }
          // Try to extract date from meta tags or URL
          let date = '';
          const urlDate = targetUrl.match(/\/20(2[4-6])\/(0[1-9]|1[0-2])\//);
          if (urlDate) {
            date = `${urlDate[2]}.${urlDate[1]}`;
          }
          resolve({ title, date });
        });
      }).on('error', () => resolve({ title: '', date: '' }));
    } catch (e) {
      resolve({ title: '', date: '' });
    }
  });
}

async function main() {
  console.log(`\n📥 Ingesting article into: ${args.domain}`);
  console.log(`🔗 URL: ${args.url}`);

  let title = args.title;
  let date = args.date;

  if (!title || !date) {
    console.log('📡 Fetching metadata from URL...');
    const meta = await fetchMetadata(args.url);
    if (!title && meta.title) title = meta.title;
    if (!date && meta.date) date = meta.date;
  }

  if (!title) {
    console.error('❌ Error: Could not determine canonical title. Please specify with --title "<Title>"');
    process.exit(1);
  }

  if (!date || !date.match(/^(0[1-9]|1[0-2])\.(2[4-6])$/)) {
    console.error(`❌ Error: Invalid or missing date "${date}". Must be MM.YY format (e.g. 08.26). Specify with --date MM.YY`);
    process.exit(1);
  }

  const [monthStr, yearStr] = date.split('.');
  const sortKey = (2000 + parseInt(yearStr, 10)) * 100 + parseInt(monthStr, 10);
  const type = args.type || 'Blogpost';
  const score = parseInt(args.score || '2', 10);

  const formattedLink = `- [[${date} ${type}]: ${title}](${args.url})`;

  // Determine target vault (Active Delta >= 2025 vs Archive <= 2024)
  const isArchive = sortKey < 202501;
  const targetFile = isArchive
    ? path.join(skillDir, 'references', 'archive.md')
    : path.join(skillDir, 'references', 'articles.md');

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ Error: Target reference file does not exist: ${targetFile}`);
    process.exit(1);
  }

  console.log(`\n✅ Metadata Extracted:`);
  console.log(`   Canonical Title: ${title}`);
  console.log(`   Publication Date: ${date} (Sort Key: ${sortKey})`);
  console.log(`   Target Vault: ${path.relative(repoRoot, targetFile)}`);
  console.log(`   Formatted Entry: ${formattedLink}`);
  console.log(`   Assigned AES Score: Level ${score}/5`);

  // Read and parse target vault
  let content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n');

  // Find existing links with their sort keys
  const linkRegex = /^-\s+\[\[(\d{2})\.(\d{2})\s+[^\]]+\]:\s+[^\]]+\]\((https?:\/\/[^\)]+)\)/;
  
  let insertIndex = -1;
  let linkFound = false;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(linkRegex);
    if (match) {
      linkFound = true;
      const m = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      const key = (2000 + y) * 100 + m;

      if (lines[i].includes(args.url)) {
        console.log(`⚠️ Warning: URL already exists in ${path.relative(repoRoot, targetFile)} at line ${i + 1}`);
        return;
      }

      if (sortKey > key && insertIndex === -1) {
        insertIndex = i;
      }
    }
  }

  if (insertIndex === -1) {
    if (linkFound) {
      // Goes at the end of the link block
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].match(linkRegex)) {
          insertIndex = i + 1;
          break;
        }
      }
    } else {
      insertIndex = lines.length;
    }
  }

  if (args['dry-run']) {
    console.log(`\n[DRY RUN] Would insert at line ${insertIndex + 1} of ${path.relative(repoRoot, targetFile)}.`);
    return;
  }

  lines.splice(insertIndex, 0, formattedLink);
  fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');

  console.log(`\n✓ Inserted link at line ${insertIndex + 1} of ${path.relative(repoRoot, targetFile)}.`);

  // Advise on next steps according to AES Score
  console.log('\n📋 Mandatory Architectural Extraction Next Steps:');
  if (score >= 2) {
    console.log(`- [AES Level 2]: Add bullet to SKILL.md under "## ⏱️ Chronological Evolution":`);
    console.log(`  - **[${date}]**: ${title} — <Describe architectural impact>`);
  }
  if (score >= 3) {
    console.log(`- [AES Level 3]: Harvest an Anti-Pattern or Decision Matrix threshold into SKILL.md citing [${date} ${type}].`);
  }
  if (score >= 4) {
    console.log(`- [AES Level 4]: Implement a runnable production blueprint (Terraform/Python/Bash) citing [${date} ${type}].`);
  }

  console.log('\n🔍 Running audit validation...');
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/audit_skills.js', { stdio: 'inherit', cwd: repoRoot });
    execSync('node scripts/lint_internal_links.js', { stdio: 'inherit', cwd: repoRoot });
    console.log('\n🎉 Ingestion complete and 100% verified with 0 errors!\n');
  } catch (err) {
    console.error('\n❌ Audit failed after ingestion. Please check errors above.');
  }
}

main();
