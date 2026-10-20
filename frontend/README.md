# Aion 前端

React + TypeScript + Vite 浏览器 SPA，使用 TanStack Query、Tailwind CSS v4 和 shadcn/ui 风格的 Radix 基础组件。需要 Node.js 22.13+（22.x）或 24+，使用 npm 和唯一的 `package-lock.json`。

```sh
cd frontend
npm ci
npm run dev
```

默认访问 Vite 输出的本地地址。开发环境 `/api` 转发到 `http://localhost:8080`；生产环境由 Web 服务配置同源反向代理。浏览器环境变量不得放入密钥。

```sh
npm run lint
npm run build
npx playwright install chromium
npm test
```

`build` 包含完整 TypeScript 检查；也可单独运行 `npm run typecheck`。浏览器检查覆盖 1440、1024、390px 的深浅主题、草稿保留、产物标签、面板开关、导航抽屉及键盘行为。截图保存在忽略的 `test-results/` 中。

## 当前范围

- 依据 Apple HIG、Impeccable Operate、Taste 应用界面参考及项目 frontend-design skill 重设计；来源与取舍见 [设计调研](../docs/frontend-design-research.md)。
- 通用任务输入、草稿与计划/执行模式选择，不预设任务类型。
- 默认会话导航 + 任务画布；桌面导航可折叠，产物按需展开；移动端产物替换主视图并提供返回，导航采用原生模态抽屉。
- 中性灰白/石墨深浅主题，初始跟随系统；使用系统字体，无外部字体请求。支持 reduced-motion、增加对比度与键盘访问。
- Query Provider 已就位，查询缓存新鲜度 30 秒、默认不重试、不在窗口聚焦时刷新；接入具体接口时按业务设置。

尚未接入后端接口：工作区、会话、发送与执行、审批、SSE、文件和产物下载均未实现。发送与新建会话保持禁用，首页不常驻显示连接提示；草稿和模式仅保留在当前页面，不创建虚假的运行记录。

业务代码放在 `src/features/`，基础组件放在 `src/components/ui/`，语义颜色位于 `src/styles/globals.css`。`components.json` 已配置后续添加 shadcn/ui 组件所需的路径。
