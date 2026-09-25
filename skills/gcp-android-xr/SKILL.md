---
name: gcp-android-xr
description: >-
  Use this skill when designing, developing, and optimizing spatial computing applications
  with the Android XR SDK and spatial UI guidelines.
---

# Android XR Spatial Computing & Jetpack XR Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Designing and developing spatial applications for **Android XR** headsets and glasses.
- Building reactive 3D spatial user interfaces with **Jetpack XR Compose** and **SceneCore**.
- Anchoring virtual entities and persistent content into physical spaces using **ARCore for Jetpack XR**.
- Optimizing graphics rendering, frame pacing, and battery longevity for Unity or native Vulkan XR apps.
- Implementing multimodal spatial input handling (eye gaze, pinch gestures, 6-DoF controllers).

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Unoptimized High-Polygon Meshes Dropping Frame Rates Below 90Hz [10.25]**
> Rendering complex, uncompressed 3D models or unculled meshes on mobile XR chipsets forces frame rates to drop below the critical 90 fps threshold, causing visual judder and acute simulator motion sickness.
> - **Mandatory Standard**: Enforce ASTC texture compression, Level of Detail (LOD) mesh hierarchies, and foveated rendering. Keep draw calls under 100 per eye and poly counts within mobile XR thermal envelopes.
> *Cites: [Optimizing Performance for Android XR with Unity](./references/articles.md) and [Getting started with Unity and Android XR](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 2: Hardcoding 2D Screen Dimensions in Spatial UI Panels [08.26, 10.25]**
> Treating Android XR panels like fixed 2D phone screens with absolute pixel coordinates causes UI windows to clip through physical walls, float at uncomfortable focal planes, or fail to rescale with user distance.
> - **Mandatory Standard**: Utilize **Jetpack XR Compose** `SpatialPanel`. Configure dynamic depth z-offsets, billboard rotation constraints, and comfortable vergence-accommodation distance boundaries (0.75m to 2.0m).
> *Cites: [Jetpack XR SDK Libraries Reach Beta](./references/articles.md) and [Learn Android XR Fundamentals](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 3: Unthrottled Spatial Eye & Hand Polling on the Main UI Thread [08.26, 10.25]**
> Polling continuous 6-DoF hand tracking joints and eye gaze vectors directly on the main Android UI thread causes CPU core saturation, frame drops, and rapid device thermal throttling.
> - **Standard Protocol**: Decouple spatial input pipelines onto dedicated background Kotlin Coroutine dispatchers. Subsample continuous tracking streams and trigger UI events only when gesture confidence thresholds (e.g., pinch down) are satisfied.
> *Cites: [Jetpack XR SDK Libraries Reach Beta](./references/articles.md) and [Learn Android XR Fundamentals](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Spawning Unanchored 3D Content Intersecting Physical Geometry [10.25]**
> Placing virtual 3D objects at arbitrary world coordinates without spatial tracking leads to floating objects that intersect physical floors, desks, and obstacles when users walk around the room.
> - **Standard Protocol**: Query the **ARCore for Jetpack XR** perception engine to identify stable horizontal and vertical planes. Attach all interactive 3D assets to validated spatial anchors (`AnchorEntity`).
> *Cites: [Getting started with Unity and Android XR](./references/articles.md) and [5 things you need to know about publishing for Android XR](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Spatial Computing Development Framework Matrix [08.26, 10.25]
| Framework | Primary Language | 3D Rendering Capabilities | Ideal Workload |
| :--- | :--- | :--- | :--- |
| **Jetpack XR Compose** | Kotlin | Spatial panels, 2.5D windows, SceneCore entities | Productivity apps, enterprise tools, media players |
| **Unity for Android XR** | C# | High-fidelity 3D graphics, physics simulations | Spatial games, training simulators, interactive 3D |
| **OpenXR Native (Vulkan)** | C++ | Low-level hardware control, custom rendering engines | Custom 3D engines, ultra-low latency telepresence |
| **WebXR in Browser** | JavaScript / WebGL | Lightweight browser-based spatial experiences | Quick spatial demos, e-commerce product previews |
*Cites: [Jetpack XR SDK Libraries Reach Beta](./references/articles.md) and [Getting started with Unity and Android XR](./references/articles.md)*

---

### 2. Spatial UI Anchor & Placement Strategy Matrix [08.26, 10.25]
| Placement Strategy | Coordinate Frame | Head Movement Reaction | Recommended Use Case |
| :--- | :--- | :--- | :--- |
| **World-Locked (Anchor)** | Physical Room | Stays fixed in physical space | Virtual monitor, persistent whiteboard, tabletop game |
| **Body-Relative (Billboard)** | User Centric | Follows user at set distance with soft lag | Main navigation panel, media playback controls |
| **Head-Locked (HUD)** | Camera / Eye | Rigidly stuck to user vision field | Emergency warnings, low battery alerts only |
| **Surface-Snapped** | Detected AR Plane | Snaps to physical table or wall | Product placement, AR tabletop visualizations |
*Cites: [Jetpack XR SDK Libraries Reach Beta](./references/articles.md) and [Learn Android XR Fundamentals](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: Jetpack XR Compose SpatialPanel Application (Kotlin) [08.26, 10.25]
Construct a spatial UI panel floating comfortably in the user's augmented environment:
```kotlin
package com.example.xr.ui

import androidx.compose.runtime.Composable
import androidx.xr.compose.spatial.SpatialPanel
import androidx.xr.compose.subspace.layout.SubspaceModifier
import androidx.xr.compose.subspace.layout.movable
import androidx.xr.compose.subspace.layout.resizable
import androidx.compose.material3.Text
import androidx.compose.material3.Card
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun EnterpriseSpatialDashboard() {
    SpatialPanel(
        modifier = SubspaceModifier
            .movable()
            .resizable()
    ) {
        Card(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Android XR Enterprise Analytics Dashboard",
                modifier = Modifier.padding(24.dp)
            )
        }
    }
}
```
*Cites: [Jetpack XR SDK Libraries Reach Beta](./references/articles.md) and [Learn Android XR Fundamentals](./references/articles.md)*

---

### Blueprint 2: Anchoring 3D Entities with ARCore Jetpack XR (Kotlin) [08.26, 10.25]
Attach a 3D model entity to a detected physical plane in the user's room:
```kotlin
package com.example.xr.spatial

import androidx.xr.scenecore.Entity
import androidx.xr.scenecore.GltfModelEntity
import androidx.xr.scenecore.Session
import androidx.xr.arcore.Anchor
import androidx.xr.arcore.Plane

fun attachModelToDetectedPlane(
    session: Session,
    targetPlane: Plane,
    gltfModelUri: String
): Entity {
    // 1. Create a persistent spatial anchor at the center of the detected plane
    val anchor: Anchor = targetPlane.createAnchor(targetPlane.centerPose)
    
    // 2. Instantiate and attach 3D model entity to the spatial anchor
    val modelEntity = GltfModelEntity.create(
        session = session,
        modelPath = gltfModelUri
    )
    
    modelEntity.setParent(anchor)
    return modelEntity
}
```
*Cites: [Jetpack XR SDK Libraries Reach Beta](./references/articles.md) and [Getting started with Unity and Android XR](./references/articles.md)*

---

### Blueprint 3: Unity Android XR Performance Optimization Profile [10.25]
Configure Unity Project Settings to maximize Android XR frame rates and battery efficiency:
```csharp
using UnityEngine;
using UnityEngine.XR.Management;

public class XRPerformanceConfigurator : MonoBehaviour
{
    void Start()
    {
        // 1. Lock display refresh rate to 90Hz to eliminate motion jitter
        QualitySettings.vSyncCount = 0;
        Application.targetFrameRate = 90;

        // 2. Configure aggressive Foveated Rendering for Qualcomm XR2 chipsets
        UnityEngine.XR.XRSettings.eyeTextureResolutionScale = 1.0f;
        
        // 3. Disable real-time soft shadows on dynamic objects
        QualitySettings.shadowCascades = 1;
        QualitySettings.shadowDistance = 15.0f;
        
        Debug.Log("Android XR Performance Profile Applied Successfully.");
    }
}
```
*Cites: [Optimizing Performance for Android XR with Unity](./references/articles.md)*

---

### Blueprint 4: Spatial Audio Node Configuration for 3D Sound Localization [08.26, 10.25]
Position an audio source in 3D coordinates so audio scales realistically with user head movement:
```kotlin
package com.example.xr.audio

import androidx.xr.scenecore.SpatialAudioTrack
import androidx.xr.scenecore.Pose
import androidx.xr.scenecore.Session

fun configureLocalizedSpatialAudio(
    session: Session, 
    audioResourcePath: String, 
    sourcePose: Pose
): SpatialAudioTrack {
    val audioTrack = SpatialAudioTrack.create(session, audioResourcePath)
    
    // Configure binaural 3D spatial simulation
    audioTrack.setPose(sourcePose)
    audioTrack.setRolloffModel(SpatialAudioTrack.ROLLOFF_LOGARITHMIC)
    audioTrack.setMaxDistance(10.0f)
    audioTrack.setMinDistance(0.5f)
    audioTrack.play()
    
    return audioTrack
}
```
*Cites: [Jetpack XR SDK Libraries Reach Beta](./references/articles.md) and [Learn Android XR Fundamentals](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[08.26]**: Jetpack XR SDK core libraries reach Beta with SceneCore, ARCore for XR, and runtime stabilization.
- **[10.25]**: Android XR Spotlight Week; Unity performance optimization guides and Play Store publication rules.
- **[10.25]**: Learn Android XR Fundamentals codelab and interactive samples launched.
- **[03.25]**: Early spatial UI guidelines and Jetpack XR Compose previews.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Spatial Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
