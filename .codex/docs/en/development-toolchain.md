# Development toolchain

[简体中文](../zh-cn/development-toolchain.md) | English

## Ownership

- mise owns the Node.js and pnpm versions in `mise.toml`.
- pnpm is the only package manager; `pnpm-lock.yaml` is the only lockfile.
- Vite+ provides formatting, linting, type checking, and Vitest.
- vinext supplies the Next.js-compatible application and Worker build.
- Drizzle owns D1 schema and migration generation.
- Better Auth owns Google OIDC, email/password credentials, session cookies,
  account linking, and auth persistence.
- Workers KV stores short-lived signup challenges, `cloudflare:sockets` provides
  TLS SMTP, and Cloudflare Turnstile supplies the non-Google bot challenge.

Use `vp env off` once so Vite+ uses the mise-managed runtime.

## Bootstrap and auth configuration

```bash
mise install
mise exec -- pnpm install
cp .dev.vars.example .dev.vars
```

Required runtime values are listed in `.dev.vars.example` and
`wrangler.cloudflare.jsonc#secrets.required`: Better Auth and Google credentials,
Turnstile site and secret keys, an independent `EMAIL_CODE_PEPPER`, plus SMTP
host, submission port, TLS mode, username, password, and envelope sender.
Production values belong in Cloudflare secrets and never in Git.
`SMTP_TLS_MODE` accepts only `starttls` (port 587) or `tls` (port 465); these
standard submission ports must use their matching TLS mode. Port 25 and
plaintext SMTP are unsupported. SMTP operations that exceed 15 seconds report
the host, port, and TLS mode for diagnosis without logging credentials or codes.

`wrangler.cloudflare.jsonc` pins the project's Cloudflare Account and contains
the real production and preview KV namespace IDs. Wrangler uses local KV during
local development. When moving to another account, create new namespaces and
update `account_id`, `id`, and `preview_id`. Configure separate Turnstile
hostname policies for development and production; automated tests may use
Cloudflare's official test keys. Configure SPF, DKIM, and DMARC for the SMTP
sender domain.

`BETTER_AUTH_URL` must be the canonical origin. It also drives same-origin write
validation, Turnstile hostname checks, and the SMTP EHLO hostname. Register
`<origin>/api/auth/callback/google` in the Google OAuth client. Apply every D1
migration before deploying code that expects the new schema.

`vite.config.ts`, the D1 migration scripts, type generation, and deployment all
use `wrangler.cloudflare.jsonc`. Keep those paths aligned so local development,
production builds, and migration commands address the intended D1 binding.

Keep `wrangler.cloudflare.jsonc#compatibility_date` at or below the newest date
supported by the repository-pinned workerd runtime. Regenerate
`worker-configuration.d.ts` whenever that date or any binding changes.

`wrangler.cloudflare.jsonc#observability.logs` enables Worker logs while
disabling automatic invocation logs, so application output remains available
without recording a log entry for every request.

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
