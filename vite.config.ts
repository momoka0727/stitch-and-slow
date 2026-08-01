import vinext from "vinext";
import type { ViteUserConfigFn } from "vite-plus";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default (async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  const cloudflareConfigPath =
    process.env.CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH ?? "./wrangler.cloudflare.jsonc";
  const isVitest = process.env.VITEST === "true";
  const appPlugins = isVitest
    ? []
    : await (async () => {
        // vinext inspects sibling plugin names during its config hook, so these
        // application plugins must be returned as a direct array.
        const { cloudflare } = await import("@cloudflare/vite-plugin");
        return [
          vinext(),
          cloudflare({
            viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
            configPath: cloudflareConfigPath,
          }),
        ];
      })();

  return {
    fmt: {
      ignorePatterns: [
        ".codex/**",
        ".next/**",
        ".vinext/**",
        "dist/**",
        "drizzle/meta/**",
        "worker-configuration.d.ts",
      ],
    },
    lint: {
      categories: {
        correctness: "warn",
      },
      env: {
        browser: true,
        builtin: true,
        node: true,
      },
      ignorePatterns: [
        ".next/**",
        ".vinext/**",
        "dist/**",
        "drizzle/meta/**",
        "next-env.d.ts",
        "worker-configuration.d.ts",
      ],
      jsPlugins: [
        {
          name: "vite-plus",
          specifier: "vite-plus/oxlint-plugin",
        },
      ],
      options: {
        typeAware: true,
        typeCheck: true,
      },
      plugins: ["typescript", "unicorn", "react", "nextjs"],
      rules: {
        "nextjs/no-html-link-for-pages": "error",
        "nextjs/no-img-element": "warn",
        "react/exhaustive-deps": "warn",
        "react/rules-of-hooks": "error",
        "vite-plus/prefer-vite-plus-imports": "error",
      },
    },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    // Vitest runs in Node and must not initialize the Worker/RSC environments.
    plugins: appPlugins,
  };
}) satisfies ViteUserConfigFn;
