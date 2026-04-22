# AR 空间定位 — 实施计划

## 概述

基于 Next.js 构建的 AR 空间定位系统，集成 Three.js 3D 渲染、设备传感器定位、QR Code 校准、双坐标系漂移校正，以及移动端实时 AR 叠加渲染。

## 验收标准

- 项目骨架运行正常，所有模块页面可访问（`/ar`、`/qr`、`/three`）
- `/three` 页面展示带有网格和坐标轴的旋转 3D 场景
- `/ar` 页面通过调试仪表板显示实时传感器姿态数据
- `/qr` 页面可扫描并解析 QR Code，带有叠加层显示
- QR 扫描初始化绝对坐标，漂移校正生效
- 摄像头画面 + 3D 模型叠加 + HUD 显示正确渲染
- 完整用户流程在真机端到端可用（iOS Safari + Android Chrome）
- 性能达标，缺陷修复，文档完善

## 范围

```
src/
├── app/                          # App Router 页面（/、/ar、/qr、/three）
├── modules/
│   ├── ar/                       # AR 传感器、定位、叠加
│   ├── qr/                       # QR 扫描模块
│   └── three/                    # Three.js 渲染模块
├── shared/
│   └── utils/                    # 共享工具（数学函数等）
└── components/                   # 共享 UI 组件
```

## 阶段概览

| 阶段 | 名称 | 目标 | 预计工时 | 状态 |
| ---- | ---- | ---- | -------- | ---- |
| **P0** | 项目脚手架与基础设施 | Next.js 初始化、模块骨架、路径别名、SSR 安全基础设施 | 2–3 天 | **已完成** |
| **P1** | Three.js 独立模块 | 独立 3D 场景渲染管线，演示页 `/three` | 3–4 天 | **已完成** |
| **P2** | 传感器定位 | DeviceMotion/Orientation 采集、6DoF 姿态估计、位置积分 | 4–5 天 | **已完成** |
| **P3** | QR Code 扫描模块 | 摄像头 + jsQR 解码 + 内容验证，演示页 `/qr` | 2–3 天 | 待开始 |
| **P4** | 双坐标系与漂移校正 | 双坐标系（相对/绝对）、QR 校准、AR.js 视觉漂移校正 | 4–5 天 | 待开始 |
| **P5** | AR 集成与叠加渲染 | 摄像头背景 + 3D 模型叠加 + HUD 实时显示 | 3–4 天 | 待开始 |
| **P6** | 完整集成与 E2E 测试 | 首页集成、完整用户流程、真机端到端测试 | 3–4 天 | 待开始 |
| **P7** | 优化与完善 | 性能优化、UI 精细化、容错增强、文档完善 | 3–5 天 | 待开始 |

**总预估：24–33 个工作日（约 5–7 周）**

---

## 实施阶段

### Phase 0：项目脚手架与基础设施 — 已完成

> Next.js 初始化、模块骨架、路径别名、SSR 安全基础设施。所有模块页面可访问。

- [x] 使用 TypeScript、ESLint、Tailwind CSS 初始化 Next.js 项目
- [x] 配置路径别名（`@/modules/*`、`@/shared/*`、`@/components/*`）
- [x] 创建模块目录结构（`ar/`、`qr/`、`three/`）
- [x] 实现 `DynamicClient` 包装器，确保浏览器 API 组件 SSR 安全
- [x] 实现 `useClientOnly` hook，用于客户端专属渲染守卫
- [x] 设置移动端 viewport meta 和响应式基础样式
- [x] 创建 `/ar`、`/qr`、`/three` 路由的占位页面
- [x] 验证所有模块页面可访问且 SSR 安全

**交付物**：M1 — 项目骨架运行正常，三个模块页面可访问

---

### Phase 1：Three.js 独立模块 — 已完成

> 独立 3D 场景渲染管线，演示页 `/three`。Issue #3: https://github.com/wcyapplemist/AR-01/issues/3

**任务依赖关系：**
```
P1.1（类型）──────┬── P1.3（SceneManager）──┬── P1.4（SceneBuilder）
P1.2（数学工具）   │                        ├── P1.5（ObjectFactory）
P1.7（FPSCounter） │                        └── P1.6（useThreeScene hook）
       ↓          ↓                                  ↓
       └──────────────────── P1.8（演示页面）────────┘
```

