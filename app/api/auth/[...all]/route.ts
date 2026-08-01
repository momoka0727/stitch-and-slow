import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "../../../../lib/auth";

async function handler(request: Request) {
  try {
    return await getAuth().handler(request);
  } catch (error) {
    console.error("Authentication request failed", error);
    return Response.json({ error: "认证服务暂时不可用" }, { status: 503 });
  }
}

export const { GET, POST } = toNextJsHandler(handler);
