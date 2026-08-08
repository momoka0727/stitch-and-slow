# Database schema

[简体中文](../zh-cn/database-schema.md) | English

## Better Auth tables

- `user` stores the internal user id, verified email, and profile fields. Email
  signup users may not have an avatar.
- `account` links `(provider_id, account_id)` to one internal user. Better Auth
  encrypts Google OAuth token columns; email/password credential accounts use the
  existing `password` column for a secure hash.
- `session` stores server sessions and expires them after 30 days.
- `verification` stores short-lived OAuth state and verification records.
- `rate_limit` provides D1-backed throttling for authentication endpoints.

User deletion cascades to accounts, sessions, and owned projects. Provider and
account id, session token, and user email are uniquely indexed as required by
the auth adapter.

Signup codes are not stored in the D1 `verification` table. The
`EMAIL_VERIFICATION_CODES` Workers KV binding uses
`email-code:challenge:<email-hash>:<challenge-id>` keys. Values contain only an
HMAC code digest, creation time, and purpose, with a 600-second TTL. Cooldown keys
and the five-attempt limit per challenge use namespaced rows in the existing D1
`rate_limit` table for cross-region atomic counters. The KV binding does not
change the D1 schema, so this change requires no new Drizzle migration.

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
