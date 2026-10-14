/**
 * Deterministic Kubernetes / GKE YAML AST Parser (Enhanced Phase 2)
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Supports:
 * - Gateway API vs Ingress
 * - Resource requests and limits
 * - Container Health Probes (liveness/readiness)
 * - OpenTelemetry sidecar / auto-instrumentation checks (Pillar 4)
 * - Privileged container and Agent Sandbox checks
 * - Deterministic Remediation Unified Diffs
 */

const fs = require('fs');
const path = require('path');
const { ModelCutoffResolver } = require('../mesh/model_resolver');

class K8sParser {
  constructor(options = {}) {
    this.requiredLabels = options.requiredLabels || ['environment', 'team'];
    this.modelProfile = ModelCutoffResolver.resolve({
      model: options.targetModel,
      cutoff: options.targetCutoff
    });
    this.targetModel = this.modelProfile.id;
  }

  parsePath(targetPath) {
    const stats = fs.statSync(targetPath);
    if (stats.isFile()) {
      return this.parseFile(targetPath);
    }

    const results = {
      files: [],
      manifests: [],
      workloads: [],
      gateways: [],
      routes: [],
      legacy_ingresses: [],
      inference_workloads: [],
      governance_findings: [],
      model_gaps: [],
      remediation_diffs: []
    };

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['.git', 'node_modules', '.terraform'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          const parsed = this.parseFile(fullPath);
          results.files.push(fullPath);
          results.manifests.push(...parsed.manifests);
          results.workloads.push(...parsed.workloads);
          results.gateways.push(...parsed.gateways);
          results.routes.push(...parsed.routes);
          results.legacy_ingresses.push(...parsed.legacy_ingresses);
          results.inference_workloads.push(...parsed.inference_workloads);
          results.governance_findings.push(...parsed.governance_findings);
          results.model_gaps.push(...parsed.model_gaps);
          results.remediation_diffs.push(...parsed.remediation_diffs);
        }
      }
    };

    walk(targetPath);
    return results;
  }

  parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const docs = content.split(/^---$/m);

    const result = {
      file: filePath,
      manifests: [],
      workloads: [],
      gateways: [],
      routes: [],
      legacy_ingresses: [],
      inference_workloads: [],
      governance_findings: [],
      model_gaps: [],
      remediation_diffs: []
    };

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i].trim();
      if (!doc) continue;

      const manifest = this._parseYamlDocument(doc, filePath, i + 1);
      if (manifest && manifest.kind) {
        result.manifests.push(manifest);
        this._classifyManifest(manifest, result);
      }
    }

    return result;
  }

  _parseYamlDocument(docStr, filePath, docIndex) {
    const manifest = {
      file: filePath,
      doc_index: docIndex,
      apiVersion: '',
      kind: '',
      metadata: { name: '', namespace: 'default', labels: {}, annotations: {} },
      raw: docStr
    };

    const lines = docStr.split('\n');
    let currentSection = '';

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const topMatch = line.match(/^([a-zA-Z0-9]+):\s*(.*)$/);
      if (topMatch && !line.startsWith(' ')) {
        const key = topMatch[1];
        const val = topMatch[2].replace(/["']/g, '').trim();
        if (key === 'apiVersion') manifest.apiVersion = val;
        if (key === 'kind') manifest.kind = val;
        currentSection = key;
        continue;
      }

      if (currentSection === 'metadata') {
        const metaMatch = line.match(/^\s{2}([a-zA-Z0-9]+):\s*(.*)$/);
        if (metaMatch) {
          const subKey = metaMatch[1];
          const subVal = metaMatch[2].replace(/["']/g, '').trim();
          if (subKey === 'name') manifest.metadata.name = subVal;
          if (subKey === 'namespace') manifest.metadata.namespace = subVal;
        }
      }
    }

    return manifest;
  }

  _classifyManifest(manifest, result) {
    const kind = manifest.kind;
    const raw = manifest.raw;

    // 1. Gateway API vs Ingress
    if (kind === 'Ingress') {
      result.legacy_ingresses.push(manifest);
      result.governance_findings.push({
        pillar: 'Pillar 1: IaC & Metadata Governance',
        pod: 'Pod 1: GKE Specialist Pod',
        severity: 'HIGH_RISK',
        rule: 'LEGACY_K8S_INGRESS_DETECTED',
        resource: `${kind}/${manifest.metadata.name}`,
        file: manifest.file,
        message: `Legacy Kubernetes Ingress resource detected ('${manifest.metadata.name}'). GKE Gateway API is GA and strongly recommended.`,
        remediation: `Migrate to GKE Gateway API ('gateway.networking.k8s.io/v1' Gateway & HTTPRoute).`
      });
      result.remediation_diffs.push({
        rule: 'LEGACY_K8S_INGRESS_DETECTED',
        target_file: manifest.file,
        diff: `- apiVersion: networking.k8s.io/v1\n- kind: Ingress\n+ apiVersion: gateway.networking.k8s.io/v1\n+ kind: Gateway\n+ spec:\n+   gatewayClassName: gke-l7-global-external-managed`
      });

      const gwTier = ModelCutoffResolver.classifyArticleTier('10.25', this.modelProfile.cutoff_sort_key);
      if (gwTier.tier === 'TIER_1_POST_CUTOFF') {
        result.model_gaps.push({
          topic: 'GKE Gateway API GA & Inference Gateway [10.25]',
          tier: gwTier.short_tier,
          context: `Model cutoff (${this.modelProfile.official_cutoff}) predates GKE Inference Gateway body-based routing and ingress-nginx retirement.`
        });
      }
    } else if (kind === 'Gateway') {
      result.gateways.push(manifest);
    } else if (kind === 'HTTPRoute' || kind === 'GRPCRoute') {
      result.routes.push(manifest);
    }

    // 2. Workload Checks
    if (['Deployment', 'StatefulSet', 'DaemonSet', 'Job'].includes(kind)) {
      result.workloads.push(manifest);

      // Bounds check
      const hasRequests = raw.includes('requests:');
      const hasLimits = raw.includes('limits:');
      if (!hasRequests || !hasLimits) {
        result.governance_findings.push({
          pillar: 'Pillar 3: Compute FinOps & Workload Sizing',
          pod: 'Pod 1: GKE Specialist Pod & Pod 5: Compute FinOps',
          severity: 'HIGH_RISK',
          rule: 'MISSING_POD_RESOURCE_BOUNDS',
          resource: `${kind}/${manifest.metadata.name}`,
          file: manifest.file,
          message: `Workload '${manifest.metadata.name}' lacks CPU/Memory requests or limits.`,
          remediation: `Define 'resources.requests' and 'resources.limits'.`
        });
        result.remediation_diffs.push({
          rule: 'MISSING_POD_RESOURCE_BOUNDS',
          target_file: manifest.file,
          diff: `+         resources:\n+           requests:\n+             cpu: "500m"\n+             memory: "1Gi"\n+           limits:\n+             cpu: "2"\n+             memory: "4Gi"`
        });
      }

      // Health Probes check (Pillar 1: Reliability)
      const hasLiveness = raw.includes('livenessProbe:');
      const hasReadiness = raw.includes('readinessProbe:');
      if (!hasLiveness || !hasReadiness) {
        result.governance_findings.push({
          pillar: 'Pillar 1: IaC & Metadata Governance',
          pod: 'Pod 1: GKE Specialist Pod',
          severity: 'MEDIUM',
          rule: 'MISSING_CONTAINER_HEALTH_PROBES',
          resource: `${kind}/${manifest.metadata.name}`,
          file: manifest.file,
          message: `Workload '${manifest.metadata.name}' is missing liveness or readiness probes. Failed containers will not be automatically restarted.`,
          remediation: `Configure 'livenessProbe' and 'readinessProbe' with HTTP or exec checks.`
        });
      }

      // OpenTelemetry / Observability check (Pillar 4: Observability)
      const hasOtel = raw.includes('opentelemetry.io') || raw.includes('otel') || raw.includes('cloud.google.com/trace');
      if (!hasOtel) {
        result.governance_findings.push({
          pillar: 'Pillar 4: Observability & Telemetry',
          pod: 'Pod 1: GKE Specialist Pod',
          severity: 'RECOMMENDATION',
          rule: 'WORKLOAD_MISSING_OPENTELEMETRY',
          resource: `${kind}/${manifest.metadata.name}`,
          file: manifest.file,
          message: `Workload '${manifest.metadata.name}' lacks OpenTelemetry auto-instrumentation annotations.`,
          remediation: `Add annotation 'instrumentation.opentelemetry.io/inject-python: "true"' or configure Cloud Trace sidecar.`
        });
      }

      // GPU & Kueue Check
      const isLLM = raw.includes('vllm') || raw.includes('tgi') || raw.includes('ollama') || raw.includes('nvidia.com/gpu');
      if (isLLM) {
        result.inference_workloads.push(manifest);
        if (!raw.includes('kueue.x-k8s.io') && !raw.includes('queue-name')) {
          result.governance_findings.push({
            pillar: 'Pillar 3: Compute FinOps & Workload Sizing',
            pod: 'Pod 1: GKE Specialist Pod (LLM Inference)',
            severity: 'RECOMMENDATION',
            rule: 'GPU_WORKLOAD_WITHOUT_KUEUE',
            resource: `${kind}/${manifest.metadata.name}`,
            file: manifest.file,
            message: `GPU / LLM workload '${manifest.metadata.name}' is missing Kueue batch queuing.`,
            remediation: `Attach label 'kueue.x-k8s.io/queue-name: "inference-queue"'.`
          });
        }
      }

      // Privileged container check
      if (raw.includes('privileged: true')) {
        result.governance_findings.push({
          pillar: 'Pillar 2: Zero-Trust Security & Hardening',
          pod: 'Pod 6: Security Hardening & Zero-Trust Pod',
          severity: 'CRITICAL',
          rule: 'PRIVILEGED_CONTAINER_DETECTED',
          resource: `${kind}/${manifest.metadata.name}`,
          file: manifest.file,
          message: `Workload '${manifest.metadata.name}' executes in privileged mode.`,
          remediation: `Eliminate 'privileged: true' and enforce non-root execution.`
        });
        result.remediation_diffs.push({
          rule: 'PRIVILEGED_CONTAINER_DETECTED',
          target_file: manifest.file,
          diff: `-         securityContext:\n-           privileged: true\n+         securityContext:\n+           allowPrivilegeEscalation: false\n+           runAsNonRoot: true`
        });
      }
    }
  }
}

module.exports = { K8sParser };
