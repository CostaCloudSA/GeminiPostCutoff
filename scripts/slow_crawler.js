#!/usr/bin/env node

/**
 * Stateful Incremental Slow Crawler & Deletion Candidate Evaluator (scripts/slow_crawler.js)
 * Part of GeminiPostCutoff Architecture Governance & Maintenance Pipeline (v2.1)
 *
 * Designed to be invoked on a recurring schedule (e.g., Daily, 6 links per run) by an
 * Antigravity Scheduled Prompt Automation (see docs/AUTOMATIONS_GALLERY.md).
 *
 * Capabilities:
 *  1. Dynamic Oldest-Active-Model Calibration:
 *     Uses ModelCutoffResolver.resolveOldestActiveModel() (currently gemini-3.1-pro, 2025-01)
 *     and automatically shifts forward when older models are marked deprecated in config/model_cutoffs.json.
 *  2. Stateful Round-Robin Cursor (reports/crawler_state.json):
 *     Selects the next N least-recently-checked links interleaved across all 22 skills with polite delays.
 *  3. 3-Layer Hard & Soft-404 Inspector (Bounded 48 KB GET):
 *     Detects HTTP 404/410/5xx, silent root redirects (deep slug -> /blog or /), and HTTP 200 pages
 *     rendering Soft-404 HTML templates.
 *  4. Content Quality & Original SKILL.md Ingestion Capture Cross-Reference:
 *     Extracts live page title, headings, and text summary, and matches the link against the exact
 *     Anti-Patterns, Decision Matrices, Blueprints, and Timeline entries in <skill>/SKILL.md.
 *  5. Hybrid Developer Knowledge API + Oldest-Active-Model Absorption Evaluation:
 *     Protects Practitioner FinOps/SRE Moat items (e.g., gcp-bigquery-cost) while identifying
 *     official syntax/capability links absorbed by developerknowledge.googleapis.com and active models.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { ModelCutoffResolver } = require('../review_engine/mesh/model_resolver');

const repoRoot = path.resolve(__dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');
const reportsDir = path.join(repoRoot, 'reports');
const stateFilePath = path.join(reportsDir, 'crawler_state.json');
const batchReportPath = path.join(reportsDir, 'latest_crawler_batch.md');
const deletionCandidatesPath = path.join(reportsDir, 'deletion_candidates.md');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    batchSize: 6,
    delayMs: 1200,
    timeoutMs: 10000,
    model: 'oldest-active',
    cutoff: null,
    skill: null,
    resetState: false
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--batch-size' && args[i + 1]) opts.batchSize = parseInt(args[++i], 10);
    else if (a === '--delay-ms' && args[i + 1]) opts.delayMs = parseInt(args[++i], 10);
    else if (a === '--timeout' && args[i + 1]) opts.timeoutMs = parseInt(args[++i], 10);
    else if (a === '--model' && args[i + 1]) opts.model = args[++i];
    else if (a === '--cutoff' && args[i + 1]) opts.cutoff = args[++i];
    else if (a === '--skill' && args[i + 1]) opts.skill = args[++i];
    else if (a === '--reset-state') opts.resetState = true;
  }
  return opts;
}

const PRACTITIONER_MOAT_SKILLS = new Set([
  'gcp-bigquery-cost',
  'gcp-gke-cost',
  'gcp-computefinops'
]);

const PRACTITIONER_HOST_PATTERNS = [
  /medium\.com/i,
  /dev\.to/i,
  /towardsai\.net/i,
  /zencore/i,
  /substack\.com/i
];

const OFFICIAL_DOC_HOST_PATTERNS = [
  /cloud\.google\.com/i,
  /developers\.google\.com/i,
  /developers\.googleblog\.com/i,
  /firebase\.blog/i,
  /firebase\.google\.com/i,
  /blog\.google/i,
  /adk\.dev/i,
  /ai\.google\.dev/i,
  /codelabs\.developers\.google\.com/i
];

const SOFT_404_HTML_PATTERNS = [
  { label: 'Title 404 / Page Not Found', regex: /<title[^>]*>\s*(?:404\b|error\s*404|page\s+not\s+found|not\s+found\b|sorry,\s*the\s+page\s+you|out\s+of\s+nothing,\s+something)/i },
  { label: 'Meta Prerender 404 Status', regex: /<meta[^>]+name=["']prerender-status-code["'][^>]+content=["']404["']/i },
  { label: 'H1 404 / Page Does Not Exist', regex: /<h1[^>]*>\s*(?:404\b|page\s+not\s+found|sorry,\s*we\s+couldn['’]t\s+find\s+that\s+page|this\s+page\s+doesn['’]t\s+exist|410\s+gone)/i },
  { label: 'Google Cloud / Developers 404 Template', regex: /sorry,\s+the\s+page\s+you['’]re\s+looking\s+for\s+cannot\s+be\s+found|requested\s+URL\s+was\s+not\s+found\s+on\s+this\s+server/i },
  { label: 'Medium Deleted / 404 Post Template', regex: /out\s+of\s+nothing,\s+something\.|this\s+page\s+is\s+out\s+of\s+the\s+universe/i }
];

function normalizeText(str) {
  return String(str || '')
    .replace(/&#129309;/g, '🤝')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .toLowerCase()
    .replace(/[–—―-]/g, '-')
    .replace(/["'’“”`]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Inspects a skill's SKILL.md to map citations, operational sections, and floor buffers
 */
