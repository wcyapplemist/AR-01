# AR Spatial Positioning — Implementation Plan

## Phased Overview

| Phase | Name | Objective | Est. Time |
| ----- | ---- | --------- | --------- |
| **P0** | Project scaffold & infrastructure | Next.js 初始化、模块骨架、路径别名、SSR 安全基础设施 | 2–3 days |
| **P1** | Three.js standalone module | 纯 3D 场景渲染管线，独立演示页 `/three` | 3–4 days |
| **P2** | Sensor-based positioning | DeviceMotion/Orientation 采集、6DoF 姿态估计、位置积分 | 4–5 days |
| **P3** | QR Code scanning module | 摄像头 + jsQR 解码 + 内容验证，独立演示页 `/qr` | 2–3 days |
| **P4** | Dual coordinate system & drift correction | 双坐标系（相对/绝对）、QR 校准、AR.js 视觉漂移校正 | 4–5 days |
| **P5** | AR integration & overlay rendering | 摄像头背景 + 3D 模型叠加 + HUD 实时显示 | 3–4 days |
| **P6** | Full integration & E2E testing | 首页集成、完整用户流程、真机端到端测试 | 3–4 days |
| **P7** | Optimization & polish | 性能优化、UI 精细化、容错增强、文档完善 | 3–5 days |

**Total estimate: 24–33 working days (~5–7 weeks)**

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

| Milestone | Phase | Demo |
| --------- | ----- | ---- |
| **M1: Infrastructure ready** | P0 | Project skeleton runs; three module pages accessible |
| **M2: 3D rendering working** | P1 | `/three` page displays rotating 3D scene with grid and axes |
| **M3: Sensor tracking working** | P2 | `/ar` page shows real-time sensor pose data (debug dashboard) |
| **M4: QR scanning working** | P3 | `/qr` page scans and parses QR Code with overlay |
| **M5: Dual coordinate system established** | P4 | QR scan initializes absolute coordinates; drift correction active |
| **M6: AR overlay rendering** | P5 | Camera feed + 3D model overlay + HUD display |
| **M7: Full integration** | P6 | Complete user flow works end-to-end on real devices |
| **M8: Release ready** | P7 | Performance targets met; bugs fixed; documentation complete |
