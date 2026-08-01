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

  test("packages Sites metadata and D1 migrations", async () => {
    const sourceHosting = new URL("../.openai/hosting.json", import.meta.url);
    const packagedHosting = new URL("../dist/.openai/hosting.json", import.meta.url);
    const packagedMigration = new URL(
      "../dist/.openai/drizzle/0001_wonderful_spencer_smythe.sql",
      import.meta.url,
    );

    await expect(access(packagedHosting)).resolves.toBeUndefined();
    await expect(access(packagedMigration)).resolves.toBeUndefined();

    const [source, packaged] = await Promise.all([
      readFile(sourceHosting, "utf8"),
      readFile(packagedHosting, "utf8"),
    ]);
    const hosting = JSON.parse(packaged) as {
      d1: string | null;
    };
    expect(packaged).toBe(source);
    expect(hosting.d1).toBe("DB");
  });
});
