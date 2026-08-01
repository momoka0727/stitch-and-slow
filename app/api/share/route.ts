import { eq } from "drizzle-orm";
import { STITCH_LIMITS } from "../../../constants/stitch";
import { getDb } from "../../../db";
import { sharedProjects } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";
import { validationError } from "../../../lib/http";
import { createShareRequestSchema, shareQuerySchema } from "../../../lib/validation/stitch";

export async function GET(request: Request) {
  try {
    const query = shareQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return validationError("分享编号不正确", query.error.flatten());
    const { id } = query.data;
    const db = getDb();
    const rows = await db
      .select({
        id: sharedProjects.id,
        senderName: sharedProjects.senderName,
        patternJson: sharedProjects.patternJson,
        createdAt: sharedProjects.createdAt,
      })
      .from(sharedProjects)
      .where(eq(sharedProjects.id, id))
      .limit(1);
    return Response.json({ share: rows[0] || null });
  } catch (error) {
    console.error("Share lookup failed", error);
    return Response.json({ error: "分享暂时无法打开" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

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
      ownerUserId: user.id,
      senderName,
      recipientEmail,
      patternJson,
      createdAt: Date.now(),
    };
    const db = getDb();
    await db.insert(sharedProjects).values(row);
    return Response.json({ id, createdAt: row.createdAt }, { status: 201 });
  } catch (error) {
    console.error("Share creation failed", error);
    return Response.json({ error: "分享暂时无法创建" }, { status: 500 });
  }
}
