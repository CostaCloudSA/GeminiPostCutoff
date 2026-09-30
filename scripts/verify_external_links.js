#!/usr/bin/env node

/**
 * Monthly External Link Verification Engine (scripts/verify_external_links.js)
 * 
 * Audits all external reference URLs across the 21 domain skills.
 * Designed to run once a month via GitHub Actions or on-demand locally.
 * 
 * Features:
 * - Rate-limited concurrency pool to prevent HTTP 429 rate-limiting.
 * - Follows redirects and applies realistic User-Agent headers.
 * - Generates explicit Markdown and CLI failure reports with exact line numbers and status codes.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// CLI Arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const CONCURRENCY = parseInt(getArg('--concurrency', '6'), 10);
const TIMEOUT_MS = parseInt(getArg('--timeout', '10000'), 10);
const LIMIT = args.includes('--limit') ? parseInt(getArg('--limit', '0'), 10) : 0;
const TARGET_SKILL = getArg('--skill', null);
const OUTPUT_FILE = getArg('--output', null);

const repoRoot = path.resolve(__dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');

// Extract all external links across skills
function collectLinks() {
  const items = [];
  const linkRegex = /^-\s+\[\[(\d{2}\.\d{2}\s+[^\]]+)\]:\s+([^\]]+)\]\((https?:\/\/[^\)]+)\)/;

  const skillFolders = fs.readdirSync(skillsDir).filter(f => {
    return fs.statSync(path.join(skillsDir, f)).isDirectory() && f !== 'gcp-skills-index';
  });

  for (const skill of skillFolders) {
    if (TARGET_SKILL && skill !== TARGET_SKILL) continue;

    const refFiles = [
      path.join(skillsDir, skill, 'references', 'articles.md'),
      path.join(skillsDir, skill, 'references', 'archive.md')
    ];

    for (const file of refFiles) {
      if (!fs.existsSync(file)) continue;
      const lines = fs.readFileSync(file, 'utf8').split('\n');

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(linkRegex);
        if (match) {
          items.push({
            skill,
            file: path.relative(repoRoot, file),
            line: i + 1,
            tag: match[1],
            title: match[2].trim(),
            url: match[3].trim()
          });
        }
      }
    }
  }
  return items;
}

function checkUrl(targetUrl, maxRedirects = 5) {
  return new Promise((resolve) => {
    if (maxRedirects < 0) {
      return resolve({ ok: false, statusCode: 310, error: 'Too many redirects' });
    }

    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (e) {
      return resolve({ ok: false, statusCode: 0, error: 'Invalid URL syntax' });
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const options = {
      method: 'HEAD',
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: TIMEOUT_MS
    };

    const req = client.request(options, (res) => {
      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, targetUrl).toString();
        }
        res.resume();
        return checkUrl(redirectUrl, maxRedirects - 1).then(resolve);
      }

      // Medium/Cloudflare sometimes blocks HEAD requests with 403 or 405; retry with GET
      if ([403, 405].includes(res.statusCode)) {
        res.resume();
        const getOptions = { ...options, method: 'GET' };
        const getReq = client.request(getOptions, (getRes) => {
          getRes.resume();
          const ok = getRes.statusCode >= 200 && getRes.statusCode < 400;
          resolve({ ok, statusCode: getRes.statusCode, error: ok ? null : `HTTP ${getRes.statusCode}` });
        });
        getReq.on('error', (err) => resolve({ ok: false, statusCode: 0, error: err.message }));
        getReq.on('timeout', () => { getReq.destroy(); resolve({ ok: false, statusCode: 408, error: 'Timeout' }); });
        getReq.end();
        return;
      }

      res.resume();
      const ok = res.statusCode >= 200 && res.statusCode < 400;
      resolve({ ok, statusCode: res.statusCode, error: ok ? null : `HTTP ${res.statusCode}` });
    });

    req.on('error', (err) => {
      resolve({ ok: false, statusCode: 0, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, statusCode: 408, error: 'Request Timeout' });
    });

    req.end();
  });
}

async function runAudit() {
  console.log('===============================================================');
  console.log('🌐 GEMINIPOSTCUTOFF MONTHLY EXTERNAL LINK VERIFICATION ENGINE');
  console.log('===============================================================\n');

  let allLinks = collectLinks();
  if (LIMIT > 0) {
    console.log(`ℹ️ Limiting verification to first ${LIMIT} links (--limit ${LIMIT})`);
    allLinks = allLinks.slice(0, LIMIT);
  }

  console.log(`Discovered ${allLinks.length} external reference links across skills.`);
  console.log(`Concurrency: ${CONCURRENCY} workers | Timeout: ${TIMEOUT_MS}ms\n`);

  let currentIndex = 0;
  let activeWorkers = 0;
  let passedCount = 0;
  const failures = [];

  return new Promise((resolve) => {
    function dispatch() {
      if (currentIndex >= allLinks.length && activeWorkers === 0) {
        return resolve(finish(failures, allLinks.length, passedCount));
      }

      while (activeWorkers < CONCURRENCY && currentIndex < allLinks.length) {
        const item = allLinks[currentIndex++];
        activeWorkers++;

        checkUrl(item.url).then((res) => {
          activeWorkers--;
          if (res.ok) {
            passedCount++;
            process.stdout.write('.');
          } else {
            // WAF bot blocks (403 from Cloudflare or Medium) are noted as warnings rather than fatal 404s
            const isBotChallenge = res.statusCode === 403 && (item.url.includes('medium.com') || item.url.includes('google.com'));
            failures.push({ ...item, ...res, isBotChallenge });
            process.stdout.write(isBotChallenge ? 'W' : 'F');
          }
          dispatch();
        });
      }
    }

    dispatch();
  });
}

function finish(failures, total, passed) {
  console.log('\n\n===============================================================');
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} links passed`);
  console.log('===============================================================\n');

  const permanentFailures = failures.filter(f => !f.isBotChallenge);
  const botWarnings = failures.filter(f => f.isBotChallenge);

  if (botWarnings.length > 0) {
    console.log(`⚠️ ${botWarnings.length} link(s) returned WAF/Bot Challenges (e.g. Medium/Cloudflare 403).`);
  }

  if (permanentFailures.length === 0) {
    console.log('✓ 0 permanent link failures detected (404/410/dead links: 0)!');
  } else {
    console.error(`❌ ${permanentFailures.length} DEAD OR FAILING LINKS DETECTED:\n`);
    console.table(permanentFailures.map(f => ({
      Status: f.statusCode || 'ERR',
      Skill: f.skill,
      File: `${f.file}:${f.line}`,
      Title: f.title.substring(0, 35),
      URL: f.url.substring(0, 45) + '...'
    })));
  }

  // Generate Explicit Markdown Report
  let reportMd = `# 🌐 Monthly Link Verification Report\n\n`;
  reportMd += `**Audit Date**: ${new Date().toISOString().split('T')[0]}  \n`;
  reportMd += `**Total Links Checked**: ${total}  \n`;
  reportMd += `**Passed**: ${passed}  \n`;
  reportMd += `**Permanent Failures (404/Dead)**: ${permanentFailures.length}  \n`;
  reportMd += `**WAF Challenges (403/Bot)**: ${botWarnings.length}  \n\n`;

  if (permanentFailures.length > 0) {
    reportMd += `## ❌ Action Required: Dead or Failing Links\n\n`;
    reportMd += `| HTTP Status | Skill Domain | File Location | Line | Canonical Title | Failing URL | Error |\n`;
    reportMd += `| :---: | :--- | :--- | :---: | :--- | :--- | :--- |\n`;
    for (const f of permanentFailures) {
      reportMd += `| \`${f.statusCode || 'ERR'}\` | \`${f.skill}\` | \`${f.file}\` | ${f.line} | ${f.title} | [Link](${f.url}) | ${f.error} |\n`;
    }
    reportMd += `\n> [!CAUTION]\n> Please remediate the above dead links by replacing them with working canonical URLs or Web Archive snapshots according to \`INGESTION_PROTOCOL.md\`.\n\n`;
  } else {
    reportMd += `## ✅ All Reference Links Healthy!\n\nZero broken or dead reference links detected across all 21 skills.\n`;
  }

  if (OUTPUT_FILE) {
    const resolvedPath = path.resolve(OUTPUT_FILE);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, reportMd, 'utf8');
    console.log(`\n📄 Explicit failure report written to: ${OUTPUT_FILE}`);
  }

  // Output to GitHub Actions Step Summary if running in CI
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, reportMd, 'utf8');
    console.log('📄 Appended failure report to GITHUB_STEP_SUMMARY.');
  }

  console.log('===============================================================\n');

  if (permanentFailures.length > 0) {
    process.exit(1);
  }
}

runAudit();
