# stitch-and-slow

[简体中文](README.md) | English

A cross-stitch pattern workspace built with React, vinext, Cloudflare D1 and
Workers KV, Drizzle, and Better Auth with Google OAuth plus email/password auth. Development uses Vite+ on top of
a mise-managed Node.js environment and a pnpm workspace.

## Prerequisites

- [mise](https://mise.jdx.dev/)
- [Vite+](https://viteplus.dev/guide/)
- A Google Cloud OAuth 2.0 Web application
- A Cloudflare Turnstile widget and Workers KV namespace
- An SMTP account supporting TLS on 465 or STARTTLS on 587

## Quick start

```bash
mise install
vp env off
mise exec -- pnpm install
cp .dev.vars.example .dev.vars
mise exec -- pnpm run dev
```

Fill `.dev.vars` with Better Auth, Google OAuth, Turnstile, SMTP, and an
independent verification-code pepper. See `.dev.vars.example` for every field.
`.dev.vars` is ignored by Git. Never commit real secrets.

```dotenv
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
TURNSTILE_SITE_KEY=<turnstile-site-key>
TURNSTILE_SECRET_KEY=<turnstile-secret-key>
EMAIL_CODE_PEPPER=<independent-random-secret>
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_TLS_MODE=starttls
SMTP_USERNAME=<smtp-user>
SMTP_PASSWORD=<smtp-password>
SMTP_FROM=no-reply@example.com
```

Create a Google OAuth Web client and register this authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

For production, set `BETTER_AUTH_URL` to the canonical Cloudflare HTTPS origin,
register `https://<domain>/api/auth/callback/google`. The repository config is
already bound to production and preview KV namespaces in the project account;
create new namespaces and replace the IDs when deploying to another Cloudflare
account. Inject every required value with
`wrangler secret put --config wrangler.cloudflare.jsonc`. Do not put secret
values in `wrangler.cloudflare.jsonc`.

## Authentication and persistence

- Better Auth runs Google OIDC at `/api/auth/*` and stores users, linked Google
  accounts, sessions, OAuth verification state, and rate limits in D1.
- Email/password sign-in is protected by Cloudflare Turnstile. Email signup uses
  Turnstile and custom SMTP to deliver a six-digit code, then requires a second
  Turnstile token to finish registration.
- Signup challenge HMAC digests live in Workers KV and expire after ten minutes.
  KV keys contain no plaintext email, and the default Better Auth email-signup
  endpoint cannot be called directly to bypass the code.
- User ownership is always derived from the server-side session `user.id`.
  Progress APIs never accept an email or user id from the browser.
- Each project row stores its validated pattern snapshot and stitched-index
  progress atomically. Signing out and back in restores the same D1-backed data.
- The legacy `stitch_progress` table remains archived but is not queried because
  its email ownership was never authenticated.

Apply all files in `drizzle/` to the D1 database before deploying a build that
uses the new authentication routes. The current schema migration is
`0002_skinny_sleepwalker.sql`.

Before the first local login, apply migrations with:

```bash
mise exec -- pnpm run db:migrate:local
```

The `dev` and `db:migrate:local` scripts both use `wrangler.cloudflare.jsonc`,
so the development server and migration command address the same local D1
database.

## Production deployment

Cloudflare Workers is the only supported production target. Configure Wrangler
authentication and all required secrets, then run:

```bash
mise exec -- pnpm run deploy
```

The deployment command builds with `wrangler.cloudflare.jsonc`, applies pending
migrations to the remote D1 database, and deploys the generated Worker in that
order. Do not deploy code that expects a new schema without completing the
migration.

## Useful commands

- `mise exec -- pnpm run dev`: start local development with the Wrangler config
- `mise exec -- pnpm run check`: run format, lint, and type checks
- `mise exec -- pnpm run test`: run tests once
- `mise exec -- pnpm run build`: build the Cloudflare Worker
- `mise exec -- pnpm run deploy`: build, migrate production D1, and deploy to Cloudflare
- `mise exec -- pnpm run deploy:dry-run`: build and validate the deployable Worker locally
- `mise exec -- pnpm run db:generate`: generate a Drizzle migration after schema changes
- `mise exec -- pnpm run db:migrate:local`: apply pending migrations to local D1
- `mise exec -- pnpm run db:migrate:remote`: apply pending migrations to production D1
- `mise exec -- pnpm run types:cloudflare`: regenerate Worker binding types

## Project shape

- `app/api/auth/[...all]/route.ts` exposes the Better Auth handler.
- `lib/auth.ts` owns server authentication configuration and session lookup.
- `lib/auth-client.ts` owns the browser authentication client.
- `db/schema.ts` contains the Better Auth and application D1 schema.
- `wrangler.cloudflare.jsonc` declares the production Worker, D1 and KV bindings,
  and runtime configuration contract.
- `drizzle/` contains deployment migrations.

See [`.codex/docs/en/`](.codex/docs/en/) for the architecture, API, page,
schema, and toolchain contracts.
