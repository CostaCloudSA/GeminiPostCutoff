/**
 * Gemini Context Caching Manager (Dynamic Cutoff-Relative Tier Engine v2.0)
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Replaces static markdown tier slicing ("Tier 1A" / "Tier 1B") with mathematical
 * Cutoff-Relative Dynamic Tier slicing via ModelCutoffResolver:
 *  - Dynamic Tier 1 (Post-Cutoff Delta): Article YYYYMM > Model Cutoff YYYYMM (delta_months > 0)
 *  - Dynamic Tier 2 (Boundary Window):   -12 <= delta_months <= 0
 *  - Dynamic Tier 3 (Timeless Foundation): delta_months < -12
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ModelCutoffResolver } = require('./model_resolver');

class ContextCacheManager {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || path.resolve(__dirname, '..', '..');
    this.skillsDir = path.join(this.repoRoot, 'skills');
    this.modelProfile = ModelCutoffResolver.resolve({
      model: options.targetModel,
      cutoff: options.targetCutoff
    });
    this.targetModel = this.modelProfile.id;
    this.ttlSeconds = options.ttlSeconds || 3600;
  }

  /**
   * Builds a cached context manifest across domain runbooks, dynamically sliced
   * relative to the active model's training cutoff date.
   */
  getOrCreateRunbookCache(activePodsOrCount = 13, includeBoundary = false, includeFoundations = false) {
    return this.buildCachedContext(activePodsOrCount, includeBoundary, includeFoundations);
  }

  get_or_create_runbook_cache(activePodsOrCount = 13, includeBoundary = false, includeFoundations = false) {
    return this.buildCachedContext(activePodsOrCount, includeBoundary, includeFoundations);
  }

  buildCachedContext(activePodsOrCount = 13, includeBoundary = false, includeFoundations = false) {
    const cutoffSortKey = this.modelProfile.cutoff_sort_key;
    const shouldIncludeBoundary = includeBoundary || this.modelProfile.inject_boundary_tier_by_default;

    let requiredSkills = null;
    let numPods = 13;

    if (Array.isArray(activePodsOrCount)) {
      numPods = Math.max(activePodsOrCount.length, 1);
      requiredSkills = new Set(['gcp-architecture-review', 'gcp-skills-index']);
      for (const pod of activePodsOrCount) {
        for (const skill of (pod.skills || [])) {
          requiredSkills.add(skill);
        }
      }
    } else if (typeof activePodsOrCount === 'number') {
      numPods = Math.max(activePodsOrCount, 1);
    }

    if (!requiredSkills && fs.existsSync(this.skillsDir)) {
      requiredSkills = new Set(
        fs.readdirSync(this.skillsDir).filter(f => fs.statSync(path.join(this.skillsDir, f)).isDirectory())
      );
    } else if (!requiredSkills) {
      requiredSkills = new Set();
    }

    const loadedRunbooks = [];
    let totalRawBytes = 0;
    let totalFilteredBytes = 0;
    let tier1ArticlesCount = 0;
    let tier2ArticlesCount = 0;
    let tier3ArticlesCount = 0;

    for (const skillName of requiredSkills) {
      const skillFolder = path.join(this.skillsDir, skillName);
      const skillFile = path.join(skillFolder, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;

      const rawSkillContent = fs.readFileSync(skillFile, 'utf8');
      let rawArticlesContent = '';
      let rawArchiveContent = '';

      const articlesPath = path.join(skillFolder, 'references', 'articles.md');
      const archivePath = path.join(skillFolder, 'references', 'archive.md');
      if (fs.existsSync(articlesPath)) rawArticlesContent = fs.readFileSync(articlesPath, 'utf8');
      if (fs.existsSync(archivePath)) rawArchiveContent = fs.readFileSync(archivePath, 'utf8');

      const combinedRawBytes = Buffer.byteLength(rawSkillContent + rawArticlesContent + rawArchiveContent, 'utf8');
      totalRawBytes += combinedRawBytes;

      const sliced = this._sliceByDynamicCutoff(
        rawSkillContent,
        rawArticlesContent,
        rawArchiveContent,
        cutoffSortKey,
        shouldIncludeBoundary,
        includeFoundations
      );

      tier1ArticlesCount += sliced.counts.tier1;
      tier2ArticlesCount += sliced.counts.tier2;
      tier3ArticlesCount += sliced.counts.tier3;

      const filteredBytes = Buffer.byteLength(sliced.payload, 'utf8');
      totalFilteredBytes += filteredBytes;

      loadedRunbooks.push({
        skill: skillName,
        raw_bytes: combinedRawBytes,
        cached_bytes: filteredBytes,
        dynamic_tier_counts: sliced.counts,
        tier_mode: this._describeTierMode(shouldIncludeBoundary, includeFoundations)
      });
    }

    const rawTokens = Math.ceil(totalRawBytes / 4);
    const cachedTokens = Math.ceil(totalFilteredBytes / 4);
    const uncachedMultiPodTokens = rawTokens * numPods;
    const effectiveBilledTokens = cachedTokens + Math.ceil(cachedTokens * 0.25 * Math.max(numPods - 1, 0));
    const netTokensConserved = Math.max(0, uncachedMultiPodTokens - effectiveBilledTokens);
    const tokenSavingsPct = uncachedMultiPodTokens > 0
      ? (((uncachedMultiPodTokens - effectiveBilledTokens) / uncachedMultiPodTokens) * 100).toFixed(1)
      : '0.0';

    const cacheKey = crypto
      .createHash('sha256')
      .update(`${this.modelProfile.id}:${cutoffSortKey}:${Array.from(requiredSkills).sort().join(',')}:${shouldIncludeBoundary}:${includeFoundations}`)
      .digest('hex')
      .slice(0, 16);

    return {
      cache_id: `gemini-ctx-cache-${cacheKey}`,
      target_model: this.modelProfile.id,
      model_display_name: this.modelProfile.display_name,
      generation_status: this.modelProfile.generation_status,
      effective_cutoff: this.modelProfile.official_cutoff,
      cutoff_sort_key: cutoffSortKey,
      post_cutoff_threshold: `>= ${this.modelProfile.post_cutoff_start}`,
      tier_policy: this._describeTierMode(shouldIncludeBoundary, includeFoundations),
      ttl_seconds: this.ttlSeconds,
      skills_cached: loadedRunbooks.length,
      dynamic_article_telemetry: {
        tier_1_post_cutoff_count: tier1ArticlesCount,
        tier_2_boundary_count: tier2ArticlesCount,
        tier_3_foundation_count: tier3ArticlesCount
      },
      raw_single_pass_tokens: rawTokens,
      cached_runbook_tokens: cachedTokens,
      cached_tier_tokens: cachedTokens,
      uncached_multi_pod_tokens: uncachedMultiPodTokens,
      effective_billed_tokens: effectiveBilledTokens,
      net_tokens_conserved: netTokensConserved,
      efficiency_gain: `${tokenSavingsPct}%`,
      estimated_cost_reduction_pct: `${tokenSavingsPct}%`,
      runbooks: loadedRunbooks
    };
  }

  _describeTierMode(includeBoundary, includeFoundations) {
    const start = this.modelProfile.post_cutoff_start;
    if (includeFoundations) {
      return `Dynamic Tier 1 (>= ${start}) + Tier 2 (Boundary 12m) + Tier 3 (Foundations)`;
    }
    if (includeBoundary) {
      return `Dynamic Tier 1 (>= ${start}) + Dynamic Tier 2 (Boundary 12m)`;
    }
    return `Dynamic Tier 1 Only (Post-Cutoff Delta >= ${start})`;
  }

  _sliceByDynamicCutoff(skillContent, articlesContent, archiveContent, cutoffSortKey, includeBoundary, includeFoundations) {
    const counts = { tier1: 0, tier2: 0, tier3: 0 };

    const skillLines = skillContent.split('\n');
    const filteredSkillLines = [];
    let inChronologicalSection = false;

    for (const line of skillLines) {
      if (line.startsWith('## ') && line.includes('Chronological Evolution')) {
        inChronologicalSection = true;
        filteredSkillLines.push(line);
        continue;
      }
      if (inChronologicalSection && line.startsWith('## ')) {
        inChronologicalSection = false;
      }

      if (inChronologicalSection) {
        const m = line.match(/\[(\d{2}\.\d{2})\]/);
        if (m) {
          const classified = ModelCutoffResolver.classifyArticleTier(m[1], cutoffSortKey);
          if (classified.tier === 'TIER_1_POST_CUTOFF') {
            filteredSkillLines.push(line);
          } else if (classified.tier === 'TIER_2_BOUNDARY' && includeBoundary) {
            filteredSkillLines.push(line);
          } else if (classified.tier === 'TIER_3_FOUNDATION' && includeFoundations) {
            filteredSkillLines.push(line);
          }
          continue;
        }
      }
      filteredSkillLines.push(line);
    }

    const selectedArticleLines = [];
    const allRefLines = `${articlesContent}\n${archiveContent}`.split('\n');
    for (const line of allRefLines) {
      const m = line.match(/^\s*-\s*\[\[(\d{2}\.\d{2})\s+[^\]]+\]:/);
      if (m) {
        const classified = ModelCutoffResolver.classifyArticleTier(m[1], cutoffSortKey);
        if (classified.tier === 'TIER_1_POST_CUTOFF') {
          counts.tier1++;
          selectedArticleLines.push(line);
        } else if (classified.tier === 'TIER_2_BOUNDARY') {
          counts.tier2++;
          if (includeBoundary) selectedArticleLines.push(line);
        } else if (classified.tier === 'TIER_3_FOUNDATION') {
          counts.tier3++;
          if (includeFoundations) selectedArticleLines.push(line);
        }
      }
    }

    const payload = [
      filteredSkillLines.join('\n'),
      selectedArticleLines.length > 0 ? `\n## Dynamically Sliced Reference Vault\n${selectedArticleLines.join('\n')}` : ''
    ].join('\n');

    return { payload, counts };
  }
}

module.exports = { ContextCacheManager };