- [x] P1.1：定义 `ThreeSceneOptions` 类型 — `src/modules/three/types.ts`
- [x] P1.2：实现数学工具函数（四元数/向量） — `src/shared/utils/math.ts`
- [x] P1.3：实现 `SceneManager` 服务（Three.js 核心生命周期） — `src/modules/three/services/SceneManager.ts`
- [x] P1.4：实现 `SceneBuilder` 服务（灯光、网格、坐标轴） — `src/modules/three/services/SceneBuilder.ts`
- [x] P1.5：实现 `ObjectFactory` 服务（几何体创建 + GLTFLoader） — `src/modules/three/services/ObjectFactory.ts`
- [x] P1.6：实现 `useThreeScene` React hook — `src/modules/three/hooks/useThreeScene.ts`
- [x] P1.7：实现 `FPSCounter` 组件 — `src/modules/three/components/FPSCounter.tsx`
- [x] P1.8：构建 `/three` 演示页面（场景控制） — `src/app/three/page.tsx`
- [x] 验证 lint + 类型检查通过，开发服务器正确渲染 `/three`

**创建的文件：**
```
src/modules/three/
├── index.ts                      # Barrel 导出
├── types.ts                      # ThreeSceneOptions
├── services/
│   ├── SceneManager.ts           # Three.js 核心生命周期
│   ├── SceneBuilder.ts           # 场景搭建（灯光、网格、坐标轴）
│   └── ObjectFactory.ts          # 几何体创建 + GLTFLoader
├── hooks/
│   └── useThreeScene.ts          # SceneManager 的 React hook
└── components/
    └── FPSCounter.tsx            # 帧率显示

src/shared/utils/
└── math.ts                       # 四元数/向量数学工具
```

**交付物**：M2 — `/three` 页面展示带有网格和坐标轴的旋转 3D 场景

---

### Phase 2：传感器定位 — 已完成

> DeviceMotion/Orientation 采集、6DoF 姿态估计、位置积分。目标：`/ar` 页面通过调试仪表板显示实时传感器姿态数据。Issue #5: https://github.com/wcyapplemist/AR-01/issues/5

- [x] P2.1：定义传感器类型和姿态接口（`DevicePose`、`Orientation`、`Acceleration`）
- [x] P2.2：实现 `SensorPermission` 服务（iOS `DeviceMotionEvent.requestPermission()`，Android 自动授权）
- [x] P2.3：实现 `SensorCollector` 服务（DeviceMotion/Orientation 事件监听、采样率控制）
- [x] P2.4：实现 `CoordinateAligner` 服务（Start 时捕获参考朝向，后续姿态相对参考计算）
- [x] P2.5：实现 `PoseEstimator` 服务（加速度 → 速度 → 位置，梯形积分、速度衰减、阈值裁剪）
- [x] P2.6：实现 `PositionIntegrator` 服务（传感器融合 6DoF 姿态，双重积分含漂移缓解）
- [x] P2.7：实现 `useSensorPose` React hook（实时姿态流、启停控制）
- [x] P2.8：实现 `SensorDebugDashboard` 组件（显示原始传感器数据、估计姿态、漂移指标）
- [x] P2.9：构建 `/ar` 演示页面（传感器调试仪表板）
- [x] P2.10：在真机上测试（iOS Safari + Android Chrome）

**交付物**：M3 — `/ar` 页面显示实时传感器姿态数据（调试仪表板）

---

### Phase 3：QR Code 扫描模块 — 待开始

> 摄像头 + jsQR 解码 + 内容验证。独立演示页 `/qr`。

- [ ] P3.1：定义 QR 类型和接口（`QRResult`、`QRContent`、`ScanOptions`）
- [ ] P3.2：实现 `CameraService`（后置摄像头访问、流管理、平台差异处理）
- [ ] P3.3：实现 `QRDecoder` 服务（jsQR 集成、帧提取、解码管线）
- [ ] P3.4：实现 `QRContentValidator` 服务（内容格式验证、校验验证）
- [ ] P3.5：实现 `useQRScanner` React hook（启停扫描、结果流）
- [ ] P3.6：实现 `QRScannerOverlay` 组件（取景器 UI、扫描区域高亮、结果显示）
- [ ] P3.7：构建 `/qr` 演示页面（摄像头预览 + 扫描叠加层）
- [ ] P3.8：在真机上测试各种 QR Code 格式的扫描

