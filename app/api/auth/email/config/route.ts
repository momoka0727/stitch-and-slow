import { readRuntimeString } from "../../../../../lib/auth-runtime";

export async function GET() {
  try {
    return Response.json(
      { turnstileSiteKey: readRuntimeString("TURNSTILE_SITE_KEY") },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Email authentication configuration is unavailable", error);
    return Response.json({ error: "邮箱登录暂时不可用" }, { status: 503 });
  }
}
