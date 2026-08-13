# 扩展指南

TwinSpace 将平台编排、实时数据和三维工作区分开。扩展时应优先沿现有边界增加能力，避免把项目导航、场景渲染和数据接入耦合到单个组件中。

## 新增平台工作区

新增工作区的推荐步骤：

1. 在 `web/src/components/` 下创建独立工作区组件。
2. 在 `projectRoute.ts` 增加稳定的项目 ID，并补充解析与 URL 生成测试。
3. 在 `PlatformShell.tsx` 注册名称和 Lucide 图标。
4. 在 `App.tsx` 按项目 ID 挂载工作区。
5. 为桌面和移动端增加项目切换、深链刷新和核心场景回归。

工作区必须在卸载时清理 WebSocket、计时器、事件监听、动画帧和 GPU 资源。不要让未激活项目继续在后台渲染。

## 扩展数字孪生资产

`web/src/components/twin/twinData.ts` 定义当前园区资产。每个资产使用 ENU 本地坐标和物理尺寸：

```ts
interface TwinAsset {
  id: string
  name: string
  code: string
  kind: 'building' | 'energy' | 'communication' | 'environment'
  status: 'normal' | 'warning'
  east: number
  north: number
  width: number
  depth: number
  height: number
  metric: string
  metricLabel: string
  secondary: string
}
```

新增资产类型时需要同步：

- `TwinAssetKind` 类型；
- `DigitalTwinWorkspace` 的资产分组与图标；
- `ThreeTwinLayer` 的模型工厂；
- Cesium 标注颜色或样式；
- 桌面和移动端交互测试。

资产的 `east`、`north` 和 `height` 必须相对同一个 `TWIN_ORIGIN`。不要直接把经纬度当作 Three.js 平面坐标。

## 接入数字孪生资产 API

当前资产与指标是前端演示数据。接入后端时建议保留以下流程：

```text
HTTP/WebSocket -> 运行时校验 -> TwinAsset/TwinMetric -> React 状态 -> Cesium/Three.js
```

要求：

- 资产 ID 稳定且唯一，用于选择、高亮和增量更新。
- 明确坐标参考系、原点、高度基准和单位。
- 外部数据在进入渲染层前完成类型与范围校验。
- 断线、陈旧数据和部分设备故障必须显示真实状态。
- 高频指标更新不应触发全部 Three.js geometry 重建。

## 增加飞行任务与无人机

优先使用外部 JSON 任务文件，不要为了新增航线修改前端组件。

1. 以 `examples/mission.example.json` 为模板创建任务文件。
2. 为每架无人机设置唯一 ID、正速度、合法颜色和至少两个航点。
3. 设置 `MISSION_FILE` 并启动 API。
4. 请求 `/api/config` 确认任务，再打开 Web 检查航线和遥测。

如果示例需要成为内置默认任务，可修改 `api/config/config.go`，同时更新配置测试、文档和截图说明。

## 接入新的遥测源

当前 `handler.Hub` 直接持有 `FlightSimulator`。接入回放文件、MQTT、消息队列或设备网关时，建议先定义窄接口：

```go
type StateSource interface {
    Snapshot() []model.DroneState
    Run(context.Context, chan<- []model.DroneState) error
}
```

保持以下边界：

- Handler 不解析设备专有协议。
- 新数据在广播前转换为 `model.DroneState` 并完成范围校验。
- 数据源必须响应 `context.Context` 取消。
- 连接失败、陈旧数据和部分机队故障不能伪装为正常飞行。
- 真实设备接入必须另行设计认证、授权、审计、限流和安全隔离。

## 扩展遥测协议

新增可选 JSON 字段通常可以保持兼容；删除字段、改名或改变单位属于破坏性变更。协议扩展需要：

1. 同时更新 Go model 与 TypeScript 类型。
2. 更新 `parseDronePayload` 的运行时校验。
3. 增加 API 契约测试和前端负载测试。
4. 更新 `docs/API.md` 与 `CHANGELOG.md`。
5. 在破坏性变更前引入协议版本字段。

## 替换地图和地形

两个工作区分别在 `CesiumViewer.tsx` 和 `DigitalTwinScene.tsx` 创建影像提供商。替换时需要确认：

- 服务条款、密钥暴露方式、署名和缓存政策；
- 坐标系是否与任务航点和园区原点一致；
- HTTPS、CORS、访问区域和离线策略；
- 地形高度与飞行高度、资产高度的语义是否一致。

任何浏览器可见的 token 都不能被视为秘密。需要保密签名时，应通过受控后端代理。

## 替换或增加三维模型

飞行工作区的轻量 UAV 模型通过 `droneModelUrl` 导入。数字孪生工作区当前使用 Three.js 基础 geometry 生成模型。引入 GLB/GLTF 时：

1. 统一模型轴向、比例、原点和单位。
2. 在 Three.js 场景中确认 ENU 到坐标轴的映射。
3. 优化网格、材质、纹理和 draw call，避免阻塞首屏。
4. 在组件卸载时释放加载器创建的 geometry、material 和 texture。
5. 在 `THIRD_PARTY_NOTICES.md` 记录作者、来源、许可证和修改。
6. 验证桌面与移动端的加载时间、内存和非空画布。

## 大规模场景

扩大到数百架无人机、数千资产或大范围园区时，应考虑：

- WebSocket 增量更新、二进制协议和消息版本；
- 每客户端缓冲区、背压、超时和慢连接淘汰；
- Cesium primitive/instancing 替代大量 React Entity；
- Three.js `InstancedMesh`、LOD、视锥裁剪和分区加载；
- 标签聚合、轨迹分段和按需资源加载；
- 双引擎统一性能预算、指标、追踪和断线恢复测试。
