---
name: backend-conventions
description: '新增、修改或审查 Aion 后端 Java 代码、pom.xml、依赖配置、包结构和模块边界时使用。后端 Maven 工程直接位于 Aion 根目录；依赖声明上一行必须使用简洁中文注释，POM 描述使用简洁中文；编码规范参考《阿里巴巴 Java 开发手册（嵩山版）》。'
---

# 后端开发规范

## 使用方式

- 修改前阅读目标文件、相关调用方和 `docs/architecture.md`，优先复用现有实现与依赖。
- 当前用户要求优先；本技能中的目录、中文注释和技术栈要求属于项目约定。Java 通用规范参考《阿里巴巴 Java 开发手册（嵩山版）》，以下为执行要点，并非手册原文或完整替代。
- 仅调整任务涉及的代码，不为满足示例预建空目录、空模块或无用途的抽象。
- 修改后检查依赖、命名、模块边界和相关测试；准确报告已执行的检查及未验证项。

## 工程目录与模块边界

后端 Maven 工程直接位于 **Aion 根目录**，不得另建 `backend/`：

```text
Aion/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/dev/aion/
│   │   │   ├── AionApplication.java
│   │   │   ├── access/
│   │   │   ├── workspace/
│   │   │   ├── session/
│   │   │   ├── run/
│   │   │   ├── agent/
│   │   │   └── tool/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/
│   └── test/
│       ├── java/dev/aion/
│       └── resources/
├── frontend/
├── deploy/
└── docs/
```

- 目录树表示约定位置，仅在需要时创建对应文件。构建产物进入 `target/`，不得提交到版本库。
- 使用 JDK 21，沿用 Spring Boot、Spring MVC、Spring JDBC、Flyway、PostgreSQL、Redis 的架构方向；具体依赖版本以兼容验证后的 POM 为准。
- 首版采用模块化单体，API 与 Worker 是同一工程的不同部署角色；不因部署角色不同而提前拆 Maven 模块或微服务。
- 按业务组织包：`access` 管访问与配置，`workspace` 管工作区，`session` 管会话，`run` 管任务运行与审批，`agent` 管运行时适配，`tool` 管工具与权限入口。
- 业务包内按需要设置 `controller`、`service`、`repository`、`dto`、`model`、`config` 等子包；不得在根包下建立容纳全部业务的全局分层目录。
- Controller 负责协议适配、参数校验和调用业务服务；Service 负责业务规则与事务；Repository 负责数据访问。不得在 Controller 中编排复杂业务或直接执行 SQL。
- 跨业务模块通过明确的服务入口或数据契约协作，不直接访问其他模块的内部 Repository，不允许循环依赖。
- 通用能力只有在职责明确且确实复用时才提取；禁止把业务逻辑堆入 `common`、`util`、`manager` 等含义模糊的包。
- 只有出现独立复用、构建或发布需求时才拆 Maven 子模块；新增模块使用清晰的小写短横线名称，例如 `aion-tool-api`，并说明职责和依赖方向。

## Maven 与 POM

### 依赖与版本管理

- 引入依赖前确认 JDK、Spring Boot 和现有依赖的兼容性；优先使用 JDK 或已有依赖，不为简单功能增加库。
- 使用 Spring Boot parent 或导入其 BOM 管理版本，按工程现状选择，避免重复导入同一套版本管理。
- 已由 parent 或 BOM 管理的依赖不重复填写 `<version>`；未被管理的第三方依赖将固定版本集中定义在 `<properties>`，使用语义明确的属性名，例如 `agentscope.version`。
- 多模块工程由父 POM 的 `<dependencyManagement>` 统一管理版本，子模块按需声明依赖。注意 `<dependencyManagement>` 不会实际引入依赖，不把所有库放入父 POM 的 `<dependencies>` 强制继承。
- 禁止使用 `LATEST`、`RELEASE`、动态版本范围；生产第三方依赖不得使用 `SNAPSHOT`。升级版本时验证兼容性，不直接沿用文档中尚待验证的版本组合。
- 明确使用的库应直接声明，避免依赖偶然的传递引入；正确设置 `test`、`runtime`、`provided` 等 scope，不滥用 `optional`，禁止 `systemPath` 引用本机 JAR。
- 依赖冲突先分析依赖树，再定向调整版本或添加 `<exclusions>`；排除项要说明原因，不用大范围排除掩盖兼容问题。
- 插件版本由 parent 或 `<pluginManagement>` 统一管理；未被管理的插件固定版本。区分插件管理与实际插件启用，不重复配置已继承的有效设置。
- 不在 POM 中写入凭据、个人目录或私有镜像认证信息；仓库镜像与认证通过 Maven settings 或部署环境提供。

