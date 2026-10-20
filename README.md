# Aion

Agent 工作台后端，使用 JDK 21、Spring Boot 4.0.8、Spring MVC、JDBC、Flyway、PostgreSQL 和 Redis。架构设计见 [docs/architecture.md](docs/architecture.md)。

## 本地开发

需要 JDK 21、Maven 3.9+ 和可运行 Linux 容器的 Docker。所有命令从仓库根目录执行，以下以 PowerShell 为例。

```powershell
$env:AION_DATABASE_PASSWORD = 'local-development-only'
docker compose -f deploy/compose.yaml up -d --wait
mvn spring-boot:run
```

默认使用 `api` profile，监听 `8080`。PostgreSQL、Redis 的开发端口仅绑定本机回环地址。如本机端口被占用，可设置 `AION_POSTGRES_PORT`、`AION_REDIS_PORT`；修改 PostgreSQL 端口时还需将 `AION_DATABASE_URL` 设为对应 JDBC 地址。

```powershell
Invoke-RestMethod http://localhost:8080/actuator/health
Invoke-RestMethod http://localhost:8080/actuator/health/liveness
Invoke-RestMethod http://localhost:8080/actuator/health/readiness
```

- `/actuator/health` 汇总 PostgreSQL、Redis 与应用健康状态，不返回内部详情。
- `/actuator/health/liveness` 仅反映应用存活，不依赖数据库或 Redis。
- `/actuator/health/readiness` 检查应用就绪与 PostgreSQL；Redis 作为暂态服务，故障不阻止数据库就绪。
- 除上述 GET 健康检查外，HTTP 请求默认拒绝，CSRF 防护保留。尚未实现登录及业务接口。

启动 Worker 时，在另一个终端设置数据库密码，然后执行：

```powershell
mvn spring-boot:run '-Dspring-boot.run.profiles=worker'
```

API 与 Worker 使用同一制品，每次只选择一个角色。Worker 是保持运行的非 Web 进程，无 HTTP 端口和 HTTP 探针，目前不领取或执行任务。后续业务组件需按角色限制注册。

## 构建与测试

```powershell
mvn verify
mvn dependency:tree
```

集成测试由 Testcontainers 自动创建并清理独立 PostgreSQL 和 Redis 容器，不使用开发数据库；Docker 不可用时测试会失败，不静默跳过。覆盖 HTTP 访问控制、基础设施连接、Worker 无 Web 启动、Flyway 重复迁移及 Redis 不可用时的探针行为。

Flyway 在两种角色启动时自动执行，使用 `aion` schema 和自身的迁移锁。首个迁移仅初始化 schema 描述与迁移历史；业务表随具体功能新增迁移。已应用的迁移不可修改。数据库账号在开发阶段需要创建 schema 的权限。

## 容器启动

先完成 `mvn verify`，生成固定名称的 `target/aion.jar`，再构建运行镜像：

```powershell
$env:AION_DATABASE_PASSWORD = 'local-development-only'
docker compose -f deploy/compose.yaml --profile app up -d --build --wait
```

API 和 Worker 使用同一镜像、非 root 用户，无 Docker socket 挂载。API 容器通过 readiness 接口检查就绪，两种角色均预留 40 秒停止宽限期。Redis 健康检查失败不阻止应用启动，但 `--wait` 仍会报告整个 Compose 项目中的 Redis 不健康。此 Compose 用于本地开发，尚未包含前端、TLS 入口、sandbox 或生产环境密钥管理。Worker 容器运行不代表已具备任务消费能力。

```powershell
docker compose -f deploy/compose.yaml --profile app down
```

停止不会删除 PostgreSQL 数据卷。数据库密码更改不会自动更新已有卷中的账号密码。

## 配置

| 环境变量 | 默认值 / 用途 |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | 未设置时默认 `api`；Worker 使用 `worker` |
| `AION_DATABASE_URL` | `jdbc:postgresql://localhost:5432/aion` |
| `AION_DATABASE_USERNAME` | `aion` |
| `AION_DATABASE_PASSWORD` | 必填，不提供内置密码 |
| `AION_REDIS_HOST` | `localhost` |
| `AION_REDIS_PORT` | `6379` |
| `AION_REDIS_PASSWORD` | 默认空；外部 Redis 可配置认证 |
| `PORT` | 本地 API 监听端口，默认 `8080` |
| `AION_API_PORT` | Compose 发布到宿主机的 API 端口，默认 `8080` |
| `AION_POSTGRES_PORT` | Compose 发布到宿主机的 PostgreSQL 端口，默认 `5432` |

PostgreSQL 连接、套接字和连接池等待，以及 Redis 连接和命令均设置超时。连接池上限为 10，可通过 Spring Boot 标准外部配置覆盖。

## 当前边界

本次交付工程启动、角色配置、数据库迁移入口、Redis 连接、健康检查、安全默认策略及容器开发环境。尚未接入 AgentScope，未验证其与 Boot 4.0.8 的兼容性；业务包、任务表、审批、事件流和工具隔离将在对应功能实现时加入。
