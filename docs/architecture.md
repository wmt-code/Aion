# Aion Agent Harness 设计方案

## Context

建设一个使用 **JDK 21 + Spring Boot + AgentScope Java + PostgreSQL + Redis**，前端采用 **React + shadcn/ui + Tailwind CSS**，通过 Docker 部署的 Agent 工作台。

默认面向**单团队自托管、浏览器优先、编程与技术研究**。核心路径：**提出任务 → Agent 执行 → 必要时审批 → 审阅文件、测试与产物**。当前仓库为空，本次只交付调研与方案。

**推荐架构：模块化单体 + 独立 Worker + 会话级执行容器。** 复用 AgentScope 的执行能力，重点建设权限、持久化、恢复和产物审阅；首版使用单主 Agent。

## 1. 成熟项目有哪些值得借鉴的思想

调研日期：2026-10-19。以下基于官方文档与公开源码；后续架构和界面属于针对 Aion 的设计建议。

| 项目 | 核心思想与证据 | Aion 的取舍 |
|---|---|---|
| **Codex** | 执行核心与界面分离；Thread / Turn / Item 和结构化事件表达任务；审批与 sandbox 分层。[1] | 建立 Session / Run / ToolCall 模型，UI 订阅事件；浏览器首版用 HTTP + SSE。 |
| **Claude Code / Agent SDK** | Agent 循环、按需 Skills、上下文压缩；会话恢复保存对话，不自动恢复文件或外部副作用。[2] | 分别管理上下文、工作目录和执行记录；明确“重连、续跑、重试”的区别。 |
| **DeepSeek Harness** | 官方项目，插件组合驱动，区分持久会话与运行中 Agent；目前仍是 developer preview，未完成安全审计。[3] | 借鉴扩展边界和持久历史，首版只做显式工具注册，不引入完整插件框架。 |
| **OpenHands** | 浏览器工作台与执行服务分离，会话可使用 Docker 执行环境；历史隔离不等于文件隔离。[4] | 对话与文件、Diff、测试并排；每个会话有独立可写目录。 |
| **AgentScope Java** | 已提供 ReAct、模型适配、流式事件、工具/MCP、Skills、状态存储和确认事件。[5] | 复用运行时；平台负责用户权限、任务调度、持久审批、事件回放与 sandbox。 |

**版本结论：** 本次核实的最新非预发布版本为 AgentScope Java **2.0.4**，另有 2.1.0-BETA1。部分在线 `AgentSession / journal` 文档不属于 2.0.4，不能直接套用。该版本 Java 基线为 17，JDK 21 满足要求；依赖采用 Spring Boot 4.0.x，但不同 POM 的补丁版本存在差异。[5]

建议先锁定 AgentScope **2.0.4**，以 **Spring Boot 4.0.x** 为兼容验证起点，验证依赖收敛后固定受支持的补丁版本。这是待验证组合，尚未进行实际构建。

## 2. 总体架构

```text
React + TypeScript + shadcn/ui + Tailwind
                    │ HTTP / SSE
          Web：静态资源 + 反向代理
                    │
       Spring Boot API：权限、会话、审批、事件订阅
                    │
       PostgreSQL：消息、任务队列、审批、事件、快照
                    │
       Spring Boot Worker：领取任务、执行、保存结果
          ├─ AgentScope Java → 模型 API
          └─ 统一工具权限入口 → 会话 sandbox
                                      └─ 文件、命令、测试、产物

Redis：登录会话、限流、缓存、事件唤醒
持久卷：工作目录、大文件和完整输出；PG 保存索引
```

- **一个后端工程、两种部署角色。** API 负责交互与控制；Worker 持有 Agent 执行订阅。两者用同一镜像，业务按包组织，无需提前拆微服务。
- **Spring MVC + Spring JDBC + Flyway。** MVC 支持 Flux/SSE，不必为流式响应引入全栈 WebFlux/R2DBC。[6] 配置异步响应执行器，阻塞数据库操作离开 Reactor 网络线程；限制任务并发、时长、工具轮数和 token。虚拟线程不能替代限流。
- **任务独立于浏览器连接。** 关闭页面不终止执行；停止通过独立接口处理。SSE 负责展示，Worker 负责运行。
- **PostgreSQL 是事实源。** 队列、状态、审批和恢复依赖 PG；Redis 只做暂态加速和唤醒，通知丢失时补查数据库。[7]
- **前端用 Vite + TanStack Query。** Query 管理服务端数据，React state/reducer 管面板、标签和弹窗，首版无需 Redux。

