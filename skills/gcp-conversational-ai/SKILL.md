---
name: gcp-conversational-ai
description: >-
  Dialogflow CX, CCAI Platform, Gemini Live API on Vertex AI,
  BigQuery Conversational Analytics, and real-time telephony voice agents.
  Activate when implementing voice agents, telephony integrations, conversational analytics, or contact center AI.
---

# Conversational AI, Contact Center (CCAI) & Voice Agents Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Designing real-time, low-latency voice agents with the **Gemini Live API** on Vertex AI (native audio-to-audio).
- Integrating conversational AI with enterprise PBX and telephony systems via **FreeSWITCH**, Asterisk, or SIP trunks.
- Implementing conversational database querying using the **BigQuery Conversational Analytics API**.
- Tuning voice expressiveness, emotion, and pace using **Gemini 3.1 Flash TTS (Text-to-Speech)**.
- Building and executing automated CI/CD regression testing suites for **Dialogflow CX** agents.
- Evaluating real-time voice agents on turn-taking, latency, and task completion with the **ADK Voice Evaluation Framework**.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: The Cascading STT -> LLM -> TTS Pipeline Latency Trap [12.25]**
> Chaining legacy Speech-to-Text (STT) $\to$ text LLM $\to$ Text-to-Speech (TTS) introduces 1,500ms–3,000ms of end-to-end latency, destroys conversational prosody, and completely loses caller emotional nuances (pitch, sarcasm, agitation).
> - **Mandatory Solution**: Standardize on **Gemini Live API** on Vertex AI (powered by Gemini 2.5/3 Flash Native Audio), which operates end-to-end audio-to-audio over a single bidirectional WebSocket connection with sub-400ms latency.
> *Cites: [Gemini Live API Now GA on Vertex AI](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 2: Streaming Raw 8kHz G.711 Telephony Audio Directly to Live API [02.26]**
> Feeding raw 8kHz mu-law audio directly from SIP trunks into the Gemini Live API without resampling causes severe acoustic distortion and hallucinated transcriptions.
> - **Solution**: Resample telephony audio in the telephony gateway (FreeSWITCH) to raw **linear PCM 16-bit mono at 16kHz or 24kHz** before streaming to Google Cloud.
> *Cites: [Gemini Live — Part 1: Building a low-latency, telephone Voice Agent with FreeSWITCH](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 3: Asking Voice LLMs to Generate Raw SQL Against Production Tables [07.26, 02.26]**
> Prompting voice models to write raw SQL directly on customer databases risks syntax errors, runaway full-table scans, and schema injection vulnerabilities over the phone.
> - **Solution**: Route all natural language data inquiries through the **BigQuery Conversational Analytics API**, which enforces semantic schemas, applies project-level row/column policies, and returns verified analytical answers.
> *Cites: [Conversational analytics in BigQuery brings trusted agentic reasoning to everyone](./references/articles.md) and [Using GCP Conversational Analytics (BigQuery) from ADK tools](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Deploying Dialogflow CX Flows without Automated Testing Suites [10.25]**
> Manually clicking through Dialogflow CX console simulators fails to detect subtle intent conflicts or regression breaks in conditional routes across large enterprise trees.
> - **Solution**: Implement automated Dialogflow CX testing suites that execute golden conversation traces in CI/CD pipelines prior to publishing environment tags.
> *Cites: [Building a Dialogflow CX Testing Suite: From Concept to Production](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Voice Agent Architecture Selection Matrix [12.25, 02.26]
| Dimension | Gemini Live API (Native Audio) | Cascading STT + LLM + TTS | Dialogflow CX Phone Gateway |
| :--- | :--- | :--- | :--- |
| **End-to-End Latency** | **< 400ms (Real-time conversational)** | 1,500ms – 3,500ms (High delay) | 800ms – 1,200ms |
| **Affective Dialogue** | **Native acoustic pitch, pace & tone** | None (Text-only emotional state) | Rule-based SSML tags |
| **Barge-In Handling** | **Intelligent contextual interruption** | Naive energy-based VAD cutoff | Fixed audio threshold cutoff |
| **Best For** | Free-form support, interactive voice agents | Legacy pipeline migrations | Strict deterministic IVR menus |

---

### 2. Conversational Data Access Matrix [07.26, 02.26]
| Strategy | Implementation | Security & Governance | Best For |
| :--- | :--- | :--- | :--- |
| **Conversational Analytics API** | Google-managed semantic reasoning | Native IAM, Row-Level Security, audit trails | Enterprise business users, voice querying |
| **ADK MCP BigQuery Tool** | Deterministic parameterized queries | Controlled via MCP server authorization | Automated agent workflows, data engineering |
| **Direct Model SQL Generation** | Raw prompt engineering | High risk of SQL injection and slot burn | Ad-hoc developer exploration only |

---

## 🛠️ Production Blueprints

### Blueprint 1: Gemini Live API Bidirectional WebSocket Streamer [12.25, 02.26]
Establish a real-time, low-latency audio stream with affective dialogue configuration:
```python
import asyncio
import json
import websockets

VERTEX_LIVE_URL = (
    "wss://us-central1-aiplatform.googleapis.com/ws/"
    "google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent"
)

async def connect_voice_agent(bearer_token: str):
    headers = {"Authorization": f"Bearer {bearer_token}"}
    
    async with websockets.connect(VERTEX_LIVE_URL, extra_headers=headers) as ws:
        # 1. Send Session Setup Message
        setup_payload = {
            "setup": {
                "model": "projects/my-gcp-project/locations/us-central1/publishers/google/models/gemini-2.5-flash-native-audio",
                "generation_config": {
                    "response_modalities": ["AUDIO"],
                    "speech_config": {
                        "voice_config": {
                            "prebuilt_voice_config": {
                                "voice_name": "Aoede" # Expressive conversational voice
                            }
                        }
                    }
                },
                "system_instruction": {
                    "parts": [{"text": "You are a helpful customer concierge. Maintain a calm, empathetic tone. Answer succinctly."}]
                }
            }
        }
        await ws.send(json.dumps(setup_payload))
        
        # 2. Receive setup acknowledgement
        initial_ack = await ws.recv()
        print("Live API session initialized:", initial_ack)

        # 3. Handle live audio streaming loop
        async def send_audio_chunks(audio_stream):
            for chunk in audio_stream:
                realtime_input = {
                    "realtime_input": {
                        "media_chunks": [{
                            "mime_type": "audio/pcm;rate=16000",
                            "data": chunk # Base64 encoded 16kHz PCM
                        }]
                    }
                }
                await ws.send(json.dumps(realtime_input))
                await asyncio.sleep(0.02) # 20ms audio slices

        async def receive_agent_audio():
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                if "serverContent" in data:
                    model_turn = data["serverContent"].get("modelTurn", {})
                    for part in model_turn.get("parts", []):
                        if "inlineData" in part:
                            # Playback audio chunk to caller
                            play_audio(part["inlineData"]["data"])

        await asyncio.gather(receive_agent_audio())
```
*Cites: [Gemini Live API Now GA on Vertex AI](./references/articles.md) and [Gemini Live — Part 1: Building a low-latency, telephone Voice Agent](./references/articles.md)*

---

### Blueprint 2: BigQuery Conversational Analytics from ADK Tools [07.26, 02.26]
Allow conversational agents to query enterprise datasets safely without generating vulnerable SQL:
```python
from google.cloud import bigquery_dataplex_v1
from google.adk import Agent, Tool

# Initialize Conversational Analytics Client
client = bigquery_dataplex_v1.DataTaxonomyServiceClient()

@Tool
def query_business_kpis(natural_language_question: str) -> dict:
    """Queries enterprise metrics via the BigQuery Conversational Analytics API."""
    request = {
        "parent": "projects/my-project/locations/us-central1",
        "query": natural_language_question,
        "context": {
            "dataset": "projects/my-project/datasets/sales_analytics"
        }
    }
    # Executes trusted semantic translation with governed row-level access
    response = client.generate_data_insights(request=request)
    return {
        "summary": response.summary_text,
        "data_table": response.tabular_results,
        "confidence": response.confidence_score
    }

voice_agent = Agent(
    name="ExecutiveVoiceConcierge",
    model="gemini-2.5-flash",
    instruction="Answer executive revenue queries using query_business_kpis.",
    tools=[query_business_kpis]
)
```
*Cites: [Conversational analytics in BigQuery brings trusted agentic reasoning to everyone](./references/articles.md) and [Using GCP Conversational Analytics (BigQuery) from ADK tools](./references/articles.md)*

---

### Blueprint 3: Expressive Speech Prompting with Gemini 3.1 Flash TTS [04.26]
Control pacing, emphasis, and emotion in generated speech using explicit SSML-style prompts:
```python
from google.cloud import texttospeech_v1beta1

tts_client = texttospeech_v1beta1.TextToSpeechClient()

def generate_expressive_voice(text: str) -> bytes:
    # Use Gemini 3.1 Flash TTS model
    input_text = texttospeech_v1beta1.SynthesisInput(
        text=f"[tone: warm, professional] [pace: standard] {text}"
    )
    voice = texttospeech_v1beta1.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Journey-F",
        model="gemini-3.1-flash-tts"
    )
    audio_config = texttospeech_v1beta1.AudioConfig(
        audio_encoding=texttospeech_v1beta1.AudioEncoding.LINEAR16,
        sample_rate_hertz=24000
    )
    response = tts_client.synthesize_speech(
        input=input_text, voice=voice, audio_config=audio_config
    )
    return response.audio_content
```
*Cites: [Guide to prompting Gemini 3.1 Flash TTS (text-to-speech)](./references/articles.md)*

---

### Blueprint 4: Automated Dialogflow CX Regression Testing Suite [10.25, 08.26]
Automate intent matching and conversation flow validation in CI/CD pipelines before deploying agent changes:
```python
from google.cloud import dialogflowcx_v3

test_client = dialogflowcx_v3.TestCasesClient()

def run_automated_cx_test(project_id: str, agent_id: str, test_case_id: str) -> bool:
    """Executes an end-to-end test case against a Dialogflow CX agent environment."""
    parent = f"projects/{project_id}/locations/global/agents/{agent_id}"
    name = f"{parent}/testCases/{test_case_id}"
    
    request = dialogflowcx_v3.RunTestCaseRequest(
        name=name,
        environment=f"{parent}/environments/staging"
    )
    operation = test_client.run_test_case(request=request)
    result = operation.result()
    
    # Returns True if test case passed with identical intent triggers
    return result.test_result.test_result == dialogflowcx_v3.TestResult.PASSED
```
*Cites: [Building a Dialogflow CX Testing Suite: From Concept to Production](./references/articles.md) and [How to Evaluate Live & Voice Agents in ADK](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[08.26]**: Voice and Live agent evaluation framework released in ADK.
- **[07.26]**: Conversational Analytics in BigQuery reaches General Availability (GA).
- **[04.26]**: Gemini 3.1 Flash TTS guide for expressive speech prompting.
- **[02.26]**: Telephony voice agent with FreeSWITCH and Gemini Live; BigQuery Conversational Analytics API integration.
- **[12.25]**: Gemini Live API GA on Vertex AI with native bidirectional audio streaming; Conversational Genomics domain agents.
- **[10.25]**: Automated Dialogflow CX testing suites and CI/CD validation.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Conversational AI Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
