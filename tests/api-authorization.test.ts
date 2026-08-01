import { describe, expect, test, vi } from "vite-plus/test";

vi.mock("../db", () => ({
  getDb: vi.fn(() => {
    throw new Error("Database must not be reached for anonymous protected requests");
  }),
}));

vi.mock("../lib/auth", () => ({
  getAuthenticatedUser: vi.fn(async () => null),
  unauthorized: () => Response.json({ error: "请先使用 Google 登录" }, { status: 401 }),
}));

import { GET as getProgress, POST as saveProgress } from "../app/api/progress/route";
import { POST as createShare } from "../app/api/share/route";

describe("authenticated API boundaries", () => {
  test("rejects anonymous project reads before accessing the database", async () => {
    const response = await getProgress(new Request("https://app.example/api/progress?all=1"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "请先使用 Google 登录" });
  });

  test("rejects anonymous progress and share writes", async () => {
    const request = (path: string) =>
      new Request(`https://app.example${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

    await expect(saveProgress(request("/api/progress"))).resolves.toMatchObject({ status: 401 });
    await expect(createShare(request("/api/share"))).resolves.toMatchObject({ status: 401 });
  });
});
