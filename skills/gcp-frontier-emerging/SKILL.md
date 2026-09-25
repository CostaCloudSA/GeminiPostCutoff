---
name: gcp-frontier-emerging
description: >-
  Gemma open models (Gemma 4 12B, Gemma 3), Cloud TPUs (v5p/v6e), JAX distributed sharding,
  Supervised Fine-Tuning (SFT), HBM memory optimization, and Gemini Enterprise Agent Platform (GEAP).
  Activate when fine-tuning or serving Gemma models, optimizing JAX workloads on TPUs, or scaling enterprise agent platforms.
---

# Gemma Open Models, Cloud TPUs & Frontier Fine-Tuning Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Fine-tuning, serving, and quantizing **Gemma open models** (Gemma 4 12B, Gemma 3, CodeGemma) on Cloud Run, GKE, or Cloud TPUs.
- Scaling distributed training and inference workloads with **JAX on Cloud TPUs** (v5p, v6e Trillium).
- Profiling High-Bandwidth Memory (HBM), collective communications, and XLA compilation stalls.
- Deploying and migrating enterprise agent platforms with **Gemini Enterprise Agent Platform (GEAP)**.
- Executing **Supervised Fine-Tuning (SFT)** on Gemini foundation models in Vertex AI Studio.
- Benchmarking and validating RAG retrieval pipelines using **DeepEval** and Vertex AI Vector Search 2.0.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Unsharded JAX Arrays Causing High-Bandwidth Memory (HBM) OOMs [01.26, 12.25]**
> In distributed JAX workloads on Cloud TPU v5p/v6e pods, failing to explicitly specify sharding rules via `jax.sharding.NamedSharding` defaults large weight tensors to host memory or replica 0, crashing TPU pods.
> - **Mandatory Standard**: Use `shard_map` or `pjit` with explicit mesh coordinate partitions (`Mesh(devices, ('data', 'model'))`).
> *Cites: [A Developer's Guide to Debugging JAX on Cloud TPUs: Essential Tools and Techniques](./references/articles.md) and [Decoding high-bandwidth memory: A practical guide to GPU memory for fine-tuning AI models](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Serving Gemma 4 with CPU-Throttled Serverless Instances [08.26, 06.26]**
> Deploying Gemma 4 12B on Cloud Run with default serverless configurations causes extreme cold starts and severe inference latency stalls during model weight dequantization.
> - **Mandatory Solution**: Configure Cloud Run with `--no-cpu-throttling`, attach an NVIDIA L4 GPU (`--gpu 1 --gpu-type nvidia-l4`), and stream weights using GCS FUSE volume mounts.
> *Cites: [Fine-Tuning and Deploying Gemma 4 at Scale on Gemini Enterprise Agent Platform (GEAP) and Cloud Run](./references/articles.md) and [Gemma 4 12B: The Developer Guide](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 3: Fine-Tuning Gemini Foundation Models without Baselines [01.25]**
> Submitting expensive Supervised Fine-Tuning (SFT) jobs without prior prompt engineering, context caching, or few-shot baselining often yields negligible accuracy gains at significant cost.
> - **Standard Protocol**: Benchmark 200+ representative validation examples on Gemini 2.5 Flash using few-shot prompts and Context Caching before committing to an SFT run.
> *Cites: [Supervised Fine Tuning for Gemini: A best practices guide](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 4: Unmonitored Foundation Model Invocation without Centralized Telemetry [04.26, 01.25]**
> Invoking frontier models without central logging and audit metrics allows prompt injections, safety policy violations, and unexpected billing spikes to pass completely undetected.
> - **Mandatory Standard**: Route all model traffic through **Cloud Logging with Token Usage Metrics** and enforce Vertex AI Model Armor across all enterprise projects.
> *Cites: [Understand how your Users are using Gemini: Cloud Logging and Monitoring Support](./references/articles.md) and [How to Secure Vertex AI in 2026: The Minimum Security Baseline for Generative AI on Google Cloud](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 5: Subjective RAG Quality Validation without Automated Metrics [01.25]**
> Evaluating RAG retrieval pipelines solely through subjective manual spot-checks fails to detect retrieval drift, hallucinated answers, or low context relevance across diverse queries.
> - **Solution**: Implement continuous automated evaluation using **DeepEval** measuring Faithfulness, Answer Relevance, and Contextual Precision against a golden test dataset.
> *Cites: [RAG Evaluation — A Step-by-Step Guide with DeepEval](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Open-Weights Gemma Serving Infrastructure Decision Matrix [08.26, 05.26]
| Infrastructure | Model Scale | Cold Start Profile | Cost Model | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Cloud Run + NVIDIA L4** | Gemma 4 (2B–12B) | Moderate (~20s with FUSE) | Scale-to-zero per-second | Intermittent workloads, webhooks |
| **GKE Autopilot + A100/H100** | Gemma 4 (12B–27B) | Fast (Warm pod pool) | Provisioned cluster nodes | High-concurrency enterprise microservices |
| **Cloud TPU v5e / v6e** | Gemma 4 12B / Distributed | Ultra-fast (JAX XLA) | Committed TPU slices | High-throughput batch inference & training |
*Cites: [Serve and Inference Gemma 4 on TPU](./references/articles.md) and [Fine-Tuning and Deploying Gemma 4 at Scale on Gemini Enterprise Agent Platform (GEAP) and Cloud Run](./references/articles.md)*

---

### 2. Model Adaptation Strategy Decision Matrix [01.25, 02.26]
| Strategy | Compute Cost | Latency Impact | Data Requirement | When to Use |
| :--- | :--- | :--- | :--- | :--- |
| **Context Caching** | Low ($0.025/1M token hr) | Low (-60% TTFT) | None (Prompt only) | Static repositories, system manuals |
| **Vertex RAG Engine** | Low (Vector index queries) | Moderate (+150ms) | Unstructured chunks | Dynamic knowledge base updates |
| **Supervised Fine-Tuning** | High (TPU/GPU hours) | Baseline model latency | 500–5,000 golden pairs | Domain dialect, strict JSON adherence |
*Cites: [Supervised Fine Tuning for Gemini: A best practices guide](./references/articles.md) and [Vertex AI Context Caching with Gemini](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Gemma 4 Inference on Cloud TPU v5e with JAX [05.26, 08.26]
Serve Gemma 4 using JAX with optimized TPU device layout:
```python
import jax
import jax.numpy as jnp
from transformers import AutoTokenizer, FlaxAutoModelForCausalLM

model_id = "google/gemma-4-12b"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = FlaxAutoModelForCausalLM.from_pretrained(model_id, dtype=jnp.bfloat16)

# Verify Cloud TPU acceleration
devices = jax.devices()
print(f"Executing Gemma 4 inference across {len(devices)} TPU cores: {devices[0].device_kind}")

prompt = "Explain the mechanics of High-Bandwidth Memory (HBM) sharding in distributed AI systems."
inputs = tokenizer(prompt, return_tensors="jax")
outputs = model.generate(**inputs, max_new_tokens=128)
print(tokenizer.decode(outputs.sequences[0], skip_special_tokens=True))
```
*Cites: [Serve and Inference Gemma 4 on TPU](./references/articles.md) and [Gemma in the Cloud](./references/articles.md)*

---

### Blueprint 2: JAX TPU Mesh Sharding & Memory Profiling [01.26, 12.25]
Configure 2D tensor mesh sharding across Cloud TPU v5e/v6e pods:
```python
import jax
import jax.numpy as jnp
from jax.sharding import Mesh, PartitionSpec as P, NamedSharding

# 1. Initialize TPU Device Mesh (2 data parallel, 4 model parallel)
devices = jax.devices()
mesh = Mesh(devices.reshape((2, 4)), ('data', 'model'))

# 2. Define Named Sharding for Weight Matrix
weight_sharding = NamedSharding(mesh, P('model', 'data'))

@jax.jit
def forward_pass(x, weights):
    # Synchronized matrix multiplication across TPU cores
    return jnp.matmul(x, weights)

print(f"JAX running on {len(devices)} TPU cores with mesh: {mesh.shape}")
```
*Cites: [A Developer's Guide to Debugging JAX on Cloud TPUs: Essential Tools and Techniques](./references/articles.md) and [Decoding high-bandwidth memory: A practical guide to GPU memory for fine-tuning AI models](./references/articles.md)*

---

### Blueprint 3: Vertex AI Supervised Fine-Tuning (SFT) Submission [01.25]
Launch a managed SFT pipeline for Gemini using the official Google GenAI SDK:
```python
from google.cloud import aiplatform

aiplatform.init(project="my-gcp-project", location="us-central1")

tuning_job = aiplatform.CustomJob.from_local_script(
    display_name="gemini-flash-sft-v1",
    script_path="train.py",
    container_uri="us-docker.pkg.dev/vertex-ai/training/tf-gpu.2-14.py310:latest",
    requirements=["google-genai>=1.0.0"],
    replica_count=1,
    machine_type="a2-highgpu-1g", # NVIDIA A100 40GB
    args=[
        "--train_data_path", "gs://my-bucket/training_pairs.jsonl",
        "--validation_data_path", "gs://my-bucket/validation_pairs.jsonl",
        "--epochs", "3",
        "--learning_rate", "0.0001"
    ]
)

tuning_job.run()
```
*Cites: [Supervised Fine Tuning for Gemini: A best practices guide](./references/articles.md)*

---

### Blueprint 4: Continuous RAG Pipeline Evaluation with DeepEval [01.25]
Validate retrieval precision, answer faithfulness, and hallucination rates in Vertex AI search:
```python
from deepeval import evaluate
from deepeval.metrics import FaithfulnessMetric, ContextualPrecisionMetric
from deepeval.test_case import LLMTestCase

# 1. Define evaluation metric thresholds
faithfulness = FaithfulnessMetric(threshold=0.8, model="gemini-2.5-flash")
precision = ContextualPrecisionMetric(threshold=0.7, model="gemini-2.5-flash")

# 2. Build test case with retrieved contexts
test_case = LLMTestCase(
    input="What is the crossover threshold for BigQuery slot commitments vs on-demand?",
    actual_output="The mathematical crossover point is approximately 690 TB per month.",
    retrieval_context=["BigQuery enterprise slot commitments break even with on-demand pricing at roughly 690 TB processed monthly."]
)

# 3. Execute automated regression evaluation
evaluate(test_cases=[test_case], metrics=[faithfulness, precision])
```
*Cites: [RAG Evaluation — A Step-by-Step Guide with DeepEval](./references/articles.md)*

---

### Blueprint 5: Deploying Gemma 4 on Cloud Run with NVIDIA L4 GPU [08.26, 06.26]
Host Gemma 4 on serverless GPU infrastructure with GCS model weight streaming:
```bash
gcloud run deploy gemma-4-service \
    --image us-docker.pkg.dev/my-project/gemma/gemma-4-12b:v1.0 \
    --region us-central1 \
    --no-cpu-throttling \
    --gpu 1 \
    --gpu-type nvidia-l4 \
    --concurrency 1 \
    --timeout 600s \
    --execution-environment gen2 \
    --set-env-vars="MODEL_PATH=/mnt/gcs/gemma_weights" \
    --add-volume=name=weights-vol,type=cloud-storage,bucket=gemma-models-bucket \
    --add-volume-mount=volume=weights-vol,mount-path=/mnt/gcs
```
*Cites: [Fine-Tuning and Deploying Gemma 4 at Scale on Gemini Enterprise Agent Platform (GEAP) and Cloud Run](./references/articles.md) and [Gemma 4 12B: The Developer Guide](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[08.26]**: Gemma in the Cloud guide; Fine-tuning Gemma 4 at scale on GEAP and Cloud Run.
- **[07.26]**: Gemini Managed Agents run background asynchronous workflows.
- **[06.26]**: Gemma 4 12B developer guide; Vertex AI transitions to Gemini Enterprise Agent Platform (GEAP).
- **[05.26]**: Serving and inferencing Gemma 4 on Cloud TPUs; Developer guide to GEAP and A2UI.
- **[04.26]**: Minimum security baseline for GenAI on GCP; Performance vs cost optimization.
- **[03.26]**: Building RAG pipelines with Gemini 2.5 and Vertex AI Vector Search.
- **[02.26]**: Gemini Enterprise Agent Ready (GEAR) program launched; Terraform deployments.
- **[01.26]**: JAX TPU debugging and profiling guides; Semantic search in AI agents.
- **[12.25]**: Decoding high-bandwidth memory (HBM) for model fine-tuning; Vertex AI Vector Search 2.0.
- **[11.25]**: AlloyDB automated vector indexing and embeddings.
- **[10.25]**: LLM-Evalkit prompt engineering framework on Google Cloud.
- **[08.25]**: Decoupled ML pipelines on Vertex AI.
- **[01.25]**: Supervised Fine-Tuning best practices on Vertex AI; RAG evaluation with DeepEval.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Frontier AI Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
