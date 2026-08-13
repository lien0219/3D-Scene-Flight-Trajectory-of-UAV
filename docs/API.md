# API 文档

## 通用约定

- 默认地址：`http://localhost:8080`
- JSON 响应：`Content-Type: application/json`
- 时间戳：Unix 秒
- 位置：WGS84 风格的十进制度数；默认地图提供商可能使用不同坐标体系
- 距离与速度：米、米/秒
- 姿态角：度

当前协议未显式版本化。外部集成应只依赖本文记录的字段，并在升级前运行契约测试。

## 健康检查

`GET /healthz`

```json
{"status":"ok"}
```

该端点只表示 HTTP 进程可响应，不检查外部地图服务或浏览器渲染。

## 任务配置

`GET /api/config`

```json
{
  "name": "深圳无人机巡航演示",
  "drones": [
    {
      "id": "uav-001",
      "name": "核心航线",
      "color": "#00ffff",
      "speed": 15,
      "route": [
        {"lng": 113.9301, "lat": 22.5334, "alt": 150},
        {"lng": 113.9425, "lat": 22.5155, "alt": 160}
      ]
    }
  ]
}
```

## 当前状态

`GET /api/state`

返回无人机遥测数组。服务刚启动、第一次 tick 尚未发生时，姿态和时间戳可能保持初始零值。

```json
[
  {
    "droneId": "uav-001",
    "lng": 113.9301,
    "lat": 22.5334,
    "alt": 150,
    "heading": 145.2,
    "pitch": 0.31,
    "roll": -1.42,
    "speed": 7.65,
    "battery": 100,
    "timestamp": 1786593600,
    "status": "flying",
    "waypointIndex": 0
  }
]
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `droneId` | string | 任务内唯一 ID |
| `lng`, `lat` | number | 当前经纬度 |
| `alt` | number | 当前高度，米 |
| `heading` | number | 真北方向航向角，范围 `[0, 360)` |
| `pitch`, `roll` | number | 俯仰角和横滚角 |
| `speed` | number | 当前模拟速度，米/秒 |
| `battery` | number | 模拟电量百分比 |
| `timestamp` | integer | 状态生成时间，Unix 秒 |
| `status` | string | 当前为 `flying` |
| `waypointIndex` | integer | 当前航段起点索引 |

## WebSocket 遥测

`GET /ws`

握手成功后，服务按 `TICK_INTERVAL` 持续发送文本帧。每一帧都是与 `/api/state` 相同结构的完整 JSON 数组。客户端不需要发送消息。

浏览器示例：

```javascript
const socket = new WebSocket('ws://localhost:8080/ws')

socket.addEventListener('message', (event) => {
  const fleet = JSON.parse(event.data)
  console.log(fleet)
})
```

浏览器握手的 `Origin` 必须出现在 `ALLOWED_ORIGINS` 中。非浏览器客户端未发送 Origin 时允许连接。

## 错误行为

- 未注册路径返回 `404 Not Found`。
- 已注册路径使用错误方法返回 `405 Method Not Allowed`。
- WebSocket Origin 不允许时握手返回 `403 Forbidden`。
- 无效任务配置会阻止 API 启动，不会通过 HTTP 返回部分任务。