### 中文注释与描述

- **每个 `<dependency>` 的紧邻上一行必须有简洁中文 XML 注释**，说明该依赖的用途；此规则适用于普通依赖、BOM 导入、依赖管理和插件依赖。分组注释不能替代逐项注释。
- 注释解释用途，避免只翻译 artifactId 或写“依赖”“相关支持”等空泛内容；同一依赖在不同位置声明时分别注释。
- `<exclusion>` 上方说明排除原因；插件声明上方简述其用途。XML 注释内容不得包含 `--`。
- POM 的 `<description>` 使用简洁中文，例如“任务执行与会话管理服务”；`<name>` 使用简洁中文名称，可保留 Aion 等专有名词。
- `groupId`、`artifactId`、属性键、包名等机器标识保持规范英文，不为中文描述要求修改 Maven 坐标。
- POM 按模型与父项、项目坐标与描述、属性、依赖管理、实际依赖、构建配置等顺序组织；仅保留需要的区块。

以下为已由 parent 或 BOM 管理版本时的片段，不是完整 POM：

```xml
<name>Aion 后端服务</name>
<description>任务执行与会话管理服务</description>

<dependencies>
    <!-- 关系数据库访问与事务支持 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
    <!-- PostgreSQL 数据库驱动 -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

## Java 编码规范

以下参考嵩山版的命名、格式、集合、并发、异常日志及数据库相关规范；涉及 JDK 21 和 Spring 的内容属于项目补充。需要核对具体条款时查阅对应版本，不把其他版本条款或个人偏好标注为嵩山版原文。官方资料入口：[阿里巴巴 Java 开发手册](https://github.com/alibaba/p3c)。

### 命名、格式与注释

- 包名全小写，采用有意义的英文单词；类名使用 `UpperCamelCase`，方法、参数和变量使用 `lowerCamelCase`，常量使用 `UPPER_SNAKE_CASE`。
- 禁止拼音与英文混用、无意义缩写、以下划线或美元符号开头或结尾的自定义名称；名称表达业务含义。
- 类型后缀反映职责，如 `RunController`、`RunService`、`RunRepository`、`CreateRunRequest`、`RunResponse`；异常类以 `Exception` 结尾，测试类以 `Test` 结尾。不要混用 DTO、数据库对象与对外响应。
- POJO 的布尔字段不以 `is` 开头，避免属性解析歧义；数据库字段按数据库约定单独映射。
- 使用 4 个空格缩进，不用 Tab；控制语句始终使用大括号；单行通常不超过 120 字符。沿用项目格式化配置，不手工制造无关格式差异。
- 方法职责单一，减少深层嵌套；用命名常量或枚举表达业务状态，不散落魔法值，不为单一实现机械创建接口。
- 公共类型、对外方法及含义不明显的字段提供必要的 Javadoc；中文注释简洁说明契约、原因、限制，避免重复代码字面含义。重写方法添加 `@Override`。

### 对象、数值与集合

- 字符串与包装类型的值比较使用 `equals` 或 `Objects.equals`；避免空指针和包装类型自动拆箱风险。
- 金额等精确数值使用 `BigDecimal`，通过字符串或 `valueOf` 构造，明确精度和舍入规则；按数值比较时使用 `compareTo`，注意 `equals` 还比较 scale。
- POJO 属性使用合适的包装类型表达空值；局部计算按语义使用基本类型，不以默认的 `0` 或 `false` 代替“未提供”。
- 覆盖 `equals` 时同时正确覆盖 `hashCode`；作为哈希键的字段不得在入集合后修改。
- 集合使用泛型；集合返回值无数据时返回空集合；明确集合是否允许修改，不暴露可变内部状态。
- 不在增强 for 循环中直接增删所遍历集合；使用迭代器、`removeIf` 或明确的并发集合语义。注意 `Arrays.asList` 的固定大小，以及 `subList` 的视图关系。
- 时间处理优先使用 `java.time`，明确时区与序列化格式；不共享非线程安全的日期格式化对象。

### 异常、日志与并发

- 不捕获异常后静默忽略，不用异常控制正常业务分支；捕获时进行有效恢复、转换或向上传递，并保留原始 cause。
- 业务错误采用清晰的错误码和描述，统一映射 HTTP 响应；不得向客户端暴露堆栈、SQL、密钥或内部路径。
- 使用日志框架及占位符，不用 `System.out` 或 `printStackTrace`；在负责处理的边界记录异常堆栈，避免逐层重复记录。
- 日志携带必要的任务或请求标识；敏感信息脱敏，限制外部输入与工具输出的日志长度。
- 线程与执行器统一管理，显式配置并发、队列容量、超时、拒绝策略和关闭流程；不随意创建线程，不使用隐藏无界队列的线程池配置。
- 虚拟线程不替代限流；共享可变状态必须有明确的同步策略，锁范围尽可能小。使用后清理 `ThreadLocal`，处理中断时正确传播或恢复中断标志。
- 资源使用 try-with-resources 或框架托管方式释放；网络、数据库与外部工具调用设置合理超时。

## 接口、事务与数据访问补充约定

- Spring 组件优先构造器注入；外部输入在边界进行格式、长度、范围和权限校验，不能只依赖前端校验。
- 事务放在业务服务的明确边界，核对代理调用和回滚语义；注意自调用不触发代理事务、受检异常默认不回滚等情况，不机械添加事务注解。
- 事务内不等待模型、网络或工具执行；跨进程副作用通过业务状态和幂等机制处理，不假定数据库回滚能撤销外部操作。
- 使用参数化 SQL，禁止拼接未经校验的外部输入；动态排序字段等无法参数化的标识符使用白名单。
- 查询按需选择列，列表接口有分页与上限，避免循环查询；为实际访问路径设计索引和唯一约束。
- 数据库表名、列名采用小写下划线；遵守 PostgreSQL 的类型和 SQL 语法，不机械照搬手册中的 MySQL 专属规则。
- 数据库变更通过 `src/main/resources/db/migration/` 下的 Flyway 迁移管理，例如 `V1__create_run_table.sql`；已应用的版本迁移不修改，后续调整新增迁移。
- 配置与密钥分离，环境差异通过外部配置处理；权限检查在服务端执行，工具执行遵守架构文档定义的隔离边界。

## 完成前检查

- 目录是否直接使用根目录 `pom.xml` 与 `src/`，业务模块职责及依赖方向是否清楚。
- 每个依赖是否在紧邻上一行有中文用途注释，POM 名称和描述是否简洁中文，版本是否集中管理且无重复覆盖。
- 代码是否满足命名、空值、精度、集合、异常、日志、事务和资源释放要求。
- 根据变更验证正常路径及关键失败边界；业务逻辑修复添加能复现问题的回归测试，纯文档调整无需运行应用构建。
- 存在 Maven 工程时优先使用仓库 Maven Wrapper，否则使用本机 Maven；从 Aion 根目录运行与变更相关的测试，必要时执行 `mvn verify`。涉及依赖调整时检查 `mvn dependency:tree`，需要确认继承与版本来源时检查 `mvn help:effective-pom`。使用 Wrapper 时替换相应命令。
- 尚无 POM、缺少环境或检查失败时如实说明，不声称构建、测试或依赖兼容性已通过；不为编写本技能创建应用骨架或提交代码。
