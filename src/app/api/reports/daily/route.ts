// 0811 Add daily report only time and count

/*import { list } from "@vercel/blob";

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
}*/

// 0811 user Q and A

import { list } from "@vercel/blob";

export const runtime = "nodejs";

type LogRec = {
  ts: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  eventId?: string;
};

function tpeDay(d?: string) {
  const base = d ? new Date(d) : new Date();
  const tpe = new Date(base.getTime() + 8 * 60 * 60 * 1000);
  return tpe.toISOString().slice(0, 10); // YYYY-MM-DD
}

function toCsv(rows: any[], headers: string[]) {
  const headerLine = headers.join(",");
  const lines = rows.map((r) =>
    headers
      .map((h) => {
        const v = (r as any)[h] ?? "";
        const s = String(v).replace(/"/g, '""');
        return /[,"\n]/.test(s) ? `"${s}"` : s;
      })
      .join(",")
  );
  return headerLine + "\n" + lines.join("\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const day = url.searchParams.get("day") || tpeDay();
  const detail = url.searchParams.get("detail") === "1";
  const format = (url.searchParams.get("format") || "json").toLowerCase();

  const prefix = `logs/${day}/`;
  const { blobs } = await list({ prefix });

  // 讀取當天所有 log 檔
  const logs: LogRec[] = [];
  for (const b of blobs) {
    const res = await fetch(b.url);
    if (!res.ok) continue;
    const txt = await res.text();
    try {
      const j = JSON.parse(txt);
      if (j.role === "user" || j.role === "assistant") logs.push(j);
    } catch {}
  }

  // 依 sessionId、時間排序
  logs.sort(
    (a, b) =>
      a.sessionId.localeCompare(b.sessionId) || a.ts.localeCompare(b.ts)
  );

  // 只要計數
  if (!detail) {
    const counts = logs.reduce(
      (acc, r) => ((acc[r.role] = (acc[r.role] || 0) + 1), acc),
      {} as Record<string, number>
    );
    const out = [
      { day, role: "assistant", count: counts["assistant"] || 0 },
      { day, role: "user", count: counts["user"] || 0 },
    ];
    if (format === "csv") {
      const csv = toCsv(out, ["day", "role", "count"]);
      return new Response(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }
    return new Response(JSON.stringify(out, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  // detail=1：把「使用者 → 助手」配對
  const pairs: Array<{
    day: string;
    sessionId: string;
    userTs: string;
    userText: string;
    assistantTs: string;
    assistantText: string;
  }> = [];

  let lastUser: LogRec | null = null;
  for (const rec of logs) {
    if (rec.role === "user") {
      lastUser = rec;
    } else if (
      rec.role === "assistant" &&
      lastUser &&
      rec.sessionId === lastUser.sessionId
    ) {
      pairs.push({
        day,
        sessionId: rec.sessionId,
        userTs: lastUser.ts,
        userText: lastUser.content,
        assistantTs: rec.ts,
        assistantText: rec.content,
      });
      lastUser = null;
    }
  }

  if (format === "csv") {
    const csv = toCsv(pairs, [
      "day",
      "sessionId",
      "userTs",
      "userText",
      "assistantTs",
      "assistantText",
    ]);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  return new Response(JSON.stringify({ day, totalPairs: pairs.length, pairs }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
