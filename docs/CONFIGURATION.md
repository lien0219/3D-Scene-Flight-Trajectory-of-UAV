# 配置指南

## 后端环境变量

可从 `api/.env.example` 查看模板。Go 服务不会自动读取 `.env` 文件；可由 shell、容器平台或进程管理器注入。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `HTTP_ADDR` | `:8080` | HTTP 监听地址 |
| `TICK_INTERVAL` | `200ms` | 模拟和广播间隔，使用 Go duration 语法且必须大于 0 |
| `ALLOWED_ORIGINS` | 两个本地 Vite 地址 | CORS 与 WebSocket Origin 白名单，逗号分隔 |
| `MISSION_FILE` | 空 | 可选任务 JSON 路径；为空时使用内置深圳任务 |

生产环境应设置精确的 `ALLOWED_ORIGINS`。仅在可信封闭环境中使用 `*`。

## 前端环境变量

Vite 只会把 `VITE_` 前缀变量暴露给浏览器，因此这些值不能包含秘密。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 空 | 跨域部署时的 API 根地址；空表示同源 |
| `VITE_WS_URL` | 自动推导 | 显式 WebSocket URL，例如 `wss://example.com/ws` |
| `VITE_DEV_API_TARGET` | `http://localhost:8080` | 仅供 Vite 开发代理使用 |

修改 Vite 环境变量后需要重新构建前端。

## 任务文件

任务文件是 UTF-8 JSON。完整示例见 `examples/mission.example.json`。

```json
{
  "name": "自定义任务",
  "drones": [
    {
      "id": "uav-demo",
      "name": "演示航线",
      "color": "#00d4ff",
      "speed": 14,
      "route": [
        { "lng": 113.9301, "lat": 22.5334, "alt": 150 },
        { "lng": 113.9425, "lat": 22.5155, "alt": 165 }
      ]
    }
  ]
}
```

### 字段

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `name` | string | 任务名称，非空 |
| `drones` | array | 至少一架无人机 |
| `drones[].id` | string | 非空且任务内唯一；也是遥测主键 |
| `drones[].name` | string | 展示名称，建议非空 |
| `drones[].color` | string | CSS 颜色，建议使用十六进制 |
| `drones[].speed` | number | 米/秒，必须大于 0 |
| `drones[].route` | array | 至少两个航点，且至少存在一个非零水平航段；末点会自动连接首点 |
| `route[].lng` | number | 经度，范围 `[-180, 180]` |
| `route[].lat` | number | 纬度，范围 `[-90, 90]` |
| `route[].alt` | number | 米，必须大于等于 0 |

未知 JSON 字段会被拒绝，避免拼写错误静默生效。相邻重复航点可以存在，但整条航线不能全部位于同一水平位置。模拟器会自动从末点飞回首点，因此无需在数组末尾重复首点；若需要不同的返航路径，应显式加入中间航点。

## 部署模式

### 同源反向代理

推荐让浏览器、API 和 WebSocket 共用域名。仓库的 Nginx 配置就是这种模式，无需前端 URL 环境变量，也不会产生浏览器跨域问题。

### 分离部署

如果 Web 和 API 使用不同域名：

1. 构建 Web 时设置 `VITE_API_BASE_URL` 和可选的 `VITE_WS_URL`。
2. API 的 `ALLOWED_ORIGINS` 必须包含 Web 的完整 origin，包括协议和端口。
3. HTTPS 页面必须使用 `wss://`，否则浏览器会阻止混合内容。