直接复用 `agentscope-harness`、`ReActAgent`、模型扩展与工具机制。平台只适配状态存储、事件、确认和中断。**Shell/文件工具统一转发至 sandbox，不能直接获得 Worker 的宿主权限。**

## 3. 功能模块与数据模型

以下是业务模块，不是独立服务。

| 模块 | 首版职责 |
|---|---|
| **访问与配置** | 管理员/成员、工作区权限、模型连接与密钥、模型能力、预算和并发限制。 |
| **工作区** | 项目导入、会话独立目录、文件浏览、Diff、产物导出、容量与清理。 |
| **会话与上下文** | 消息、附件、历史、项目指令、上下文预算、摘要与工具输出裁剪。 |
| **任务运行** | 入队、领取、状态、审批、停止、恢复、事件保存与 SSE。 |
| **Agent 与工具** | AgentScope 接入；文件、搜索、Shell、受控网络；统一校验权限。 |
| **运行记录** | 工具调用审计、错误、耗时、token 用量、测试与产物关联。 |

核心关系：`Workspace → Session → Run → ToolCall`；另有 `Message、RunEvent、Approval、AgentSnapshot、Artifact`。一个会话一次只有一个活跃 Run，一个可写目录只有一个写者；不同会话可并行。审批等待也保留目录占用。

上下文分为**固定规则、当前任务与近期消息、历史摘要与按需检索**。权限和审批独立持久化，不能仅存在于模型摘要；长期记忆下一阶段再做，并允许查看、修改和删除。

## 4. Harness 的关键运行规则

```text
QUEUED → RUNNING → SUCCEEDED / FAILED
             ├→ WAITING_APPROVAL → QUEUED
             ├→ CANCELLING → CANCELLED
             └→ INTERRUPTED（结果不明，需要核对）
```

1. **审批可持久化。** 执行前保存待调用工具、参数摘要、工作目录版本和 Agent 快照，再进入等待，释放线程。批准只绑定具体调用和有效期；参数变化重新审批，重复提交幂等。拒绝/超时返回工具拒绝结果，允许 Agent 调整计划。
2. **明确事务边界。** 暂停快照、审批、任务状态和对应事件一起提交，事务内不等待模型或工具。AgentScope 2.0.4 的 JDBC 状态存储自行 commit，不能默认参与业务 `@Transactional`；使用小型 `AgentStateStore` 适配器衔接平台事务，并先验证跨进程恢复。[8]
3. **防止重复写入。** PG `FOR UPDATE SKIP LOCKED` 领取任务，租约版本阻止旧 Worker 提交。租约过期不代表旧 Shell 已停止，接管前必须确认其终止；无法确认则暂停核对。工具派发前记录 executionId，崩溃后结果未知的命令不自动重放，不承诺副作用“恰好一次”。
4. **停止需要落实到进程。** SDK 中断与 sandbox 进程终止分别处理，确认执行停止后才显示“已停止”。
5. **事件可以补发。** 事件采用 `runId、seq、type、payload`；文本增量合批落库后发送，前端按序号去重，通过 `Last-Event-ID` 补齐。事件过期则返回快照；Redis Pub/Sub 与 SSE 自动重连不能代替持久日志。[7]

**事件回放还原界面，Agent 续跑只承诺已验证的稳定边界。** 无法确认执行位置时，核对结果后开启关联的新 Run。

## 5. 产品界面与视觉规范

默认进入最近会话；新用户看到“选择工作区 + 输入任务”。主要布局强调执行过程与交付结果并排审阅。

