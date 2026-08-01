import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { sharedProjects } from "../../../db/schema";
import { STITCH_LIMITS } from "../../../constants/stitch";
import { validationError } from "../../../lib/http";
import { createShareRequestSchema, shareQuerySchema } from "../../../lib/validation/stitch";

export async function GET(request: Request) {
  try {
    const query = shareQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return validationError("分享编号不正确", query.error.flatten());
    const { id } = query.data;
    const db = getDb();
    const rows = await db.select().from(sharedProjects).where(eq(sharedProjects.id, id)).limit(1);
    return Response.json({ share: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "分享暂时无法打开";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = createShareRequestSchema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return validationError("分享信息不完整", payload.error.flatten());
    const { senderName, recipientEmail, pattern } = payload.data;
    const patternJson = JSON.stringify(pattern);
    if (new TextEncoder().encode(patternJson).byteLength > STITCH_LIMITS.storedPatternBytes) {
      return Response.json({ error: "图纸数据过大" }, { status: 413 });
    }
    const id = crypto.randomUUID().replaceAll("-", "").slice(0, 20);
    const row = {
      id,
      senderName,
      recipientEmail,
      patternJson,
      createdAt: Date.now(),
    };
    const db = getDb();
    await db.insert(sharedProjects).values(row);
    return Response.json({ id, createdAt: row.createdAt }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "分享暂时无法创建";
    return Response.json({ error: message }, { status: 500 });
  }
}
