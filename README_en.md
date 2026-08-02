# stitch-and-slow

[简体中文](README.md) | English

A cross-stitch pattern workspace built with React, vinext, Cloudflare D1,
Drizzle, and Google OAuth through Better Auth. Development uses Vite+ on top of
a mise-managed Node.js environment and a pnpm workspace.

## Prerequisites

- [mise](https://mise.jdx.dev/)
- [Vite+](https://viteplus.dev/guide/)
- A Google Cloud OAuth 2.0 Web application

## Quick start

```bash
mise install
vp env off
mise exec -- pnpm install
cp .dev.vars.example .dev.vars
mise exec -- pnpm run dev
```

Fill `.dev.vars` with a random secret of at least 32 bytes and the Google OAuth
client credentials. `.dev.vars` is ignored by Git. Never commit real client
secrets.

```dotenv
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
```

Create a Google OAuth Web client and register this authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

For production, set `BETTER_AUTH_URL` to the canonical Cloudflare HTTPS origin,
register `https://<domain>/api/auth/callback/google`, and inject all four values
with `wrangler secret put --config wrangler.cloudflare.jsonc`. Do not put secret
values in `wrangler.cloudflare.jsonc`.

## Authentication and persistence

- Better Auth runs Google OIDC at `/api/auth/*` and stores users, linked Google
  accounts, sessions, OAuth verification state, and rate limits in D1.
- Email/password registration and the old browser-only email login are disabled.
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
- `wrangler.cloudflare.jsonc` declares the production Worker and D1 binding.
- `drizzle/` contains deployment migrations.

See [`.codex/docs/en/`](.codex/docs/en/) for the architecture, API, page,
schema, and toolchain contracts.
