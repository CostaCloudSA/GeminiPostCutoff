/**
 * Deterministic Terraform / HCL AST Parser (Enhanced Phase 2)
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Supports:
 * - 4 Hub Governance Pillars
 * - Code annotation & metadata validation
 * - Post-cutoff architecture traps (Direct VPC Egress, BigQuery Partitioning, Private GKE)
 * - Enhanced Multi-Cloud & Storage URI detection
 * - Model Cutoff Gap Tagging (Flash 3.8 vs Pro 3.1)
 * - Deterministic Remediation Unified Diff generation
 */

const fs = require('fs');
const path = require('path');
const { ModelCutoffResolver } = require('../mesh/model_resolver');

class HclParser {
  constructor(options = {}) {
    this.requiredLabels = options.requiredLabels || ['environment', 'team', 'managed_by'];
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
      providers: [],
      resources: [],
      data_sources: [],
      modules: [],
      variables: [],
      outputs: [],
      backend: null,
      multi_cloud: {
        detected: false,
        providers: [],
        resources: [],
        storage_uris: [],
        connection_strings: [],
        trigger_pod: null
      },
      governance_findings: [],
      model_gaps: [],
      remediation_diffs: []
    };

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['.git', '.terraform', 'node_modules'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith('.tf') || entry.name.endsWith('.tfvars'))) {
          const parsed = this.parseFile(fullPath);
          results.files.push(fullPath);
          results.providers.push(...parsed.providers);
          results.resources.push(...parsed.resources);
          results.data_sources.push(...parsed.data_sources);
          results.modules.push(...parsed.modules);
          results.variables.push(...parsed.variables);
          results.outputs.push(...parsed.outputs);
          if (parsed.backend) results.backend = parsed.backend;
          results.governance_findings.push(...parsed.governance_findings);
          results.model_gaps.push(...parsed.model_gaps);
          results.remediation_diffs.push(...parsed.remediation_diffs);

          if (parsed.multi_cloud.detected) {
            results.multi_cloud.detected = true;
            for (const p of parsed.multi_cloud.providers) {
              if (!results.multi_cloud.providers.includes(p)) results.multi_cloud.providers.push(p);
            }
            results.multi_cloud.resources.push(...parsed.multi_cloud.resources);
            results.multi_cloud.storage_uris.push(...parsed.multi_cloud.storage_uris);
            results.multi_cloud.connection_strings.push(...parsed.multi_cloud.connection_strings);
          }
        }
      }
    };

    walk(targetPath);
    if (results.multi_cloud.detected) {
      results.multi_cloud.trigger_pod = 'Pod 12: Cross-Cloud Modernization & Migration Pod (gcp-migrations)';
    }

    return results;
  }

  parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    const result = {
      file: filePath,
      providers: [],
      resources: [],
      data_sources: [],
      modules: [],
      variables: [],
      outputs: [],
      backend: null,
      multi_cloud: {
        detected: false,
        providers: [],
        resources: [],
        storage_uris: [],
        connection_strings: []
      },
      governance_findings: [],
      model_gaps: [],
      remediation_diffs: []
    };

    // Extract blocks
    this._extractBackend(content, filePath, result);
    this._extractProviders(content, filePath, result);
    this._extractResources(content, filePath, result);
    this._extractDataSources(content, filePath, result);
    this._extractModules(content, filePath, result);
    this._extractVariables(content, filePath, result);
    this._extractOutputs(content, filePath, result);

    // Scan for storage URIs (s3://, wasbs://, abfss://)
    const uriRegex = /(s3:\/\/[a-zA-Z0-9.\-_]+|wasbs?:\/\/[a-zA-Z0-9.\-_@]+|abfss?:\/\/[a-zA-Z0-9.\-_@]+)/g;
    let uriMatch;
    while ((uriMatch = uriRegex.exec(content)) !== null) {
      result.multi_cloud.detected = true;
      result.multi_cloud.storage_uris.push({
        uri: uriMatch[1],
        file: filePath,
        line: content.substring(0, uriMatch.index).split('\n').length
      });
      if (uriMatch[1].startsWith('s3://') && !result.multi_cloud.providers.includes('aws')) {
        result.multi_cloud.providers.push('aws');
      } else if (!result.multi_cloud.providers.includes('azure')) {
        result.multi_cloud.providers.push('azure');
      }
    }

    // Scan for foreign connection strings / dialects
    const connRegex = /(snowflake:\/\/|jdbc:redshift:\/\/|jdbc:oracle:thin|databricks-instance)/g;
    let connMatch;
    while ((connMatch = connRegex.exec(content)) !== null) {
      result.multi_cloud.detected = true;
      result.multi_cloud.connection_strings.push({
        match: connMatch[1],
        file: filePath,
        line: content.substring(0, connMatch.index).split('\n').length
      });
    }

    // Run deep governance & trap audit
    this._auditGovernance(result, content);

    return result;
  }

  _extractBackend(content, filePath, result) {
    const backendRegex = /backend\s+"([^"]+)"\s*\{([^}]*)\}/gs;
    let match;
    while ((match = backendRegex.exec(content)) !== null) {
      result.backend = {
        type: match[1],
        body: match[2].trim(),
        file: filePath,
        line: content.substring(0, match.index).split('\n').length
      };
    }
  }

  _extractProviders(content, filePath, result) {
    const providerRegex = /provider\s+"([^"]+)"\s*\{([^}]*)\}/gs;
    let match;
    while ((match = providerRegex.exec(content)) !== null) {
      const provName = match[1];
      result.providers.push({
        name: provName,
        raw_body: match[2].trim(),
        file: filePath
      });
      if (['aws', 'azurerm', 'azuread', 'snowflake', 'databricks', 'alicloud', 'oci'].includes(provName.toLowerCase())) {
        result.multi_cloud.detected = true;
        if (!result.multi_cloud.providers.includes(provName)) result.multi_cloud.providers.push(provName);
      }
    }

    const reqProvRegex = /([a-zA-Z0-9_-]+)\s*=\s*\{\s*source\s*=\s*"([^"]+)"(?:\s*,\s*version\s*=\s*"([^"]+)")?/g;
    while ((match = reqProvRegex.exec(content)) !== null) {
      const alias = match[1];
      const source = match[2];
      if (source.includes('aws') || source.includes('azurerm') || source.includes('snowflake') || source.includes('databricks')) {
        result.multi_cloud.detected = true;
        if (!result.multi_cloud.providers.includes(alias)) result.multi_cloud.providers.push(alias);
      }
    }
  }

  _extractResources(content, filePath, result) {
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;
    let match;
    while ((match = resourceRegex.exec(content)) !== null) {
      const resType = match[1];
      const resName = match[2];
      const startIndex = match.index;
      const startLine = content.substring(0, startIndex).split('\n').length;
      const body = this._extractBlockBody(content, match.index + match[0].length - 1);

      const resObj = {
        type: resType,
        name: resName,
        start_line: startLine,
        file: filePath,
        raw_body: body
      };
      result.resources.push(resObj);

      const prefix = resType.split('_')[0].toLowerCase();
      if (['aws', 'azurerm', 'snowflake', 'databricks', 'alicloud', 'oci'].includes(prefix)) {
        result.multi_cloud.detected = true;
        result.multi_cloud.resources.push({
          type: resType,
          name: resName,
          line: startLine,
          file: filePath
        });
        if (!result.multi_cloud.providers.includes(prefix)) result.multi_cloud.providers.push(prefix);
      }
    }
  }

  _extractDataSources(content, filePath, result) {
    const dataRegex = /data\s+"([^"]+)"\s+"([^"]+)"\s*\{/g;
    let match;
    while ((match = dataRegex.exec(content)) !== null) {
      result.data_sources.push({
        type: match[1],
        name: match[2],
        file: filePath,
        start_line: content.substring(0, match.index).split('\n').length
      });
    }
  }

  _extractModules(content, filePath, result) {
    const modRegex = /module\s+"([^"]+)"\s*\{/g;
    let match;
    while ((match = modRegex.exec(content)) !== null) {
      result.modules.push({
        name: match[1],
        file: filePath,
        start_line: content.substring(0, match.index).split('\n').length
      });
    }
  }

  _extractVariables(content, filePath, result) {
    const varRegex = /variable\s+"([^"]+)"\s*\{([^}]*)\}/gs;
    let match;
    while ((match = varRegex.exec(content)) !== null) {
      const varName = match[1];
      const body = match[2];
      const hasDesc = body.includes('description');
      const startLine = content.substring(0, match.index).split('\n').length;
      result.variables.push({
        name: varName,
        file: filePath,
        start_line: startLine,
        has_description: hasDesc
      });
    }
  }

  _extractOutputs(content, filePath, result) {
    const outRegex = /output\s+"([^"]+)"\s*\{([^}]*)\}/gs;
    let match;
    while ((match = outRegex.exec(content)) !== null) {
      const outName = match[1];
      const body = match[2];
      const hasDesc = body.includes('description');
      const startLine = content.substring(0, match.index).split('\n').length;
      result.outputs.push({
        name: outName,
        file: filePath,
        start_line: startLine,
        has_description: hasDesc
      });
    }
  }

  _extractBlockBody(content, openBraceIndex) {
    let depth = 0;
    for (let i = openBraceIndex; i < content.length; i++) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') {
        depth--;
        if (depth === 0) {
          return content.substring(openBraceIndex + 1, i);
        }
      }
    }
    return content.substring(openBraceIndex + 1);
  }

  _auditGovernance(result, content) {
    // 1. Remote State Locking & Backend Audit (Pillar 1: IaC Governance)
    if (!result.backend && (result.resources.length > 0 || result.modules.length > 0)) {
      result.governance_findings.push({
        pillar: 'Pillar 1: IaC & Metadata Governance',
        pod: 'Pod 13: Platform Engineering & IaC Specialist',
        severity: 'MEDIUM',
        rule: 'MISSING_REMOTE_BACKEND_STATE_LOCKING',
        resource: 'terraform.backend',
        file: result.file,
        line: 1,
        message: 'No remote Terraform backend (e.g. backend "gcs") declared. Local state files risk state corruption during team or agent collaboration.',
        remediation: 'Configure a remote GCS backend with state locking and bucket versioning.'
      });
      result.remediation_diffs.push({
        rule: 'MISSING_REMOTE_BACKEND_STATE_LOCKING',
        target_file: result.file,
        diff: `+ terraform {\n+   backend "gcs" {\n+     bucket = "my-prod-tfstate"\n+     prefix = "terraform/state"\n+   }\n+ }`
      });
    }

    // 2. Variable & Output Description Checks (Platform Engineering Standards)
    for (const v of result.variables) {
      if (!v.has_description) {
        result.governance_findings.push({
          pillar: 'Pillar 1: IaC & Metadata Governance',
          pod: 'Pod 13: Platform Engineering & IaC Specialist',
          severity: 'LOW',
          rule: 'VARIABLE_MISSING_DESCRIPTION',
          resource: `variable.${v.name}`,
          file: v.file,
          line: v.start_line,
          message: `Variable '${v.name}' lacks a 'description' attribute. Undocumented variables impede automated review and platform maintainability.`,
          remediation: `Add 'description = "Purpose of this variable"'.`
        });
      }
    }

    for (const out of result.outputs) {
      if (!out.has_description) {
        result.governance_findings.push({
          pillar: 'Pillar 1: IaC & Metadata Governance',
          pod: 'Pod 13: Platform Engineering & IaC Specialist',
          severity: 'LOW',
          rule: 'OUTPUT_MISSING_DESCRIPTION',
          resource: `output.${out.name}`,
          file: out.file,
          line: out.start_line,
          message: `Output '${out.name}' lacks a 'description' attribute.`,
          remediation: `Add 'description = "Explanation of exported value"'.`
        });
      }
    }

    // 3. Resource Traps & Architecture Violations
    for (const res of result.resources) {
      // A. Authoritative IAM Overwrite Check
      if (res.type.includes('_iam_policy') || res.type.includes('_iam_binding')) {
        const additiveType = res.type.replace(/_iam_(policy|binding)$/, '_iam_member');
        result.governance_findings.push({
          pillar: 'Pillar 2: Zero-Trust Security & Hardening',
          pod: 'Pod 13: Platform Engineering & IaC Specialist',
          severity: 'HIGH_RISK',
          rule: 'ANTI_PATTERN_AUTHORITATIVE_IAM',
          resource: `${res.type}.${res.name}`,
          file: res.file,
          line: res.start_line,
          message: `Authoritative IAM resource '${res.type}' wipes existing IAM bindings on the resource.`,
          remediation: `Migrate to additive '${additiveType}'.`
        });
        result.remediation_diffs.push({
          rule: 'ANTI_PATTERN_AUTHORITATIVE_IAM',
          target_file: res.file,
          diff: `- resource "${res.type}" "${res.name}" {\n+ resource "${additiveType}" "${res.name}" {\n+   member = "user:example@domain.com"\n  }`
        });
      }

      // B. Static Service Account Key
      if (res.type === 'google_service_account_key') {
        result.governance_findings.push({
          pillar: 'Pillar 2: Zero-Trust Security & Hardening',
          pod: 'Pod 6: Security Hardening & Zero-Trust Pod',
          severity: 'CRITICAL',
          rule: 'STATIC_SERVICE_ACCOUNT_KEY_DETECTED',
          resource: `${res.type}.${res.name}`,
          file: res.file,
          line: res.start_line,
          message: `Static JSON service account key generation detected. Violates zero-trust guidelines.`,
          remediation: `Eliminate key. Authenticate via Workload Identity Federation (WIF).`
        });
      }

      // C. Deprecated Serverless VPC Access Connector (Post-Cutoff Trap)
      if (res.type === 'google_vpc_access_connector') {
        result.governance_findings.push({
          pillar: 'Pillar 3: Compute FinOps & Workload Sizing',
          pod: 'Pod 7: Cloud Networking & Connectivity Pod',
          severity: 'HIGH_RISK',
          rule: 'DEPRECATED_SERVERLESS_VPC_CONNECTOR',
          resource: `${res.type}.${res.name}`,
          file: res.file,
          line: res.start_line,
          message: `Legacy Serverless VPC Access connector detected. Incurs minimum 2-VM idle charges ($35+/mo) and introduces 100Mbps egress bottlenecks.`,
          remediation: `Decommission connector and migrate to Cloud Run Direct VPC Egress ('vpc_access.network_interfaces').`
        });
        // Dynamic Cutoff-Relative Gap Detection
        const vpcTier = ModelCutoffResolver.classifyArticleTier('05.25', this.modelProfile.cutoff_sort_key);
        if (vpcTier.tier === 'TIER_1_POST_CUTOFF') {
          result.model_gaps.push({
            topic: 'Cloud Run Direct VPC Egress (GA mid-2025) [05.25]',
            tier: vpcTier.short_tier,
            context: `Model cutoff (${this.modelProfile.official_cutoff}) predates GA of Direct VPC Egress without connector VMs.`
          });
        }
      }

      // D. Cloud Run CPU Throttling on Async / Worker
      if (res.type === 'google_cloud_run_v2_service') {
        const body = res.raw_body;
        if (body.includes('cpu_idle = true') || (!body.includes('cpu_idle = false') && (body.includes('worker') || body.includes('async') || body.includes('pubsub')))) {
          result.governance_findings.push({
            pillar: 'Pillar 3: Compute FinOps & Workload Sizing',
            pod: 'Pod 2: Cloud Run Serverless Pod',
            severity: 'WARNING',
            rule: 'CLOUD_RUN_CPU_THROTTLING_RISK',
            resource: `${res.type}.${res.name}`,
            file: res.file,
            line: res.start_line,
            message: `Cloud Run background worker has CPU throttling active ('cpu_idle = true'). Execution freezes between HTTP invocations.`,
            remediation: `Set 'template.scaling.cpu_idle = false' to allocate continuous CPU for background tasks.`
          });
          result.remediation_diffs.push({
            rule: 'CLOUD_RUN_CPU_THROTTLING_RISK',
            target_file: res.file,
            diff: `-     cpu_idle = true\n+     cpu_idle = false  # Allocate CPU continuously for background processing`
          });
        }

        // Public Unauthenticated Ingress Check
        if (body.includes('allUsers') || body.includes('roles/run.invoker')) {
          result.governance_findings.push({
            pillar: 'Pillar 2: Zero-Trust Security & Hardening',
            pod: 'Pod 6: Security Hardening & Zero-Trust Pod',
            severity: 'HIGH_RISK',
            rule: 'CLOUD_RUN_PUBLIC_UNAUTHENTICATED_INGRESS',
            resource: `${res.type}.${res.name}`,
            file: res.file,
            line: res.start_line,
            message: `Cloud Run service permits unauthenticated public invocation ('allUsers') without edge perimeter sanitization.`,
            remediation: `Place behind Cloud Armor / API Gateway or wrap endpoints with Google Model Armor.`
          });
        }
      }

      // E. GKE Cluster: Dataplane V2 & Private Endpoints
      if (res.type === 'google_container_cluster') {
        const body = res.raw_body;
        if (!body.includes('datapath_provider') || body.includes('DATAPATH_PROVIDER_UNSPECIFIED')) {
          result.governance_findings.push({
            pillar: 'Pillar 2: Zero-Trust Security & Hardening',
            pod: 'Pod 1: GKE Specialist Pod',
            severity: 'RECOMMENDATION',
            rule: 'GKE_MISSING_DATAPLANE_V2',
            resource: `${res.type}.${res.name}`,
            file: res.file,
            line: res.start_line,
            message: `GKE cluster '${res.name}' is missing Dataplane V2 (eBPF). Required for Cilium network policies and zero-overhead routing.`,
            remediation: `Add 'datapath_provider = "ADVANCED_DATAPATH"'.`
          });
          result.remediation_diffs.push({
            rule: 'GKE_MISSING_DATAPLANE_V2',
            target_file: res.file,
            diff: `+   datapath_provider = "ADVANCED_DATAPATH"  # Enable Dataplane V2 (eBPF)`
          });
        }

        if (!body.includes('private_cluster_config') || body.includes('enable_private_endpoint = false')) {
          result.governance_findings.push({
            pillar: 'Pillar 2: Zero-Trust Security & Hardening',
            pod: 'Pod 6: Security Hardening & Zero-Trust Pod',
            severity: 'HIGH_RISK',
            rule: 'GKE_PUBLIC_MASTER_ENDPOINT',
            resource: `${res.type}.${res.name}`,
            file: res.file,
            line: res.start_line,
            message: `GKE cluster '${res.name}' exposes Kubernetes API server to public internet.`,
            remediation: `Configure 'private_cluster_config { enable_private_endpoint = true, enable_private_nodes = true }'.`
          });
        }

        // Observability check on GKE (Pillar 4)
        if (!body.includes('logging_config') && !body.includes('monitoring_config')) {
          result.governance_findings.push({
            pillar: 'Pillar 4: Observability & Telemetry',
            pod: 'Pod 1: GKE Specialist Pod',
            severity: 'RECOMMENDATION',
            rule: 'GKE_MISSING_MANAGED_OBSERVABILITY',
            resource: `${res.type}.${res.name}`,
            file: res.file,
            line: res.start_line,
            message: `GKE cluster '${res.name}' lacks managed logging and Cloud Monitoring telemetry configuration.`,
            remediation: `Configure 'logging_config { enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"] }' and Google Cloud Managed Service for Prometheus.`
          });
        }
      }

      // F. BigQuery Partitioning & Clustering (Pillar 3 FinOps)
      if (res.type === 'google_bigquery_table') {
        const body = res.raw_body;
        if (!body.includes('time_partitioning') && !body.includes('range_partitioning')) {
          result.governance_findings.push({
            pillar: 'Pillar 3: Compute FinOps & Workload Sizing',
            pod: 'Pod 4: Unified BigQuery & Modern Data Pod',
            severity: 'HIGH_RISK',
            rule: 'BIGQUERY_UNPARTITIONED_TABLE',
            resource: `${res.type}.${res.name}`,
            file: res.file,
            line: res.start_line,
            message: `BigQuery table '${res.name}' lacks partitioning. Analytical queries will perform expensive full table scans.`,
            remediation: `Define 'time_partitioning { type = "DAY", field = "created_at" }' and configure clustering keys.`
          });
        }
      }

      // G. Observability Log Sinks (Pillar 4)
      if (res.type === 'google_logging_project_sink') {
        const body = res.raw_body;
        if (!body.includes('exclusions')) {
          result.governance_findings.push({
            pillar: 'Pillar 4: Observability & Telemetry',
            pod: 'Pod 5: GCP Compute FinOps Pod',
            severity: 'WARNING',
            rule: 'LOG_SINK_MISSING_EXCLUSION_FILTERS',
            resource: `${res.type}.${res.name}`,
            file: res.file,
            line: res.start_line,
            message: `Log sink '${res.name}' has no exclusion filters configured. High-volume HTTP health checks or debug traces may incur runaway logging ingestion fees.`,
            remediation: `Add 'exclusions { name = "health-checks", filter = "httpRequest.status = 200 AND httpRequest.requestUrl =~ \'/healthz\'" }'.`
          });
        }
      }

      // H. Resource Labeling Check (Pillar 1)
      const labelableTypes = [
        'google_compute_instance',
        'google_container_cluster',
        'google_cloud_run_v2_service',
        'google_bigquery_dataset',
        'google_storage_bucket',
        'google_sql_database_instance'
      ];

      if (labelableTypes.includes(res.type)) {
        if (!res.raw_body.includes('labels =')) {
          result.governance_findings.push({
            pillar: 'Pillar 1: IaC & Metadata Governance',
            pod: 'Pod 13: Platform Engineering & IaC Specialist',
            severity: 'MEDIUM',
            rule: 'MISSING_RESOURCE_LABELS',
            resource: `${res.type}.${res.name}`,
            file: res.file,
            line: res.start_line,
            message: `Resource '${res.type}.${res.name}' is missing mandatory operational and FinOps labels (${this.requiredLabels.join(', ')}).`,
            remediation: `Add 'labels = { environment = "prod", team = "platform", managed_by = "terraform" }'.`
          });
          result.remediation_diffs.push({
            rule: 'MISSING_RESOURCE_LABELS',
            target_file: res.file,
            diff: `+   labels = {\n+     environment = "prod"\n+     team        = "platform"\n+     managed_by  = "terraform"\n+   }`
          });
        }
      }
    }
  }
}

module.exports = { HclParser };
