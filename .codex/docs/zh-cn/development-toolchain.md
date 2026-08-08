# 开发工具链

简体中文 | [English](../en/development-toolchain.md)

## 职责划分

- mise 管理 `mise.toml` 中的 Node.js 和 pnpm 版本。
- pnpm 是唯一的包管理器；`pnpm-lock.yaml` 是唯一的锁文件。
- Vite+ 提供格式化、代码检查、类型检查和 Vitest。
- vinext 提供兼容 Next.js 的应用和 Worker 构建。
- Drizzle 负责 D1 数据库模式和迁移生成。
- Better Auth 负责 Google OIDC、邮箱密码 credential、会话 Cookie、账户关联和身份验证持久化。
- Workers KV 保存短期注册 challenge，`cloudflare:sockets` 负责 TLS SMTP，Cloudflare Turnstile
  提供非 Google 人机验证。

执行一次 `vp env off`，以便 Vite+ 使用由 mise 管理的运行时。

## 初始化与身份验证配置

```bash
mise install
mise exec -- pnpm install
cp .dev.vars.example .dev.vars
```

必需的运行时值列在 `.dev.vars.example` 和
`wrangler.cloudflare.jsonc#secrets.required`：Better Auth 与 Google 凭据、Turnstile site/secret
key、独立的 `EMAIL_CODE_PEPPER`，以及 SMTP host、submission port、TLS 模式、用户名、密码和
发件邮箱。生产值应存放在 Cloudflare secrets 中，绝不能提交至 Git。`SMTP_TLS_MODE` 只接受
`starttls`（587）或 `tls`（465）；这两个标准 submission 端口必须与对应的 TLS 模式配对。
端口 25 和明文 SMTP 不受支持。SMTP 连接超过 15 秒时，服务端日志会包含主机、端口和 TLS
模式以便诊断，但不会输出凭据或验证码。

`wrangler.cloudflare.jsonc` 已固定项目所属的 Cloudflare Account，并绑定生产与预览 KV
namespace 的真实 ID。本地开发使用 Wrangler 的本地 KV；迁移至其他 Account 时，应创建新的
namespace 并同时更新 `account_id`、`id` 和 `preview_id`。
Turnstile widget 应为开发和生产分别配置 hostname；自动化测试可使用 Cloudflare 官方测试
key。SMTP 发件域名应配置 SPF、DKIM 和 DMARC。

`BETTER_AUTH_URL` 必须是规范源。它同时用于 Google callback、同源写入验证、Turnstile
hostname 校验和 SMTP EHLO hostname。在 Google OAuth 客户端中注册
`<origin>/api/auth/callback/google`。部署依赖新数据库模式的代码之前，应先应用每项 D1 迁移。

`vite.config.ts`、D1 迁移脚本、类型生成和部署均使用 `wrangler.cloudflare.jsonc`。请确保这些路径保持一致，使本地开发、生产构建和迁移命令指向预期的 D1 绑定。

`wrangler.cloudflare.jsonc#compatibility_date` 不得晚于仓库锁定的 workerd 运行时所支持的最新日期。该日期或任何绑定发生变化时，应重新生成 `worker-configuration.d.ts`。

`wrangler.cloudflare.jsonc#observability.logs` 会启用 Worker 日志，同时禁用自动调用日志，从而在保留应用输出的同时，避免为每个请求记录一条日志。

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
