import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { stitchProgress } from "../../../db/schema";
import { STITCH_LIMITS } from "../../../constants/stitch";
import { validationError } from "../../../lib/http";
import { progressQuerySchema, saveProgressRequestSchema } from "../../../lib/validation/stitch";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = progressQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!query.success) return validationError("查询参数不正确", query.error.flatten());
    const { user: userEmail, pattern: patternId } = query.data;
    const includeAll = query.data.all === "1";

    const db = getDb();
    const rows = includeAll
      ? await db
          .select()
          .from(stitchProgress)
          .where(eq(stitchProgress.userEmail, userEmail))
          .orderBy(desc(stitchProgress.updatedAt))
          .limit(STITCH_LIMITS.maxProjects)
      : patternId
        ? await db
            .select()
            .from(stitchProgress)
            .where(
              and(eq(stitchProgress.userEmail, userEmail), eq(stitchProgress.patternId, patternId)),
            )
            .limit(1)
        : await db
            .select()
            .from(stitchProgress)
            .where(eq(stitchProgress.userEmail, userEmail))
            .orderBy(desc(stitchProgress.updatedAt))
            .limit(1);

    return includeAll
      ? Response.json({ progresses: rows })
      : Response.json({ progress: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存服务暂时不可用";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = saveProgressRequestSchema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return validationError("保存信息不完整", payload.error.flatten());
    const { userEmail, patternId, pattern, stitched } = payload.data;

    const patternJson = JSON.stringify(pattern);
    if (new TextEncoder().encode(patternJson).byteLength > STITCH_LIMITS.storedPatternBytes) {
      return Response.json({ error: "图纸数据过大" }, { status: 413 });
    }
    const row = {
      id: `${userEmail}:${patternId}`,
      userEmail,
      patternId,
      patternJson,
      stitchedJson: JSON.stringify(stitched),
      updatedAt: Date.now(),
    };
    const db = getDb();
    await db
      .insert(stitchProgress)
      .values(row)
      .onConflictDoUpdate({
        target: stitchProgress.id,
        set: {
          patternJson: row.patternJson,
          stitchedJson: row.stitchedJson,
          updatedAt: row.updatedAt,
        },
      });

    return Response.json({ savedAt: row.updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存服务暂时不可用";
    return Response.json({ error: message }, { status: 500 });
  }
}
