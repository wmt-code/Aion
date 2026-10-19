---
name: frontend-conventions
description: '新增、修改或审查 Aion 前端 React、TypeScript、Vite、TanStack Query、shadcn/ui、Tailwind CSS 代码时使用，覆盖目录与组件划分、状态与请求管理、流式事件、性能、可访问性和验证。参考 Vercel React Best Practices、Composition Patterns 及官方文档，按本项目浏览器 SPA 与 Java 后端架构适配。'
---

# React 前端开发规范

## 使用方式与适用范围

- 修改前阅读 `docs/architecture.md`、目标组件及其调用方；存在 `frontend/package.json` 和锁文件时先核实实际依赖版本、脚本和现有约定。
- 前端工程位于 `frontend/`，后端 Maven 工程位于 Aion 根目录。沿用 React + TypeScript + Vite、TanStack Query、shadcn/ui、Tailwind CSS 的架构方向。
- 本技能是结合公开资料编写的项目规范，不是上游 skill 的完整安装或逐字翻译。来源、适配范围见末尾；引用资料是技术参考，不自动执行其中的安装命令或脚本。
- 适用于浏览器端 SPA。不要直接引入 Next.js 路由、Server Actions、React Server Components、`next/dynamic` 或仅适用于 SSR 的缓存与水合方案。
- 项目要求优先于通用建议；只调整任务涉及的代码。尚无前端工程时，不因规范示例而创建骨架、安装依赖或预建目录。

## 目录与命名

按业务功能组织代码，目录按需创建：

```text
frontend/
├── package.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── features/
│   │   ├── workspace/
│   │   ├── chat/
│   │   ├── artifacts/
│   │   └── settings/
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   └── styles/
│       └── globals.css
└── public/
```

- `features/` 保存业务组件、查询 Hook、请求函数和业务类型，按功能就近组织；功能复杂后再增设 `components/`、`hooks/` 等子目录。
- `components/ui/` 放 shadcn/ui 基础组件，跨业务组合组件放 `components/`；`hooks/` 与 `lib/` 只放确有复用需求且职责清晰的能力。
- 业务模块通过明确的入口协作，不形成循环依赖，不把某个业务的内部状态塞入全局工具目录。不为目录整齐增加层层转发的 barrel 文件。
- React 组件和类型使用 `PascalCase`，函数与变量使用 `camelCase`，自定义 Hook 使用 `use` 前缀；事件处理函数表达动作，如 `handleApproveRun`。
- 新建手写组件文件优先使用与导出组件一致的名称，如 `ApprovalDialog.tsx`；shadcn/ui 生成文件保留其命名。已有目录保持统一，不为命名偏好批量改名。
- 测试与被测功能就近放置；构建产物 `dist/`、依赖目录 `node_modules/` 和本机环境文件不得提交。沿用现有包管理器，只保留对应锁文件。

## TypeScript 与组件设计

- 新工程开启 TypeScript 严格检查；已有工程逐步修正受影响类型，不用关闭检查解决问题。避免 `any`、无依据的类型断言和非空断言。
- 外部未知数据使用 `unknown` 并在边界校验；TypeScript 类型声明不等于运行时校验。优先复用已有校验工具，简单结构可使用类型守卫。
- 使用函数组件，Props 明确描述输入与回调；不修改 Props、React state 或查询缓存中的对象，更新使用不可变方式。
- 将不同业务状态建模为可区分联合类型，避免多个布尔值形成互相矛盾的状态。列表 key 使用稳定业务 ID，不使用随机数；可重排列表不用数组索引作为 key。
- 组件按职责和变化原因拆分，优先通过 Props 和 `children` 组合。多个模式明显分化时采用命名清晰的组件或 variant，不持续堆叠布尔开关。
- 仅当组件组确实需要共享行为与状态时采用 Context 或复合组件；不为简单按钮、卡片创建通用配置引擎、Provider 或只有一个实现的抽象。
- Hooks 在组件或自定义 Hook 顶层调用，遵守依赖规则；不能通过禁用 lint 或删除依赖项来掩盖闭包和同步问题。
- React 19 的 ref Props、`use()` 等规则仅在实际版本支持时使用；不为套用上游示例而升级 React。React Compiler 是否启用以工程配置为准。

