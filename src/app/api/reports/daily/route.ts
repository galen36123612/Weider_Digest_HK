// 0811 Add daily report

import { list } from "@vercel/blob";

export const runtime = "nodejs";

function toCsv(rows: any[]) {
  if (!rows.length) return "day,role,count\n";
  const headers = Object.keys(rows[0]);
  const lines = rows.map(r => headers.map(h => String(r[h]).replace(/"/g, '""')).join(","));
  return headers.join(",") + "\n" + lines.join("\n");
}

export async function GET() {
  // 你也可以改成昨天的報表：new Date(Date.now() - 86400000)
  const d = new Date();
  const day = d.toISOString().slice(0, 10); // YYYY-MM-DD
  const prefix = `logs/${day}/`;

  const { blobs } = await list({ prefix }); // 列出當天所有物件
  let userCount = 0;
  let assistantCount = 0;

  // 下載每個物件並累計
  for (const b of blobs) {
    const res = await fetch(b.url);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (json.role === "user") userCount++;
      if (json.role === "assistant") assistantCount++;
    } catch {
      // 忽略不合法內容
    }
  }

  const csv = toCsv([
    { day, role: "assistant", count: assistantCount },
    { day, role: "user", count: userCount },
  ]);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