function parseSkillCaptureMap(skillName) {
  const skillMdPath = path.join(skillsDir, skillName, 'SKILL.md');
  const articlesMdPath = path.join(skillsDir, skillName, 'references', 'articles.md');
  if (!fs.existsSync(skillMdPath)) return null;

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const lines = content.split('\n');

  let activeArticlesCount = 0;
  if (fs.existsSync(articlesMdPath)) {
    const m = fs.readFileSync(articlesMdPath, 'utf8').match(/^-\s*\[\[\d{2}\.\d{2}/gm);
    activeArticlesCount = m ? m.length : 0;
  }

  const reqAntiPatterns = activeArticlesCount > 40 ? 6 : activeArticlesCount >= 16 ? 5 : 4;
  const reqDecisionMatrices = 2;
  const reqBlueprints = activeArticlesCount > 40 ? 6 : activeArticlesCount >= 16 ? 5 : 4;

  const antiPatternsCount = (content.match(/\*\*Anti-Pattern\s+\d+:/gi) || []).length;
  const decisionMatricesCount = (content.match(/###\s+\d+\.\s+[^\n]+/gi) || []).length;
  const blueprintsCount = (content.match(/###\s+Blueprint\s+\d+:/gi) || []).length;

  let currentSection = 'Header';
  let currentBlockHeader = '';
  const blocks = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      currentSection = line.replace(/^##\s+/, '').trim();
      currentBlockHeader = currentSection;
    } else if (line.startsWith('### ') || /\*\*Anti-Pattern\s+\d+:/i.test(line)) {
      currentBlockHeader = line.replace(/^[>#*\s]+/, '').replace(/\*+$/, '').trim();
    }

    if (line.includes('*Cites:') || (currentSection.includes('Chronological Evolution') && line.trim().startsWith('- **['))) {
      blocks.push({
        line: i + 1,
        section: currentSection,
        blockHeader: currentBlockHeader,
        rawLine: line.trim()
      });
    }
  }

  return {
    skillName,
    activeArticlesCount,
    floors: {
      antiPatterns: { current: antiPatternsCount, required: reqAntiPatterns, buffer: antiPatternsCount - reqAntiPatterns },
      decisionMatrices: { current: decisionMatricesCount, required: reqDecisionMatrices, buffer: decisionMatricesCount - reqDecisionMatrices },
      blueprints: { current: blueprintsCount, required: reqBlueprints, buffer: blueprintsCount - reqBlueprints }
    },
    blocks
  };
}

/**
 * Collects all reference links across all 22 skills and maps them to SKILL.md captures
 */
function collectAllVaultLinks(targetSkillFilter = null) {
  const linkRegex = /^-\s+\[\[(\d{2}\.\d{2})\s+([^\]]+)\]:\s+([^\]]+)\]\((https?:\/\/[^\)]+)\)/;
  const genericRegex = /^-\s+\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/;

  const skillFolders = fs.readdirSync(skillsDir).filter(f => {
    return fs.statSync(path.join(skillsDir, f)).isDirectory() && f !== 'gcp-skills-index';
  });

  const skillCaptures = new Map();
  const allItems = [];

  for (const skill of skillFolders) {
    if (targetSkillFilter && skill !== targetSkillFilter) continue;
    const captureInfo = parseSkillCaptureMap(skill);
    skillCaptures.set(skill, captureInfo);

    const files = [
      { type: 'articles.md', fullPath: path.join(skillsDir, skill, 'references', 'articles.md') },
      { type: 'archive.md', fullPath: path.join(skillsDir, skill, 'references', 'archive.md') }
    ];

    for (const f of files) {
      if (!fs.existsSync(f.fullPath)) continue;
      const lines = fs.readFileSync(f.fullPath, 'utf8').split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        let date = 'archive';
        let resourceType = 'Resource';
        let title = '';
        let url = '';

        const m = line.match(linkRegex);
        if (m) {
          date = m[1];
          resourceType = m[2].trim();
          title = m[3].trim();
          url = m[4].trim();
        } else {
          const gm = line.match(genericRegex);
          if (gm && !gm[1].startsWith('http')) {
            title = gm[1].trim();
            url = gm[2].trim();
          }
        }

        if (!url) continue;

        const normTitle = normalizeText(title);
        const matchingBlocks = (captureInfo ? captureInfo.blocks : []).filter(b => {
          const normLine = normalizeText(b.rawLine);
          if (normTitle.length >= 8 && normLine.includes(normTitle.slice(0, Math.min(normTitle.length, 32)))) {
            return true;
          }
          return false;
        });

        const id = `${skill}::${f.type}::${url}`;
        allItems.push({
          id,
          skill,
          vaultFile: `skills/${skill}/references/${f.type}`,
          vaultType: f.type,
          line: i + 1,
          date,
          resourceType,
          title,
          url,
          matchingBlocks,
          isOperationalizedInRunbook: matchingBlocks.some(b => !b.section.includes('Chronological Evolution')),
          isTimelineOnly: matchingBlocks.length > 0 && matchingBlocks.every(b => b.section.includes('Chronological Evolution')),
          isUnreferencedInSkillMd: matchingBlocks.length === 0,
          floors: captureInfo ? captureInfo.floors : null
        });
      }
    }
  }

  return allItems;
}

/**
 * Selects the next batch of links in an interleaved round-robin order across skills
 */
function selectNextBatch(allItems, stateRecords, batchSize) {
  const annotated = allItems.map(item => {
    const prev = stateRecords[item.id] || null;
    return {
      ...item,
      checkCount: prev ? (prev.check_count || 0) : 0,
      lastCheckedAt: prev && prev.last_checked_at ? new Date(prev.last_checked_at).getTime() : 0
    };
  });

  // Group by skill so a single batch samples across diverse domains & hosts
  const bySkill = new Map();
  for (const item of annotated) {
    if (!bySkill.has(item.skill)) bySkill.set(item.skill, []);
    bySkill.get(item.skill).push(item);
  }

  for (const list of bySkill.values()) {
    list.sort((a, b) => {
      if (a.checkCount !== b.checkCount) return a.checkCount - b.checkCount;
      if (a.lastCheckedAt !== b.lastCheckedAt) return a.lastCheckedAt - b.lastCheckedAt;
      return a.line - b.line;
    });
  }

  const selected = [];
  const skillKeys = Array.from(bySkill.keys()).sort((a, b) => {
    const firstA = bySkill.get(a)[0];
    const firstB = bySkill.get(b)[0];
    if (firstA.checkCount !== firstB.checkCount) return firstA.checkCount - firstB.checkCount;
    return firstA.lastCheckedAt - firstB.lastCheckedAt;
  });

  let idx = 0;
  while (selected.length < batchSize && skillKeys.some(k => bySkill.get(k).length > 0)) {
    const skillKey = skillKeys[idx % skillKeys.length];
    const queue = bySkill.get(skillKey);
    if (queue.length > 0) {
      selected.push(queue.shift());
    }
    idx++;
  }

  return selected;
}

/**
 * Checks whether a redirect truncated a deep article path to a generic root/landing page
 */
function isSilentRootRedirect(originalUrlStr, finalUrlStr) {
  try {
    const orig = new URL(originalUrlStr);
    const fin = new URL(finalUrlStr);
    const origSegments = orig.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    const finPath = fin.pathname.replace(/\/+$/, '');
    if (
      origSegments.length >= 2 &&
      (finPath === '' ||
        finPath === '/blog' ||
        finPath === '/docs' ||
        finPath === '/en' ||
        /\/(404|not-found|error)$/i.test(finPath))
    ) {
      return true;
    }
  } catch (_) {}
  return false;
}

/**
 * Performs a bounded 48 KB GET inspection of a URL to detect Hard 404s, Soft 404s,
 * silent root redirects, and extract live content metadata for quality comparison.
 */
function inspectUrlAndContent(targetUrl, timeoutMs = 10000, maxRedirects = 5, originalUrl = null, redirectChain = []) {
  const rootUrl = originalUrl || targetUrl;

  return new Promise(resolve => {
    if (maxRedirects < 0) {
      return resolve({
        ok: false,
        healthStatus: 'HARD_404_REDIRECT_LOOP',
        statusCode: 310,
        finalUrl: targetUrl,
        redirectChain,
        error: 'Too many redirects',
        pageTitle: '',
        headings: [],
        excerpt: '',
        contentLengthBytes: 0
      });
    }

    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (e) {
      return resolve({
        ok: false,
        healthStatus: 'INVALID_URL',
        statusCode: 0,
        finalUrl: targetUrl,
        redirectChain,
        error: 'Invalid URL syntax',
        pageTitle: '',
        headings: [],
        excerpt: '',
        contentLengthBytes: 0
      });
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const options = {
      method: 'GET',
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: timeoutMs
    };

    const req = client.request(options, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        let nextUrl = res.headers.location;
        if (!nextUrl.startsWith('http')) {
          nextUrl = new URL(nextUrl, targetUrl).toString();
        }
        res.resume();
        return inspectUrlAndContent(
          nextUrl,
          timeoutMs,
          maxRedirects - 1,
          rootUrl,
          [...redirectChain, `${res.statusCode} -> ${nextUrl}`]
        ).then(resolve);
      }

      const chunks = [];
      let totalBytes = 0;
      const MAX_BYTES = 49152; // 48 KB bounded read

      res.on('data', chunk => {
        if (totalBytes < MAX_BYTES) {
          chunks.push(chunk);
          totalBytes += chunk.length;
          if (totalBytes >= MAX_BYTES) {
            res.destroy();
          }
        }
      });

      const finalizeResponse = () => {
        const html = Buffer.concat(chunks).toString('utf8');
        const statusCode = res.statusCode || 0;

        // Extract title, headings, and readable text excerpt
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

        const headings = [];
        const hRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
        let hm;
        while ((hm = hRegex.exec(html)) !== null && headings.length < 6) {
          const cleanH = hm[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanH.length > 2) headings.push(cleanH);
        }

        const strippedBody = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const excerpt = strippedBody.slice(0, 400);

        // 1. Check WAF / Bot Challenge (e.g., Cloudflare 403)
        if (statusCode === 403 || statusCode === 429 || /just a moment\.\.\.|attention required! \| cloudflare/i.test(pageTitle)) {
          return resolve({
            ok: true,
            healthStatus: 'WAF_CHALLENGE_AGENT_VERIFY',
            statusCode,
            finalUrl: targetUrl,
            redirectChain,
            error: `HTTP ${statusCode} WAF/Bot Challenge (verify via Agent search_web)`,
            pageTitle,
            headings,
            excerpt,
            contentLengthBytes: totalBytes
          });
        }

        // 2. Check Hard HTTP 404 / 410 / 5xx
        if (statusCode < 200 || statusCode >= 400) {
          return resolve({
            ok: false,
            healthStatus: 'HARD_404',
            statusCode,
            finalUrl: targetUrl,
            redirectChain,
            error: `HTTP ${statusCode}`,
            pageTitle,
            headings,
            excerpt,
            contentLengthBytes: totalBytes
          });
        }

        // 3. Check Silent Root Redirect (Soft Redirect 404)
        if (redirectChain.length > 0 && isSilentRootRedirect(rootUrl, targetUrl)) {
          return resolve({
            ok: false,
            healthStatus: 'SOFT_REDIRECT_404',
            statusCode,
            finalUrl: targetUrl,
            redirectChain,
            error: `Deep URL silently redirected to generic root/landing page (${targetUrl})`,
            pageTitle,
            headings,
            excerpt,
            contentLengthBytes: totalBytes
          });
        }

        // 4. Check HTML Body for Soft-404 Templates
        for (const pat of SOFT_404_HTML_PATTERNS) {
          if (pat.regex.test(html)) {
            return resolve({
              ok: false,
              healthStatus: 'SOFT_404_PAGE',
              statusCode,
              finalUrl: targetUrl,
              redirectChain,
              error: `HTTP 200 Soft-404 detected (${pat.label}): "${pageTitle}"`,
              pageTitle,
              headings,
              excerpt,
              contentLengthBytes: totalBytes
            });
          }
        }

        return resolve({
          ok: true,
          healthStatus: 'HEALTHY_200',
          statusCode,
          finalUrl: targetUrl,
          redirectChain,
          error: null,
          pageTitle,
          headings,
          excerpt,
          contentLengthBytes: totalBytes
        });
      };

      res.on('end', finalizeResponse);
      res.on('close', finalizeResponse);
    });

    req.on('error', err => {
      resolve({
        ok: false,
        healthStatus: 'NETWORK_ERROR',
        statusCode: 0,
        finalUrl: targetUrl,
        redirectChain,
        error: err.message,
        pageTitle: '',
        headings: [],
        excerpt: '',
        contentLengthBytes: 0
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ok: false,
        healthStatus: 'TIMEOUT',
        statusCode: 408,
        finalUrl: targetUrl,
        redirectChain,
        error: 'Request Timeout',
        pageTitle: '',
        headings: [],
        excerpt: '',
        contentLengthBytes: 0
      });
    });

    req.end();
  });
}

/**
 * Optional direct REST probe against Google Developer Knowledge API if DEVELOPER_KNOWLEDGE_API_KEY is set
 */
function probeDeveloperKnowledgeApi(query, apiKey) {
  return new Promise(resolve => {
    if (!apiKey) {
      return resolve({
        mode: 'AGENT_HYBRID_PROBE_READY',
        queried_live_api: false,
        top_chunk_uri: null,
        match_count: 0
      });
    }

    const encodedQuery = encodeURIComponent(query);
    const options = {
      method: 'GET',
      hostname: 'developerknowledge.googleapis.com',
      path: `/v1alpha/documents:searchDocumentChunks?query=${encodedQuery}&pageSize=3`,
      headers: {
        'X-Goog-Api-Key': apiKey,
        'Accept': 'application/json'
      },
      timeout: 6000
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const results = parsed.results || parsed.chunks || [];
          resolve({
            mode: 'LIVE_DK_API_REST',
            queried_live_api: true,
            status_code: res.statusCode,
            match_count: results.length,
            top_chunk_uri: results[0] ? (results[0].uri || results[0].document || 'matched') : null
          });
        } catch (_) {
          resolve({
            mode: 'LIVE_DK_API_PARSE_FALLBACK',
            queried_live_api: true,
            status_code: res.statusCode,
            match_count: 0,
            top_chunk_uri: null
          });
        }
      });
    });

    req.on('error', () => resolve({ mode: 'AGENT_HYBRID_PROBE_READY', queried_live_api: false, top_chunk_uri: null, match_count: 0 }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ mode: 'AGENT_HYBRID_PROBE_READY', queried_live_api: false, top_chunk_uri: null, match_count: 0 });
    });
    req.end();
  });
}

