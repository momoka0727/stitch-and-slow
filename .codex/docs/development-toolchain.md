# Development toolchain

## Ownership

- mise owns the Node.js and pnpm runtime versions declared in `mise.toml`.
- pnpm is the only package manager. `pnpm-lock.yaml` is the only dependency
  lockfile.
- Vite+ provides the project command surface, dependency delegation, formatting,
  linting, type-checking, and Vitest.
- vinext remains the Next.js-compatible framework layer. Its `dev`, `build`,
  and `start` commands run through `vp run` package tasks.

Vite+'s global runtime shims should use system-first mode so they do not replace
mise:

```bash
vp env off
```

## Bootstrap

```bash
mise install
mise exec -- vp install
```

Vite+ reads the pinned pnpm version from `package.json#devEngines` and delegates
dependency operations to pnpm.

## Commands

| Goal | Command |
| --- | --- |
| Start development | `mise exec -- vp run dev` |
| Build for Sites | `mise exec -- vp run build` |
| Run static checks | `mise exec -- vp check` |
| Run tests | `mise exec -- vp test --run` |
| Check formatting only | `mise exec -- vp fmt --check` |
| Apply formatting | `mise exec -- vp fmt` |
| Lint only | `mise exec -- vp lint` |
| Build with production Wrangler config | `mise exec -- vp run build:cloudflare` |
| Regenerate Cloudflare types | `mise exec -- vp run types:cloudflare` |
| Check generated Cloudflare types | `mise exec -- vp run types:cloudflare:check` |
| Generate Drizzle migrations | `mise exec -- vp run db:generate` |

Use `vp run` for package scripts. The built-in `vp dev`, `vp build`, and
`vp test` commands do not execute same-named `package.json` scripts. In
particular, this repository uses `vp run build` so vinext can perform its
framework-specific production steps.

## Configuration

`vite.config.ts` is the shared configuration for Vite, Vite+, vinext, the Sites
packaging plugin, and Cloudflare's Vite plugin. Keep the plugin order:

1. `vinext()`
2. `sites()`
3. `cloudflare()`

Keep the application plugins in a direct array. vinext inspects sibling plugin
names during its config hook to select Cloudflare-compatible environment
settings. Vitest receives an empty plugin array because its Node test
environment must not initialize Worker/RSC environments.

The `sites()` plugin must continue to copy `.openai/hosting.json` and `drizzle/`
into `dist/.openai/`; Sites version packaging depends on those paths.

`worker-configuration.d.ts` is generated from `wrangler.cloudflare.jsonc`.
Regenerate it whenever Cloudflare bindings or compatibility settings change.

## Dependency updates

Use Vite+ commands so the pinned pnpm version and workspace policy remain
consistent:

```bash
mise exec -- vp add <package>
mise exec -- vp add --save-dev <package>
mise exec -- vp remove <package>
mise exec -- vp install
```

Review changes to `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml`
together.