```text
┌────────────────────────────────────────────────────────────────┐
│ Aion   工作区 / 当前会话       模型 · 计划/执行       状态 / 停止│
├───────────┬─────────────────────────┬──────────────────────────┤
│ 新建会话  │ 用户任务                │ 产物 | 变更 | 文件 | 输出│
│ 最近会话  │ 简短计划                │                          │
│           │ 执行时间线              │ 文件 Diff                │
│ 工作区    │ · 读取文件              │ Markdown / 测试结果      │
│ 运行记录  │ · 修改文件              │                          │
│           │ · 运行测试              │                          │
│ 设置      │ 审批卡片（需要时）      │                          │
│           │ 输入任务 / 附件 / 发送  │ 导出补丁 / 下载产物      │
└───────────┴─────────────────────────┴──────────────────────────┘
```

**布局：** ≥1280px 左栏 224px、中栏自适应、右栏约 36%（360–520px），可拖动和折叠；768–1279px 收起导航，产物按需展开；手机采用“对话 / 产物”标签，导航用抽屉，16px 边距。

**交互：** 工具调用折叠成操作行，点击定位结果；对话与产物独立滚动。展示计划、动作、参数与结果，不展示隐藏思维链。模式只设“计划（只读）”和“执行（允许当前工作目录写入）”；首版 Shell 默认审批，可配置小范围可信命令。

审批卡显示命令、路径/站点、原因和影响范围，提供“仅此次允许 / 拒绝”。Diff 展示已经发生在隔离工作区的修改；首版导出补丁，不自动提交或推送。终端先提供只读输出。

### 配色

采用**冷灰背景 + 青绿主色**，主色集中用于主操作、选中项与焦点。

| Token | 浅色 | 深色 |
|---|---|---|
| 页面背景 | `#F6F8FA` | `#15202B` |
| 内容表面 | `#FFFFFF` | `#1B2632` |
| 主文字 | `#18232E` | `#E6EDF3` |
| 次级文字 | `#526172` | `#9AACBD` |
| 分隔线 | `#D8E0E7` | `#344556` |
| 主色 | `#0F766E` | `#55C3B6` |
| 主按钮文字 | `#FFFFFF` | `#102521` |

状态色（浅/深）：运行 `#245EA8 / #8EBBFF`，成功 `#216E4E / #78D0A6`，待批准 `#946200 / #F2C66D`，失败 `#B42318 / #FF9D91`；同时配文字和图标。

字体用 IBM Plex Sans 搭配中文系统字体，代码用 JetBrains Mono；UI 14px、消息 15px/24px、代码 13px/20px。4px 间距基准、6–10px 圆角，正文左对齐，阴影主要用于浮层。

复用 shadcn/ui 的 Sidebar、Resizable、Tabs、Sheet、Dialog、Tooltip，Tailwind 映射语义变量。[9] 已计算主要文字/按钮对比度 ≥5.47:1、状态文字 ≥5.24:1。实现时补验全部组件状态、键盘导航、可见焦点和 reduced-motion；模型 Markdown 默认禁用原始 HTML。

## 6. Docker 部署

Compose 常驻 **web、api、worker、postgres、redis** 五个服务；sandbox 按需创建、空闲停止，数据单独持久化。生产用 Linux，Windows 开发可用 Docker Desktop/WSL2。

- 仅 Web 暴露 HTTPS，前端/API 同源；HttpOnly Cookie 登录，修改请求做 CSRF 防护。SSE 禁用代理缓冲、设置心跳；PG/Redis 不开放公网端口。
- API 和 sandbox 不持有 Docker socket；仅可信 Worker 访问专用 rootless Docker daemon，创建配置由服务端固定，守护进程账号不能读取业务密钥与数据库目录。[10]
- sandbox 仅挂载所属目录，非 root、只读根文件系统、受限临时空间、移除多余 capabilities，限制 CPU/内存/进程/时长。默认无外网；确需下载依赖时经受限出口放行，禁止访问内部数据服务。
- 模型密钥仅留在可信服务；日志脱敏，事件与文件设容量/保留期。实测 rootless 的 cgroup 限额生效；备份 PG、工作目录与产物并验证恢复。

