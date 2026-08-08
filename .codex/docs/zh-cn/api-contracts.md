# API 契约

简体中文 | [English](../en/api-contracts.md)

## 身份验证

Better Auth 负责 Google OAuth、邮箱密码登录和 `/api/auth/*` 下的会话。浏览器可启动
Google 登录，或以 `POST /api/auth/sign-in/email` 提交邮箱密码。邮箱登录必须在
`x-captcha-response` 请求头携带 action 为 `email-login` 的 Turnstile token。

邮箱注册使用以下应用路由：

- `GET /api/auth/email/config` 仅返回公开的 Turnstile site key，且禁止缓存。
- `POST /api/auth/email/code` 接受严格的 `{ email }` JSON，并要求 action 为
  `email-signup-send` 的 Turnstile token。成功时通过 SMTP 发送 6 位验证码，并返回不透明的
  `challengeId` 和 600 秒有效期。邮箱和来源 IP 分别具有由 D1 原子计数的 60 秒冷却。
- `POST /api/auth/email/register` 接受 `name`、`email`、`password`、`code` 和
  `challengeId`，并要求新的 action 为 `email-signup` 的 Turnstile token。服务端验证并删除
  KV challenge 后，通过仅限内部使用的短期签名证明调用 Better Auth 注册端点。每个
  challenge 最多提交 5 次；成功创建账户后删除 challenge。

三个写入端点都验证同源请求。Turnstile token 单次有效，前端每次请求后必须重新生成。
验证码错误、过期与无法注册使用通用错误，不返回内部存储细节。直接调用
`POST /api/auth/sign-up/email` 而没有有效内部证明会返回 `403`。

成功登录或注册后，服务端设置 HttpOnly 会话 cookie。`GET /api/auth/get-session` 是浏览器
身份状态的唯一来源。

受保护的路由调用 `getAuthenticatedUser(request)`，并从已验证会话的 `user.id`
推导所有权。它们绝不接受 `email`、`userEmail` 或 `userId` 作为所有权输入。
会话缺失或过期时返回 `401`。

## 共享验证

`lib/validation/stitch.ts` 是浏览器和服务端数据的事实来源。浏览器会验证传出的
payload 和传入的 JSON。API 路由在访问 D1 之前验证查询参数和请求体。
持久化的 JSON 在恢复至 UI 状态之前会再次经过验证。

## 进度与项目

- `GET /api/progress?pattern=<id>` 返回已登录用户的匹配项目。
- `GET /api/progress?all=1` 最多返回配置的项目数量上限，并按最近更新时间倒序排列。
- `GET /api/progress` 返回最近更新的项目。
- `POST /api/progress` 接受 `patternId`、经过验证的 `pattern`，以及经过验证的
  `stitched` 索引。它以会话用户和图案 id 标识记录，并以原子方式执行 upsert。

未知的查询/请求体字段会被拒绝。尤其是，伪造的所有者字段会返回 `400`，
而不会影响所有权。超过字节限制的图案 payload 返回 `413`。意外的存储故障
返回通用的 `500`，且不会泄露内部错误消息。

## 共享

- `GET /api/share?id=<opaque-id>` 保持公开，以使现有共享链接继续有效。
  其响应仅包含 `id`、`senderName`、`patternJson` 和 `createdAt`；
  接收者电子邮箱和所有者身份绝不会公开。
- `POST /api/share` 要求有效会话，并将会话用户存储为所有者。
  它接受发送者名称、接收者电子邮箱和经过验证的图案。

格式错误的查询/请求体数据返回 `400`；未经身份验证的创建请求返回 `401`；
过大的图案 JSON 返回 `413`。
