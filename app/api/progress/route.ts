import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { stitchProgress } from "../../../db/schema";

function cleanEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return email.includes("@") && email.length <= 320 ? email : "";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userEmail = cleanEmail(url.searchParams.get("user"));
    const patternId = (url.searchParams.get("pattern") || "").slice(0, 120);
    const includeAll = url.searchParams.get("all") === "1";

    if (!userEmail) {
      return Response.json({ error: "user is required" }, { status: 400 });
    }

    const db = getDb();
    const rows = includeAll
      ? await db
          .select()
          .from(stitchProgress)
          .where(eq(stitchProgress.userEmail, userEmail))
          .orderBy(desc(stitchProgress.updatedAt))
          .limit(50)
      : patternId
      ? await db
          .select()
          .from(stitchProgress)
          .where(
            and(
              eq(stitchProgress.userEmail, userEmail),
              eq(stitchProgress.patternId, patternId),
            ),
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
    const payload = (await request.json()) as {
      userEmail?: string;
      patternId?: string;
      pattern?: unknown;
      stitched?: unknown;
    };
    const userEmail = cleanEmail(payload.userEmail);
    const patternId = String(payload.patternId || "").slice(0, 120);
    const stitched = Array.isArray(payload.stitched)
      ? payload.stitched.filter(Number.isInteger).slice(0, 4096)
      : [];

    if (!userEmail || !patternId || !payload.pattern) {
      return Response.json({ error: "保存信息不完整" }, { status: 400 });
    }

    const row = {
      id: `${userEmail}:${patternId}`,
      userEmail,
      patternId,
      patternJson: JSON.stringify(payload.pattern).slice(0, 500_000),
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
