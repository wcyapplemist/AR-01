# AR Spatial Positioning — Implementation Plan

## Overview

AR Spatial Positioning system built with Next.js, featuring Three.js 3D rendering, device sensor-based positioning, QR code calibration, dual coordinate system with drift correction, and real-time AR overlay rendering on mobile devices.

## Acceptance Criteria

- Project skeleton runs with all module pages accessible (`/ar`, `/qr`, `/three`)
- `/three` page displays a rotating 3D scene with grid and axes
- `/ar` page shows real-time sensor pose data via debug dashboard
- `/qr` page scans and parses QR Codes with overlay
- QR scan initializes absolute coordinates; drift correction is active
- Camera feed + 3D model overlay + HUD display renders correctly
- Complete user flow works end-to-end on real devices (iOS Safari + Android Chrome)
- Performance targets met; bugs fixed; documentation complete

## Scope

```
src/
├── app/                          # App Router pages (/, /ar, /qr, /three)
├── modules/
│   ├── ar/                       # AR sensor, positioning, overlay
│   ├── qr/                       # QR scanning module
│   └── three/                    # Three.js rendering module
├── shared/
│   └── utils/                    # Shared utilities (math, etc.)
└── components/                   # Shared UI components
```

## Phased Overview

| Phase | Name | Objective | Est. Time | Status |
| ----- | ---- | --------- | --------- | ------ |
| **P0** | Project scaffold & infrastructure | Next.js initialization, module skeleton, path aliases, SSR-safe infrastructure | 2–3 days | **DONE** |
| **P1** | Three.js standalone module | Standalone 3D scene rendering pipeline, demo page `/three` | 3–4 days | **DONE** |
| **P2** | Sensor-based positioning | DeviceMotion/Orientation collection, 6DoF pose estimation, position integration | 4–5 days | **DONE** |
| **P3** | QR Code scanning module | Camera + jsQR decode + content validation, demo page `/qr` | 2–3 days | **DONE** |
| **P4** | Dual coordinate system & drift correction | Dual coord system (relative/absolute), QR calibration, AR.js visual drift correction | 4–5 days | Pending |
| **P5** | AR integration & overlay rendering | Camera background + 3D model overlay + HUD real-time display | 3–4 days | Pending |
| **P6** | Full integration & E2E testing | Homepage integration, complete user flow, real device E2E testing | 3–4 days | Pending |
| **P7** | Optimization & polish | Performance optimization, UI refinement, error handling, documentation | 3–5 days | Pending |

**Total estimate: 24–33 working days (~5–7 weeks)**

---

## Implementation Phases

### Phase 0: Project Scaffold & Infrastructure — DONE

> Next.js initialization, module skeleton, path aliases, SSR-safe infrastructure. All module pages accessible.

- [x] Initialize Next.js project with TypeScript, ESLint, Tailwind CSS
- [x] Configure path aliases (`@/modules/*`, `@/shared/*`, `@/components/*`)
- [x] Create module directory structure (`ar/`, `qr/`, `three/`)
- [x] Implement `DynamicClient` wrapper for SSR-safe browser API components
- [x] Implement `useClientOnly` hook for client-only rendering guard
- [x] Set up mobile viewport meta and responsive base styles
- [x] Create placeholder pages for `/ar`, `/qr`, `/three` routes
- [x] Verify all module pages accessible and SSR-safe

**Deliverable**: M1 — Project skeleton runs; three module pages accessible

---

### Phase 1: Three.js Standalone Module — DONE

> Standalone 3D scene rendering pipeline with demo page `/three`. Issue #3: https://github.com/wcyapplemist/AR-01/issues/3

**Task dependency:**
```
P1.1 (types) ──────┬── P1.3 (SceneManager) ──┬── P1.4 (SceneBuilder)
P1.2 (math utils)  │                         ├── P1.5 (ObjectFactory)
P1.7 (FPSCounter)  │                         └── P1.6 (useThreeScene hook)
       ↓           ↓                                  ↓
       └──────────────────── P1.8 (demo page) ────────┘
```

