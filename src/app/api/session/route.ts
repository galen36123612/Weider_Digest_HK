/*import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2025-06-03",
          // model: "gpt-4o-mini-realtime-preview-2024-12-17",
        }),
      }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}*/

// 0811 log Testing

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { sql } from "@vercel/postgres";

export const runtime = "nodejs"; // 用 Postgres 需要 Node 端執行

export async function GET() {
  try {
    // 1) 取得/建立匿名 userId（cookie）
    const jar = cookies();
    let userId = jar.get("anonId")?.value;
    if (!userId) {
      userId = randomUUID();
      // 若你不需要在前端讀 cookie，可改 httpOnly: true
      jar.set({
        name: "anonId",
        value: userId,
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 年
      });
    }

    // 2) 產生本次交談的 sessionId，並寫 DB
    const sessionId = randomUUID();

    // 這兩張表要先建好（見下方 schema）
    await sql`INSERT INTO users (id) VALUES (${userId}) ON CONFLICT (id) DO NOTHING;`;
    await sql`INSERT INTO sessions (id, user_id) VALUES (${sessionId}, ${userId});`;

    // 3) 向 OpenAI 取得 Realtime ephemeral key（保留你原本的做法）
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        // 需要的話可加 voice / modalities 等其他 session 項目
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI session error:", errText);
      return NextResponse.json({ error: "Failed to create realtime session" }, { status: 500 });
    }

    const data = await response.json();

    // 4) 回傳 ephemeral key + 我們自己的 userId / sessionId
    return NextResponse.json({
      ...data,
      userId,
      sessionId,
    });
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


