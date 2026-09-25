---
name: gcp-generative-media
description: >-
  Veo 3.1 cinematic video generation, Gemini Omni Flash conversational video editing,
  DiffusionGemma, Nano Banana prompting, and Vertex AI GenMedia pipelines.
  Activate when generating or iteratively editing video, synthesizing visual assets, or building generative media workflows.
---

# Generative Media, Video Synthesis & Creative AI Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Generating and conversationally editing video with **Gemini Omni Flash** (`gemini-omni-1.1-flash`) via the Interactions API.
- Orchestrating cinematic high-resolution video production with **Veo 3.1** (`veo-3.1-generate-001`) and **Veo 3.1 Lite**.
- Deploying and serving open-weights image generation models like **DiffusionGemma** on Cloud Run with GPUs.
- Crafting production prompts and visual aesthetics with **Nano Banana** and Vertex AI GenMedia toolkits.
- Implementing physics-based motion tracking and sports telemetry using multimodal video reasoning.
- Embedding and validating **SynthID** digital watermarking across media synthesis pipelines.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Stateless One-Off Video Generation without Scene Continuity [09.26, 05.26]**
> Calling disconnected text-to-video generation endpoints for multi-shot video sequences produces jarring continuity shifts, character warping, and inconsistent lighting between cuts.
> - **Mandatory Solution**: Use **Gemini Omni Flash** with the **Interactions API** (`previous_interaction_id`), passing progressive instructions to maintain visual persistence across iterations.
> *Cites: [Generate and edit videos with Gemini Omni Flash](./references/articles.md) and [Introducing Gemini Omni](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Serving DiffusionGemma with CPU-Throttled Serverless Instances [06.26]**
> Deploying DiffusionGemma or image diffusion pipelines on serverless Cloud Run without GPU acceleration and dedicated memory allocation causes extreme cold starts (>90s) and timeout crashes.
> - **Mandatory Solution**: Configure Cloud Run with `--no-cpu-throttling`, attach an NVIDIA L4 GPU (`--gpu 1 --gpu-type nvidia-l4`), and stream model weights using GCS FUSE volume mounts.
> *Cites: [DiffusionGemma: The Developer Guide](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Unconstrained Aspect Ratio & Resolution Submissions [04.26, 10.25]**
> Submitting arbitrary aspect ratios (e.g. `21:9` or unaligned pixel dimensions) to Veo 3.1 endpoints triggers API validation rejections and wasted generation retries.
> - **Standard Protocol**: Restrict video generation requests strictly to standard production configurations: `16:9` (1920x1080), `9:16` (1080x1920), or `1:1` (1080x1080) at 24 fps, specifying durations in allowed 4s, 6s, or 8s increments.
> *Cites: [Veo 3.1](./references/articles.md) and [Veo 3.1 Lite - Model Card](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Omitting SynthID Watermark Verification in Enterprise Pipelines [03.26, 10.25]**
> Publishing AI-generated media without validating imperceptible provenance watermarks creates compliance liability and vulnerability to deepfake spoofing.
> - **Mandatory Standard**: Verify SynthID digital watermark embedding on all output video and image streams before distributing to client applications or media repositories.
> *Cites: [Create without limits: GenMedia on Vertex AI](./references/articles.md) and [Introducing Veo 3.1 and new creative capabilities in the Gemini API](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Generative Video & Image Model Decision Matrix [09.26, 04.26, 06.26]
| Capability | Gemini Omni Flash | Veo 3.1 | Veo 3.1 Lite | DiffusionGemma |
| :--- | :--- | :--- | :--- | :--- |
| **Model ID** | `gemini-omni-1.1-flash` | `veo-3.1-generate-001` | `veo-3.1-lite-generate-001` | `google/diffusion-gemma` |
| **Primary Modality** | Video + Conversational Editing | Cinematic Video | High-Throughput Video | Image Diffusion (Open Weights) |
| **FPS & Durations** | 24 fps, variable | 24 fps, up to 10s | 24 fps, 4s / 6s / 8s | Static images (512–1024px) |
| **Serving Model** | Managed API (Interactions) | Managed API (Async Op) | Managed API (Async Op) | Self-hosted (Cloud Run / GKE) |
| **Best For** | Social content, multi-turn edits | Broadcast advertising, films | High-volume batch rendering | Private VPC, on-prem, edge |
*Cites: [Video generation prompt guide](./references/articles.md), [Veo 3.1 Lite - Model Card](./references/articles.md), and [DiffusionGemma: The Developer Guide](./references/articles.md)*

---

### 2. Generative Media Prompting Paradigm Matrix [09.26, 03.26, 10.25]
| Paradigm | Workflow | Camera Directives | Continuity Control | Target Platform |
| :--- | :--- | :--- | :--- | :--- |
| **Interactions Editing** | Multi-turn conversational delta | Delta updates ("pan right 30°") | `previous_interaction_id` | Gemini Omni Flash |
| **Director's Prompting** | Single comprehensive brief | Explicit lens, lighting, FPS | Seed + reference image | Veo 3.1 |
| **Nano Banana Aesthetics** | Stylized, hyper-consistent | Visual framing descriptors | Prompt weights & tokens | GenMedia on Vertex AI |
*Cites: [The ultimate Nano Banana prompting guide](./references/articles.md) and [The ultimate prompting guide for Veo 3.1](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Gemini Omni Flash Video Generation & Iterative Editing [09.26, 05.26]
Generate an initial video and iteratively refine camera angle and motion using the Interactions API:
```python
from google import genai
from google.genai import types

client = genai.Client()

# 1. Generate base video sequence
initial_interaction = client.interactions.create(
    model="gemini-omni-1.1-flash",
    input="Cinematic tracking shot of an automated logistics warehouse with autonomous mobile robots sorting packages under ambient neon lighting."
)
print(f"Base video generated. Interaction ID: {initial_interaction.id}")

# 2. Perform conversational editing turn while preserving scene continuity
refined_interaction = client.interactions.create(
    model="gemini-omni-1.1-flash",
    previous_interaction_id=initial_interaction.id,
    input="Change camera angle to a low-angle tracking shot and increase package movement speed by 20%."
)
print(f"Refined video ready: {refined_interaction.id}")
```
*Cites: [Generate and edit videos with Gemini Omni Flash](./references/articles.md) and [Introducing Gemini Omni](./references/articles.md)*

---

### Blueprint 2: Veo 3.1 Cinematic Video Generation Pipeline [04.26, 10.25]
Submit an asynchronous video generation operation with exact duration and framerate parameters:
```python
import time
from google.genai import Client, types

client = Client()

operation = client.models.generate_videos(
    model="veo-3.1-generate-001",
    prompt=(
        "Aerial view of modern offshore floating wind turbines rotating smoothly above deep blue ocean waves, "
        "morning fog dissipating in golden sunlight, 4k ultra-realistic documentary footage, steady drone glide"
    ),
    config=types.GenerateVideosConfig(
        aspect_ratio="16:9",
        duration_seconds=6,
        fps=24
    )
)

print(f"Veo 3.1 operation submitted: {operation.name}")

# Poll operation until complete
while not operation.done:
    print("Generating video...")
    time.sleep(10)
    operation = client.operations.get(operation)

video_uri = operation.result.generated_videos[0].video.uri
print(f"Video generation successful. Cloud Storage URI: {video_uri}")
```
*Cites: [Veo 3.1](./references/articles.md) and [The ultimate prompting guide for Veo 3.1](./references/articles.md)*

---

### Blueprint 3: Deploying DiffusionGemma on Cloud Run with NVIDIA L4 GPU [06.26]
Host image diffusion models on serverless GPU infrastructure with GCS model weight streaming:
```bash
gcloud run deploy diffusion-gemma-service \
    --image us-docker.pkg.dev/my-project/diffusion/diffusion-gemma:v1.0 \
    --region us-central1 \
    --no-cpu-throttling \
    --gpu 1 \
    --gpu-type nvidia-l4 \
    --concurrency 1 \
    --timeout 600s \
    --execution-environment gen2 \
    --set-env-vars="MODEL_PATH=/mnt/gcs/diffusion_gemma_weights" \
    --add-volume=name=weights-vol,type=cloud-storage,bucket=diffusion-models-bucket \
    --add-volume-mount=volume=weights-vol,mount-path=/mnt/gcs
```
*Cites: [DiffusionGemma: The Developer Guide](./references/articles.md)*

---

### Blueprint 4: Nano Banana Stylized Visual Asset Synthesis [03.26]
Synthesize consistent visual brand assets using Nano Banana prompt composition:
```python
from google import genai
from google.genai import types

client = genai.Client()

prompt = (
    "Nano Banana style: minimal 3D isometric illustration of a cloud data center, "
    "matte pastel color palette, soft global illumination, clean geometric vectors, high resolution"
)

response = client.models.generate_images(
    model="imagen-3.0-generate-002",
    prompt=prompt,
    config=types.GenerateImagesConfig(
        number_of_images=1,
        output_mime_type="image/jpeg",
        aspect_ratio="1:1"
    )
)

print(f"Asset generated successfully with SynthID watermark: {len(response.generated_images)} image(s)")
```
*Cites: [The ultimate Nano Banana prompting guide](./references/articles.md) and [Create without limits: GenMedia on Vertex AI](./references/articles.md)*

---

### Blueprint 5: Multimodal Video Physics & Motion Trajectory Analysis [02.26]
Analyze athlete motion dynamics, trajectory angles, and velocity curves from video frames:
```python
from google import genai
from google.genai import types

client = genai.Client()

video_file = client.files.upload(file="snowboard_halfpipe_jump.mp4")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        video_file,
        (
            "Analyze the athlete's halfpipe jump in this video. Extract: "
            "1. Takeoff angle and launch velocity estimate. "
            "2. Maximum vertical amplitude above the pipe lip. "
            "3. Number of rotational degrees and axis of rotation. "
            "Output the telemetry in valid JSON format."
        )
    ],
    config=types.GenerateContentConfig(
        response_mime_type="application/json"
    )
)

print(response.text)
```
*Cites: [Using Google Cloud AI to measure the physics of U.S. freestyle snowboarding and skiing](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[09.26]**: Gemini Omni Flash (`gemini-omni-1.1-flash`) video generation and conversational editing via Interactions API; Video generation prompt guide.
- **[08.26]**: Gemini Omni Flash model card release detailing visual synthesis architecture.
- **[06.26]**: DiffusionGemma developer guide for open-weights image generation pipelines.
- **[05.26]**: Google DeepMind introduces Gemini Omni multimodal generative foundation model.
- **[04.26]**: Veo 3.1 and Veo 3.1 Lite high-throughput 24fps video generation previews.
- **[03.26]**: Nano Banana aesthetic prompting guide; GenMedia on Vertex AI webinar series.
- **[02.26]**: Multimodal video physics tracking applied to U.S. freestyle snowboarding and skiing.
- **[10.25]**: Veo 3.1 launch in Gemini API and creative prompting guides.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Generative Media Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