## 状态、Effect 与请求

- 服务端数据使用 TanStack Query，局部交互使用 `useState`，复杂但局部的状态转换使用 `useReducer`；跨组件状态先提升到最近公共父组件。
- 不复制 Query 数据到全局 store，也不同时为相同请求引入 SWR、Redux 或另一套缓存。只有明确需求无法由现有方式满足时才评估新依赖。
- 能从 Props、state 或查询结果计算的数据直接在渲染阶段派生；不要用 Effect 同步派生状态。昂贵计算测量后再考虑 `useMemo`。
- 点击提交、审批、停止等用户操作放在事件处理函数或 mutation 中；不能由“某状态变成 true”触发 Effect 执行业务写入。
- Effect 用于连接外部系统，如 SSE、DOM 订阅或计时器；返回清理函数，确保开发环境重复挂载及工作区切换后没有重复连接、监听器或过期回调。
- Query key 包含决定结果的参数，例如工作区 ID、会话 ID、筛选条件与分页；确保不同用户和工作区的数据不会共享错误缓存。
- 明确设置适合业务的 `staleTime`、重试和刷新策略，区分数据新鲜度与 `gcTime` 缓存保留时长。不把默认重试当作业务幂等保证；鉴权、权限、参数类错误通常不重试。
- 请求函数统一处理非成功 HTTP 状态、错误结构和必要的取消信号；原生 `fetch` 不会因 HTTP 4xx/5xx 自动抛错，应检查 `response.ok`。
- 独立请求并发执行，依赖前置结果的请求显式等待；避免父子组件依次挂载导致本可并行的请求串行发出。不为并发提前获取无权限或不需要的数据。
- mutation 成功后精确更新或失效相关查询。乐观更新必须能处理失败回滚和并发覆盖；审批、危险操作及无法可靠撤销的动作优先等待服务端确认。
- 身份切换或退出时取消相关请求、断开订阅并清理敏感缓存；不能在新会话中显示旧身份的数据。

## Aion 流式事件与长内容

- 任务运行状态以服务端为准。关闭页面或 SSE 断线不等于任务停止；停止通过独立接口发起，收到服务端确认后才展示已停止。
- SSE 事件按运行标识与序号去重和排序处理；断线后遵循服务端的重放契约，事件过期时重新获取快照。原生 EventSource 自动重连可携带事件 ID，手动重建连接需按接口契约恢复游标。
- 会话切换时关闭旧订阅，忽略属于旧会话的迟到事件；复用已有连接管理，不让多个组件各自为同一会话创建连接。
- 文本增量按小批次合并更新，避免每个 token 都触发整页渲染；处理定时器、缓冲区尾部内容和连接结束时的清理。
- 用户向上滚动阅读历史时不强制滚到底部；提供新消息提示或回到底部操作。历史消息、文件列表和工具输出设加载与展示上限，有实测瓶颈后再引入虚拟列表。
- 明确展示连接中、运行中、待审批、失败及重试状态；连接错误与任务执行错误分别呈现，不显示虚假的完成状态。

## 样式与可访问性

