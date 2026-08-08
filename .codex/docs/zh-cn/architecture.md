# 架构

简体中文 | [English](../en/architecture.md)

## 依赖与信任流

```text
Google OIDC -> Better Auth route -> D1 user/account/session
                                  -> HttpOnly session cookie
邮箱注册 -> Turnstile -> SMTP 发码 -> Workers KV 验证码 -> 签名注册证明
邮箱登录 -> Turnstile -> Better Auth credential -> D1 user/account/session
browser UI -> validated API client -> route auth guard -> user_projects / shared_projects
```

- `app/` 包含框架入口和 API 路由。
- `components/` 包含工作区协调器和展示型 UI。
- `lib/auth.ts` 是仅限服务端使用的身份验证边界。
- `lib/auth-client.ts` 是浏览器端的同源会话客户端。
- `lib/validation/` 包含共享的 Zod 领域模型和 API 契约。
- `lib/api/` 包含经过验证的浏览器 API 客户端。
- `db/` 负责 D1 绑定和 Drizzle schema。

Better Auth 将 Google provider account id 或邮箱密码 credential 账户关联到内部不可变的
`user.id`。邮箱注册验证码只以 HMAC 摘要写入 `EMAIL_VERIFICATION_CODES` KV，并使用
10 分钟 TTL、随机 challenge id 和不含明文邮箱的键。发码与最终注册分别验证一次
Cloudflare Turnstile；邮箱密码登录由 Better Auth 的 Turnstile 插件保护。验证码验证成功后，
注册路由生成有效期 30 秒且绑定邮箱的内部签名证明，默认 `/sign-up/email` 无法被直接调用绕过。

Workers KV 是最终一致存储，不提供原子消费。注册流程依赖 D1 的唯一邮箱约束保证并发请求
最多创建一个用户；若未来验证码被用于重置密码等更高风险操作，应改用 Durable Object 或
D1 原子消费作为真源。

应用程序的所有权始终使用该内部 id。电子邮箱、显示名称和头像均为个人资料数据，
不得用作授权键。OAuth token 以加密形式静态存储；cookie 为 HttpOnly、同站点，
且在 HTTPS 来源上为 secure。

## 状态边界

`components/stitch-app.tsx` 负责跨视图状态、计时器、持久化和导航。它观察
Better Auth 的会话状态，绝不将浏览器存储视为身份证明。页面组件保持为展示型组件。
Canvas 渲染和浏览器图像处理保留在客户端进行。

活跃的针迹集合在内存中使用 `Set<number>`。API 边界将其转换为经过验证的整数数组。
一条 `user_projects` 记录通过一次 upsert 同时存储图案快照和针迹进度，
确保自动保存不会只持久化其中一项。

## 公共边界

不透明的共享链接被有意设为公开。公共投影不包含接收者和所有者信息，
并将存储的图案 JSON 视为不可信数据。创建共享需要通过身份验证。

旧的 `stitch_progress.user_email` 记录仍作为隔离的遗留数据保留。它们不会被自动复制或认领，
因为此前的 API 无法证明提交请求的浏览器拥有该电子邮箱。
