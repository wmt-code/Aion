# Aion 界面重设计依据

调研日期：2026-10-20。产品定位：通用 Agent Harness，不预设编程、研究或其他任务分类。此次用户明确授权替换原有配色、布局和 UI；本记录取代早期方案对首页三栏常驻、青绿主色和字体的建议。

## 官方资料

Apple HIG 网页正文依赖 JavaScript，本次通过 Apple 官方 `tutorials/data/design/human-interface-guidelines/*.json` 文档数据读取正文，并核对 WWDC 视频文字稿。

| 来源 | 官方原则 | 在 Aion 中的应用 |
|---|---|---|
| [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | 用对齐、间距与分组建立层级；逐步展示次要选项；随可用空间调整布局且保留功能 | 新任务以输入为中心；产物默认收起，窄屏切换内容，草稿不丢失 |
| [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | 减少字体种类、避免过细字重、保持可读性与缩放后的层级 | 使用系统字体栈；输入 16px、UI 14px、辅助信息 12–13px；不嵌入 Apple 字体文件 |
| [Color](https://developer.apple.com/design/human-interface-guidelines/color) | 克制地使用强调色；保持颜色语义一致；不可仅靠颜色传达状态 | 中性灰白/石墨色面板；蓝色焦点；状态附文字；自定义网页语义变量，不冒充 Apple 动态系统色 |
| [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Liquid Glass 用于导航和控件层，不应铺在内容层；过量使用会扰乱层级 | 当前内容无复杂背景，采用不透明表面，避免无意义玻璃和模糊效果 |
| [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) | 导航应简短、可辨识；允许收起；空间有限时换成紧凑表达 | 桌面会话导航可收起；窄屏原生模态抽屉 |
| [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) | 深色模式用较亮表面表达抬升层级，非简单反色；验证对比度 | 深色导航、画布、输入层级独立定义；支持增加对比度 |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | 支持键盘、足够的命中区域、减弱动态效果 | 手机主要按钮 44px；可见焦点；抽屉 Escape 和焦点恢复；reduced-motion |
| [WWDC25: Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/) | 内容优先，避免 glass-on-glass，材质与动效应服务交互关系 | 不加入玻璃堆叠、光晕、流光、装饰动画 |
| [WWDC25: Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/) | 明确功能分组、减少额外边框和背景、保持跨设备结构连续 | 精简工具栏，移除重复标题与页脚标语；产物入口在各尺寸均可访问 |

原生 pt、Dynamic Type、SF Symbols 和 SwiftUI 材质 API 不直接等同于 CSS。上述网页尺寸是 Aion 的实现选择，不是 Apple 对网页的官方规定。

## 设计 skills 核查与取舍

已阅读下列上游 skill 和对应参考文档；本次将它们作为设计参考，不执行远程安装脚本，也不将社区总结称为 Apple 官方 skill。

- [Impeccable](https://github.com/pbakaus/impeccable)，Apache-2.0：[SKILL.md](https://raw.githubusercontent.com/pbakaus/impeccable/main/.agents/skills/impeccable/SKILL.md)、[Operate 模式](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/mode-operate.md)、[排版](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/typeset.md)、[布局](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/layout.md)、[反模式](https://raw.githubusercontent.com/pbakaus/impeccable/main/skill/reference/craft-floor.md)。采用面向操作的稳定结构、间距优先和反模板检查；不机械照搬对某些字体、容器或标签的绝对禁令。
- [Taste Skill](https://github.com/Leonxlnx/taste-skill)，MIT：[应用界面参考](https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/references/app-screens.md)。采用 UI/辅助文字层级、紧凑导航与渐进展开；不采用营销页面的大字号、强制图片或动效。
- [Emil Kowalski skills](https://github.com/emilkowalski/skills)，MIT：[Design Engineering](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md)、[apple-design](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md)。采用有目的的反馈、可中断交互、低频才考虑动效；apple-design 为社区解释，不是 Apple 发布。
- [HIGAgentSkills](https://github.com/justinwetch/HIGAgentSkills)，社区摘要。仓库贡献采用 MIT，其 NOTICE 明确不覆盖 Apple 拥有的内容。
- [apple-hig-skill](https://github.com/daft2/apple-hig-skill)，社区维护、MIT。用作参考索引，规范结论优先核对官方原文。
- 已安装的 Anthropic [frontend-design](../.claude/skills/frontend-design/SKILL.md) 继续用于“设计、审视、实现、截图复核”流程；它不保证仅换颜色就能解决布局问题。

## 新的视觉与布局

旧版问题：常驻空产物栏压缩任务区；层层标题、卡片、边框和装饰图形制造噪声；多处重复“未连接”；辅助文字过小；口号和功能分类抢占核心操作。

选择：安静的任务画布，主操作只有输入任务。首页标题居中，输入文本左对齐。空状态无行业模板、无营销卡片、无虚构会话。

```text
┌──────────────┬───────────────────────────────────┐
│ aion.        │ 导航开关  新任务        主题  产物 │
│ 新建会话     │                                   │
│ 当前任务     │          今天，想完成什么？       │
│              │          一行必要的引导           │
│ 最近会话     │       ┌─────────────────────┐     │
│              │       │ 任务输入            │     │
│              │       │ 模式           发送 │     │
│              │       └─────────────────────┘     │
│ 工作空间     │          一处连接状态说明         │
└──────────────┴───────────────────────────────────┘
```

产物按需在右侧展开；手机替换主内容并提供返回，保持草稿与模式。桌面导航 232px，任务输入最大宽度 680px。无渐变、装饰数据、虚拟文件、卡片套卡片或新动画依赖。

浅色：画布 `#FCFCFD`、导航 `#F3F3F5`、输入 `#FFFFFF`、主文字 `#202124`、辅助文字 `#686A70`、焦点 `#0067D9`。

深色：画布 `#1C1C1E`、导航 `#161618`、输入 `#262628`、主文字 `#F2F2F4`、辅助文字 `#AAAAB2`、焦点 `#85B7FF`。

核心文字使用系统字体。通过字号、字重、留白与表面亮度表达层次；输入表面使用局部轻阴影，其余区域不靠堆叠阴影制造层级。

## 验收范围

Lint、TypeScript、生产构建；1440/1024/390px 深浅主题；默认和展开产物；导航收起/抽屉；键盘标签切换和焦点恢复；草稿、模式保留；短视口与长内容；增加对比度与 reduced-motion。截图作为本地测试产物，不提交。