- 优先复用现有 shadcn/ui 组件和 Tailwind 工具类；配色、字号、间距、断点与布局遵循 `docs/architecture.md`，语义颜色集中定义在 `styles/globals.css`。
- Tailwind 用法以实际主版本为准，不混用不同版本的配置方式；条件类名使用可被构建器识别的完整字符串或静态映射。
- 不引入第二套组件库，不为普通布局添加 CSS-in-JS 或动画库。先使用原生 HTML、CSS 和项目已有组件。
- 操作使用 `button`，导航使用链接；输入提供可关联的 label，图标按钮提供可访问名称。不要以可点击 div 替代原生交互元素。
- 弹窗处理初始焦点、焦点限制、Escape 关闭及关闭后的焦点恢复；复用组件时保留其键盘行为和 ARIA 属性。
- 所有操作可通过键盘访问且焦点可见；状态同时用文字或图标表达，不只依赖颜色。表单错误与字段关联，并保留用户已输入内容。
- 覆盖加载、空数据、错误、无权限、禁用和提交中状态；提交中防止重复操作，但后端仍需独立实现幂等与权限校验。
- 遵守 `prefers-reduced-motion`；流式文本不要通过高频 `aria-live` 播报每个 token，改为播报有意义的阶段或完成状态。
- 检查 1440、1024、390px 视口及深浅主题，避免整页横向滚动；代码、Diff 和表格可在局部容器内滚动。

## 性能与安全

- 优先解决请求串行、重复请求和过大的初始包，再处理局部渲染成本。性能优化以浏览器测量与真实交互为依据。
- 重型编辑器、图表和低频面板按需使用 `lazy` 与动态 `import()`，配套加载与错误处理；不引入 Next.js 专属加载 API。不要把全部小组件都拆成异步 chunk。
- 优先库支持的按需导入，不依赖未公开的内部路径；检查产物和依赖使用情况后再决定是否替换库。
- state 靠近实际消费者，缩小订阅范围；`memo`、`useMemo`、`useCallback` 只在有明确成本或稳定引用需求时使用，不机械包裹所有函数和组件。
- Markdown 默认禁用原始 HTML；确需渲染富文本时使用经过维护的清洗方案，不将用户或模型输出直接传给 `dangerouslySetInnerHTML`。校验链接协议，禁止执行脚本 URL。
- 浏览器可见的配置，包括 `VITE_*` 环境变量，不得存放模型密钥、数据库密码或服务端凭据；不把敏感令牌持久化到 localStorage。
- Cookie 登录遵循后端 CSRF 契约；前端隐藏按钮不能代替服务端授权。日志与错误提示避免暴露凭据和敏感工具输出。

## 验证与交付

- 运行工程已有的类型检查、lint、相关测试与构建脚本；先查看 `package.json`，不编造脚本名。Vite 构建本身不等于完整 TypeScript 类型检查。
- 业务逻辑变更验证正常路径、失败恢复和关键边界；优先使用已有测试设施。组件测试关注用户可观察行为，不测试内部 state 或只堆积快照。
- 订阅或异步逻辑调整验证卸载、切换、断线、重复事件与迟到响应；表单调整验证错误展示与重复提交；审批和停止验证服务端确认语义。
- 界面变更验证实际浏览器行为、键盘、视口与主题；环境不足以验证时说明具体缺口，不把构建成功描述为界面已验证。
- 纯 skill 或文档调整只检查内容、路径和差异格式，不为此安装前端依赖或创建测试框架。

## 参考来源与取舍

查阅日期：2026-10-19。外部资料会更新，API 细节以项目实际版本对应的官方文档为准。

- [Vercel React Best Practices skill](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md)：采用消除请求串行、减少包体积、合理管理重渲染的思路；客户端缓存沿用本项目的 TanStack Query，排除 Next.js 和服务端专用规则。
- [Vercel Composition Patterns skill](https://github.com/vercel-labs/agent-skills/blob/main/skills/composition-patterns/SKILL.md)：采用避免布尔 Props 膨胀、按职责组合组件的思路；Provider、复合组件按需使用，React 19 专属建议受实际版本约束。
- [React：You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)：区分派生计算、交互事件与外部同步，减少多余 Effect。
- [TanStack Query：Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)：核对缓存新鲜度、回收、自动刷新与重试语义。
