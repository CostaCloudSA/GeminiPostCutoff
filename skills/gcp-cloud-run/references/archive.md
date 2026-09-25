# gcp-cloud-run Historical & Evergreen Reference Vault

This archive vault contains foundational architecture patterns, codelabs, starter kits, and official Google documentation for `gcp-cloud-run`.

---

### 💎 Evergreen Serverless Architecture Masterclasses
- **CPU Allocation & Throttling Semantics**:
  - Request-based CPU allocation vs Always-allocated CPU (`--no-cpu-throttling`).
  - Container lifecycle, graceful shutdown (`SIGTERM` handling within 10s grace period), and scaling-to-zero economics.

- **High-Throughput Concurrency & Networking**:
  - Tuning container concurrency (default 80 vs single-concurrency for heavy compute).
  - Global External Application Load Balancer with multi-region Serverless Network Endpoint Groups (NEGs) and Cloud Armor WAF.

---

### 🛠️ Interactive Codelabs & Bootcamps
- [Google Cloud Computing Foundations: Infrastructure in Google Cloud](https://www.cloudskillsboost.google/course_templates/154)
- [Perform Foundational Data, ML, and AI Tasks in Google Cloud](https://www.cloudskillsboost.google/course_templates/631)
- [Perform Foundational Infrastructure Tasks in Google Cloud](https://www.cloudskillsboost.google/course_templates/637)

---

### 🐙 Official Repositories & Starter Kits
- [Memory Bank for ADK Agents in Cloud Run Github Repository](https://github.com/GoogleCloudPlatform/generative-ai/blob/main/agents/cloud_run/agents_with_memory/get_started_with_memory_for_adk_in_cloud_run.ipynb)
- [Google MCP Servers Github Repository](https://github.com/google/mcp)

---

### 📖 Official Google Documentation & Courses
- [Host AI apps and agents on Cloud Run](https://cloud.google.com/run/docs/ai-agents)
- [Host MCP Servers on Cloud Run](https://cloud.google.com/run/docs/host-mcp-servers)
- [Host A2A Agents on Cloud Run](https://cloud.google.com/run/docs/host-a2a-agents)
