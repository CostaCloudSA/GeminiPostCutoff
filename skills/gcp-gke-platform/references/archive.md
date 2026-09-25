# gcp-gke-platform Historical & Evergreen Reference Vault

This archive vault contains foundational architecture patterns, GKE Sandbox guides, and official Google documentation for `gcp-gke-platform`.

---

### 💎 Evergreen GKE Architecture Masterclasses
- **GKE Dataplane V2 & eBPF Networking**:
  - eBPF-based packet processing replacing kube-proxy iptables.
  - Built-in network policy enforcement without third-party CNI daemons.

- **Private Cluster Architecture & Bastion Access**:
  - Control plane authorized networks, private endpoint master nodes, and Cloud NAT egress.
  - Zero-Trust IAM proxy access via IAP tunnels instead of open public master endpoints.

---

### 📖 Official Google Documentation & Courses
- [GKE Sandbox](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/sandbox-pods)
  - **Core Mechanism**: gVisor kernel virtualization sandboxing untrusted tenant containers.
