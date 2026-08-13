# 变更记录

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构，并计划使用语义化版本。

## [Unreleased]

### Added

- TwinSpace 多项目平台外壳、项目导航和 URL 深链。
- CesiumJS 与 Three.js 相机/ENU 坐标同步的园区数字孪生工作区。
- 建筑、能源站、通信基站、环境设备、资产状态、图层控制和巡检仿真。
- Three.js、Lucide 图标及对应 TypeScript 类型依赖。
- 项目路由单元测试，以及双画布、资产交互和相机变化端到端回归。
- 外部 JSON 任务文件、环境变量配置和任务校验。
- `/healthz`、`/api/config` 端点及 HTTP/WebSocket Origin 白名单。
- Go 配置、模拟器、路由测试和前端遥测负载测试。
- 桌面/移动 Playwright 场景、像素和防重叠回归测试。
- Dockerfile、Docker Compose、GitHub Actions 和 Dependabot。
- 架构、API、配置、扩展、贡献、安全和第三方资源文档。

### Changed

- 项目从单一无人机轨迹页面升级为可扩展的多工作区三维空间平台。
- WebSocket Origin 校验支持 Vite 自动选择的本机回环端口，同时保持外部域名精确匹配。
- 开发代理显式使用 `127.0.0.1`，避免 `localhost` 解析到无关 IPv6 服务。
- 两个 Cesium Viewer 均禁用默认 Ion 底图，避免无效 Token 请求。
- 前端航线和颜色改为由 API 任务配置驱动。
- 移动端 HUD 与场景控制改为上下分区响应式布局。
- 前端默认使用同源 API 和 WebSocket，并支持分离部署变量。
- 模拟器跨航点时保留剩余步进距离，并跳过零长度航段。
- Hub 支持上下文取消、优雅退出和并发安全的失效连接移除。
- 统一使用 pnpm 锁文件。

### Removed

- 前端源码中的硬编码 Cesium token。
- 重复的 npm 锁文件。
- 来源与再分发条款不明的旧无人机模型、FBX 源文件和纹理。

## [1.0.0] - 2026-02-23

### Added

- Go 多机飞行模拟和 WebSocket 广播。
- React、Resium 与 CesiumJS 三维可视化。
- 三条深圳示例航线、HUD、视角和天气控制。

[Unreleased]: https://github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/compare/2bf38a0...HEAD
[1.0.0]: https://github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/commit/2bf38a0