**交付物**：M4 — `/qr` 页面可扫描并解析 QR Code，带有叠加层

---

### Phase 4：双坐标系与漂移校正 — 待开始

> 双坐标系（相对/绝对）、QR 校准、AR.js 视觉漂移校正。

- [ ] P4.1：定义坐标系类型（`RelativePose`、`AbsolutePose`、`CoordinateFrame`）
- [ ] P4.2：实现 `CoordinateTransformer` 服务（相对 ↔ 绝对坐标转换）
- [ ] P4.3：实现 `QRCalibrationService`（QR 扫描初始化绝对原点、坐标系对齐）
- [ ] P4.4：实现 `DriftCorrector` 服务（速度衰减调优、阈值校正、梯形精细化）
- [ ] P4.5：集成 AR.js 视觉校正管线（基于标记的位置校正）
- [ ] P4.6：实现 `PositionFusion` 服务（传感器 + QR + 视觉校正融合，类卡尔曼加权）
- [ ] P4.7：实现 `useDualCoordinate` React hook（暴露双坐标系、校正事件）
- [ ] P4.8：实现 `DriftDebugOverlay` 组件（漂移量、校正事件、坐标系可视化）
- [ ] P4.9：更新 `/ar` 演示页面（双坐标显示 + 漂移校正可视化）
- [ ] P4.10：使用真机运动模式测试漂移校正精度

**交付物**：M5 — QR 扫描初始化绝对坐标，漂移校正生效

---

### Phase 5：AR 集成与叠加渲染 — 待开始

> 摄像头背景 + 3D 模型叠加 + HUD 实时显示。

- [ ] P5.1：定义 AR 叠加类型（`AROverlayConfig`、`HUDData`、`ModelPlacement`）
- [ ] P5.2：实现 `ARRenderer` 服务（摄像头画面作为 Three.js 背景、场景-AR 同步）
- [ ] P5.3：实现 `ModelOverlayService`（3D 模型在摄像头空间中的放置、遮挡处理）
- [ ] P5.4：实现 `HUDRenderer` 组件（实时遥测叠加：位置、朝向、漂移状态）
- [ ] P5.5：实现 `ARSceneController` 服务（坐标系 → Three.js 场景映射）
- [ ] P5.6：实现 `useARScene` React hook（统一 AR 渲染管线）
- [ ] P5.7：构建 `/ar` AR 演示页面（摄像头 + 3D 叠加 + HUD）
- [ ] P5.8：验证所有 AR 组件 SSR 安全（`ssr: false`，仅客户端渲染）
- [ ] P5.9：在真机上测试 AR 渲染（性能、延迟、视觉精度）

**交付物**：M6 — 摄像头画面 + 3D 模型叠加 + HUD 显示

---

### Phase 6：完整集成与 E2E 测试 — 待开始

> 首页集成、完整用户流程、真机端到端测试。

- [ ] P6.1：实现首页，导航至所有模块（`/`、`/ar`、`/qr`、`/three`）
- [ ] P6.2：将 QR 校准集成到 AR 流程中（扫描 QR → 初始化坐标 → 开始 AR）
- [ ] P6.3：实现完整用户流程：启动 → QR 扫描 → AR 追踪 → 叠加显示
- [ ] P6.4：编写核心用户流程的 E2E 测试场景
- [ ] P6.5：在真机上进行 E2E 测试（iOS Safari + Android Chrome）
- [ ] P6.6：修复集成问题和跨平台缺陷
- [ ] P6.7：在目标设备上验证性能（帧率、内存、电量）

**交付物**：M7 — 完整用户流程在真机端到端可用

---

### Phase 7：优化与完善 — 待开始

> 性能优化、UI 精细化、容错增强、文档完善。

- [ ] P7.1：性能分析与渲染优化（Three.js 场景、传感器处理、AR 管线）
- [ ] P7.2：优化传感器采样和处理管线（减少 GC 压力、缓冲管理）
- [ ] P7.3：精细化全页面 UI/UX（加载态、错误态、响应式布局）
- [ ] P7.4：增强错误处理和恢复（传感器故障、摄像头拒绝、QR 解码错误）
- [ ] P7.5：添加离线能力和优雅降级
- [ ] P7.6：编写 API 文档和模块指南
- [ ] P7.7：最终跨设备测试和缺陷修复
- [ ] P7.8：准备发布产物和部署配置

