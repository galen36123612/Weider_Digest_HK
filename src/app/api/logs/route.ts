// 0811 add Blob

import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { sessionId, userId, role, content, eventId } = await req.json();
    if (!sessionId || !userId || !role || !content) {
      return new Response("Bad Request", { status: 400 });
    }
    const ts = new Date().toISOString();
    // 依日期分目錄，避免單一資料夾過多檔案
    const day = ts.slice(0, 10); // YYYY-MM-DD
    const key = `logs/${day}/${sessionId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.json`;

    const body = JSON.stringify({ ts, sessionId, userId, role, content, eventId }) + "\n";

    await put(key, body, {
      access: "private",
      contentType: "application/json",
    });

    return new Response("ok");
  } catch (e) {
    console.error("/api/logs error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
