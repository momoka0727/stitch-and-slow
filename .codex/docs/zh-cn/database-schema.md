# 数据库模式

简体中文 | [English](../en/database-schema.md)

## Better Auth 数据表

- `user` 存储内部用户 ID 和 Google 提供的个人资料字段。
- `account` 将 `(provider_id, account_id)` 关联至一个内部用户。OAuth 令牌列由 Better Auth 加密。
- `session` 存储服务器会话，并使其在 30 天后过期。
- `verification` 存储短期 OAuth 状态和验证记录。
- `rate_limit` 为身份验证端点提供由 D1 支持的限流。

删除用户时，会级联删除账户、会话以及该用户拥有的项目。根据身份验证适配器的要求，提供商与账户 ID 的组合、会话令牌以及用户电子邮件均具有唯一索引。

## 应用数据表

`user_projects` 为每个 `(user_id, pattern_id)` 存储一行。`pattern_json` 是经过验证的作品快照，`stitched_json` 是经过验证的进度。二者在同一次 upsert 中写入。`created_at` 保持不变；`updated_at` 用于确定最近项目的排序。删除用户时，会级联删除其项目。

`shared_projects` 存储不可变的公开快照。新行会记录所有者用户 ID，但删除所有者时会将其设为 null，因此已经发送的链接仍然有效。公开 API 的投影绝不会包含 `owner_user_id` 或 `recipient_email`。

`stitch_progress` 是 OAuth 引入之前已归档的数据表。其 `user_email` 值来自未经身份验证的浏览器请求，因此无法据此确认所有权。当前没有任何路由读取或写入该表，迁移 0002 也不会将其中的行关联到已通过身份验证的用户。

所有应用时间戳均为表示 Unix 毫秒的整数。Better Auth 的日期列使用 Drizzle 的 SQLite 时间戳映射。
