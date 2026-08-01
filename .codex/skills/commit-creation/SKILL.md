---
name: commit-creation
description: Generates or validates Git commit messages following this repo's Conventional Commits-based format (Japanese summary, bullet body, optional issue number). Use when writing commit messages, generating a commit from staged changes, or when the user asks for commit message help.
disable-model-invocation: false
---

# Commit Creation

分析已暂存的更改，自动生成符合Conventional Commits规范的提交信息并执行提交。

## When to Use

代码更改后的提交创建，符合Conventional Commits规范的消息自动生成时使用。

## Instructions

### 1. 工作流程

1. **初期信息获取**：并行执行 `git status`（获取分支名）、`git diff --cached`（分析暂存区内容）
2. **前缀选择**：根据变更内容选择（参见下表）
3. **消息生成**：`<前缀>: <摘要（50字以内）>` + 项目符号正文（0-4行）
4. **执行提交**：以 `git commit -m "$(cat <<'EOF'...EOF)"` 格式执行

### 2. 前缀选择

| 前缀 | 用途 |
|--------|------|
| `feat` | 新功能添加 |
| `fix` | 修复错误 |
| `refactor` | 重构（无行为改变） |
| `perf` | 性能优化 |
| `test` | 添加/修改测试 |
| `docs` | 文档更新 |
| `build` | 构建/依赖变更 |
| `ci` | CI相关变更 |
| `chore` | 杂务（工具配置/脚本等） |
| `style` | 仅样式变更（与代码逻辑无关） |
| `revert` | 撤销 |

### 3. 提交信息格式

```
<前缀>: <摘要（命令式/简洁）>

- 变更内容1（项目符号）
- 变更内容2（项目符号）
```

**规则**：摘要限简体中文50字以内，正文为0-4行的项目符号。

### 4. 执行示例

```bash
git commit -m "$(cat <<'EOF'
fix：删除不必要的调试日志输出

- 删除用户信息获取处理中的冗余日志行
EOF
)"
```

## Examples

```
fix：删除不必要的调试日志输出
- 删除用户信息获取处理中的冗余日志行

feat：添加两步验证功能
- 实现短信认证流程
- 添加认证令牌的生成与验证功能
```

## Important Notes

- **必须**：使用 `git diff --cached` 分析暂存区内容（忽略未暂存的更改）
- **禁止**：模糊的摘要（如“update”，“fix bug”等），禁止仅有无条理的长文
- 对于较大的差异，聚焦主要变更点进行总结

## 运行时注意事项
- 当用户请求提交信息时，先通过 `git status` 或 `git diff --staged` 了解变更内容，然后按照上述格式提出一条提交信息。