**交付物**：M8 — 性能达标，缺陷修复，文档完善

---

## 技术约束映射

| # | 约束 | 涉及阶段 | 缓解策略 |
| - | ---- | -------- | -------- |
| **#1** | 惯性导航漂移（双重积分误差） | P2, P4 | P2：速度衰减、阈值裁剪、梯形积分；P4：AR.js 视觉校正 + QR 校准 |
| **#2** | 传感器权限（iOS Safari 需显式请求） | P2 | `SensorPermission` 服务封装平台差异；iOS 显式调用 `DeviceMotionEvent.requestPermission()` |
| **#3** | SSR 兼容性（所有浏览器 API 组件必须仅客户端） | P0, P5 | P0：`DynamicClient` 包装器 + `useClientOnly` hook；P5：所有 AR 组件设置 `ssr: false` |
| **#4** | 移动端优先（目标：iOS Safari + Android Chrome） | 全部 | P0：移动端 viewport meta；每阶段在真机测试；优先使用后置摄像头 |
| **#5** | 坐标系对齐（传感器坐标系 → 世界坐标系） | P2 | `CoordinateAligner` 在 Start 时捕获参考朝向；后续姿态相对参考计算 |

---

## 里程碑与交付物

| 里程碑 | 阶段 | 演示 | 状态 |
| ------ | ---- | ---- | ---- |
| **M1：基础设施就绪** | P0 | 项目骨架运行正常，三个模块页面可访问 | **已完成** |
| **M2：3D 渲染可用** | P1 | `/three` 页面展示带网格和坐标轴的旋转 3D 场景 | **已完成** |
| **M3：传感器追踪可用** | P2 | `/ar` 页面显示实时传感器姿态数据（调试仪表板） | **已完成** |
| **M4：QR 扫描可用** | P3 | `/qr` 页面可扫描并解析 QR Code，带叠加层 | 待开始 |
| **M5：双坐标系建立** | P4 | QR 扫描初始化绝对坐标，漂移校正生效 | 待开始 |
| **M6：AR 叠加渲染** | P5 | 摄像头画面 + 3D 模型叠加 + HUD 显示 | 待开始 |
| **M7：完整集成** | P6 | 完整用户流程在真机端到端可用 | 待开始 |
| **M8：发布就绪** | P7 | 性能达标，缺陷修复，文档完善 | 待开始 |

---

## 依赖

- **Three.js** → P0、P1、P5 需要（3D 渲染）
- **jsQR** → P3 需要（QR Code 解码）
- **AR.js** → P4 需要（视觉漂移校正）
- **DeviceMotion/Orientation API** → P2 需要（传感器数据），仅移动端浏览器可用
- **WebRTC / MediaDevices API** → P3、P5 需要（摄像头访问）

## 风险与缓解

| 风险 | 影响 | 可能性 | 缓解策略 |
| ---- | ---- | ------ | -------- |
| 部分浏览器不支持传感器 API | 高 | 中 | 特性检测配合优雅降级；清晰的错误提示 |
| 惯性漂移超出可接受阈值 | 高 | 高 | 多源校正（QR + 视觉）；用户重新校准提示 |
| iOS Safari 权限模型限制 | 中 | 高 | 显式 `requestPermission()` 流程；UI 中引导用户 |
| 低端设备性能下降 | 中 | 中 | 自适应质量设置；跳帧；资源预算限制 |
| 长时间使用后坐标系偏移 | 高 | 中 | 定期重新校准提示；自动漂移检测 |

## 成功指标

- **P1**：`/three` 以 60fps 渲染，帧时间 < 16ms
- **P2**：传感器姿态以 ≥ 60Hz 更新，处理延迟 < 5ms
- **P3**：QR 解码时间 < 500ms（目标设备）
- **P4**：校准后漂移校正减少累积误差 > 80%
- **P5**：AR 叠加以 ≥ 30fps 渲染（目标设备）
- **P6**：完整用户流程从启动到 AR 显示 < 30 秒
- **P7**：所有页面在 4G 下加载 < 2s；包体积 < 500KB（gzip 后）
