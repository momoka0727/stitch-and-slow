# API 契约

简体中文 | [English](../en/api-contracts.md)

## 身份验证

Better Auth 负责 `/api/auth/*`。浏览器通过 Better Auth 客户端启动 Google 登录，
Google 返回至 `/api/auth/callback/google`，随后服务端设置 HttpOnly 会话 cookie。
`GET /api/auth/get-session` 是浏览器身份状态的唯一来源；电子邮箱/密码注册已禁用。

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