- [x] P1.1: Define `ThreeSceneOptions` type — `src/modules/three/types.ts`
- [x] P1.2: Implement math utility functions (quaternion/vector) — `src/shared/utils/math.ts`
- [x] P1.3: Implement `SceneManager` service (core Three.js lifecycle) — `src/modules/three/services/SceneManager.ts`
- [x] P1.4: Implement `SceneBuilder` service (lights, grid, axes) — `src/modules/three/services/SceneBuilder.ts`
- [x] P1.5: Implement `ObjectFactory` service (geometry + GLTFLoader) — `src/modules/three/services/ObjectFactory.ts`
- [x] P1.6: Implement `useThreeScene` React hook — `src/modules/three/hooks/useThreeScene.ts`
- [x] P1.7: Implement `FPSCounter` component — `src/modules/three/components/FPSCounter.tsx`
- [x] P1.8: Build `/three` demo page with scene controls — `src/app/three/page.tsx`
- [x] Verify lint + typecheck pass and dev server renders `/three` correctly

**Files created:**
```
src/modules/three/
├── index.ts                      # Barrel export
├── types.ts                      # ThreeSceneOptions
├── services/
│   ├── SceneManager.ts           # Core Three.js lifecycle
│   ├── SceneBuilder.ts           # Scene setup (lights, grid, axes)
│   └── ObjectFactory.ts          # Geometry creation + GLTFLoader
├── hooks/
│   └── useThreeScene.ts          # React hook for SceneManager
└── components/
    └── FPSCounter.tsx            # Frame rate display

src/shared/utils/
└── math.ts                       # Quaternion/vector math utilities
```

**Deliverable**: M2 — `/three` page displays rotating 3D scene with grid and axes

---

### Phase 2: Sensor-Based Positioning — DONE

> DeviceMotion/Orientation collection, 6DoF pose estimation, position integration. Target: `/ar` page shows real-time sensor pose data via debug dashboard. Issue #5: https://github.com/wcyapplemist/AR-01/issues/5

- [x] P2.1: Define sensor types and pose interfaces (`DevicePose`, `Orientation`, `Acceleration`)
- [x] P2.2: Implement `SensorPermission` service (iOS `DeviceMotionEvent.requestPermission()`, Android auto-grant)
- [x] P2.3: Implement `SensorCollector` service (DeviceMotion/Orientation event listeners, sampling rate control)
- [x] P2.4: Implement `CoordinateAligner` service (capture reference orientation at Start, subsequent poses relative to reference)
- [x] P2.5: Implement `PoseEstimator` service (acceleration → velocity → position with trapezoidal integration, velocity decay, threshold clipping)
- [x] P2.6: Implement `PositionIntegrator` service (6DoF pose from sensor fusion, double integration with drift mitigation)
- [x] P2.7: Implement `useSensorPose` React hook (real-time pose stream, start/stop controls)
- [x] P2.8: Implement `SensorDebugDashboard` component (display raw sensor data, estimated pose, drift metrics)
- [x] P2.9: Build `/ar` demo page with sensor debug dashboard
- [x] P2.10: Test on real devices (iOS Safari + Android Chrome)

**Deliverable**: M3 — `/ar` page shows real-time sensor pose data (debug dashboard)

---

### Phase 3: QR Code Scanning Module — DONE

> Camera + jsQR decode + content validation. Independent demo page `/qr`.

- [x] P3.1: Define QR types and interfaces (`QRResult`, `QRContent`, `ScanOptions`)
- [x] P3.2: Implement `CameraService` (rear camera access, stream management, platform differences)
- [x] P3.3: Implement `QRDecoder` service (jsQR integration, frame extraction, decode pipeline)
- [x] P3.4: Implement `QRContentValidator` service (content format validation, checksum verification)
- [x] P3.5: Implement `useQRScanner` React hook (start/stop scanning, result stream)
- [x] P3.6: Implement `QRScannerOverlay` component (viewfinder UI, scan region highlight, result display)
- [x] P3.7: Build `/qr` demo page with camera preview and scan overlay
- [ ] P3.8: Test QR scanning on real devices with various QR Code formats

