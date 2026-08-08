# API contracts

[简体中文](../zh-cn/api-contracts.md) | English

## Authentication

Better Auth owns Google OAuth, email/password sign-in, and sessions under
`/api/auth/*`. The browser may start Google sign-in or post credentials to
`POST /api/auth/sign-in/email`. Email sign-in must include a Turnstile token with
the `email-login` action in the `x-captcha-response` header.

Email signup uses these application routes:

- `GET /api/auth/email/config` returns only the public Turnstile site key and is
  never cached.
- `POST /api/auth/email/code` accepts strict `{ email }` JSON and a Turnstile
  token with the `email-signup-send` action. It sends a six-digit code over SMTP
  and returns an opaque `challengeId` with a 600-second lifetime. Email and source
  IP each have a D1-backed atomic 60-second cooldown.
- `POST /api/auth/email/register` accepts `name`, `email`, `password`, `code`, and
  `challengeId`, plus a fresh Turnstile token with the `email-signup` action. It
  validates the KV challenge, then invokes Better Auth signup with a short-lived
  internal signed proof. Each challenge allows at most five submissions and is
  deleted after the account is created successfully.

All three write operations enforce same-origin requests. Turnstile tokens are
single-use and the browser must render a new token after each request. Invalid or
expired codes and unavailable accounts produce generic errors without exposing
storage details. A direct `POST /api/auth/sign-up/email` without a valid internal
proof returns `403`.

Successful sign-in or signup sets an HttpOnly session cookie.
`GET /api/auth/get-session` remains the only source of browser identity state.

Protected routes call `getAuthenticatedUser(request)` and derive ownership from
the verified session `user.id`. They never accept `email`, `userEmail`, or
`userId` as an ownership input. Missing or expired sessions return `401`.

## Shared validation

`lib/validation/stitch.ts` is the source of truth for browser and server data.
The browser validates outgoing payloads and incoming JSON. API routes validate
query parameters and request bodies before accessing D1. Persisted JSON is
validated again before it is restored into UI state.

## Progress and projects

- `GET /api/progress?pattern=<id>` returns the signed-in user's matching project.
- `GET /api/progress?all=1` returns up to the configured project limit, most
  recently updated first.
- `GET /api/progress` returns the most recently updated project.
- `POST /api/progress` accepts `patternId`, a validated `pattern`, and validated
  `stitched` indices. It atomically upserts the row identified by the session
  user and pattern id.

Unknown query/body fields are rejected. In particular, a forged owner field
returns `400` rather than influencing ownership. Pattern payloads over the byte
limit return `413`. Unexpected storage failures return a generic `500` without
leaking internal error messages.

## Sharing

- `GET /api/share?id=<opaque-id>` remains public so existing share links work.
  Its response only includes `id`, `senderName`, `patternJson`, and `createdAt`;
  recipient email and owner identity are never exposed.
- `POST /api/share` requires a valid session and stores the session user as the
  owner. It accepts a sender name, recipient email, and validated pattern.

Malformed query/body data returns `400`; unauthenticated creation returns `401`;
oversized pattern JSON returns `413`.
