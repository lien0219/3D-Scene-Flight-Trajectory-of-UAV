# 扩展指南

## 增加任务与无人机

优先使用外部 JSON 任务文件，不要为了新增航线修改前端组件。

1. 以 `examples/mission.example.json` 为模板创建任务文件。
2. 为每架无人机设置唯一 ID、正速度、合法颜色和至少两个航点。
3. 设置 `MISSION_FILE` 并启动 API。
4. 请求 `/api/config` 确认任务，再打开 Web 检查航线和遥测。

如果示例任务需要成为内置默认任务，可修改 `api/config/config.go`，同时更新配置测试和截图说明。

## 接入新的遥测源

当前 `handler.Hub` 直接持有 `FlightSimulator`。接入回放文件、MQTT、消息队列或真实设备网关时，建议先定义窄接口，例如：

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
- 连接失败、陈旧数据和部分机队故障要有明确状态，不能伪装为正常飞行。
- 真实设备接入必须另行设计认证、授权、审计、速率限制和安全隔离。

## 扩展遥测协议

新增可选 JSON 字段通常可以保持兼容；删除字段、改名或改变单位属于破坏性变更。进行协议扩展时：

1. 同时更新 Go model 与 TypeScript 类型。
2. 更新 `parseDronePayload` 的运行时校验。
3. 增加 API 契约测试和前端负载测试。
4. 更新 `docs/API.md` 与 `CHANGELOG.md`。
5. 破坏性变更前先增加协议版本字段。

## 替换地图和地形

默认 `UrlTemplateImageryProvider` 位于 `web/src/components/CesiumViewer.tsx`。替换时需要确认：

- 服务条款、密钥暴露方式、署名和缓存政策。
- 坐标系是否与任务航点一致。
- HTTPS、CORS、访问区域和离线策略。
- 地形高度与航点高度语义是否一致。

任何浏览器可见的 token 都不能被视为秘密。需要保密签名时，应通过受控后端代理。

## 替换 3D 模型

当前 MIT 许可的轻量模型通过 `droneModelUrl` 导入。新增模型前：

1. 优先使用优化后的 GLB，删除生产未使用的源文件和超大纹理。
2. 检查模型轴向、真实尺寸、原点和 Cesium 中的缩放效果。
3. 在 `THIRD_PARTY_NOTICES.md` 记录作者、来源 URL、许可证和修改。
4. 验证桌面与移动端加载时间，避免把未经优化的模型加入首屏。

## 大规模机队

当前架构适合演示规模。扩大到数百架或更多时，应考虑：

- WebSocket 增量更新、二进制协议和消息版本。
- 每客户端缓冲区、背压、超时和慢连接淘汰。
- Cesium primitive/instancing，而不是每架无人机一个 React Entity。
- 视锥和距离过滤、轨迹分段加载、标签聚合。
- 指标、追踪、断线恢复和容量测试。