**Deliverable**: M4 — `/qr` page scans and parses QR Code with overlay

---

### Phase 4: Dual Coordinate System & Drift Correction — Pending

> Dual coordinate system (relative/absolute), QR calibration, AR.js visual drift correction.

- [x] P4.1: Define coordinate system types (`RelativePose`, `AbsolutePose`, `CoordinateFrame`)
- [x] P4.2: Implement `CoordinateTransformer` service (relative ↔ absolute coordinate conversion)
- [x] P4.3: Implement `QRCalibrationService` (QR scan initializes absolute origin, coordinate frame alignment)
- [x] P4.4: Implement `DriftCorrector` service (velocity decay tuning, threshold-based correction, trapezoidal refinement)
- [x] P4.5: Integrate AR.js visual correction pipeline (marker-based position correction)
- [x] P4.6: Implement `PositionFusion` service (sensor + QR + visual correction fusion with Kalman-like weighting)
- [x] P4.7: Implement `useDualCoordinate` React hook (expose both coordinate frames, correction events)
- [x] P4.8: Implement `DriftDebugOverlay` component (drift magnitude, correction events, coordinate frame visualization)
- [x] P4.9: Update `/ar` demo page with dual coordinate display and drift correction visualization
- [ ] P4.10: Test drift correction accuracy with real device movement patterns

**Deliverable**: M5 — QR scan initializes absolute coordinates; drift correction active

---

### Phase 5: AR Integration & Overlay Rendering — Pending

> Camera background + 3D model overlay + HUD real-time display.

- [ ] P5.1: Define AR overlay types (`AROverlayConfig`, `HUDData`, `ModelPlacement`)
- [ ] P5.2: Implement `ARRenderer` service (camera feed as Three.js background, scene-AR synchronization)
- [ ] P5.3: Implement `ModelOverlayService` (3D model placement in camera space, occlusion handling)
- [ ] P5.4: Implement `HUDRenderer` component (real-time telemetry overlay: position, orientation, drift status)
- [ ] P5.5: Implement `ARSceneController` service (coordinate system → Three.js scene mapping)
- [ ] P5.6: Implement `useARScene` React hook (unified AR rendering pipeline)
- [ ] P5.7: Build `/ar` AR demo page with camera + 3D overlay + HUD
- [ ] P5.8: Verify all AR components are SSR-safe (`ssr: false`, client-only rendering)
- [ ] P5.9: Test AR rendering on real devices (performance, latency, visual accuracy)

**Deliverable**: M6 — Camera feed + 3D model overlay + HUD display

---

### Phase 6: Full Integration & E2E Testing — Pending

> Homepage integration, complete user flow, real device end-to-end testing.

- [ ] P6.1: Implement homepage with navigation to all modules (`/`, `/ar`, `/qr`, `/three`)
- [ ] P6.2: Integrate QR calibration into AR flow (scan QR → initialize coordinates → begin AR)
- [ ] P6.3: Implement complete user flow: launch → QR scan → AR tracking → overlay display
- [ ] P6.4: Write E2E test scenarios for core user flows
- [ ] P6.5: Perform real device E2E testing (iOS Safari + Android Chrome)
- [ ] P6.6: Fix integration issues and cross-platform bugs
- [ ] P6.7: Verify performance on target devices (frame rate, memory, battery)

**Deliverable**: M7 — Complete user flow works end-to-end on real devices

---

### Phase 7: Optimization & Polish — Pending

> Performance optimization, UI refinement, error handling, documentation.