/**
 * Evaluates Epistemic Category, Model Cutoff Absorption, Content Capture Alignment, and Deletion Candidacy
 */
async function evaluateItem(item, urlCheck, modelProfile, dkApiKey) {
  const isPractitionerHost = PRACTITIONER_HOST_PATTERNS.some(r => r.test(item.url));
  const isOfficialHost = OFFICIAL_DOC_HOST_PATTERNS.some(r => r.test(item.url));
  const hasFinOpsKeywords = /\b(690\s*TB|crossover|long-term storage|slot-hour|unallocated|finops|saved\s+\$|cost\s+reduction|taming\s+the\s+bigquery)\b/i.test(
    `${item.title} ${item.matchingBlocks.map(b => b.blockHeader).join(' ')}`
  );

  let epistemicCategory = 'OFFICIAL_CAPABILITY_OR_SYNTAX';
  if (PRACTITIONER_MOAT_SKILLS.has(item.skill) && (isPractitionerHost || hasFinOpsKeywords)) {
    epistemicCategory = 'PROTECTED_PRACTITIONER_FINOPS_MOAT';
  } else if (isPractitionerHost || hasFinOpsKeywords) {
    epistemicCategory = 'PROTECTED_PRACTITIONER_FIELD_ANECDOTE';
  } else if (!isOfficialHost) {
    epistemicCategory = 'COMMUNITY_OR_ECOSYSTEM_REFERENCE';
  }

  // Classify against the Oldest Active Model (currently gemini-3.1-pro, 2025-01)
  const tierInfo = item.date !== 'archive'
    ? ModelCutoffResolver.classifyArticleTier(item.date, modelProfile.cutoff_sort_key)
    : { tier: 'TIER_3_FOUNDATION', short_tier: 'Dynamic Tier 3 (Archive <= 2024)', delta_months: -18 };

  const absorbedByOldestModel = tierInfo.delta_months !== null && tierInfo.delta_months <= 0;

  // Build focused Developer Knowledge API probe query (2-5 keywords per DK API best practices)
  const cleanTitleWords = item.title
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !/^(how|the|and|for|with|from|into|using|your|what|why|new|part)$/i.test(w))
    .slice(0, 5)
    .join(' ');
  const dkProbeQuery = `${item.skill.replace(/^gcp-/, 'GCP ')} ${cleanTitleWords}`.trim();
  const dkProbeResult = await probeDeveloperKnowledgeApi(dkProbeQuery, dkApiKey);

  // Content Quality & Capture Alignment
  let captureStatus = 'OPERATIONALIZED_IN_BLUEPRINT_OR_RULE';
  if (item.isUnreferencedInSkillMd) {
    captureStatus = 'UNUTILIZED_VAULT_LINK_ONLY (AES Level 1)';
  } else if (item.isTimelineOnly) {
    captureStatus = 'TIMELINE_MILESTONE_ONLY (AES Level 2)';
  }

  // Determine Verdict & Deletion Candidacy
  let candidateCategory = 'RETAIN_HEALTHY';
  let candidateReason = 'Healthy link providing active post-cutoff or practitioner value.';
  let floorSafeToDelete = true;

  if (item.isOperationalizedInRunbook && item.floors) {
    const minBuf = Math.min(
      item.floors.antiPatterns.buffer,
      item.floors.blueprints.buffer
    );
    if (minBuf <= 0) floorSafeToDelete = false;
  }

  if (!urlCheck.ok) {
    candidateCategory = 'CANDIDATE_DEAD_OR_SOFT_404';
    candidateReason = `${urlCheck.healthStatus}: ${urlCheck.error || 'Unreachable / Soft-404 page'}. Replace with updated canonical URL or remove.`;
  } else if (epistemicCategory.startsWith('PROTECTED_PRACTITIONER')) {
    candidateCategory = 'PROTECTED_PRACTITIONER_MOAT';
    candidateReason = `Practitioner FinOps/SRE field intelligence outside official GCP docs corpus. Retain 100%.`;
  } else if (absorbedByOldestModel && epistemicCategory === 'OFFICIAL_CAPABILITY_OR_SYNTAX') {
    candidateCategory = 'CANDIDATE_ABSORBED_BY_DK_AND_MODEL';
    candidateReason = `Published [${item.date}] (delta=${tierInfo.delta_months}m <= 0 vs oldest active model ${modelProfile.display_name} [${modelProfile.official_cutoff}]) and covers official syntax/docs retrievable via Developer Knowledge API.`;
  } else if (item.isUnreferencedInSkillMd && epistemicCategory === 'OFFICIAL_CAPABILITY_OR_SYNTAX') {
    candidateCategory = 'CANDIDATE_DK_API_COMPACTION_CHECK';
    candidateReason = `Vault-only official link (AES Level 1, not cited in any SKILL.md blueprint/anti-pattern). Verify via Developer Knowledge API query "${dkProbeQuery}" — if covered in official docs, safe to prune from articles.md.`;
  } else if (urlCheck.ok && urlCheck.contentLengthBytes > 15000 && item.isUnreferencedInSkillMd) {
    candidateCategory = 'OPPORTUNITY_ENRICH_CAPTURE';
    candidateReason = `Substantial article (${Math.round(urlCheck.contentLengthBytes / 1024)} KB) indexed in vault but not yet extracted into a SKILL.md Anti-Pattern or Blueprint.`;
  }

  return {
    id: item.id,
    checked_at: new Date().toISOString(),
    skill: item.skill,
    vault_file: item.vaultFile,
    line: item.line,
    date: item.date,
    title: item.title,
    url: item.url,
    final_url: urlCheck.finalUrl,
    http_status: urlCheck.statusCode,
    health_status: urlCheck.healthStatus,
    error: urlCheck.error,
    page_title: urlCheck.pageTitle,
    headings: urlCheck.headings,
    excerpt: urlCheck.excerpt,
    epistemic_category: epistemicCategory,
    oldest_active_model: {
      id: modelProfile.id,
      display_name: modelProfile.display_name,
      official_cutoff: modelProfile.official_cutoff,
      article_tier: tierInfo.tier,
      delta_months: tierInfo.delta_months,
      absorbed_in_model_weights: absorbedByOldestModel
    },
    dk_api_probe: {
      query: dkProbeQuery,
      ...dkProbeResult
    },
    capture_alignment: {
      status: captureStatus,
      cited_in_sections: item.matchingBlocks.map(b => `${b.section} -> ${b.blockHeader} (L${b.line})`),
      floor_safe_to_prune: floorSafeToDelete
    },
    verdict: candidateCategory,
    reason: candidateReason
  };
}

