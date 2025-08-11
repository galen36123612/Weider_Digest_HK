// 0811 add Blob

/*import { put } from "@vercel/blob";

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
      access: "public",
      contentType: "application/json",
    });

    return new Response("ok");
  } catch (e) {
    console.error("/api/logs error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}*/

// src/app/api/logs/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

function tpeDay(d = new Date()) {
  const tpe = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return tpe.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date();
    const day = tpeDay(now);
    const ts = now.toISOString();
    const key = `logs/${day}/${Date.now()}-${Math.random().toString(36).slice(2)}.json`;

    const payload = JSON.stringify({ ts, ...body });

    await put(key, payload, {
      access: "public", // Blob 目前只支援 public
      contentType: "application/json",
    });

    return NextResponse.json({ ok: true, key });
  } catch (e: any) {
    console.error("POST /api/logs error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

