/**
 * Dynamic Model & Cutoff-Relative Tier Resolver
 * Part of GeminiPostCutoff Architecture Review Engine (v2.1)
 *
 * Eliminates hardcoded default models and static markdown tier dependencies.
 * Differentiates between:
 *  - Newest generation models (e.g., Gemini 4 Argon or future models via --cutoff)
 *  - Older generation models (e.g., Gemini 3.8 Flash, Gemini 3.1 Pro)
 *  - Oldest Active Model (--model oldest-active): dynamically selects the earliest
 *    non-deprecated model in config/model_cutoffs.json (currently gemini-3.1-pro)
 *    and automatically shifts forward when older models are marked deprecated.
 *  - Unverified / Unspecified models (Fail-Safe Earliest Active Horizon)
 *
 * Computes Dynamic Cutoff-Relative Tiers using month delta math:
 *  delta_months = (Year_Article - Year_Cutoff) * 12 + (Month_Article - Month_Cutoff)
 *  - TIER_1_POST_CUTOFF: delta_months > 0
 *  - TIER_2_BOUNDARY:    -12 <= delta_months <= 0
 *  - TIER_3_FOUNDATION:  delta_months < -12
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '..', '..', 'config', 'model_cutoffs.json');

class ModelCutoffResolver {
  static loadConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
    return {
      version: '2.1.0',
      unverified_failsafe: {
        policy: 'CONSERVATIVE_EARLIEST_ACTIVE_HORIZON',
        effective_cutoff: '2025-01',
        cutoff_sort_key: 202501,
        generation_status: 'unverified'
      },
      models: {}
    };
  }

  /**
   * Dynamically resolves the oldest active (non-deprecated) model in config/model_cutoffs.json.
   * Currently resolves to gemini-3.1-pro (2025-01). Automatically advances to the next
   * earliest active model when older models are marked lifecycle: "deprecated" or deprecated: true.
   */
  static resolveOldestActiveModel() {
    const config = this.loadConfig();
    const models = config.models || {};
    const activeEntries = Object.entries(models)
      .filter(([_, entry]) => entry.deprecated !== true && entry.lifecycle !== 'deprecated')
      .sort((a, b) => a[1].cutoff_sort_key - b[1].cutoff_sort_key);

    if (activeEntries.length > 0) {
      const [oldestKey, oldestEntry] = activeEntries[0];
      const cutoffSortKey = oldestEntry.cutoff_sort_key;
      const officialCutoff = oldestEntry.official_cutoff;
      const postCutoffStart = this.getPostCutoffStartMMYY(cutoffSortKey);
      const isNewest = oldestEntry.generation_status === 'newest';

      return {
        id: oldestKey,
        requested_model: 'oldest-active',
        display_name: oldestEntry.display_name,
        generation: oldestEntry.generation || 'Gemini',
        generation_status: oldestEntry.generation_status || 'older',
        official_cutoff: officialCutoff,
        cutoff_sort_key: cutoffSortKey,
        post_cutoff_start: postCutoffStart,
        is_verified: true,
        is_newest_generation: isNewest,
        is_oldest_active_model: true,
        active_model_pool_size: activeEntries.length,
        inject_boundary_tier_by_default: !isNewest && cutoffSortKey <= 202501,
        label: `${officialCutoff} (${oldestEntry.display_name} — OLDEST ACTIVE MODEL) [Dynamic Tier 1: >= ${postCutoffStart}]`
      };
    }

    return this.resolve({});
  }

  /**
   * Parses a cutoff string ("2026-03", "03.26", "202603") into { year, month, sortKey, formatted }
   */
  static parseCutoffDate(cutoffInput) {
    if (!cutoffInput) return null;
    const raw = String(cutoffInput).trim();

    // Format 1: YYYY-MM (e.g. "2026-03")
    let m = raw.match(/^(\d{4})-(\d{2})$/);
    if (m) {
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      return {
        year,
        month,
        sortKey: year * 100 + month,
        iso: `${year}-${String(month).padStart(2, '0')}`,
        mmYY: `${String(month).padStart(2, '0')}.${String(year - 2000).padStart(2, '0')}`
      };
    }

    // Format 2: MM.YY (e.g. "03.26")
    m = raw.match(/^(\d{2})\.(\d{2})$/);
    if (m) {
      const month = parseInt(m[1], 10);
      const year = 2000 + parseInt(m[2], 10);
      return {
        year,
        month,
        sortKey: year * 100 + month,
        iso: `${year}-${String(month).padStart(2, '0')}`,
        mmYY: `${String(month).padStart(2, '0')}.${m[2]}`
      };
    }

    // Format 3: YYYYMM integer (e.g. 202603)
    m = raw.match(/^(\d{4})(\d{2})$/);
    if (m) {
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      return {
        year,
        month,
        sortKey: year * 100 + month,
        iso: `${year}-${String(month).padStart(2, '0')}`,
        mmYY: `${String(month).padStart(2, '0')}.${String(year - 2000).padStart(2, '0')}`
      };
    }

    return null;
  }

  /**
   * Parses an article's [MM.YY] tag into { year, month, sortKey }
   */
  static parseArticleMMYY(mmYYStr) {
    if (!mmYYStr) return null;
    const m = String(mmYYStr).trim().match(/^(\d{2})\.(\d{2})$/);
    if (!m) return null;
    const month = parseInt(m[1], 10);
    const year = 2000 + parseInt(m[2], 10);
    return {
      year,
      month,
      sortKey: year * 100 + month
    };
  }

  /**
   * Computes month delta: (Year_A - Year_C) * 12 + (Month_A - Month_C)
   */
  static computeMonthDelta(articleSortKey, cutoffSortKey) {
    const aYear = Math.floor(articleSortKey / 100);
    const aMonth = articleSortKey % 100;
    const cYear = Math.floor(cutoffSortKey / 100);
    const cMonth = cutoffSortKey % 100;
    return (aYear - cYear) * 12 + (aMonth - cMonth);
  }

  /**
   * Dynamically classifies an article's [MM.YY] (or YYYYMM sortKey) relative to a model's cutoffSortKey
   */
  static classifyArticleTier(articleDateOrSortKey, cutoffSortKey) {
    let articleSortKey = typeof articleDateOrSortKey === 'number'
      ? articleDateOrSortKey
      : null;

    if (!articleSortKey) {
      const parsed = this.parseArticleMMYY(articleDateOrSortKey) || this.parseCutoffDate(articleDateOrSortKey);
      if (!parsed) return { tier: 'UNKNOWN', delta_months: null };
      articleSortKey = parsed.sortKey;
    }

    const deltaMonths = this.computeMonthDelta(articleSortKey, cutoffSortKey);
    if (deltaMonths > 0) {
      return {
        tier: 'TIER_1_POST_CUTOFF',
        short_tier: 'Dynamic Tier 1 (Post-Cutoff Delta)',
        delta_months: deltaMonths
      };
    }
    if (deltaMonths >= -12) {
      return {
        tier: 'TIER_2_BOUNDARY',
        short_tier: 'Dynamic Tier 2 (Boundary Window)',
        delta_months: deltaMonths
      };
    }
    return {
      tier: 'TIER_3_FOUNDATION',
      short_tier: 'Dynamic Tier 3 (Timeless Foundation)',
      delta_months: deltaMonths
    };
  }

  /**
   * Formats the post-cutoff threshold (Cutoff + 1 month) as MM.YY
   */
  static getPostCutoffStartMMYY(cutoffSortKey) {
    let year = Math.floor(cutoffSortKey / 100);
    let month = (cutoffSortKey % 100) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    return `${String(month).padStart(2, '0')}.${String(year - 2000).padStart(2, '0')}`;
  }

  /**
   * Resolves a model and/or cutoff specification without assuming a hardcoded default model.
   *
   * @param {Object|string} input - Either a model string or { model, cutoff }
   */
  static resolve(input = {}) {
    const config = this.loadConfig();
    const models = config.models || {};
    const failsafe = config.unverified_failsafe || {
      effective_cutoff: '2025-01',
      cutoff_sort_key: 202501,
      generation_status: 'unverified'
    };

    let rawModel = null;
    let rawCutoff = null;

    if (typeof input === 'string') {
      rawModel = input.trim();
    } else if (input && typeof input === 'object') {
      rawModel = input.model || input.targetModel || process.env.GEMINI_MODEL || null;
      rawCutoff = input.cutoff || input.targetCutoff || process.env.GEMINI_CUTOFF || null;
    }

    if (rawModel) {
      const lower = rawModel.toLowerCase().trim();
      if (lower === 'oldest-active' || lower === 'oldest_active' || lower === 'oldest') {
        return this.resolveOldestActiveModel();
      }
      if (lower === 'unverified' || lower === 'auto' || lower === 'failsafe') {
        rawModel = null;
      }
    }

    const explicitCutoff = this.parseCutoffDate(rawCutoff);

    // 1. Try matching against registered models in config/model_cutoffs.json
    if (rawModel) {
      const normalized = rawModel.toLowerCase().trim();
      for (const [key, entry] of Object.entries(models)) {
        const aliases = (entry.aliases || []).map(a => a.toLowerCase());
        if (
          key.toLowerCase() === normalized ||
          aliases.includes(normalized) ||
          normalized.includes(key.toLowerCase()) ||
          aliases.some(a => a.length >= 3 && normalized.includes(a))
        ) {
          const cutoffSortKey = explicitCutoff ? explicitCutoff.sortKey : entry.cutoff_sort_key;
          const officialCutoff = explicitCutoff ? explicitCutoff.iso : entry.official_cutoff;
          const postCutoffStart = this.getPostCutoffStartMMYY(cutoffSortKey);
          const isNewest = entry.generation_status === 'newest';

          return {
            id: key,
            requested_model: rawModel,
            display_name: entry.display_name,
            generation: entry.generation || 'Gemini',
            generation_status: entry.generation_status || 'older',
            lifecycle: entry.lifecycle || (entry.deprecated ? 'deprecated' : 'active'),
            deprecated: Boolean(entry.deprecated),
            official_cutoff: officialCutoff,
            cutoff_sort_key: cutoffSortKey,
            post_cutoff_start: postCutoffStart,
            is_verified: true,
            is_newest_generation: isNewest,
            inject_boundary_tier_by_default: !isNewest && cutoffSortKey <= 202501,
            label: `${officialCutoff} (${entry.display_name} — ${entry.generation_status.toUpperCase()} Gen) [Dynamic Tier 1: >= ${postCutoffStart}]`
          };
        }
      }

      // 2. Unregistered/Future Model String (e.g. "gemini-4.5-pro" or "gemini-5-ultra")
      const inferredGenMatch = normalized.match(/gemini-(\d+(?:\.\d+)?)/);
      const genNum = inferredGenMatch ? parseFloat(inferredGenMatch[1]) : null;
      const isNewestInferred = genNum !== null ? genNum >= 4.0 : true;
      const cutoffObj = explicitCutoff || this.parseCutoffDate('2026-03');
      const postCutoffStart = this.getPostCutoffStartMMYY(cutoffObj.sortKey);

      return {
        id: normalized,
        requested_model: rawModel,
        display_name: rawModel,
        generation: genNum ? `Gemini ${genNum}` : 'Custom/Future Gemini',
        generation_status: isNewestInferred ? 'newest' : 'older',
        lifecycle: 'active',
        deprecated: false,
        official_cutoff: cutoffObj.iso,
        cutoff_sort_key: cutoffObj.sortKey,
        post_cutoff_start: postCutoffStart,
        is_verified: true,
        is_newest_generation: isNewestInferred,
        inject_boundary_tier_by_default: !isNewestInferred,
        label: `${cutoffObj.iso} (${rawModel} — ${isNewestInferred ? 'NEWEST' : 'OLDER'} Gen) [Dynamic Tier 1: >= ${postCutoffStart}]`
      };
    }

    // 3. Explicit --cutoff provided without a model name
    if (explicitCutoff) {
      const postCutoffStart = this.getPostCutoffStartMMYY(explicitCutoff.sortKey);
      const isNewest = explicitCutoff.sortKey >= 202603;
      return {
        id: `cutoff-${explicitCutoff.iso}`,
        requested_model: `cutoff:${explicitCutoff.iso}`,
        display_name: `Cutoff-Calibrated Model (${explicitCutoff.iso})`,
        generation: 'Cutoff-Calibrated',
        generation_status: isNewest ? 'newest' : 'older',
        lifecycle: 'active',
        deprecated: false,
        official_cutoff: explicitCutoff.iso,
        cutoff_sort_key: explicitCutoff.sortKey,
        post_cutoff_start: postCutoffStart,
        is_verified: true,
        is_newest_generation: isNewest,
        inject_boundary_tier_by_default: !isNewest,
        label: `${explicitCutoff.iso} (Explicit Cutoff Calibration) [Dynamic Tier 1: >= ${postCutoffStart}]`
      };
    }

    // 4. Unverified / Unspecified Model -> Conservative Fail-Safe Horizon (Dynamically tracks oldest active model!)
    const activeEntries = Object.entries(models)
      .filter(([_, entry]) => entry.deprecated !== true && entry.lifecycle !== 'deprecated')
      .sort((a, b) => a[1].cutoff_sort_key - b[1].cutoff_sort_key);

    const earliestCutoffKey = activeEntries.length > 0 ? activeEntries[0][1].cutoff_sort_key : failsafe.cutoff_sort_key;
    const earliestCutoffIso = activeEntries.length > 0 ? activeEntries[0][1].official_cutoff : failsafe.effective_cutoff;
    const postCutoffStart = this.getPostCutoffStartMMYY(earliestCutoffKey);

    return {
      id: 'unverified-failsafe',
      requested_model: 'unverified-failsafe',
      display_name: 'Unverified Model (Conservative Fail-Safe Horizon)',
      generation: 'Unverified',
      generation_status: 'unverified',
      lifecycle: 'active',
      deprecated: false,
      official_cutoff: earliestCutoffIso,
      cutoff_sort_key: earliestCutoffKey,
      post_cutoff_start: postCutoffStart,
      is_verified: false,
      is_newest_generation: false,
      inject_boundary_tier_by_default: true,
      label: `${earliestCutoffIso} (Unverified Model Fail-Safe Horizon) [Dynamic Tier 1: >= ${postCutoffStart}]`
    };
  }
}

module.exports = { ModelCutoffResolver };
