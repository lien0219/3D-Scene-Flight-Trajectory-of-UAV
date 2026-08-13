# 贡献指南

感谢参与 UAV Flight Trajectory。为保持项目可维护，请先通过 Issue 对较大功能、协议变更和新依赖进行讨论。小型修复可以直接提交 Pull Request。

参与项目即表示你同意遵守 [行为准则](CODE_OF_CONDUCT.md)。安全漏洞不要提交公开 Issue，请按 [安全策略](SECURITY.md) 报告。

## 开发环境

需要 Go 1.22+、Node.js 20+ 和 pnpm 10。

```bash
git clone git@github.com:lien0219/3D-Scene-Flight-Trajectory-of-UAV.git
cd 3D-Scene-Flight-Trajectory-of-UAV/web
pnpm install --frozen-lockfile
```

分别在 `api` 目录运行 `go run .`，在 `web` 目录运行 `pnpm dev`。应用地址为 <http://localhost:5173>。

## 工作原则

- 一个 Pull Request 解决一个清晰问题。
- 保持 API、任务格式和默认行为向后兼容；不兼容变更必须先讨论。
- 配置与业务逻辑分离，航线数据通过任务文件扩展。
- 外部输入应在边界处校验，失败时给出可操作错误。
- 修复缺陷时增加能在修复前失败、修复后通过的测试。
- 不提交 token、凭据、私有坐标、构建产物或本地环境文件。
- 不在本项目中加入可直接控制真实航空器且未经安全评审的能力。

## 代码约定

### Go

- 使用 `gofmt`，保持包职责单一。
- HTTP handler 不承载飞行计算或设备协议解析。
- 所有 goroutine 必须有明确退出路径。
- 使用表驱动测试覆盖输入边界和公共契约。

### TypeScript 与 React

- 保持 `strict` 类型检查，不用 `any` 绕过公共契约。
- 数据转换优先放入 `src/lib` 的纯函数并测试。
- Hook 必须清理连接、计时器、监听器和动画循环。
- Cesium 对象创建应稳定，避免在渲染期间无意义重复分配。

### Markdown

- 文件使用 UTF-8、LF、ATX 标题和围栏代码块。
- 标题层级逐级递进，列表前后保留空行。
- 命令注明 shell，路径和环境变量使用反引号。
- 文档中的命令和 JSON 必须可运行，不使用占位结果冒充已验证行为。
- 从 `web` 目录运行 `pnpm lint:md` 检查 Markdown。

## 验证

提交前至少运行：

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

UI 或 Cesium 改动还应在浏览器中验证桌面与窄屏布局、WebSocket 重连、模型加载和控制面板交互。

## Commit 与 Pull Request

推荐使用 Conventional Commits：

```text
feat(api): support external mission files
fix(web): derive secure websocket URL
docs: document asset licensing boundary
```

Pull Request 描述应说明：问题、行为变化、兼容影响、验证结果和截图（适用于 UI 变化）。维护者可能要求拆分无关改动或补充资源许可证明。

## 资源与数据

新增模型、图片、地图数据或示例数据必须在 `THIRD_PARTY_NOTICES.md` 中记录来源、作者、许可证和修改情况。来源不明、禁止再分发或含敏感信息的资源不会被接受。
