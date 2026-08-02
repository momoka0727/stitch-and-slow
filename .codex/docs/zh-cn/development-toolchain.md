# 开发工具链

简体中文 | [English](../en/development-toolchain.md)

## 职责划分

- mise 管理 `mise.toml` 中的 Node.js 和 pnpm 版本。
- pnpm 是唯一的包管理器；`pnpm-lock.yaml` 是唯一的锁文件。
- Vite+ 提供格式化、代码检查、类型检查和 Vitest。
- vinext 提供兼容 Next.js 的应用和 Worker 构建。
- Drizzle 负责 D1 数据库模式和迁移生成。
- Better Auth 负责 Google OIDC、会话 Cookie、账户关联和身份验证持久化。

执行一次 `vp env off`，以便 Vite+ 使用由 mise 管理的运行时。

## 初始化与身份验证配置

```bash
mise install
mise exec -- pnpm install
cp .dev.vars.example .dev.vars
```

必需的运行时值为 `BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`。除已提交的示例文件外，`.dev.vars*` 均被忽略。生产环境的值应存放在 Cloudflare secrets 中，绝不能放入 Wrangler 配置或 Git。它们的名称声明在 `wrangler.cloudflare.jsonc#secrets.required` 下，因此本地开发、生成类型和部署能够验证同一份契约，而无须存储这些值。

`BETTER_AUTH_URL` 必须是规范源。在 Google OAuth 客户端中注册 `<origin>/api/auth/callback/google`。部署依赖新数据库模式的代码之前，应先应用每项 D1 迁移。

`vite.config.ts`、D1 迁移脚本、类型生成和部署均使用 `wrangler.cloudflare.jsonc`。请确保这些路径保持一致，使本地开发、生产构建和迁移命令指向预期的 D1 绑定。

`wrangler.cloudflare.jsonc#compatibility_date` 不得晚于仓库锁定的 workerd 运行时所支持的最新日期。该日期或任何绑定发生变化时，应重新生成 `worker-configuration.d.ts`。

Cloudflare Vite 插件会写入仅供预览使用的 `dist/server/.dev.vars`，使其本地预览能够复现绑定。`dist/` 已被忽略，且 `.dev.vars` 会从 Worker 模块和公共资源中排除；应通过 Wrangler 部署，而不要将服务器目录作为原始文件发布。

## 命令

| 目标 | 命令 |
| --- | --- |
| 启动开发环境 | `mise exec -- pnpm run dev` |
| 运行静态检查 | `mise exec -- pnpm run check` |
| 运行测试 | `mise exec -- pnpm run test` |
| 应用格式化 | `mise exec -- pnpm run format` |
| 仅运行 lint | `mise exec -- pnpm run lint` |
| 构建 Cloudflare Worker | `mise exec -- pnpm run build` |
| 部署 Cloudflare Worker | `mise exec -- pnpm run deploy` |
| 验证可部署的 Worker | `mise exec -- pnpm run deploy:dry-run` |
| 生成 Drizzle 迁移 | `mise exec -- pnpm run db:generate` |
| 应用本地 D1 迁移 | `mise exec -- pnpm run db:migrate:local` |
| 应用生产环境 D1 迁移 | `mise exec -- pnpm run db:migrate:remote` |
| 重新生成 Worker 类型 | `mise exec -- pnpm run types:cloudflare` |

Cloudflare Workers 是唯一的生产目标。Vite 构建会写入 `dist/server/wrangler.json` 和 `.wrangler/deploy/config.json`；后者使普通的 `wrangler deploy` 使用生成的 Worker，而不会重新打包 vinext 源入口。`pnpm run deploy` 会先验证构建，然后在部署该制品之前立即应用远程 D1 迁移。不要将源 Wrangler 配置传给最终部署命令，不要添加第二套托管控制平面，也不要将平台特定元数据打包进 `dist/`。

## 依赖更新

通过仓库管理的命令界面使用 pnpm：

```bash
mise exec -- pnpm add <package>
mise exec -- pnpm remove <package>
mise exec -- pnpm install
```

应一并审查 `package.json`、`pnpm-workspace.yaml` 和 `pnpm-lock.yaml`。
