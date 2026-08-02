# Development toolchain

[简体中文](../zh-cn/development-toolchain.md) | English

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
mise exec -- pnpm install
cp .dev.vars.example .dev.vars
```

Required runtime values are `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`,
`GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. `.dev.vars*` is ignored except
for the committed example. Production values belong in Cloudflare secrets,
never Wrangler config or Git. Their names are declared under
`wrangler.cloudflare.jsonc#secrets.required` so local development, generated
types, and deployment validate the same contract without storing their values.

`BETTER_AUTH_URL` must be the canonical origin. Register
`<origin>/api/auth/callback/google` in the Google OAuth client. Apply every D1
migration before deploying code that expects the new schema.

`vite.config.ts`, the D1 migration scripts, type generation, and deployment all
use `wrangler.cloudflare.jsonc`. Keep those paths aligned so local development,
production builds, and migration commands address the intended D1 binding.

Keep `wrangler.cloudflare.jsonc#compatibility_date` at or below the newest date
supported by the repository-pinned workerd runtime. Regenerate
`worker-configuration.d.ts` whenever that date or any binding changes.

The Cloudflare Vite plugin writes a preview-only `dist/server/.dev.vars` so its
local preview can reproduce bindings. `dist/` is ignored and `.dev.vars` is
excluded from Worker modules and public assets; deploy through Wrangler rather
than publishing the server directory as raw files.

## Commands

| Goal | Command |
| --- | --- |
| Start development | `mise exec -- pnpm run dev` |
| Run static checks | `mise exec -- pnpm run check` |
| Run tests | `mise exec -- pnpm run test` |
| Apply formatting | `mise exec -- pnpm run format` |
| Lint only | `mise exec -- pnpm run lint` |
| Build Cloudflare Worker | `mise exec -- pnpm run build` |
| Deploy Cloudflare Worker | `mise exec -- pnpm run deploy` |
| Validate deployable Worker | `mise exec -- pnpm run deploy:dry-run` |
| Generate Drizzle migrations | `mise exec -- pnpm run db:generate` |
| Apply local D1 migrations | `mise exec -- pnpm run db:migrate:local` |
| Apply production D1 migrations | `mise exec -- pnpm run db:migrate:remote` |
| Regenerate Worker types | `mise exec -- pnpm run types:cloudflare` |

Cloudflare Workers is the only production target. The Vite build writes
`dist/server/wrangler.json` and `.wrangler/deploy/config.json`; the latter makes
plain `wrangler deploy` consume the generated Worker instead of rebundling the
vinext source entry. `pnpm run deploy` validates the build first, then applies
remote D1 migrations immediately before deploying that artifact. Do not pass
the source Wrangler config to the final deploy command, add a second hosting
control plane, or package platform-specific metadata into `dist/`.

## Dependency updates

Use pnpm through the repository-managed command surface:

```bash
mise exec -- pnpm add <package>
mise exec -- pnpm remove <package>
mise exec -- pnpm install
```

Review `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` together.
