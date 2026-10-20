# IDEA 复查

- 每次完成代码或配置修改后，使用 `idea` MCP 的 `get_file_problems` 检查本次修改的文件，设置 `errorsOnly: false`，同时查看错误和警告。
- 在批准 `idea` MCP 并加载项目 hooks 后，`.claude/settings.json` 的 PostToolUse hook 自动检查 Write/Edit 修改的文件；通过终端、其他工具或子代理修改的文件，也必须在完成前补查。
- 明确传入当前工作区的 `projectPath` 和目标文件路径；在 Git worktree 中必须检查实际修改的那份文件，不可用主工作区的检查结果代替。
- 修复本次变更新引入的问题后重新检查。IDEA 检查不替代相关构建和测试。
- MCP 未连接、IDE 未打开对应项目、检查超时或返回错误时，明确说明未完成 IDEA 复查，不得声称检查通过。
