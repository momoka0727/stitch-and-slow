# Architecture

[简体中文](../zh-cn/architecture.md) | English

## Dependency and trust flow

```text
Google OIDC -> Better Auth route -> D1 user/account/session
                                  -> HttpOnly session cookie
email signup -> Turnstile -> SMTP code -> Workers KV challenge -> signed signup proof
email login -> Turnstile -> Better Auth credential -> D1 user/account/session
browser UI -> validated API client -> route auth guard -> user_projects / shared_projects
```

- `app/` contains framework entries and API routes.
- `components/` contains the workspace orchestrator and presentational UI.
- `lib/auth.ts` is the server-only authentication boundary.
- `lib/auth-client.ts` is the same-origin browser session client.
- `lib/validation/` contains shared Zod domain and API contracts.
- `lib/api/` contains the validated browser API client.
- `db/` owns the D1 binding and Drizzle schema.

Better Auth links either Google's provider account id or an email/password
credential account to an immutable internal `user.id`. Signup codes are stored
only as HMAC digests in `EMAIL_VERIFICATION_CODES` KV with a ten-minute TTL,
random challenge id, and keys that contain no plaintext email. Code delivery and
final signup each require a fresh Cloudflare Turnstile token; Better Auth's
Turnstile plugin protects password sign-in. After a code passes, the signup route
creates a 30-second internal proof bound to that email, so the default
`/sign-up/email` endpoint cannot be called directly to bypass verification.

Workers KV is eventually consistent and has no atomic consume operation. The D1
unique-email constraint ensures concurrent registration requests can create at
most one user. Any future higher-risk use such as password reset should use a
Durable Object or D1 atomic consumption as the source of truth.

Application ownership always uses the internal user id. Email, display
name, and avatar are profile data and must not be used as authorization keys.
OAuth tokens are encrypted at rest; cookies are HttpOnly, same-site, and secure
on HTTPS origins.

## State boundaries

`components/stitch-app.tsx` owns cross-view state, timers, persistence, and
navigation. It observes Better Auth's session state and never treats browser
storage as proof of identity. Page components remain presentational. Canvas
rendering and browser image processing stay client-side.

The active stitch collection uses `Set<number>` in memory. API boundaries
convert it to a validated integer array. A `user_projects` row stores the
pattern snapshot and stitch progress in one upsert so autosave cannot persist
one without the other.

## Public boundary

Opaque shared links are intentionally public. The public projection excludes
recipient and owner information and treats stored pattern JSON as untrusted.
Creating a share is authenticated.

The old `stitch_progress.user_email` rows remain isolated legacy data. They are
not copied or claimed automatically because the previous API did not prove that
the submitting browser owned that email.
