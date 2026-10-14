/**
 * Adversarial Peer Critique & Mutual Workload Arbitration Engine (Enhanced Phase 3)
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Orchestrates cross-pod adversarial critiques and resolves trade-offs:
 * 1. Cloud Run <-> Pub/Sub (Async decoupling vs direct RPC)
 * 2. Compute FinOps <-> GKE Specialist (Spot vs CUD GPU reservations)
 * 3. BigQuery AI <-> Operational Databases (Vector SQL vs AlloyDB ScaNN)
 * 4. Frontier Models TPU <-> Compute FinOps (Dedicated GKE TPU vs Vertex AI Spot)
 * 5. Conversational Voice <-> Networking/Security (WebSocket streaming vs WAF timeouts)
 * 6. Security Hardening <-> Platform Engineering (Additive IAM mandate)
 */

class PeerArbitrationEngine {
  constructor() {}

  /**
   * Executes the full peer critique matrix across active pods
   */
  executeArbitration(activePodsMap, inventory, governanceFindings) {
    const critiques = [];
    const arbitrationResolutions = [];

    const tf = inventory.terraform || {};
    const k8s = inventory.kubernetes || {};

    // 1. Cloud Run <-> Pub/Sub Mutual Workload Arbitration
    const hasRun = activePodsMap.has('pod_2');
    const hasPubSub = activePodsMap.has('pod_3');

    if (hasRun || hasPubSub) {
      const runPod = activePodsMap.get('pod_2');
      const pubsubPod = activePodsMap.get('pod_3');

      const runServices = (tf.resources || []).filter(r => r.type.includes('cloud_run'));
      const hasLongRunningWorkers = runServices.some(s => 
        s.raw_body.includes('worker') || s.raw_body.includes('async') || s.raw_body.includes('pubsub')
      );

      if (pubsubPod && hasLongRunningWorkers) {
        critiques.push(pubsubPod.arbitrateCloudRun(runServices));
        arbitrationResolutions.push({
          arbitration_pair: 'Cloud Run ⟷ Pub/Sub',
          winner: 'Pod 3: Event-Driven & Pub/Sub Pod',
          consensus: 'ADOPT DECOUPLED PUB/SUB PUSH ARCHITECTURE: Decouple long-running or asynchronous workers via Cloud Pub/Sub topics with Dead-Letter Queues (DLQs). Set Cloud Run cpu_idle = false on worker push endpoints.',
          impact: 'Eliminates HTTP 504 timeouts, provides automatic exponential backoff, and guarantees zero message loss during traffic surges.'
        });
      }

      if (runPod && runServices.length >= 2) {
        critiques.push(runPod.arbitratePubSub(tf));
        arbitrationResolutions.push({
          arbitration_pair: 'Cloud Run ⟷ Pub/Sub',
          winner: 'Pod 2: Cloud Run Serverless Pod',
          consensus: 'FAVOR DIRECT VPC EGRESS FOR SYNCHRONOUS RPCS: For point-to-point service invocations requiring < 100ms response latency, bypass Pub/Sub queues and invoke target Cloud Run services directly using Direct VPC Egress with IAM token authentication.',
          impact: 'Reduces end-to-end request latency by 60-120ms and avoids Pub/Sub message ingestion costs for high-frequency internal RPCs.'
        });
      }
    }

    // 2. Compute FinOps Arbitration (Pod 5 vs GKE Pod 1 & Cloud Run Pod 2)
    if (activePodsMap.has('pod_5')) {
      const finopsPod = activePodsMap.get('pod_5');
      const gkePod = activePodsMap.get('pod_1');
      const runPod = activePodsMap.get('pod_2');

      critiques.push(finopsPod.critiqueGkeAndRun(gkePod, runPod));

      if (gkePod && k8s.inference_workloads && k8s.inference_workloads.length > 0) {
        critiques.push(gkePod.critiqueFinOps(finopsPod));
        arbitrationResolutions.push({
          arbitration_pair: 'Compute FinOps ⟷ GKE Specialist',
          winner: 'SUPERVISOR MEDIATED CONSENSUS',
          consensus: 'SPLIT-POOL GPU STRATEGY: Apply 1-Year/3-Year Spend-Based CUDs for primary baseline GPU inference instances. Utilize Spot VMs ONLY for secondary batch queuing managed by Kueue with automated drain timeouts.',
          impact: 'Guarantees sub-second latency for live AI requests while capturing 60-70% discounts on background batch inference.'
        });
      }
    }

    // 3. BigQuery AI (Pod 4) vs Operational Databases (Pod 8)
    if (activePodsMap.has('pod_4') && activePodsMap.has('pod_8')) {
      critiques.push({
        reviewer: 'Pod 4: Unified BigQuery & Modern Data Pod',
        target: 'Pod 8: Operational Databases & Cloud SQL Pod',
        critique: 'BigQuery Vector SQL (VECTOR_SEARCH) handles petabyte embedding retrieval in-database without managing external database instances.'
      });
      critiques.push({
        reviewer: 'Pod 8: Operational Databases & Cloud SQL Pod',
        target: 'Pod 4: Unified BigQuery & Modern Data Pod',
        critique: 'BigQuery slot query latency (1.5s - 3s) is unacceptable for transactional OLTP application requests requiring < 20ms response time.'
      });
      arbitrationResolutions.push({
        arbitration_pair: 'BigQuery AI ⟷ Operational Databases',
        winner: 'HYBRID WORKLOAD ARCHITECTURE',
        consensus: 'TIERED VECTOR RETRIEVAL: Deploy AlloyDB AI with ScaNN vector indexing for real-time transactional application queries (< 10ms SLA). Use BigQuery VECTOR_SEARCH for analytical retrieval, offline batch clustering, and RAG over petabyte historical datasets.',
        impact: 'Delivers sub-10ms user latency while preserving petabyte analytical scale at lowest cost.'
      });
    }

    // 4. Frontier Models TPU (Pod 9) vs Compute FinOps (Pod 5)
    if (activePodsMap.has('pod_9') && activePodsMap.has('pod_5')) {
      critiques.push({
        reviewer: 'Pod 9: Frontier Models, Gemma & TPU Serving Pod',
        target: 'Pod 5: GCP Compute FinOps Pod',
        critique: 'Continuous GKE Ray cluster with TPU v6e provides maximum fine-tuning throughput and direct JAX hardware control.'
      });
      critiques.push({
        reviewer: 'Pod 5: GCP Compute FinOps Pod',
        target: 'Pod 9: Frontier Models, Gemma & TPU Serving Pod',
        critique: 'Idle TPU v6e pods cost $1.20-$2.40 per hour when unutilized. Periodic fine-tuning should not incur 24/7 cluster management overhead.'
      });
      arbitrationResolutions.push({
        arbitration_pair: 'Frontier Models TPU ⟷ Compute FinOps',
        winner: 'DUTY-CYCLE OPTIMIZED CONSENSUS',
        consensus: 'DUTY-CYCLE ROUTING: Workloads with > 70% continuous monthly utilization maintain dedicated GKE TPU v6e clusters with 1-Year CUDs. Periodic, episodic, or fine-tuning experiments (< 30% duty cycle) must run on Vertex AI Custom Training Jobs using Spot TPUs.',
        impact: 'Saves 40-65% on intermittent training spend while providing dedicated high-throughput infrastructure for continuous serving.'
      });
    }

    // 5. Conversational Voice (Pod 10) vs Networking/Security (Pod 7 & Pod 6)
    if (activePodsMap.has('pod_10') && (activePodsMap.has('pod_7') || activePodsMap.has('pod_6'))) {
      critiques.push({
        reviewer: 'Pod 10: Generative Media & Conversational AI Pod',
        target: 'Pod 7: Cloud Networking & Pod 6: Security Hardening',
        critique: 'Gemini Live API bi-directional audio streaming requires persistent full-duplex WebSockets with sub-300ms latency.'
      });
      arbitrationResolutions.push({
        arbitration_pair: 'Conversational AI ⟷ Cloud Networking & Security',
        winner: 'SUPERVISOR MEDIATED CONSENSUS',
        consensus: 'WEBSOCKET STREAMING PERIMETER: Configure GKE Gateway HTTPRoute / Cloud Run backend services with 3600-second timeouts and WebSocket upgrade support. Apply Cloud Armor rate-limiting without interrupting active bi-directional audio frames.',
        impact: 'Prevents dropped voice calls caused by standard 30-second HTTP proxy timeouts while maintaining WAF DDoS protection.'
      });
    }

    // 6. Security Hardening Arbitration (Pod 6 vs Platform Engineering)
    if (activePodsMap.has('pod_6')) {
      const secPod = activePodsMap.get('pod_6');
      critiques.push(secPod.critiqueMeshSecurity(activePodsMap));

      const hasAuthoritativeIam = governanceFindings.some(f => f.rule === 'ANTI_PATTERN_AUTHORITATIVE_IAM');
      if (hasAuthoritativeIam) {
        arbitrationResolutions.push({
          arbitration_pair: 'Security Hardening ⟷ Platform Engineering',
          winner: 'Pod 6: Security Hardening & Zero-Trust Pod',
          consensus: 'MANDATE ADDITIVE IAM BINDINGS: Authoritative google_*_iam_binding resources are rejected across all environments. Replace immediately with google_*_iam_member.',
          impact: 'Prevents accidental catastrophic revocation of project-wide permissions.'
        });
      }
    }

    return {
      total_critiques_exchanged: critiques.length,
      critiques,
      arbitration_resolutions: arbitrationResolutions
    };
  }
}

module.exports = { PeerArbitrationEngine };