/**
 * Generates reports/latest_crawler_batch.md and updates reports/deletion_candidates.md
 */
function writeReports(batchEvaluations, stateObj, modelProfile, totalLinksCount) {
  const allEvaluated = Object.values(stateObj.records || {});
  const checkedCount = allEvaluated.filter(r => r.check_count > 0).length;

  // 1. Write Latest Batch Dossier (reports/latest_crawler_batch.md)
  let batchMd = `# 🐢 Incremental Slow-Crawler Batch Dossier\n\n`;
  batchMd += `- **Run Timestamp**: \`${new Date().toISOString()}\`\n`;
  batchMd += `- **Oldest Active Model Baseline**: **${modelProfile.display_name}** (\`${modelProfile.id}\`, Official Cutoff: \`${modelProfile.official_cutoff}\`)\n`;
  batchMd += `- **Batch Size Checked**: **${batchEvaluations.length}** links\n`;
  batchMd += `- **Cumulative Vault Coverage**: **${checkedCount} / ${totalLinksCount}** links inspected (${((checkedCount / Math.max(totalLinksCount, 1)) * 100).toFixed(1)}%)\n\n`;

  batchMd += `## 📋 Batch Inspection Results\n\n`;
  batchMd += `| # | Skill | Date | Title | Link Health | Epistemic Class | Oldest Model ($\\Delta_m$) | Capture Status | Verdict |\n`;
  batchMd += `| :---: | :--- | :---: | :--- | :---: | :--- | :---: | :--- | :--- |\n`;

  batchEvaluations.forEach((ev, idx) => {
    const deltaStr = ev.oldest_active_model.delta_months !== null ? `${ev.oldest_active_model.delta_months}m` : 'archive';
    batchMd += `| ${idx + 1} | \`${ev.skill}\` | \`[${ev.date}]\` | [${ev.title}](${ev.url}) | \`${ev.health_status}\` (${ev.http_status}) | \`${ev.epistemic_category}\` | \`${deltaStr}\` | \`${ev.capture_alignment.status}\` | **\`${ev.verdict}\`** |\n`;
  });

  batchMd += `\n---\n\n## 🔍 Per-Link Content Quality & Developer Knowledge API Probe Details\n\n`;
  for (const ev of batchEvaluations) {
    batchMd += `### [${ev.date}] ${ev.title} (\`${ev.skill}\` — \`${ev.vault_file}:${ev.line}\`)\n`;
    batchMd += `- **Target URL**: ${ev.url}\n`;
    if (ev.final_url && ev.final_url !== ev.url) {
      batchMd += `- **Redirected To**: ${ev.final_url}\n`;
    }
    batchMd += `- **HTTP & Soft-404 Check**: \`${ev.health_status}\` (Status: \`${ev.http_status}\`)${ev.error ? ` — ⚠️ ${ev.error}` : ''}\n`;
    batchMd += `- **Live Page Title**: \`${ev.page_title || 'N/A'}\`\n`;
    if (ev.headings && ev.headings.length > 0) {
      batchMd += `- **Live Headings**: ${ev.headings.map(h => `\`${h}\``).join(' | ')}\n`;
    }
    batchMd += `- **Original \`SKILL.md\` Capture**: ${ev.capture_alignment.cited_in_sections.length > 0 ? ev.capture_alignment.cited_in_sections.join('; ') : 'Not directly cited in SKILL.md body (Vault link only)'}\n`;
    batchMd += `- **Developer Knowledge API Probe Query**: \`${ev.dk_api_probe.query}\` (Floor-Safe to Prune: \`${ev.capture_alignment.floor_safe_to_prune}\`)\n`;
    batchMd += `- **Crawler Verdict**: **\`${ev.verdict}\`** — ${ev.reason}\n\n`;
  }

  fs.writeFileSync(batchReportPath, batchMd, 'utf8');

  // 2. Write Cumulative Deletion & Compaction Candidate Ledger (reports/deletion_candidates.md)
  const deadOrSoft404 = allEvaluated.filter(r => r.verdict === 'CANDIDATE_DEAD_OR_SOFT_404');
  const absorbedByDkModel = allEvaluated.filter(r => r.verdict === 'CANDIDATE_ABSORBED_BY_DK_AND_MODEL');
  const dkCompactionCheck = allEvaluated.filter(r => r.verdict === 'CANDIDATE_DK_API_COMPACTION_CHECK');
  const protectedMoat = allEvaluated.filter(r => r.verdict === 'PROTECTED_PRACTITIONER_MOAT');

  let candMd = `# 🗂️ GeminiPostCutoff Deletion, Compaction & Remediation Candidate Ledger\n\n`;
  candMd += `> **Maintained By**: \`scripts/slow_crawler.js\` (Antigravity Daily Incremental Slow-Crawler Automation)\n`;
  candMd += `> **Last Updated**: \`${new Date().toISOString()}\`\n`;
  candMd += `> **Oldest Active Model Horizon**: **${modelProfile.display_name}** (\`${modelProfile.id}\` — Cutoff \`${modelProfile.official_cutoff}\`)\n`;
  candMd += `> **Cumulative Progress**: **${checkedCount} / ${totalLinksCount}** links crawled\n\n`;

  candMd += `## 📊 Cumulative Ledger Summary\n\n`;
  candMd += `| Category | Count | Action Policy |\n`;
  candMd += `| :--- | :---: | :--- |\n`;
  candMd += `| **1. Dead or Soft-404 Links (\`CANDIDATE_DEAD_OR_SOFT_404\`)** | **${deadOrSoft404.length}** | Replace with updated canonical URL or remove in Monthly Review Gate |\n`;
  candMd += `| **2. Absorbed by Oldest Model & DK API (\`CANDIDATE_ABSORBED_BY_DK_AND_MODEL\`)** | **${absorbedByDkModel.length}** | Pre-cutoff for oldest active model & official docs; safe to prune/compact |\n`;
  candMd += `| **3. Official Syntax Compaction Candidates (\`CANDIDATE_DK_API_COMPACTION_CHECK\`)** | **${dkCompactionCheck.length}** | Vault-only official links; prune once verified in Developer Knowledge API |\n`;
  candMd += `| **4. Protected Practitioner & FinOps Moat (\`PROTECTED_PRACTITIONER_MOAT\`)** | **${protectedMoat.length}** | **Exempt from deletion** (Operational anecdotes & FinOps math outside GCP docs) |\n\n`;

  candMd += `---\n\n## 🚨 1. Broken & Soft-404 Links (\`CANDIDATE_DEAD_OR_SOFT_404\`)\n\n`;
  if (deadOrSoft404.length === 0) {
    candMd += `*Zero broken or Soft-404 links detected in crawled batches so far.*\n\n`;
  } else {
    candMd += `| Skill | Location | Date | Title | Failure Mode | URL |\n`;
    candMd += `| :--- | :--- | :---: | :--- | :--- | :--- |\n`;
    for (const item of deadOrSoft404) {
      candMd += `| \`${item.skill}\` | \`${item.vault_file}:${item.line}\` | \`[${item.date}]\` | ${item.title} | \`${item.health_status}\`: ${item.error} | [Link](${item.url}) |\n`;
    }
    candMd += `\n`;
  }

  candMd += `## 🧹 2. Absorbed by Oldest Active Model & Developer Knowledge API (\`CANDIDATE_ABSORBED_BY_DK_AND_MODEL\`)\n\n`;
  if (absorbedByDkModel.length === 0) {
    candMd += `*Zero fully-absorbed model-cutoff candidates flagged in crawled batches so far.*\n\n`;
  } else {
    candMd += `| Skill | Location | Date | $\\Delta_m$ vs Oldest Model | Title | DK Probe Query | Floor-Safe |\n`;
    candMd += `| :--- | :--- | :---: | :---: | :--- | :--- | :---: |\n`;
    for (const item of absorbedByDkModel) {
      candMd += `| \`${item.skill}\` | \`${item.vault_file}:${item.line}\` | \`[${item.date}]\` | \`${item.oldest_active_model.delta_months}m\` | [${item.title}](${item.url}) | \`${item.dk_api_probe.query}\` | \`${item.capture_alignment.floor_safe_to_prune}\` |\n`;
    }
    candMd += `\n`;
  }

  candMd += `## 🔎 3. Official Docs Compaction Candidates (\`CANDIDATE_DK_API_COMPACTION_CHECK\`)\n\n`;
  if (dkCompactionCheck.length === 0) {
    candMd += `*Zero unreferenced official-doc links flagged in crawled batches so far.*\n\n`;
  } else {
    candMd += `| Skill | Location | Date | Title | Developer Knowledge API Probe Query | Capture Status |\n`;
    candMd += `| :--- | :--- | :---: | :--- | :--- | :--- |\n`;
    for (const item of dkCompactionCheck) {
      candMd += `| \`${item.skill}\` | \`${item.vault_file}:${item.line}\` | \`[${item.date}]\` | [${item.title}](${item.url}) | \`${item.dk_api_probe.query}\` | \`${item.capture_alignment.status}\` |\n`;
    }
    candMd += `\n`;
  }

  candMd += `## 🛡️ 4. Protected Practitioner & FinOps Moat Verified (\`PROTECTED_PRACTITIONER_MOAT\`)\n\n`;
  if (protectedMoat.length === 0) {
    candMd += `*No practitioner moat items inspected yet.*\n\n`;
  } else {
    candMd += `| Skill | Location | Date | Title | Capture Section in \`SKILL.md\` |\n`;
    candMd += `| :--- | :--- | :---: | :--- | :--- |\n`;
    for (const item of protectedMoat) {
      const cited = item.capture_alignment.cited_in_sections.join('; ') || 'Chronological / Vault Moat';
      candMd += `| \`${item.skill}\` | \`${item.vault_file}:${item.line}\` | \`[${item.date}]\` | [${item.title}](${item.url}) | ${cited} |\n`;
    }
    candMd += `\n`;
  }

  fs.writeFileSync(deletionCandidatesPath, candMd, 'utf8');
}

