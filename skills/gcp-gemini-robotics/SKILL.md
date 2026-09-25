---
name: gcp-gemini-robotics
description: >-
  Use this skill for Gemini Robotics SDK, Aloha Sim simulation, Edge AI, Local AI,
  LiteRT / LiteRT-LM runtimes, MediaPipe LLM Inference, and the Gemma model family (Gemma 2/3/4, PaliGemma, CodeGemma, Gemma.cpp).
---

# Robotics, Edge AI, Local AI & Gemma Model Family Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- **Robotics & Embodied AI**: Developing spatial perception, arm manipulation, and vision-language-action (VLA) pipelines with **Gemini Robotics SDK**, **Aloha Sim**, or ROS2.
- **Local AI & Offline Inference**: Running LLMs locally without cloud dependencies using **LiteRT** (formerly TensorFlow Lite), **LiteRT-LM**, **MediaPipe GenAI**, **Gemma.cpp**, or **Ollama**.
- **Gemma Model Family**: Fine-tuning, quantizing, and deploying open-weights Google models including **Gemma 4**, **Gemma 3**, **PaliGemma** (Vision-Language), and **DiffusionGemma**.
- **Edge Hardware Acceleration**: Deploying AI to resource-constrained devices (Raspberry Pi 5, Google Coral Edge TPU, NVIDIA Jetson Orin, Qualcomm Snapdragon NPUs, Apple Silicon, and WebGPU in browsers).
- **Local Multi-Modal & Tool Calling**: Building on-device function calling, structured JSON output extraction, and offline Retrieval-Augmented Generation (Local RAG).

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Unquantized FP16/FP32 Deployment on Edge Devices [08.26, 01.26]**
> Attempting to load unquantized FP16/FP32 model weights on single-board computers (SBCs) or mobile chipsets consumes ~5GB of RAM for a 2B model, triggering immediate Out-Of-Memory (OOM) Linux kernel panics.
> - **Mandatory Standard**: Use **LiteRT INT4/INT2 quantization** or **Gemma.cpp 4-bit / 8-bit SFP (Scaled Floating Point)** compression with memory-mapped weights (`mmap`) to keep the working footprint under 1.2GB.
> *Cites: [Mastering Edge AI on Raspberry Pi with LiteRT and Gemma](./references/articles.md) and [LiteRT: High-Performance On-Device AI Runtime for Android, iOS, and Embedded Systems](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Missing Hardware Acceleration Delegates in LiteRT / MediaPipe [03.26, 01.26]**
> Running LiteRT without explicitly specifying a hardware delegate defaults to single-threaded CPU interpretation, yielding unacceptably slow token generation (< 2 tokens/sec).
> - **Mandatory Standard**: Always attach the appropriate backend delegate:
>   - Android / Linux GPU: `GpuDelegate` (OpenCL / Vulkan)
>   - Mobile / PC CPU: `XNNPACK` with multi-threading
>   - Web: `WebGPU` delegate
>   - Qualcomm Edge: `QNN / HTP` NPU delegate
> *Cites: [Running Gemma 3 on Local Hardware with LiteRT and WebGPU](./references/articles.md) and [LiteRT: High-Performance On-Device AI Runtime for Android, iOS, and Embedded Systems](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Direct Motor Actuation without Real-Time Safety Clamping in Robotics VLA Loops [06.25]**
> Vision-Language-Action (VLA) spatial models must never write raw trajectory coordinates directly to physical motor actuators. Stochastic token predictions or hallucinated bounding boxes can drive robotic arms beyond mechanical joint limits.
> - **Mandatory Standard**: All model-predicted waypoint deltas must pass through a local mathematical safety boundary check and velocity clamp running at $\ge 20\text{Hz}$ before transmission to motor drivers.
> *Cites: [Gemini Robotics On-Device brings AI to local robotic devices](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Cloud-Dependent Latency in Autonomous Robotic Reflex Loops [06.25, 10.25]**
> Offloading sub-second physical robot reflexes or obstacle avoidance to remote cloud APIs introduces network jitter (>200ms) and causes catastrophic collisions during temporary packet loss.
> - **Standard Protocol**: Run real-time perception and tactile feedback loops locally on-device using quantized **PaliGemma On-Device** or **LiteRT-LM**, reserving cloud Gemini calls exclusively for high-level tactical mission planning.
> *Cites: [Gemini Robotics On-Device brings AI to local robotic devices](./references/articles.md) and [PaliGemma On-Device: Multimodal Vision-Language Inference for Embedded Systems](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. On-Device & Local AI Engines Matrix [08.26, 01.26]
| Runtime / Framework | Primary Target Hardware | Memory Footprint (2B Model) | Best Suited For |
| :--- | :--- | :--- | :--- |
| **LiteRT / LiteRT-LM** | Android, iOS, Embedded Linux, Qualcomm NPU, Coral TPU | ~600MB – 1.1GB (INT4) | Mobile apps, cross-platform embedded IoT, low-power edge gateways |
| **MediaPipe GenAI** | Web (WebGPU), Android, iOS, Desktop Python | ~1.2GB (INT4) | Turn-key cross-platform app integration, on-device multimodal tasks |
| **Gemma.cpp** | Desktop CPU, Single-Board Computers (Raspberry Pi 5) | ~1.3GB (SFP4) | Zero-dependency standalone C++ embedded systems, high-speed CPU SIMD |
| **Ollama / llama.cpp** | Developer Workstations, Edge Servers (NVIDIA Jetson) | ~1.8GB (Q4_K_M) | Rapid local prototyping, local REST API serving, developer CLI pairing |
| **Gemini Robotics SDK** | Robot Compute Units, Physical Actuators, Aloha Sim | Hybrid Local / Cloud | Real-time spatial reasoning, 6-DoF robotic arm trajectory planning |
*Cites: [Mastering Edge AI on Raspberry Pi with LiteRT and Gemma](./references/articles.md) and [LiteRT: High-Performance On-Device AI Runtime for Android, iOS, and Embedded Systems](./references/articles.md)*

---

### 2. Gemma Model Family Architecture & Quantization Matrix [08.26, 06.26]
| Model | Parameter Scale | Modality | Minimum RAM Footprint | Ideal Serving Tier |
| :--- | :--- | :--- | :--- | :--- |
| **Gemma 4 12B** | 12B Dense | Text / Multimodal | ~8GB (INT4) / ~24GB (FP16) | Cloud Run with NVIDIA L4 GPU or Cloud TPU |
| **Gemma 3 4B** | 4B Dense | Text / Code | ~2.5GB (INT4) | Apple Silicon, Snapdragon X Elite, WebGPU |
| **PaliGemma** | 3B VLM | Vision-Language | ~2.1GB (INT4) | Edge camera defect inspection, spatial navigation |
| **DiffusionGemma** | Multimodal Diffusion | Image / Video Gen | ~12GB (FP16) | Cloud Run serverless GPU inference |
*Cites: [Fine-Tuning and Deploying Gemma 4 at Scale on GEAP and Cloud Run](./references/articles.md) and [Gemma 4 12B: The Developer Guide](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: On-Device Gemma Inference with MediaPipe GenAI (Python) [01.26]
Execute on-device text generation using MediaPipe GenAI task runner:
```python
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python.genai import llm_inference

options = llm_inference.LlmInferenceOptions(
    model_path="/data/models/gemma-2b-it-gpu-int4.bin",
    max_tokens=512,
    temperature=0.7,
    top_k=40,
    random_seed=42
)

with llm_inference.LlmInference.create_from_options(options) as engine:
    prompt = "Explain why local on-device AI improves user privacy in 2 sentences."
    response = engine.generate_response(prompt)
    print(f"Gemma Output:\n{response}")
```
*Cites: [LiteRT: High-Performance On-Device AI Runtime for Android, iOS, and Embedded Systems](./references/articles.md)*

---

### Blueprint 2: Standalone Gemma C++ Execution (`gemma.cpp`) [02.24]
Compile and run Gemma with Highway SIMD vectorization and zero external dependencies:
```bash
# Build lightweight gemma.cpp with Highway SIMD vectorization
cmake -B build -DWEIGHT_TYPE=sfp
cmake --build build -j8

# Run Gemma 2B locally with zero runtime dependencies
./build/gemma \
    --tokenizer /path/to/tokenizer.spm \
    --weights /path/to/2b-it-sfp.sbs \
    --max_generated_tokens 256
```
*Cites: [gemma.cpp: Lightweight Standalone C++ Inference Engine for Gemma](./references/archive.md)*

---

### Blueprint 3: Gemini Robotics SDK Spatial Manipulation Loop [06.25]
Execute a safe, kinematic-validated robotic arm manipulation loop:
```python
import time
from gemini_robotics import SpatialAgent, RobotController

agent = SpatialAgent(model="gemini-robotics-on-device")
robot = RobotController(device_uri="ros2://arm_actuator_0")

def execute_manipulation_step(rgb_camera_frame, task_instruction):
    # 1. Generate 3D spatial bounding boxes and trajectory waypoints
    spatial_plan = agent.plan_action(
        image=rgb_camera_frame,
        instruction=task_instruction
    )
    
    # 2. Enforce local safety boundary clamp
    safe_waypoints = robot.validate_kinematics(spatial_plan.waypoints)
    
    # 3. Stream trajectory to motor controller at 20Hz
    for waypoint in safe_waypoints:
        robot.move_to(waypoint)
        time.sleep(0.05)
```
*Cites: [Gemini Robotics On-Device brings AI to local robotic devices](./references/articles.md)*

---

### Blueprint 4: Deploying Gemma 4 on Cloud Run with NVIDIA L4 GPU [08.26]
Serve Gemma 4 12B containerized on serverless GPU infrastructure:
```bash
gcloud run deploy gemma-4-service \
    --image us-docker.pkg.dev/my-project/models/gemma-4-12b:latest \
    --region us-central1 \
    --no-cpu-throttling \
    --gpu 1 \
    --gpu-type nvidia-l4 \
    --concurrency 4 \
    --memory 32Gi \
    --cpu 8 \
    --timeout 600s \
    --execution-environment gen2
```
*Cites: [Fine-Tuning and Deploying Gemma 4 at Scale on GEAP and Cloud Run](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2024–2026)
- **[08.26]**: Gemma 4 fine-tuning and deployment on GEAP and Cloud Run; LiteRT-LM optimized multi-token prediction.
- **[06.26]**: Gemma 4 12B developer guide; DiffusionGemma image/video foundation models.
- **[05.26]**: TPU inference pipelines for Gemma 4.
- **[03.26]**: Aloha Sim physical robotics simulation benchmarking environment; Gemma 3 on-device deployment guides.
- **[01.26]**: Gemini Robotics SDK official release for multimodal spatial control; LiteRT becomes official name for Google AI Edge runtime.
- **[10.25]**: PaliGemma vision-language fine-tuning for edge camera defect inspection.
- **[06.25]**: Gemini Robotics On-Device brings AI to local robotic hardware and manipulators.
- **[03.25]**: Serverless and edge deployment patterns for Gemma with Cloud Run and on-device runtimes.
- **[02.24]**: Google launches Gemma open model family and `gemma.cpp`.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Robotics & Edge Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
