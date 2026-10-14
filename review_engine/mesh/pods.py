"""
13 Specialized Architectural Review Pods (Python ADK Parity)
Part of GeminiPostCutoff Architecture Review Engine (Phase 3)
"""

from typing import Dict, List, Any, Optional
from pathlib import Path

class BasePod:
    def __init__(self, pod_id: str, name: str, skills: List[str], repo_root: Optional[Path] = None):
        self.id = pod_id
        self.name = name
        self.skills = skills
        self.repo_root = repo_root or Path(__file__).resolve().parent.parent.parent

    def load_runbook_knowledge(self) -> str:
        knowledge = []
        for s in self.skills:
            skill_md = self.repo_root / "skills" / s / "SKILL.md"
            if skill_md.exists():
                knowledge.append(f"\n--- RUNBOOK: {s} ---\n" + skill_md.read_text(encoding="utf-8"))
        return "\n".join(knowledge)

class GkeSpecialistPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_1", "Pod 1: GKE Specialist Pod", ["gcp-gke-platform", "gcp-gke-inference", "gcp-gke-cost"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        recommendations = [
            {
                "title": "Migrate Legacy Ingress to GKE Gateway API with Multi-Cluster Routing",
                "tier": "Tier 1A",
                "priority": "HIGH",
                "details": "Migrate from legacy Ingress to GKE Gateway API (gateway.networking.k8s.io/v1) backed by Dataplane V2.",
                "canonical_url": "https://cloud.google.com/kubernetes-engine/docs/concepts/gateway-api"
            },
            {
                "title": "Deploy GKE Inference Gateway with Body-Based Routing for vLLM Workloads",
                "tier": "Tier 1A [>= 04.26]",
                "priority": "HIGH",
                "details": "For GPU/vLLM inference, configure GKE Inference Gateway with body-based routing and Kueue batch queuing.",
                "canonical_url": "https://cloud.google.com/blog/products/containers-kubernetes/introducing-gke-inference-gateway"
            }
        ]
        return {"pod_id": self.id, "name": self.name, "recommendations": recommendations, "status": "COMPLETED"}

    def critique_finops(self, finops_output: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "reviewer": self.name,
            "target": "Pod 5: GCP Compute FinOps Pod",
            "critique": "Compute FinOps suggests Spot VMs for GKE worker nodes. Caution: GPU inference workloads (vLLM) serving real-time requests must not run on Spot VMs without active failover to on-demand reservations, or latency spikes will breach SLA."
        }

class CloudRunServerlessPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_2", "Pod 2: Cloud Run Serverless Pod", ["gcp-cloud-run"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        recommendations = [
            {
                "title": "Adopt Cloud Run Direct VPC Egress and Decommission Serverless Access Connectors",
                "tier": "Tier 1A [>= 04.26]",
                "priority": "HIGH",
                "details": "Direct VPC Egress eliminates 2-VM connector fees and removes network bottlenecks.",
                "canonical_url": "https://cloud.google.com/run/docs/configuring/vpc-direct-vpc"
            },
            {
                "title": "Configure Continuous CPU Allocation for Background Workers",
                "tier": "Tier 1B",
                "priority": "CRITICAL",
                "details": "Background queue workers must configure cpu_idle = false to prevent CPU throttling.",
                "canonical_url": "https://cloud.google.com/run/docs/configuring/cpu-allocation"
            }
        ]
        return {"pod_id": self.id, "name": self.name, "recommendations": recommendations, "status": "COMPLETED"}

    def arbitrate_pubsub(self, pubsub_inventory: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "reviewer": self.name,
            "target": "Pod 3: Event-Driven & Pub/Sub Pod",
            "arbitration_type": "WORKLOAD_ARBITRATION_CRITIQUE",
            "recommendation": "For point-to-point synchronous RPC between Cloud Run services within the same region, replace Pub/Sub with direct HTTP invocations over Direct VPC Egress to eliminate latency."
        }

class PubSubEventDrivenPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_3", "Pod 3: Event-Driven & Pub/Sub Pod", ["gcp-pubsub"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        recommendations = [
            {
                "title": "Decouple Ingestion Spikes with In-Flight Single Message Transformations (SMTs)",
                "tier": "Tier 1A [>= 04.26]",
                "priority": "HIGH",
                "details": "Leverage Pub/Sub in-flight transformations and direct BigQuery push subscriptions.",
                "canonical_url": "https://cloud.google.com/pubsub/docs/bigquery"
            }
        ]
        return {"pod_id": self.id, "name": self.name, "recommendations": recommendations, "status": "COMPLETED"}

    def arbitrate_cloud_run(self, run_inventory: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "reviewer": self.name,
            "target": "Pod 2: Cloud Run Serverless Pod",
            "arbitration_type": "WORKLOAD_ARBITRATION_CRITIQUE",
            "recommendation": "Any Cloud Run endpoint taking longer than 5 seconds or processing batch files must be decoupled via Pub/Sub topics with Dead-Letter Queues (DLQs)."
        }

class UnifiedBigQueryPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_4", "Pod 4: Unified BigQuery & Modern Data Pod", ["gcp-bigquery-ai", "gcp-bigquery-analytics", "gcp-bigquery-cost"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        recommendations = [
            {
                "title": "Enforce Mandatory Partitioning & Clustering on Analytical Tables",
                "tier": "Tier 1B",
                "priority": "CRITICAL",
                "details": "Tables > 10GB must implement date partitioning and clustering to eliminate full-table scanning.",
                "canonical_url": "https://cloud.google.com/bigquery/docs/partitioned-tables"
            },
            {
                "title": "Adopt Vector SQL and Remote MCP Server for In-Database AI Inference",
                "tier": "Tier 1A [>= 04.26]",
                "priority": "HIGH",
                "details": "Utilize BigQuery Vector Search and Remote MCP Server for autonomous AI agent queries.",
                "canonical_url": "https://cloud.google.com/bigquery/docs/vector-search"
            }
        ]
        return {"pod_id": self.id, "name": self.name, "recommendations": recommendations, "status": "COMPLETED"}

class ComputeFinOpsPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_5", "Pod 5: GCP Compute FinOps Pod", ["gcp-computefinops"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        recommendations = [
            {
                "title": "Implement Automated Cloud Billing Spend Caps & Alerting Killswitches",
                "tier": "Tier 1B",
                "priority": "CRITICAL",
                "details": "Deploy Cloud Billing export to BigQuery with programmatic budget pub/sub triggers.",
                "canonical_url": "https://cloud.google.com/billing/docs/how-to/notify"
            }
        ]
        return {"pod_id": self.id, "name": self.name, "recommendations": recommendations, "status": "COMPLETED"}

    def critique_gke_and_run(self, gke_pod: Any, run_pod: Any) -> Dict[str, Any]:
        return {
            "reviewer": self.name,
            "target": "Pod 1: GKE Specialist & Pod 2: Cloud Run Serverless",
            "critique": "Ensure GKE cluster nodes configure right-sized pod request-to-limit ratios to prevent unallocated cluster node spend."
        }

class SecurityZeroTrustPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_6", "Pod 6: Security Hardening & Zero-Trust Pod", ["gcp-security-compliance"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        recommendations = [
            {
                "title": "Enforce Workload Identity Federation (WIF) and Decommission All Static JSON Keys",
                "tier": "Tier 1B",
                "priority": "CRITICAL",
                "details": "Replace all static service account keys with short-lived OIDC token exchanges.",
                "canonical_url": "https://cloud.google.com/iam/docs/workload-identity-federation"
            }
        ]
        return {"pod_id": self.id, "name": self.name, "recommendations": recommendations, "status": "COMPLETED"}

    def critique_mesh_security(self, active_pods: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "reviewer": self.name,
            "target": "Global Review Mesh",
            "critique": "Audit all ingress endpoints. Ensure no Cloud Run services or GKE Gateway routes allow unauthenticated allUsers without Cloud Armor WAF and Model Armor."
        }

class CloudNetworkingPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_7", "Pod 7: Cloud Networking & Connectivity Pod", ["gcp-networking"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        return {"pod_id": self.id, "name": self.name, "recommendations": [{
            "title": "Design Hub-and-Spoke VPC Topology with Private Service Connect (PSC)",
            "tier": "Tier 1B",
            "priority": "HIGH",
            "details": "Connect spoke VPCs via PSC endpoints to eliminate transitive peering limits.",
            "canonical_url": "https://cloud.google.com/vpc/docs/private-service-connect"
        }], "status": "COMPLETED"}

class OperationalDatabasesPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_8", "Pod 8: Operational Databases & Cloud SQL Pod", ["gcp-databases"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        return {"pod_id": self.id, "name": self.name, "recommendations": [{
            "title": "Scale Read Throughput with Cloud SQL Autoscaling Read Pools & ScaNN Vector Indexes",
            "tier": "Tier 1B",
            "priority": "HIGH",
            "details": "Configure autoscaling read replicas and ScaNN indexes for vector queries.",
            "canonical_url": "https://cloud.google.com/sql/docs/postgres/replication"
        }], "status": "COMPLETED"}

class FrontierModelsGemmaPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_9", "Pod 9: Frontier Models, Gemma & TPU Serving Pod", ["gcp-frontier-emerging", "gcp-gemini-robotics"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        return {"pod_id": self.id, "name": self.name, "recommendations": [{
            "title": "Serve Gemma 4 12B on Cloud TPU v6e with JAX Distributed Sharding",
            "tier": "Tier 1A [>= 04.26]",
            "priority": "HIGH",
            "details": "Deploy Gemma 4 on TPU v6e using JAX FSDP sharding for sub-10ms token latency.",
            "canonical_url": "https://cloud.google.com/tpu/docs/v6e-intro"
        }], "status": "COMPLETED"}

class GenerativeMediaVoicePod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_10", "Pod 10: Generative Media & Conversational AI Pod", ["gcp-generative-media", "gcp-conversational-ai"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        return {"pod_id": self.id, "name": self.name, "recommendations": [{
            "title": "Deploy Gemini Live API on Vertex AI for Sub-300ms Voice Telephony",
            "tier": "Tier 1A [>= 04.26]",
            "priority": "HIGH",
            "details": "Stream bi-directional audio via WebSockets with Gemini Live API.",
            "canonical_url": "https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/live-api"
        }], "status": "COMPLETED"}

class AndroidXrSpatialPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_11", "Pod 11: Android XR & Spatial Computing Pod", ["gcp-android-xr", "gcp-geospatial"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        return {"pod_id": self.id, "name": self.name, "recommendations": [{
            "title": "Optimize Android XR Spatial Meshing and Earth Engine Pipeline",
            "tier": "Tier 1A [>= 04.26]",
            "priority": "MEDIUM",
            "details": "Utilize Android XR spatial guidelines with Earth Engine raster analytic tiles.",
            "canonical_url": "https://developer.android.com/xr"
        }], "status": "COMPLETED"}

class CrossCloudMigrationPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_12", "Pod 12: Cross-Cloud Modernization & Migration Pod", ["gcp-migrations"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        return {"pod_id": self.id, "name": self.name, "recommendations": [{
            "title": "Migrate AWS S3 Data Lakes to Google Cloud Storage via Storage Transfer Service (STS)",
            "tier": "Tier 1B",
            "priority": "CRITICAL",
            "details": "Automate transfers from AWS S3 to GCS with event-driven synchronization.",
            "canonical_url": "https://cloud.google.com/storage-transfer/docs/cloud-storage-transfer"
        }], "status": "COMPLETED"}

class PlatformEngineeringIacPod(BasePod):
    def __init__(self, repo_root: Optional[Path] = None):
        super().__init__("pod_13", "Pod 13: Platform Engineering & IaC Specialist", ["gcp-gemini-tooling", "gcp-adk-agents"], repo_root)

    def evaluate(self, inventory: Dict[str, Any], governance_findings: List[Dict[str, Any]], model_calibration: str) -> Dict[str, Any]:
        return {"pod_id": self.id, "name": self.name, "recommendations": [{
            "title": "Enforce Additive IAM Bindings and Remote GCS State Locking",
            "tier": "Tier 1B",
            "priority": "CRITICAL",
            "details": "Replace authoritative bindings with google_*_iam_member and lock state in GCS.",
            "canonical_url": "https://cloud.google.com/docs/terraform/best-practices-for-terraform"
        }], "status": "COMPLETED"}
