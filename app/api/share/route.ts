import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { sharedProjects } from "../../../db/schema";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.slice(0, 80) || "";
    if (!id) return Response.json({ error: "分享编号不能为空" }, { status: 400 });
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
    const payload = (await request.json()) as {
      senderName?: string;
      recipientEmail?: string;
      pattern?: unknown;
    };
    const senderName = String(payload.senderName || "")
      .trim()
      .slice(0, 60);
    const recipientEmail = String(payload.recipientEmail || "")
      .trim()
      .toLowerCase()
      .slice(0, 320);
    if (!senderName || !recipientEmail.includes("@") || !payload.pattern) {
      return Response.json({ error: "分享信息不完整" }, { status: 400 });
    }
    const id = crypto.randomUUID().replaceAll("-", "").slice(0, 20);
    const row = {
      id,
      senderName,
      recipientEmail,
      patternJson: JSON.stringify(payload.pattern).slice(0, 500_000),
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
