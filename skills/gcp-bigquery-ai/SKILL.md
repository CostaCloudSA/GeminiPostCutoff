---
name: gcp-bigquery-ai
description: >-
  BigQuery AI/ML, Gemini in BigQuery, BigQuery Remote MCP Server,
  Vector SQL, Autonomous Embeddings, and MCP Toolbox for Databases.
  Activate when implementing in-database AI inference, vector search, or connecting AI agents to BigQuery.
---

# BigQuery AI/ML, Vector Search & MCP Database Toolbox Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Implementing SQL-native LLM generation, translation, and summarization using `ML.GENERATE_TEXT` and `ML.GENERATE_EMBEDDING`.
- Enabling **Autonomous Embedding Generation** in BigQuery tables for auto-updating vector columns.
- Executing high-speed approximate nearest neighbor semantic searches using `VECTOR_SEARCH` with `IVF` or `TREE_AH` indexing.
- Connecting AI agents (Google ADK, LangGraph, Claude Code) to BigQuery using the official **BigQuery Remote MCP Server** or **MCP Toolbox for Databases**.
- Running open-source models (Gemma 2/3) directly in SQL with BigQuery managed inference.
- Performing multimodal analytics across images, audio, and PDF object tables in Google Cloud Storage.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Unindexed Brute-Force Vector Searches [10.25]**
> Running `VECTOR_SEARCH` on tables with >100,000 rows without creating an `IVF` or `TREE_AH` vector index forces a brute-force exact cosine distance scan over all rows, consuming hundreds of slot-minutes and blowing query latency past 10 seconds.
> - **Solution**: Always create an `IVF` (Inverted File) vector index and specify `fraction_lists_to_search` (e.g. `0.05` to `0.10`) for sub-second retrieval.
> *Cites: [Vector SQL in Practice: Embedding Tables, ANN vs. Exact Search](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Manual Batch Embedding Cron Scripts vs Autonomous Embeddings [02.26]**
> Writing external Cloud Run or Airflow scripts to poll tables, fetch un-embedded rows, invoke embedding APIs, and write back updates introduces race conditions, pipeline failures, and latency lag.
> - **Solution**: Use **BigQuery Autonomous Embedding Generation**, which automatically and continuously computes embeddings as new records are inserted into the source table.
> *Cites: [Simplify your AI workflow with autonomous embedding generation in BigQuery](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Handcrafted Ad-Hoc SQL Connectors for AI Agents [02.26, 01.26]**
> Writing custom Python DB adapters for agent tool calling exposes systems to prompt injection, lacks query cost dry-runs, and bypasses IAM authentication controls.
> - **Solution**: Connect agents via the official **BigQuery Remote MCP Server** (`@google/mcp-bigquery`) or **MCP Toolbox for Databases**, which provide secure schema introspection, query validation, and cost dry-runs out of the box.
> *Cites: [Getting Started with the BigQuery Remote MCP Server](./references/articles.md) and [Build data analytics agents faster with BigQuery's fully managed remote MCP server](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Unbounded Multi-Turn Agent Latency Loops [08.26, 01.26]**
> Allowing conversational data agents to run arbitrary multi-turn SQL exploration without a grounded semantic layer results in slow query iterations and hallucinated column names.
> - **Solution**: Ground agents with **Conversational Analytics in BigQuery** and a semantic modeling layer (LookML or open semantic models) so agents query validated business metrics rather than raw tables.
> *Cites: [Building a Reliable AI Analytics Agent with BigQuery, a Semantic Layer, and Google ADK](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 5: Public Unauthenticated Remote MCP Server Exposure [05.26, 06.26]**
> Deploying the BigQuery Remote MCP server on a public Cloud Run URL without token authorization allows unauthorized external callers to execute arbitrary queries, introspect sensitive schemas, or trigger heavy slot-consuming scans.
> - **Solution**: Enforce strict **Cloud Run IAM Authentication** requiring caller agents to present signed Google OIDC bearer tokens (`roles/run.invoker`) and bind MCP tool execution to explicit service account scopes.
> *Cites: [Securing AI agents with MCP Authorization](./references/articles.md) and [Managing BigQuery with Google ADK, MCP, Cloud Run, Streamlit, and OIDC Authentication](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Vector Retrieval Architecture: Native BigQuery vs Dedicated Vector DB [06.26]
| Dimension | BigQuery Vector Search | Vertex AI Vector Search | Dedicated DB (Pinecone / Weaviate) |
| :--- | :--- | :--- | :--- |
| **Data Gravity** | Source data stays in BigQuery | Streamed from GCS / Vertex | Synchronized via continuous ETL |
| **Index Types** | `IVF`, `TREE_AH` | ScaNN (SOTA speed) | HNSW, IVF |
| **Latency** | 200ms – 1.5s (Analytic RAG) | 5ms – 25ms (Real-time online) | 5ms – 30ms (Online app serving) |
| **Operational TCO** | **Zero egress, pay-per-query slots** | Managed index endpoint cost | High SaaS cluster subscription |
| **Hybrid Filtering** | Native SQL `WHERE` & `SEARCH()` | Restricted metadata filtering | Varies by vendor |
| **Best For** | Internal RAG, analytical search | Ultra-low latency user-facing apps | Specialized standalone vector graphs |
*Cites: [You Probably Don't Need a Vector Database - If Your Data Already Lives in BigQuery](./references/articles.md)*

---

### 2. LLM Inference Modality in BigQuery: Cloud API vs Managed Open Weights [01.26]
| Modality | Syntax / Mechanism | Latency / Throughput | Cost Structure |
| :--- | :--- | :--- | :--- |
| **Gemini Foundation Models** | `ML.GENERATE_TEXT` via Vertex AI Connection | High quality, 500–1,500ms | Billed per input/output token |
| **BigQuery Managed Open Models** | `ML.GENERATE_TEXT` using Gemma 2/3 | High throughput, predictable batch | BigQuery slot compute |
| **Remote Vertex AI Endpoints** | Custom fine-tuned Hugging Face models | Tuned for specialized domain | Dedicated GPU instance-hours |
*Cites: [BigQuery's Managed Inference for Open Models](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Autonomous Embedding Generation on Table Insert [02.26]
Configure BigQuery to automatically generate and maintain text embeddings as data enters the catalog:
```sql
-- 1. Create Cloud Resource connection to Vertex AI
-- (Assumes connection `us.vertex-ai-conn` exists with roles/aiplatform.user)

-- 2. Create the Remote Embedding Model
CREATE OR REPLACE MODEL `my_project.ai_models.text_embedding`
REMOTE WITH CONNECTION `us.vertex-ai-conn`
OPTIONS (
  ENDPOINT = 'text-embedding-005'
);

-- 3. Create the Autonomous Embedding Table
CREATE OR REPLACE TABLE `my_project.knowledge_base.articles` (
  article_id STRING,
  content STRING,
  embedding ARRAY<FLOAT64>
)
OPTIONS (
  auto_embedding_source_column = 'content',
  auto_embedding_model = 'my_project.ai_models.text_embedding'
);
```
*Cites: [Simplify your AI workflow with autonomous embedding generation in BigQuery](./references/articles.md)*

---

### Blueprint 2: High-Performance Vector Search with IVF Indexing [10.25, 06.26]
Build an inverted file vector index and perform approximate nearest neighbor semantic search:
```sql
-- Step 1: Create the Vector Index
CREATE VECTOR INDEX product_embedding_ivf_idx
ON `my_project.ecommerce.product_catalog`(embedding)
OPTIONS(
  index_type = 'IVF',
  distance_type = 'COSINE',
  ivf_options = '{"num_lists": 2000}'
);

-- Step 2: Query with pre-filtering and fraction limits
SELECT
  base.product_id,
  base.title,
  base.category,
  base.price,
  distance
FROM
  VECTOR_SEARCH(
    TABLE (
      SELECT * FROM `my_project.ecommerce.product_catalog`
      WHERE status = 'ACTIVE' AND price BETWEEN 20.00 AND 150.00
    ),
    'embedding',
    (
      SELECT ml_generate_embedding_result
      FROM ML.GENERATE_EMBEDDING(
        MODEL `my_project.ai_models.text_embedding`,
        (SELECT 'breathable waterproof trail running shoes' AS content)
      )
    ),
    top_k => 10,
    distance_type => 'COSINE',
    options => '{"fraction_lists_to_search": 0.05}'
  );
```
*Cites: [Vector SQL in Practice: Embedding Tables, ANN vs. Exact Search](./references/articles.md)*

---

### Blueprint 3: BigQuery Remote MCP Server Configuration for Agents [02.26, 01.26]
Connect Gemini CLI, Claude Code, or Google ADK agents to BigQuery using the official remote MCP server:
```json
{
  "mcpServers": {
    "bigquery": {
      "command": "npx",
      "args": [
        "-y",
        "@google/mcp-bigquery",
        "--project=my-company-analytics",
        "--dataset=marts",
        "--dry-run-bytes-limit=10737418240",
        "--location=US"
      ],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/sa-key.json"
      }
    }
  }
}
```
*Cites: [Getting Started with the BigQuery Remote MCP Server](./references/articles.md) and [Build data analytics agents faster with BigQuery's fully managed remote MCP server](./references/articles.md)*

---

### Blueprint 4: Multimodal Analytics with Gemini Vision on GCS Object Tables [07.25]
Analyze image files stored in Google Cloud Storage directly using standard SQL queries:
```sql
-- 1. Create Object Table referencing raw image blobs in GCS
CREATE OR REPLACE EXTERNAL TABLE `my_project.media.product_images`
WITH CONNECTION `us.vertex-ai-conn`
OPTIONS (
  object_metadata = 'SIMPLE',
  uris = ['gs://my-bucket/products/*.jpg']
);

-- 2. Inspect and classify images using Gemini 1.5 Pro in SQL
SELECT
  uri,
  ml_generate_text_result['candidates'][0]['content']['parts'][0]['text'] AS generated_caption
FROM
  ML.GENERATE_TEXT(
    MODEL `my_project.ai_models.gemini_vision`,
    TABLE `my_project.media.product_images`,
    STRUCT(
      'Describe the product in this image and extract any brand logos or color codes in JSON format.' AS prompt,
      0.2 AS temperature
    )
  );
```
*Cites: [BigQuery Multimodal Analytics](./references/articles.md)*

---

### Blueprint 5: Open-Source Gemma Inference in BigQuery SQL [01.26]
Run open-source Gemma 2 directly within BigQuery slots without standing up separate Vertex AI GPU endpoints:
```sql
-- Register Gemma managed model
CREATE OR REPLACE MODEL `my_project.ai_models.gemma_classifier`
OPTIONS (
  model_type = 'MANAGED_OPEN_MODEL',
  model_name = 'google/gemma-2-9b-it'
);

-- Execute classification over incoming customer tickets
SELECT
  ticket_id,
  customer_text,
  ml_generate_text_result AS sentiment_classification
FROM
  ML.GENERATE_TEXT(
    MODEL `my_project.ai_models.gemma_classifier`,
    (SELECT ticket_id, customer_text, 'Classify ticket as URGENT, NORMAL, or SPAM: ' || customer_text AS prompt FROM `my_project.support.tickets`),
    STRUCT(50 AS max_output_tokens)
  );
```
*Cites: [BigQuery's Managed Inference for Open Models: Your Warehouse is Now an AI Engine](./references/articles.md)*

---

### Blueprint 6: Adaptive Agent Feedback Loop & Observability Table [08.26]
Capture agent execution logs, generated queries, user corrections, and evaluations directly into BigQuery:
```sql
CREATE TABLE IF NOT EXISTS `my_project.agent_telemetry.execution_evals` (
  session_id STRING,
  agent_name STRING,
  user_prompt STRING,
  generated_sql STRING,
  execution_status STRING,
  bytes_billed INT64,
  user_feedback_score INT64, -- +1 or -1
  correction_notes STRING,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(logged_at)
CLUSTER BY agent_name, execution_status;
```
*Cites: [How to Build an Adaptive Feedback Loop for AI Agents in BigQuery](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[09.26]**: TriLink enterprise analytics architecture combining BigQuery AI with agentic service networks.
- **[08.26]**: Adaptive feedback loops and evaluation telemetry for AI Agents querying BigQuery.
- **[07.26]**: Conversational Analytics in BigQuery GA with agentic reasoning and semantic layer integration.
- **[06.26]**: Native BigQuery `VECTOR_SEARCH` eliminates need for dedicated external vector databases; A2A protocol BigQuery Data Engineering Agent.
- **[05.26]**: MCP Authorization and fine-grained OAuth scoping for agentic SQL access.
- **[04.26]**: MCP Toolbox v1.0 released for multi-agent database orchestration; Real-time intelligent triage engine with Continuous Queries.
- **[02.26]**: Autonomous Embedding Generation auto-refreshes vector columns on row insertion; BigQuery Remote MCP Server `@google/mcp-bigquery` GA.
- **[01.26]**: BigQuery Managed Inference for open-weights models (Gemma 2/3) directly in SQL slots.
- **[11.25]**: BigQuery Agent Analytics plugin for ADK; BigQuery AI unified brand launch.
- **[10.25]**: Managed AI Functions in BigQuery (`AI.TRANSLATE`, `AI.SUMMARIZE`, `AI.GENERATE_TABLE`).
- **[08.25]**: MCP Toolbox for Databases released by Google Cloud.
- **[07.25]**: BigQuery Multimodal Analytics evaluating GCS images and PDFs with Gemini Vision in SQL.
- **[02.25]**: LangGraph and Gemini agent workflows for BigQuery data exploration.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen AI/ML Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
