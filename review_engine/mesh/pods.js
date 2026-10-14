/**
 * 13 Specialized Architectural Review Pods
 * Part of GeminiPostCutoff Architecture Review Engine (Phase 3)
 * 
 * Maps the 21 GCP & AI Agent runbooks into 13 specialized domain pods
 * with adversarial critique capabilities and post-cutoff knowledge grounding.
 */

const fs = require('fs');
const path = require('path');

class BasePod {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.skills = config.skills || [];
    this.repoRoot = config.repoRoot || path.resolve(__dirname, '../..');
  }

  loadRunbookKnowledge() {
    let knowledge = '';
    for (const skillName of this.skills) {
      const skillPath = path.join(this.repoRoot, 'skills', skillName, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        knowledge += `\n--- RUNBOOK: ${skillName} ---\n` + fs.readFileSync(skillPath, 'utf8') + '\n';
      }
    }
    return knowledge;
  }
}

class GkeSpecialistPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_1',
      name: 'Pod 1: GKE Specialist Pod',
      skills: ['gcp-gke-platform', 'gcp-gke-inference', 'gcp-gke-cost'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const k8s = inventory.kubernetes || {};
    const tf = inventory.terraform || {};
    const findings = governanceFindings.filter(f => f.pod && f.pod.includes('Pod 1'));

    const recommendations = [];

    // Check for Gateway API migration
    if (k8s.legacy_ingresses && k8s.legacy_ingresses.length > 0) {
      recommendations.push({
        title: 'Migrate Legacy Ingress to GKE Gateway API with Multi-Cluster Routing',
        tier: 'Tier 1A',
        priority: 'HIGH',
        details: 'Legacy Ingress controllers bottleneck cross-cluster failover and lack native HTTPRoute traffic splitting. Migrate to Gateway API (gateway.networking.k8s.io/v1) backed by Dataplane V2.',
        canonical_url: 'https://cloud.google.com/kubernetes-engine/docs/concepts/gateway-api'
      });
    }

    // Check for LLM serving & Inference Gateway
    if (k8s.inference_workloads && k8s.inference_workloads.length > 0) {
      recommendations.push({
        title: 'Deploy GKE Inference Gateway with Body-Based Routing for vLLM Workloads',
        tier: 'Tier 1A [>= 04.26]',
        priority: 'HIGH',
        details: 'For GPU/vLLM inference workloads, configure GKE Inference Gateway with body-based model routing and Kueue fair-sharing batch queues to eliminate GPU idle starvation.',
        canonical_url: 'https://cloud.google.com/blog/products/containers-kubernetes/introducing-gke-inference-gateway'
      });
    }

    // Dataplane V2 check
    const hasClusters = tf.resources && tf.resources.some(r => r.type === 'google_container_cluster');
    if (hasClusters) {
      recommendations.push({
        title: 'Enforce GKE Dataplane V2 (eBPF) and Pod Security Standards',
        tier: 'Tier 1B',
        priority: 'MEDIUM',
        details: 'Ensure all clusters specify datapath_provider = "ADVANCED_DATAPATH" for eBPF routing, network policy enforcement, and zero-touch OpenTelemetry.',
        canonical_url: 'https://cloud.google.com/kubernetes-engine/docs/concepts/dataplane-v2'
      });
    }

    return {
      pod_id: this.id,
      name: this.name,
      findings_addressed: findings.length,
      recommendations,
      status: 'COMPLETED'
    };
  }

  critiqueFinOps(computeFinOpsOutput) {
    return {
      reviewer: this.name,
      target: 'Pod 5: GCP Compute FinOps Pod',
      critique: 'Compute FinOps suggests Spot VMs for GKE worker nodes. Caution: GPU inference workloads (vLLM) serving real-time requests must not run on Spot VMs without active failover to on-demand reservations, or latency spikes will breach SLA.'
    };
  }
}

class CloudRunServerlessPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_2',
      name: 'Pod 2: Cloud Run Serverless Pod',
      skills: ['gcp-cloud-run'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const tf = inventory.terraform || {};
    const findings = governanceFindings.filter(f => f.pod && f.pod.includes('Pod 2'));
    const recommendations = [];

    const runServices = (tf.resources || []).filter(r => r.type.includes('cloud_run'));

    if (runServices.length > 0) {
      recommendations.push({
        title: 'Adopt Cloud Run Direct VPC Egress and Decommission Serverless Access Connectors',
        tier: 'Tier 1A [>= 04.26]',
        priority: 'HIGH',
        details: 'Direct VPC Egress routes Cloud Run traffic directly through VPC subnets without connector VMs, eliminating 2-VM idle fees and removing throughput bottlenecks.',
        canonical_url: 'https://cloud.google.com/run/docs/configuring/vpc-direct-vpc'
      });

      recommendations.push({
        title: 'Configure Continuous CPU Allocation for Background Workers',
        tier: 'Tier 1B',
        priority: 'CRITICAL',
        details: 'Cloud Run instances handling Pub/Sub push, asynchronous queues, or WebSockets must set cpu_idle = false (--no-cpu-throttling) to avoid process freezing between requests.',
        canonical_url: 'https://cloud.google.com/run/docs/configuring/cpu-allocation'
      });
    }

    return {
      pod_id: this.id,
      name: this.name,
      findings_addressed: findings.length,
      recommendations,
      status: 'COMPLETED'
    };
  }

  // Workload Arbitration: Cloud Run critiques Pub/Sub
  arbitratePubSub(pubsubInventory) {
    return {
      reviewer: this.name,
      target: 'Pod 3: Event-Driven & Pub/Sub Pod',
      arbitration_type: 'WORKLOAD_ARBITRATION_CRITIQUE',
      recommendation: 'Evaluate Pub/Sub queue overhead. If message ingestion is purely point-to-point synchronous RPC between two Cloud Run services within the same region, replace Pub/Sub with direct authenticated HTTP invocations over Direct VPC Egress to eliminate message latency and Pub/Sub ingestion costs.'
    };
  }
}

class PubSubEventDrivenPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_3',
      name: 'Pod 3: Event-Driven & Pub/Sub Pod',
      skills: ['gcp-pubsub'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const tf = inventory.terraform || {};
    const recommendations = [];

    recommendations.push({
      title: 'Decouple Ingestion Spikes with In-Flight Single Message Transformations (SMTs)',
      tier: 'Tier 1A [>= 04.26]',
      priority: 'HIGH',
      details: 'Leverage native Pub/Sub in-flight transformations and direct BigQuery/GCS push subscriptions without intermediate Cloud Functions to reduce latency and execution spend.',
      canonical_url: 'https://cloud.google.com/pubsub/docs/bigquery'
    });

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }

  // Workload Arbitration: Pub/Sub critiques Cloud Run
  arbitrateCloudRun(cloudRunInventory) {
    return {
      reviewer: this.name,
      target: 'Pod 2: Cloud Run Serverless Pod',
      arbitration_type: 'WORKLOAD_ARBITRATION_CRITIQUE',
      recommendation: 'Identify synchronous bottlenecks on Cloud Run. Any HTTP endpoint taking longer than 5 seconds or processing batch files must be decoupled via Pub/Sub topics with Dead-Letter Queues (DLQs) and exponential backoff to prevent request timeout drops.'
    };
  }
}

class UnifiedBigQueryPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_4',
      name: 'Pod 4: Unified BigQuery & Modern Data Pod',
      skills: ['gcp-bigquery-ai', 'gcp-bigquery-analytics', 'gcp-bigquery-cost'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const tf = inventory.terraform || {};
    const recommendations = [];

    recommendations.push({
      title: 'Enforce Mandatory Partitioning & Clustering on Analytical Tables',
      tier: 'Tier 1B',
      priority: 'CRITICAL',
      details: 'All tables exceeding 10 GB must implement time-based partitioning and clustering keys (e.g., date, user_id) to eliminate full-table scanning under on-demand pricing ($6.25/TB).',
      canonical_url: 'https://cloud.google.com/bigquery/docs/partitioned-tables'
    });

    recommendations.push({
      title: 'Adopt Vector SQL and Remote MCP Server for In-Database AI Inference',
      tier: 'Tier 1A [>= 04.26]',
      priority: 'HIGH',
      details: 'Utilize BigQuery Vector Search (VECTOR_SEARCH SQL) and Remote MCP Server to let autonomous AI agents query vector indexes directly inside BigQuery without external vector databases.',
      canonical_url: 'https://cloud.google.com/bigquery/docs/vector-search'
    });

    recommendations.push({
      title: 'Evaluate Slot Commitment vs On-Demand Mathematical Crossover',
      tier: 'Tier 2 [Mathematical Crossover]',
      priority: 'MEDIUM',
      details: 'If monthly query scanning exceeds 690 TB/month, transition from On-Demand ($6.25/TB) to BigQuery Editions baseline slot reservations with autoscaling to achieve lower predictable spend.',
      canonical_url: 'https://cloud.google.com/bigquery/docs/editions-intro'
    });

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }
}

class ComputeFinOpsPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_5',
      name: 'Pod 5: GCP Compute FinOps Pod',
      skills: ['gcp-computefinops'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const recommendations = [];

    recommendations.push({
      title: 'Implement Automated Cloud Billing Spend Caps & Alerting Killswitches',
      tier: 'Tier 1B',
      priority: 'CRITICAL',
      details: 'Deploy Cloud Billing export to BigQuery with programmatic budget pub/sub triggers to disable billing or downscale compute before runaway recursive agent loops breach budgets.',
      canonical_url: 'https://cloud.google.com/billing/docs/how-to/notify'
    });

    recommendations.push({
      title: 'Apply 1-Year/3-Year Spend-Based Committed Use Discounts (CUDs)',
      tier: 'Tier 2 [FinOps Math]',
      priority: 'HIGH',
      details: 'Analyze 30-day baseline compute spend and commit to flexible Spend-Based CUDs for 28% to 57% savings across Compute Engine, GKE, and Cloud Run.',
      canonical_url: 'https://cloud.google.com/compute/docs/sustained-use-discounts'
    });

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }

  critiqueGkeAndRun(gkePodOutput, runPodOutput) {
    return {
      reviewer: this.name,
      target: 'Pod 1: GKE Specialist & Pod 2: Cloud Run Serverless',
      critique: 'Ensure GKE cluster nodes configure right-sized pod request-to-limit ratios (target 70-80% node memory saturation) to prevent unallocated cluster node spend.'
    };
  }
}

class SecurityZeroTrustPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_6',
      name: 'Pod 6: Security Hardening & Zero-Trust Pod',
      skills: ['gcp-security-compliance'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const recommendations = [];

    recommendations.push({
      title: 'Enforce Workload Identity Federation (WIF) and Decommission All Static JSON Keys',
      tier: 'Tier 1B',
      priority: 'CRITICAL',
      details: 'Replace all static service account keys with short-lived OIDC token exchanges via Workload Identity Pools for GitHub Actions, GitLab CI, and AWS workloads.',
      canonical_url: 'https://cloud.google.com/iam/docs/workload-identity-federation'
    });

    recommendations.push({
      title: 'Integrate Google Model Armor for LLM Prompt Defense & DLP Sanitization',
      tier: 'Tier 1A [>= 04.26]',
      priority: 'HIGH',
      details: 'Intercept user prompts and agent tool outputs with Google Model Armor to prevent prompt injections, jailbreaks, and PII leakage before data reaches Gemini models.',
      canonical_url: 'https://cloud.google.com/security/products/model-armor'
    });

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }

  critiqueMeshSecurity(allPodOutputs) {
    return {
      reviewer: this.name,
      target: 'Global Review Mesh',
      critique: 'Audit all ingress endpoints. Ensure no Cloud Run services or GKE Gateway routes allow unauthenticated allUsers without Cloud Armor WAF rate-limiting and Model Armor inspection.'
    };
  }
}

class CloudNetworkingPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_7',
      name: 'Pod 7: Cloud Networking & Connectivity Pod',
      skills: ['gcp-networking'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const recommendations = [];

    recommendations.push({
      title: 'Design Hub-and-Spoke VPC Topology with Private Service Connect (PSC)',
      tier: 'Tier 1B',
      priority: 'HIGH',
      details: 'Isolate workloads into dedicated spoke VPCs connected to a central transit hub via PSC endpoints, avoiding IP address exhaustion and eliminating transitive peering limits.',
      canonical_url: 'https://cloud.google.com/vpc/docs/private-service-connect'
    });

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }
}

class OperationalDatabasesPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_8',
      name: 'Pod 8: Operational Databases & Cloud SQL Pod',
      skills: ['gcp-databases'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const recommendations = [];

    recommendations.push({
      title: 'Scale Read Throughput with Cloud SQL Autoscaling Read Pools & ScaNN Vector Indexes',
      tier: 'Tier 1B',
      priority: 'HIGH',
      details: 'Configure autoscaling read replicas for bursty read workloads and leverage ScaNN indexes for AlloyDB/PostgreSQL vector queries at 3x higher throughput.',
      canonical_url: 'https://cloud.google.com/sql/docs/postgres/replication'
    });

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }
}

class FrontierModelsGemmaPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_9',
      name: 'Pod 9: Frontier Models, Gemma & TPU Serving Pod',
      skills: ['gcp-frontier-emerging', 'gcp-gemini-robotics'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const recommendations = [];

    recommendations.push({
      title: 'Serve Gemma 4 12B on Cloud TPU v6e with JAX Distributed Sharding',
      tier: 'Tier 1A [>= 04.26]',
      priority: 'HIGH',
      details: 'Deploy open-weights Gemma 4 models on Gemini Enterprise Agent Platform (GEAP) and TPU v6e clusters using JAX FSDP sharding for sub-10ms token generation latency.',
      canonical_url: 'https://cloud.google.com/tpu/docs/v6e-intro'
    });

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }
}