- [ ] P7.1: Profile and optimize rendering performance (Three.js scene, sensor processing, AR pipeline)
- [ ] P7.2: Optimize sensor sampling and processing pipeline (reduce GC pressure, buffer management)
- [ ] P7.3: Refine UI/UX across all pages (loading states, error states, responsive layout)
- [ ] P7.4: Enhance error handling and recovery (sensor failures, camera access denied, QR decode errors)
- [ ] P7.5: Add offline capability and graceful degradation
- [ ] P7.6: Write API documentation and module guides
- [ ] P7.7: Final cross-device testing and bug fixes
- [ ] P7.8: Prepare release artifacts and deployment configuration

**Deliverable**: M8 — Performance targets met; bugs fixed; documentation complete

---

## Technical Constraints Mapping

| # | Constraint | Phases | Mitigation |
| - | ---------- | ------ | ---------- |
| **#1** | Inertial navigation drift (double integration error) | P2, P4 | P2: velocity decay, threshold clipping, trapezoidal integration; P4: AR.js visual correction + QR calibration |
| **#2** | Sensor permissions (iOS Safari requires explicit request) | P2 | `SensorPermission` service wrapping platform differences; iOS explicit `DeviceMotionEvent.requestPermission()` |
| **#3** | SSR compatibility (all browser API components must be client-only) | P0, P5 | P0: `DynamicClient` wrapper + `useClientOnly` hook; P5: all AR components with `ssr: false` |
| **#4** | Mobile-first (target: iOS Safari + Android Chrome) | All | P0: mobile viewport meta; every phase tested on real devices; rear camera priority |
| **#5** | Coordinate system alignment (sensor frame → world frame) | P2 | `CoordinateAligner` captures reference orientation at Start; subsequent poses calculated relative to reference |

---

## Milestones & Deliverables

| Milestone | Phase | Demo | Status |
| --------- | ----- | ---- | ------ |
| **M1: Infrastructure ready** | P0 | Project skeleton runs; three module pages accessible | **DONE** |
| **M2: 3D rendering working** | P1 | `/three` page displays rotating 3D scene with grid and axes | **DONE** |
| **M3: Sensor tracking working** | P2 | `/ar` page shows real-time sensor pose data (debug dashboard) | **DONE** |
| **M4: QR scanning working** | P3 | `/qr` page scans and parses QR Code with overlay | **DONE** |
| **M5: Dual coordinate system established** | P4 | QR scan initializes absolute coordinates; drift correction active | Pending |
| **M6: AR overlay rendering** | P5 | Camera feed + 3D model overlay + HUD display | Pending |
| **M7: Full integration** | P6 | Complete user flow works end-to-end on real devices | Pending |
| **M8: Release ready** | P7 | Performance targets met; bugs fixed; documentation complete | Pending |

---

## Dependencies

- **Three.js** → required for P0, P1, P5 (3D rendering)
- **jsQR** → required for P3 (QR code decoding)
- **AR.js** → required for P4 (visual drift correction)
- **DeviceMotion/Orientation APIs** → required for P2 (sensor data), available on mobile browsers only
- **WebRTC / MediaDevices API** → required for P3, P5 (camera access)

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
| ---- | ------ | ---------- | ---------- |
| Sensor API unavailable on some browsers | High | Medium | Feature detection with graceful fallback; clear error messaging |
| Inertial drift exceeds acceptable threshold | High | High | Multi-source correction (QR + visual); user recalibration prompt |
| iOS Safari permission model restrictions | Medium | High | Explicit `requestPermission()` flow; user education in UI |
| Performance degradation on low-end devices | Medium | Medium | Adaptive quality settings; frame skipping; resource budget limits |
| Coordinate system misalignment after extended use | High | Medium | Periodic recalibration prompts; automatic drift detection |

## Success Metrics

- **P1**: `/three` renders at 60fps with < 16ms frame time
- **P2**: Sensor pose updates at ≥ 60Hz with < 5ms processing latency
- **P3**: QR decode time < 500ms on target devices
- **P4**: Drift correction reduces accumulated error by > 80% after calibration
- **P5**: AR overlay renders at ≥ 30fps on target devices
- **P6**: Complete user flow completes in < 30 seconds from launch to AR display
- **P7**: All pages load in < 2s on 4G; bundle size < 500KB gzipped
