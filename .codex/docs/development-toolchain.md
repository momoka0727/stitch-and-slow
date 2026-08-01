# Development toolchain

## Ownership

- mise owns the Node.js and pnpm versions in `mise.toml`.
- pnpm is the only package manager; `pnpm-lock.yaml` is the only lockfile.
- Vite+ provides formatting, linting, type checking, and Vitest.
- vinext supplies the Next.js-compatible application and Worker build.
- Drizzle owns D1 schema and migration generation.
- Better Auth owns Google OIDC, session cookies, account linking, and auth
  persistence.

Use `vp env off` once so Vite+ uses the mise-managed runtime.

## Bootstrap and auth configuration

```bash
mise install
mise exec -- vp install
cp .dev.vars.example .dev.vars
```

Required runtime bindings are `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`,
`GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. `.dev.vars*` is ignored except
for the committed example. Production values belong in the hosting secret
manager, never Wrangler config or Git. Their names are declared under
`wrangler.cloudflare.jsonc#secrets.required` so local development, generated
types, and deployment validate the same contract without storing their values.

`BETTER_AUTH_URL` must be the canonical origin. Register
`<origin>/api/auth/callback/google` in the Google OAuth client. Apply every D1
migration before deploying code that expects the new schema.

The `dev` and `db:migrate:local` package scripts both set
`CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH=./wrangler.cloudflare.jsonc` (directly or
through Wrangler's `--config` option). Keep them aligned: otherwise the Vite
plugin falls back to the inline placeholder D1 and authentication queries will
not see migrations applied to the configured local database.

Keep `wrangler.cloudflare.jsonc#compatibility_date` at or below the newest date
supported by the repository-pinned workerd runtime. Regenerate
`worker-configuration.d.ts` whenever that date or any binding changes.

The Cloudflare Vite plugin writes a preview-only `dist/server/.dev.vars` so its
local preview can reproduce bindings. `dist/` is ignored and `.dev.vars` is
excluded from Worker modules and public assets; deploy through the configured
Cloudflare/Sites workflow rather than publishing the server directory as raw
files.

## Commands

| Goal | Command |
| --- | --- |
| Start development | `mise exec -- vp run dev` |
| Run static checks | `mise exec -- vp check` |
| Run tests | `mise exec -- vp test --run` |
| Apply formatting | `mise exec -- vp fmt` |
| Lint only | `mise exec -- vp lint` |
| Build for Sites | `mise exec -- vp run build` |
| Build with Wrangler config | `mise exec -- vp run build:cloudflare` |
| Generate Drizzle migrations | `mise exec -- vp run db:generate` |
| Apply local D1 migrations | `mise exec -- vp run db:migrate:local` |
| Regenerate Worker types | `mise exec -- vp run types:cloudflare` |

The `sites()` build plugin must continue packaging `.openai/hosting.json` and
the complete `drizzle/` directory. Update the production-build test when a new
required migration is added.

## Dependency updates

Use pnpm through the repository-managed command surface:

```bash
mise exec -- vp add <package>
mise exec -- vp remove <package>
mise exec -- vp install
```

Review `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` together.