class GenerativeMediaVoicePod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_10',
      name: 'Pod 10: Generative Media & Conversational AI Pod',
      skills: ['gcp-generative-media', 'gcp-conversational-ai'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const recommendations = [];

    recommendations.push({
      title: 'Deploy Gemini Live API on Vertex AI for Sub-300ms Voice Telephony',
      tier: 'Tier 1A [>= 04.26]',
      priority: 'HIGH',
      details: 'Integrate real-time bi-directional audio streaming via WebSockets with Gemini Live API, streaming conversational voice turns with sub-300ms latency without intermediate STT/TTS.',
      canonical_url: 'https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/live-api'
    });

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }
}

class AndroidXrSpatialPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_11',
      name: 'Pod 11: Android XR & Spatial Computing Pod',
      skills: ['gcp-android-xr', 'gcp-geospatial'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    return {
      pod_id: this.id,
      name: this.name,
      recommendations: [{
        title: 'Optimize Android XR Spatial Meshing and Earth Engine Pipeline',
        tier: 'Tier 1A [>= 04.26]',
        priority: 'MEDIUM',
        details: 'Utilize Android XR SDK spatial layout guidelines with Earth Engine raster analytic tile generation.',
        canonical_url: 'https://developer.android.com/xr'
      }],
      status: 'COMPLETED'
    };
  }
}

class CrossCloudMigrationPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_12',
      name: 'Pod 12: Cross-Cloud Modernization & Migration Pod',
      skills: ['gcp-migrations'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const tf = inventory.terraform || {};
    const multi = tf.multi_cloud || {};
    const recommendations = [];

    if (multi.detected) {
      if (multi.providers.includes('aws') || multi.storage_uris.some(u => u.uri.startsWith('s3://'))) {
        recommendations.push({
          title: 'Migrate AWS S3 Data Lakes to Google Cloud Storage via Storage Transfer Service (STS)',
          tier: 'Tier 1B',
          priority: 'CRITICAL',
          details: 'Deploy automated STS transfers from AWS S3 to GCS with continuous event-driven synchronization and MD5 checksum verification, eliminating manual transfer scripts.',
          canonical_url: 'https://cloud.google.com/storage-transfer/docs/cloud-storage-transfer'
        });
      }

      if (multi.providers.includes('snowflake') || multi.connection_strings.some(c => c.match.includes('snowflake'))) {
        recommendations.push({
          title: 'Translate Snowflake Data Pipelines to BigQuery Dataform SQLX',
          tier: 'Tier 1B',
          priority: 'HIGH',
          details: 'Utilize BigQuery Migration Service (Batch & Interactive SQL translation) to automatically rewrite Snowflake SnowSQL queries into GoogleSQL and native Dataform DAGs.',
          canonical_url: 'https://cloud.google.com/bigquery/docs/migration-sql'
        });
      }
    }

    return {
      pod_id: this.id,
      name: this.name,
      recommendations,
      status: 'COMPLETED'
    };
  }
}

class PlatformEngineeringIacPod extends BasePod {
  constructor(repoRoot) {
    super({
      id: 'pod_13',
      name: 'Pod 13: Platform Engineering & IaC Specialist',
      skills: ['gcp-gemini-tooling', 'gcp-adk-agents'],
      repoRoot
    });
  }

  evaluate(inventory, governanceFindings, modelCalibration) {
    const findings = governanceFindings.filter(f => f.pod && f.pod.includes('Pod 13'));
    const recommendations = [];

    recommendations.push({
      title: 'Enforce Additive IAM Bindings and Remote GCS State Locking',
      tier: 'Tier 1B',
      priority: 'CRITICAL',
      details: 'Replace all authoritative google_*_iam_binding resources with additive google_*_iam_member. Ensure all Terraform configurations lock state in GCS with object versioning.',
      canonical_url: 'https://cloud.google.com/docs/terraform/best-practices-for-terraform'
    });

    recommendations.push({
      title: 'Standardize on Google Agent Development Kit (ADK 1.0) and FastMCP Tooling',
      tier: 'Tier 1A [>= 04.26]',
      priority: 'HIGH',
      details: 'Build all agentic AI workflows using ADK 1.0 (google-adk >= 1.0.0) with Model Context Protocol (FastMCP) tools and A2A multi-agent contracts.',
      canonical_url: 'https://cloud.google.com/blog/products/ai-machine-learning/introducing-google-agent-development-kit'
    });

    return {
      pod_id: this.id,
      name: this.name,
      findings_addressed: findings.length,
      recommendations,
      status: 'COMPLETED'
    };
  }
}

module.exports = {
  GkeSpecialistPod,
  CloudRunServerlessPod,
  PubSubEventDrivenPod,
  UnifiedBigQueryPod,
  ComputeFinOpsPod,
  SecurityZeroTrustPod,
  CloudNetworkingPod,
  OperationalDatabasesPod,
  FrontierModelsGemmaPod,
  GenerativeMediaVoicePod,
  AndroidXrSpatialPod,
  CrossCloudMigrationPod,
  PlatformEngineeringIacPod
};
