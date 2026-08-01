import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, test } from "vite-plus/test";

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const vinextCli = join(dirname(fileURLToPath(import.meta.resolve("vinext"))), "cli.js");

beforeAll(async () => {
  await execFileAsync(process.execPath, [vinextCli, "build"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      VITEST: "",
      WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
    },
    maxBuffer: 16 * 1024 * 1024,
  });
}, 120_000);

async function renderHome() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

describe("production build", () => {
  test("server-renders the current stitch workspace", async () => {
    const response = await renderHome();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/html\b/i);

    const html = await response.text();
    expect(html).toContain("<title>针迹小屋 · 图片转十字绣图纸</title>");
    expect(html).toContain("STITCH &amp; SLOW");
    expect(html).toContain("把快生活，绣得慢一点。");
  });

  test("uses the Cloudflare Worker and D1 migration configuration", async () => {
    const packagedWranglerConfig = new URL("../dist/server/wrangler.json", import.meta.url);
    const sourceAuthMigration = new URL("../drizzle/0002_skinny_sleepwalker.sql", import.meta.url);
    const packagedSitesMetadata = new URL("../dist/.openai/hosting.json", import.meta.url);

    await expect(access(sourceAuthMigration)).resolves.toBeUndefined();
    await expect(access(packagedWranglerConfig)).resolves.toBeUndefined();
    await expect(access(packagedSitesMetadata)).rejects.toMatchObject({ code: "ENOENT" });

    const config = JSON.parse(await readFile(packagedWranglerConfig, "utf8")) as {
      name: string;
      main: string;
      assets: { directory: string };
      d1_databases: Array<{
        binding: string;
        database_id: string;
        migrations_dir: string;
      }>;
    };
    expect(config.name).toBe("stitch-and-slow");
    expect(config.main).toBe("index.js");
    expect(config.assets.directory).toBe("../client");
    expect(config.d1_databases).toContainEqual(
      expect.objectContaining({
        binding: "DB",
        database_id: "a4399cde-c60d-4279-b3d0-51a3be6f4591",
        migrations_dir: "../../drizzle",
      }),
    );
  });
});
