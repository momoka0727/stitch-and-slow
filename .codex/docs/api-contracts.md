# API contracts

## Authentication

Better Auth owns `/api/auth/*`. The browser starts Google sign-in through the
Better Auth client, Google returns to `/api/auth/callback/google`, and the server
sets an HttpOnly session cookie. `GET /api/auth/get-session` is the only source
of browser identity state; email/password registration is disabled.

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
