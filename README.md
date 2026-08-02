# stitch-and-slow

简体中文 | [English](README_en.md)

一个使用 React、vinext、Cloudflare D1、Drizzle 以及通过 Better Auth 集成
Google OAuth 构建的十字绣图案工作区。项目基于由 mise 管理的 Node.js 环境，
使用 Vite+ 进行开发，并采用 pnpm workspace。

## 前置条件

- [mise](https://mise.jdx.dev/)
- [Vite+](https://viteplus.dev/guide/)
- 一个 Google Cloud OAuth 2.0 Web 应用

## 快速开始

```bash
mise install
vp env off
mise exec -- pnpm install
cp .dev.vars.example .dev.vars
mise exec -- pnpm run dev
```

在 `.dev.vars` 中填写一个至少 32 字节的随机密钥和 Google OAuth 客户端凭据。
`.dev.vars` 已被 Git 忽略。切勿提交真实的客户端密钥。

```dotenv
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
```

创建一个 Google OAuth Web 客户端，并注册以下已获授权的重定向 URI：

```text
http://localhost:3000/api/auth/callback/google
```

在生产环境中，将 `BETTER_AUTH_URL` 设置为规范的 Cloudflare HTTPS 源地址，
注册 `https://<domain>/api/auth/callback/google`，并使用
`wrangler secret put --config wrangler.cloudflare.jsonc` 注入全部四个值。
不要将密钥值写入 `wrangler.cloudflare.jsonc`。

## 身份认证与持久化

- Better Auth 在 `/api/auth/*` 运行 Google OIDC，并将用户、关联的 Google
  账户、会话、OAuth 验证状态和速率限制数据存储在 D1 中。
- 电子邮件/密码注册和旧版仅限浏览器的电子邮件登录均已禁用。
- 用户所有权始终由服务端会话中的 `user.id` 确定。进度 API 从不接受浏览器
  提供的电子邮件地址或用户 ID。
- 每条项目记录会以原子方式存储经过验证的图案快照和已完成针脚的索引进度。
  退出后重新登录时，会恢复由 D1 持久化的相同数据。
- 旧版 `stitch_progress` 表仍处于归档状态，但不会被查询，因为其基于电子邮件的
  所有权从未经过身份认证。

在部署使用新身份认证路由的构建之前，请将 `drizzle/` 中的所有文件应用到 D1
数据库。当前的 schema 迁移文件是 `0002_skinny_sleepwalker.sql`。

首次在本地登录前，使用以下命令应用迁移：

```bash
mise exec -- pnpm run db:migrate:local
```

`dev` 和 `db:migrate:local` 脚本都使用 `wrangler.cloudflare.jsonc`，因此开发
服务器和迁移命令会连接到同一个本地 D1 数据库。

## 生产部署

Cloudflare Workers 是唯一受支持的生产环境目标。配置 Wrangler 身份认证和所有
必需的密钥，然后运行：

```bash
mise exec -- pnpm run deploy
```

部署命令会依次使用 `wrangler.cloudflare.jsonc` 进行构建、将待处理的迁移应用到
远程 D1 数据库，然后部署生成的 Worker。请勿在未完成迁移的情况下部署依赖新
schema 的代码。

## 常用命令

- `mise exec -- pnpm run dev`：使用 Wrangler 配置启动本地开发环境
- `mise exec -- pnpm run check`：运行格式、lint 和类型检查
- `mise exec -- pnpm run test`：运行一次测试
- `mise exec -- pnpm run build`：构建 Cloudflare Worker
- `mise exec -- pnpm run deploy`：构建、迁移生产环境 D1 并部署到 Cloudflare
- `mise exec -- pnpm run deploy:dry-run`：在本地构建并验证可部署的 Worker
- `mise exec -- pnpm run db:generate`：在 schema 变更后生成 Drizzle 迁移
- `mise exec -- pnpm run db:migrate:local`：将待处理的迁移应用到本地 D1
- `mise exec -- pnpm run db:migrate:remote`：将待处理的迁移应用到生产环境 D1
- `mise exec -- pnpm run types:cloudflare`：重新生成 Worker 绑定类型

## 项目结构

- `app/api/auth/[...all]/route.ts` 暴露 Better Auth 处理程序。
- `lib/auth.ts` 负责服务端身份认证配置和会话查询。
- `lib/auth-client.ts` 负责浏览器端身份认证客户端。
- `db/schema.ts` 包含 Better Auth 和应用程序的 D1 schema。
- `wrangler.cloudflare.jsonc` 声明生产环境 Worker 和 D1 绑定。
- `drizzle/` 包含部署迁移。

有关架构、API、页面、schema 和工具链约定，请参阅
[`.codex/docs/zh-cn/`](.codex/docs/zh-cn/)。