首版单机不承诺高可用；多机时再加共享/对象存储。若目标改为公网多租户，需要专用执行节点和更强隔离。

## 7. 实施顺序与验收

| 阶段 | 交付内容 | 完成标准 |
|---|---|---|
| **技术验证** | 版本组合、流输出、工具调用、审批快照、重建 Agent、取消进程 | JDK 21 构建通过；等待审批时重启后能关联原调用；恢复边界明确。 |
| **P0 完整闭环** | 登录、模型配置、工作区、单 Agent、文件/Shell、审批、事件流、Diff/产物、预算 | 完成“导入项目 → 修改 → 测试 → 审阅 → 导出补丁”。 |
| **P0 可靠性** | 断线补发、互斥、故障核对、隔离、备份恢复 | 浏览器断线不中止；Redis 断开不丢任务；重复批准不重复派发；结果未知的命令不盲目重放。 |
| **P1 扩展** | MCP 管理、项目 Skills、长期记忆、分支会话 | 扩展沿用权限、记录与审阅机制。 |

多 Agent 调度、可视化编排、插件市场、完整 IDE、Kubernetes 和独立向量数据库暂缓；有实际 RAG 需求时先评估 pgvector。

**后续工程落点：** 后端 Maven 工程直接位于 Aion 根目录，不创建 `backend/`：`pom.xml`；`src/main/java/dev/aion/{access,workspace,session,run,agent,tool}`；`src/main/resources/db/migration/`；`frontend/src/features/{workspace,chat,artifacts,settings}`；`frontend/src/styles/globals.css`；`deploy/compose.yaml`；`docs/architecture.md`。当前无业务代码可复用，以上为拟建路径。

**必须验收：** 在工具成功而结果未保存时杀掉 Worker；旧租约不能推进状态；两个任务不能写同一目录；路径/符号链接越界、凭据读取和未授权网络访问被拒绝；取消后进程停止。界面覆盖 1440/1024/390px、深浅主题、键盘操作、长输出和审批卡片。

本次完成资料核查与配色计算，未创建应用代码或运行 SDK 集成测试。

## Sources

1. [Codex App Server](https://learn.chatgpt.com/docs/app-server)、[工具审批源码](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/orchestrator.rs)。
2. [Claude Agent 循环](https://code.claude.com/docs/en/agent-sdk/agent-loop)、[会话恢复](https://code.claude.com/docs/en/agent-sdk/sessions)、[检查点限制](https://code.claude.com/docs/en/checkpointing)。
3. [DeepSeek 官方介绍](https://www.deepseek.com/harness/en/)、[架构](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)、[安全声明](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md)。
4. [OpenHands 会话](https://docs.openhands.dev/openhands/usage/agent-canvas/conversations)、[Docker 执行](https://docs.openhands.dev/openhands/usage/agent-canvas/backend-setup/docker-execution.md)。
5. [AgentScope Java 2.0.4](https://github.com/agentscope-ai/agentscope-java/releases/tag/v2.0.4)、[版本 BOM](https://github.com/agentscope-ai/agentscope-java/blob/v2.0.4/agentscope-dependencies-bom/pom.xml)、[权限确认](https://github.com/agentscope-ai/agentscope-java/blob/v2.0.4/docs/v2/en/docs/building-blocks/permission-system.md)。
6. [Spring MVC 异步与响应式类型](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html)。
7. [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)、[SSE 重连](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)、[PostgreSQL 锁定](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)。
8. [AgentScope JDBC 状态存储源码](https://github.com/agentscope-ai/agentscope-java/blob/v2.0.4/agentscope-extensions/agentscope-extensions-jdbc/src/main/java/io/agentscope/extensions/jdbc/state/JdbcAgentStateStore.java)。
9. [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar)、[Resizable](https://ui.shadcn.com/docs/components/resizable)、[Tailwind 主题变量](https://tailwindcss.com/docs/theme)。
10. [Docker 安全边界](https://docs.docker.com/engine/security/)、[rootless 资源限制](https://docs.docker.com/engine/security/rootless/tips/)。
