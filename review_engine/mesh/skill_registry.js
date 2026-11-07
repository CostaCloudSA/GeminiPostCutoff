/**
 * Dynamic Skill Registry & Topic-Drift Lineage Resolver (v2.1.1)
 * Part of GeminiPostCutoff Architecture Review Engine
 *
 * Eliminates hardcoded skill counts (21 vs 22) and static skill arrays across
 * the review engine, A2A server, CLI, and linters. Automatically discovers any
 * newly split child skills (`split_from`) and binds them to their parent's
 * Review Pod and Audit Batch.
 */

const fs = require('fs');
const path = require('path');

class SkillRegistry {
  static loadRegistry(repoRoot = path.resolve(__dirname, '..', '..')) {
    const regPath = path.join(repoRoot, 'config', 'skill_registry.json');
    if (fs.existsSync(regPath)) {
      try {
        return JSON.parse(fs.readFileSync(regPath, 'utf8'));
      } catch (e) {
        // Fallback to disk scan if malformed
      }
    }
    return { router_skill: 'gcp-skills-index', skills: {} };
  }

  /**
   * Dynamically returns all operational domain skill names on disk
   * (excluding the router skill `gcp-skills-index`).
   */
  static getOperationalSkills(repoRoot = path.resolve(__dirname, '..', '..')) {
    const registry = this.loadRegistry(repoRoot);
    const routerSkill = registry.router_skill || 'gcp-skills-index';
    const skillsDir = path.join(repoRoot, 'skills');

    const diskSkills = fs.existsSync(skillsDir)
      ? fs.readdirSync(skillsDir).filter(name => {
          const full = path.join(skillsDir, name);
          return (
            name !== routerSkill &&
            fs.statSync(full).isDirectory() &&
            fs.existsSync(path.join(full, 'SKILL.md'))
          );
        })
      : Object.keys(registry.skills || {});

    return diskSkills.sort();
  }

  /**
   * Returns the exact count of operational domain skills on disk (currently 22,
   * automatically incrementing as skills are split into child skills).
   */
  static getOperationalSkillCount(repoRoot = path.resolve(__dirname, '..', '..')) {
    return this.getOperationalSkills(repoRoot).length;
  }

  /**
   * Returns all skills assigned to a specific Review Pod (e.g., 'pod_1'),
   * automatically including any child skills whose `split_from` ancestor
   * belongs to that pod.
   */
  static getSkillsForPod(podId, defaultSkills = [], repoRoot = path.resolve(__dirname, '..', '..')) {
    const registry = this.loadRegistry(repoRoot);
    const regSkills = registry.skills || {};
    const resolved = new Set(defaultSkills);

    for (const [skillName, meta] of Object.entries(regSkills)) {
      if (meta.pod_id === podId) {
        resolved.add(skillName);
      } else if (meta.split_from && (resolved.has(meta.split_from) || (regSkills[meta.split_from] && regSkills[meta.split_from].pod_id === podId))) {
        resolved.add(skillName);
      }
    }

    return Array.from(resolved);
  }

  /**
   * Returns grouped audit batches covering 100% of operational skills on disk,
   * including any newly split child skills.
   */
  static getAuditBatches(repoRoot = path.resolve(__dirname, '..', '..')) {
    const registry = this.loadRegistry(repoRoot);
    const regSkills = registry.skills || {};
    const operationalSkills = this.getOperationalSkills(repoRoot);

    const batches = {
      'Batch A': [],
      'Batch B': [],
      'Batch C': [],
      'Batch D': [],
      'Batch E': [],
      'Batch F': []
    };

    for (const skillName of operationalSkills) {
      const meta = regSkills[skillName] || {};
      let targetBatch = meta.audit_batch;

      if (!targetBatch && meta.split_from && regSkills[meta.split_from]) {
        targetBatch = regSkills[meta.split_from].audit_batch;
      }

      if (!targetBatch) {
        targetBatch = 'Batch G (Dynamic / Split Skills)';
      }

      if (!batches[targetBatch]) {
        batches[targetBatch] = [];
      }
      batches[targetBatch].push(skillName);
    }

    return batches;
  }
}

module.exports = { SkillRegistry };
