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

export const runtime = "nodejs";

export async function GET() {
  try {
    // 建立/讀取匿名 userId（cookie）
    const jar = cookies();
    let userId = jar.get("anonId")?.value;
    if (!userId) {
      userId = randomUUID();
      jar.set({
        name: "anonId",
        value: userId,
        httpOnly: false, // 若不須前端讀取可改 true
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    // 本次交談 sessionId（暫時不落庫）
    const sessionId = randomUUID();

    // 向 OpenAI 取 Realtime ephemeral key（沿用你的原邏輯）
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
}



