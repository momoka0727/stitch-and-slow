import { and, desc, eq } from "drizzle-orm";
import { STITCH_LIMITS } from "../../../constants/stitch";
import { getDb } from "../../../db";
import { userProjects } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";
import { validationError } from "../../../lib/http";
import { progressQuerySchema, saveProgressRequestSchema } from "../../../lib/validation/stitch";

const publicProjectColumns = {
  id: userProjects.id,
  patternId: userProjects.patternId,
  patternJson: userProjects.patternJson,
  stitchedJson: userProjects.stitchedJson,
  updatedAt: userProjects.updatedAt,
};

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const query = progressQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) return validationError("查询参数不正确", query.error.flatten());
    const { pattern: patternId } = query.data;
    const includeAll = query.data.all === "1";

    const db = getDb();
    const rows = includeAll
      ? await db
          .select(publicProjectColumns)
          .from(userProjects)
          .where(eq(userProjects.userId, user.id))
          .orderBy(desc(userProjects.updatedAt))
          .limit(STITCH_LIMITS.maxProjects)
      : patternId
        ? await db
            .select(publicProjectColumns)
            .from(userProjects)
            .where(and(eq(userProjects.userId, user.id), eq(userProjects.patternId, patternId)))
            .limit(1)
        : await db
            .select(publicProjectColumns)
            .from(userProjects)
            .where(eq(userProjects.userId, user.id))
            .orderBy(desc(userProjects.updatedAt))
            .limit(1);

    return includeAll
      ? Response.json({ progresses: rows })
      : Response.json({ progress: rows[0] || null });
  } catch (error) {
    console.error("Progress lookup failed", error);
    return Response.json({ error: "保存服务暂时不可用" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const payload = saveProgressRequestSchema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return validationError("保存信息不完整", payload.error.flatten());
    const { patternId, pattern, stitched } = payload.data;

    const patternJson = JSON.stringify(pattern);
    if (new TextEncoder().encode(patternJson).byteLength > STITCH_LIMITS.storedPatternBytes) {
      return Response.json({ error: "图纸数据过大" }, { status: 413 });
    }

    const savedAt = Date.now();
    const row = {
      id: crypto.randomUUID(),
      userId: user.id,
      patternId,
      patternJson,
      stitchedJson: JSON.stringify(stitched),
      createdAt: savedAt,
      updatedAt: savedAt,
    };
    const db = getDb();
    await db
      .insert(userProjects)
      .values(row)
      .onConflictDoUpdate({
        target: [userProjects.userId, userProjects.patternId],
        set: {
          patternJson: row.patternJson,
          stitchedJson: row.stitchedJson,
          updatedAt: row.updatedAt,
        },
      });

    return Response.json({ savedAt });
  } catch (error) {
    console.error("Progress save failed", error);
    return Response.json({ error: "保存服务暂时不可用" }, { status: 500 });
  }
}
