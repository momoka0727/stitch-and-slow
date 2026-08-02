# Database schema

[简体中文](../zh-cn/database-schema.md) | English

## Better Auth tables

- `user` stores the internal user id and Google-supplied profile fields.
- `account` links `(provider_id, account_id)` to one internal user. OAuth token
  columns are encrypted by Better Auth.
- `session` stores server sessions and expires them after 30 days.
- `verification` stores short-lived OAuth state and verification records.
- `rate_limit` provides D1-backed throttling for authentication endpoints.

User deletion cascades to accounts, sessions, and owned projects. Provider and
account id, session token, and user email are uniquely indexed as required by
the auth adapter.

## Application tables

`user_projects` stores one row per `(user_id, pattern_id)`. `pattern_json` is the
validated work snapshot and `stitched_json` is the validated progress. Both are
written in the same upsert. `created_at` is stable; `updated_at` drives recent
project ordering. Deleting a user cascades to their projects.

`shared_projects` stores an immutable public snapshot. New rows record an owner
user id, but deleting the owner sets it to null so sent links remain valid.
Public API projections never include `owner_user_id` or `recipient_email`.

`stitch_progress` is the archived pre-OAuth table. Its `user_email` value came
from an unauthenticated browser request and therefore cannot establish
ownership. No current route reads or writes this table, and migration 0002 does
not attach its rows to authenticated users.

All application timestamps are integer Unix milliseconds. Better Auth date
columns use Drizzle's SQLite timestamp mapping.