async function main() {
  const opts = parseArgs();

  const modelProfile = opts.cutoff
    ? ModelCutoffResolver.resolve({ model: opts.model, cutoff: opts.cutoff })
    : ModelCutoffResolver.resolve({ model: opts.model });

  console.log('============================================================================');
  console.log('🐢 GEMINIPOSTCUTOFF STATEFUL INCREMENTAL SLOW CRAWLER & ABSORPTION AUDITOR');
  console.log('============================================================================');
  console.log(`Oldest Active Model Baseline : ${modelProfile.label}`);
  console.log(`Batch Size                   : ${opts.batchSize} links (Polite delay: ${opts.delayMs}ms)\n`);

  let stateObj = {
    version: '2.1.0',
    updated_at: null,
    oldest_active_model: modelProfile.id,
    oldest_active_cutoff: modelProfile.official_cutoff,
    total_runs: 0,
    records: {}
  };

  if (!opts.resetState && fs.existsSync(stateFilePath)) {
    try {
      stateObj = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      if (!stateObj.records) stateObj.records = {};
    } catch (_) {}
  }

  const allItems = collectAllVaultLinks(opts.skill);
  const batch = selectNextBatch(allItems, stateObj.records, opts.batchSize);

  console.log(`Selected ${batch.length} least-recently-checked links across ${new Set(batch.map(b => b.skill)).size} skills:\n`);

  const dkApiKey = process.env.DEVELOPER_KNOWLEDGE_API_KEY || null;
  const batchEvaluations = [];

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    if (i > 0 && opts.delayMs > 0) {
      await sleep(opts.delayMs);
    }

    process.stdout.write(`  [${i + 1}/${batch.length}] [${item.skill}] [${item.date}] ${item.title.slice(0, 48)}... `);
    const urlCheck = await inspectUrlAndContent(item.url, opts.timeoutMs);
    const evaluation = await evaluateItem(item, urlCheck, modelProfile, dkApiKey);

    const prevCount = stateObj.records[item.id] ? (stateObj.records[item.id].check_count || 0) : 0;
    stateObj.records[item.id] = {
      ...evaluation,
      check_count: prevCount + 1,
      last_checked_at: evaluation.checked_at
    };

    batchEvaluations.push(evaluation);
    console.log(`-> ${evaluation.health_status} | ${evaluation.verdict}`);
  }

  stateObj.updated_at = new Date().toISOString();
  stateObj.oldest_active_model = modelProfile.id;
  stateObj.oldest_active_cutoff = modelProfile.official_cutoff;
  stateObj.total_runs = (stateObj.total_runs || 0) + 1;

  fs.writeFileSync(stateFilePath, JSON.stringify(stateObj, null, 2), 'utf8');
  writeReports(batchEvaluations, stateObj, modelProfile, allItems.length);

  console.log('\n============================================================================');
  console.log(`✓ Slow Crawler State Updated : ${path.relative(repoRoot, stateFilePath)}`);
  console.log(`✓ Latest Batch Dossier       : ${path.relative(repoRoot, batchReportPath)}`);
  console.log(`✓ Deletion Candidate Ledger  : ${path.relative(repoRoot, deletionCandidatesPath)}`);
  console.log('============================================================================\n');
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  collectAllVaultLinks,
  inspectUrlAndContent,
  isSilentRootRedirect
};
