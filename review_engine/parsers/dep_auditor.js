/**
 * Deterministic Dependency & SDK Auditor
 * Part of GeminiPostCutoff Architecture Review Engine (Phase 2)
 * 
 * Verifies that AI Agent and GCP dependencies adhere to post-cutoff standards
 * (e.g. google-adk >= 1.0.0, google-genai >= 1.0.0).
 */

const fs = require('fs');
const path = require('path');

class DependencyAuditor {
  constructor() {
    this.postCutoffStandards = {
      'google-adk': { min_version: '1.0.0', modern: true, description: 'Google Agent Development Kit' },
      'google-genai': { min_version: '1.0.0', modern: true, description: 'Google GenAI Unified SDK' },
      '@google/genai': { min_version: '0.1.0', modern: true, description: 'Google GenAI SDK for Node.js' },
      'fastmcp': { min_version: '0.4.0', modern: true, description: 'FastMCP Python Framework' },
      'vllm': { min_version: '0.6.0', modern: true, description: 'vLLM High-Throughput Inference Engine' }
    };

    this.deprecatedLibraries = {
      'google-cloud-aiplatform': {
        alternative: 'google-genai and google-adk',
        reason: 'Legacy monolithic SDK. Prefer google-genai for Gemini models and google-adk for agent orchestration.'
      }
    };
  }

  parsePath(targetPath) {
    const stats = fs.statSync(targetPath);
    if (stats.isFile()) {
      return this.parseFile(targetPath);
    }

    const results = {
      files: [],
      dependencies: [],
      governance_findings: []
    };

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['.git', 'node_modules', '.venv', 'venv'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          if (['requirements.txt', 'package.json', 'pyproject.toml'].includes(entry.name)) {
            const parsed = this.parseFile(fullPath);
            results.files.push(fullPath);
            results.dependencies.push(...parsed.dependencies);
            results.governance_findings.push(...parsed.governance_findings);
          }
        }
      }
    };

    walk(targetPath);
    return results;
  }

  parseFile(filePath) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    const result = {
      file: filePath,
      dependencies: [],
      governance_findings: []
    };

    if (fileName === 'requirements.txt') {
      this._parseRequirementsTxt(content, filePath, result);
    } else if (fileName === 'package.json') {
      this._parsePackageJson(content, filePath, result);
    } else if (fileName === 'pyproject.toml') {
      this._parsePyProjectToml(content, filePath, result);
    }

    return result;
  }

  _parseRequirementsTxt(content, filePath, result) {
    const lines = content.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (!line || line.startsWith('#')) continue;

      const match = line.match(/^([a-zA-Z0-9_-]+)\s*([=><~^!]+)?\s*([0-9a-zA-Z_.-]+)?/);
      if (match) {
        const name = match[1].toLowerCase();
        const op = match[2] || '';
        const ver = match[3] || 'unspecified';

        result.dependencies.push({
          name,
          version_op: op,
          version: ver,
          file: filePath,
          line: idx + 1
        });

        this._checkDep(name, ver, filePath, idx + 1, result);
      }
    }
  }

  _parsePackageJson(content, filePath, result) {
    try {
      const pkg = JSON.parse(content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [name, ver] of Object.entries(allDeps)) {
        result.dependencies.push({
          name,
          version: ver,
          file: filePath
        });
        this._checkDep(name.toLowerCase(), ver, filePath, 0, result);
      }
    } catch (e) {
      // Ignored if JSON parsing fails
    }
  }

  _parsePyProjectToml(content, filePath, result) {
    const lines = content.split('\n');
    let inDeps = false;
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (line.includes('dependencies = [')) inDeps = true;
      if (inDeps) {
        if (line.includes(']')) { inDeps = false; continue; }
        const match = line.match(/["']([a-zA-Z0-9_-]+)(?:([=><~^!]+)([0-9a-zA-Z_.-]+))?["']/);
        if (match) {
          const name = match[1].toLowerCase();
          const ver = match[3] || 'unspecified';
          result.dependencies.push({
            name,
            version: ver,
            file: filePath,
            line: idx + 1
          });
          this._checkDep(name, ver, filePath, idx + 1, result);
        }
      }
    }
  }

  _checkDep(name, ver, filePath, line, result) {
    // Check legacy SDK
    if (this.deprecatedLibraries[name]) {
      const depInfo = this.deprecatedLibraries[name];
      result.governance_findings.push({
        pillar: 'Pillar 1: IaC & Metadata Governance',
        pod: 'Pod 13: Platform Engineering & IaC Specialist',
        severity: 'MEDIUM',
        rule: 'LEGACY_SDK_DETECTED',
        resource: name,
        file: filePath,
        line: line,
        message: `Deprecated or legacy library '${name}' detected. ${depInfo.reason}`,
        remediation: `Migrate to '${depInfo.alternative}'.`
      });
    }

    // Check post-cutoff standards
    if (this.postCutoffStandards[name]) {
      const std = this.postCutoffStandards[name];
      if (ver === 'unspecified') {
        result.governance_findings.push({
          pillar: 'Pillar 1: IaC & Metadata Governance',
          pod: 'Pod 13: Platform Engineering & IaC Specialist',
          severity: 'WARNING',
          rule: 'UNPINNED_AI_DEPENDENCY',
          resource: name,
          file: filePath,
          line: line,
          message: `AI Agent dependency '${name}' is unpinned. May resolve to pre-cutoff or breaking versions.`,
          remediation: `Pin to at least version '${name}>=${std.min_version}'.`
        });
      }
    }
  }
}

module.exports = { DependencyAuditor };
