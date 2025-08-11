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

/*import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 建立/讀取匿名 userId（cookie）
    const jar = await cookies(); // ✅ Next 15 要 await
    let userId = jar.get("anonId")?.value;
    if (!userId) {
      userId = randomUUID();
      jar.set({
        name: "anonId",
        value: userId,
        httpOnly: false, // 若不需前端讀取可改 true
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    // 本次交談 sessionId（暫不落庫）
    const sessionId = randomUUID();

    // 向 OpenAI 取 Realtime ephemeral key（沿用你的邏輯）
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI session error:", errText);
      return NextResponse.json({ error: "Failed to create realtime session" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ ...data, userId, sessionId });
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}*/

// 0811 V1

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const runtime = "nodejs"; // 很重要！Node runtime 才能同步 cookies()

export async function GET() {
  try {
    // 1) 取得/建立匿名 userId（寫入 cookie）
    const jar = cookies(); // Node runtime 下是同步的
    let userId = jar.get("anonId")?.value;
    if (!userId) {
      userId = randomUUID();
      jar.set({
        name: "anonId",
        value: userId,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    // 2) 為這次連線產生一個 sessionId
    const sessionId = randomUUID();

    // 3) 向 OpenAI 建立 Realtime ephemeral session
    const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        // 也可以用你先前那個 2025-06-03 的預覽型號
      }),
    });

    const data = await resp.json();

    // 4) 一併把 userId / sessionId 回給前端（AppContent 會 set 進 state）
    return NextResponse.json({
      ...data,
      userId,
      sessionId,
    });
  } catch (error: any) {
    console.error("Error in /api/session:", error);
    return NextResponse.json(
      { error: "Internal Server Error", detail: String(error?.message || error) },
      { status: 500 }
    );
  }
}





