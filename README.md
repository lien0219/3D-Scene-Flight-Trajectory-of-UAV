# UAV Flight Trajectory

[![CI](https://github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/actions/workflows/ci.yml/badge.svg)](https://github.com/lien0219/3D-Scene-Flight-Trajectory-of-UAV/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.22%2B-00ADD8?logo=go)](api/go.mod)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](web/package.json)

基于 CesiumJS、React 和 Go 的实时无人机飞行轨迹可视化系统。后端模拟多架无人机沿任务航线飞行，通过 WebSocket 推送遥测；前端在三维地理场景中完成平滑插值、航线绘制、相机跟随、天气切换和 HUD 展示。

> 本项目用于可视化、教学和仿真演示，不包含真实飞控、避障、空域合规或安全保障能力，不应直接用于控制真实航空器。

![三维场景多机巡航](web/src/img/default/1.png)

## 功能

- 多无人机独立航线、速度、颜色与状态模拟
- 5 Hz WebSocket 遥测与浏览器逐帧平滑插值
- 2D/3D 场景、追尾/俯瞰/自由视角和天气效果
- REST 状态查询、任务配置查询和健康检查
- JSON 任务文件扩展，无需修改前端航线源码
- 环境变量配置、Docker Compose、本地开发代理
- Go 单元/契约测试、前端负载测试和 GitHub Actions CI

更多实现细节见 [架构说明](docs/ARCHITECTURE.md)。

## 快速开始

### 环境要求

- Go 1.22 或更高版本
- Node.js 20 或更高版本
- pnpm 10

### 本地开发

打开两个终端。

终端 1，启动 API：

```bash
cd api
go run .
```

终端 2，安装依赖并启动 Web：

```bash
cd web
pnpm install --frozen-lockfile
pnpm dev
```

访问 <http://127.0.0.1:5173>。Vite 会将 `/api` 和 `/ws` 代理到 `http://127.0.0.1:8080`。

### Docker Compose

```bash
docker compose up --build
```

访问 <http://localhost:8088>。停止服务：

```bash
docker compose down
```

## 自定义任务

复制并修改 [任务示例](examples/mission.example.json)，然后让 API 读取该文件：

```bash
cd api
MISSION_FILE=../examples/mission.example.json go run .
```

PowerShell：

```powershell
cd api
$env:MISSION_FILE = "../examples/mission.example.json"
go run .
```

任务文件可声明任意数量的无人机。每架无人机至少需要两个有效航点，完整字段、校验规则和部署变量见 [配置指南](docs/CONFIGURATION.md)。

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/healthz` | 服务健康检查 |
| `GET` | `/api/config` | 当前任务和无人机航线 |
| `GET` | `/api/state` | 当前无人机遥测快照 |
| `GET` | `/ws` | 实时遥测 WebSocket |

接口字段和示例见 [API 文档](docs/API.md)。

## 项目结构

```text
.
├── api/                    # Go 模拟与遥测服务
│   ├── config/             # 运行配置、默认任务和任务校验
│   ├── handler/            # WebSocket Hub 与 HTTP handler
│   ├── model/              # 共享后端数据模型
│   ├── router/             # 路由和 CORS
│   └── simulator/          # 飞行推进与地理计算
├── web/                    # React + CesiumJS 前端
│   └── src/
│       ├── components/     # 三维场景与 HUD
│       ├── config/         # 浏览器运行地址解析
│       ├── hooks/          # 任务与遥测数据接入
│       ├── lib/            # 可独立测试的数据处理
│       └── types/          # TypeScript 契约
├── docs/                   # 架构、API、配置和扩展文档
├── examples/               # 可运行任务示例
├── .github/                # CI、Issue 和 PR 模板
└── compose.yaml            # 本地容器编排
```

## 质量检查

```bash
cd api
go test ./...
go vet ./...

cd ../web
pnpm check
pnpm test
pnpm build
pnpm lint:md
pnpm exec playwright install chromium
pnpm test:e2e
```

在支持 `make` 的环境中也可从仓库根目录运行 `make check`。

## 扩展方向

- 通过任务 JSON 增加无人机和航线
- 实现新的遥测源，将模拟器替换为回放、消息队列或设备网关
- 抽象新的影像/地形提供商，满足部署区域的许可和坐标系要求
- 为大规模机队增加增量协议、空间索引和实体分层加载

具体扩展点与兼容要求见 [扩展指南](docs/EXTENDING.md)，计划中的工作见 [路线图](ROADMAP.md)。

## 参与贡献

提交代码前请阅读 [贡献指南](CONTRIBUTING.md) 和 [行为准则](CODE_OF_CONDUCT.md)。安全问题请按 [安全策略](SECURITY.md) 私下报告。

## 许可证与第三方资源

项目源码和项目自制 UAV 模型采用 [MIT License](LICENSE)。截图中的地图影像和运行时地图服务仍受提供商条款约束；分发或商用前必须阅读 [第三方声明](THIRD_PARTY_NOTICES.md)。
