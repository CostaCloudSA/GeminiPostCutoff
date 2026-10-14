# Google Cloud Pub/Sub & Event-Driven Architecture — Post-Cutoff & Modern Reference Vault

> **Domain**: `gcp-pubsub` | **Model-Agnostic Chronological Vault**
> **Dynamic Tier Mapping**: Computed dynamically via `ModelCutoffResolver` ($\Delta_m = \text{Article}_{\text{YYYYMM}} - \text{Cutoff}_{\text{YYYYMM}}$):
> - **Dynamic Tier 1 (Post-Cutoff Delta)**: $\Delta_m > 0$
> - **Dynamic Tier 2 (Boundary & Maturation Window)**: $-12 \le \Delta_m \le 0$

---

### 📅 2025 Releases & Deep Dives (Chronological)

- [[08.25 Blogpost]: Powering event-driven architectures with Google Cloud Pub/Sub](https://cloud.google.com/blog/products/data-analytics/powering-event-driven-architectures-with-google-cloud-pub-sub)
- [[07.25 Blogpost]: Announcing general availability of Pub/Sub exports to Cloud Storage](https://cloud.google.com/blog/products/data-analytics/pub-sub-export-subscriptions-to-cloud-storage-now-ga)
- [[06.25 Blogpost]: Pub/Sub Lite to Pub/Sub migration guide and best practices](https://cloud.google.com/blog/products/data-analytics/migrating-from-pub-sub-lite-to-pub-sub)
- [[05.25 Blogpost]: Building resilient AI agent pipelines with Pub/Sub and Cloud Run](https://cloud.google.com/blog/products/serverless/building-resilient-ai-agent-pipelines-with-pub-sub-and-cloud-run)
- [[04.25 Blogpost]: Introducing Pub/Sub Single-Message Transforms (SMTs)](https://cloud.google.com/blog/products/data-analytics/introducing-pub-sub-single-message-transforms)
- [[03.25 Blogpost]: Google Cloud Managed Service for Apache Kafka vs. Cloud Pub/Sub](https://cloud.google.com/blog/products/data-analytics/choosing-between-managed-kafka-and-cloud-pub-sub)
