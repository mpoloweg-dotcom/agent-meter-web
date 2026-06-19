import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<{ id: number; timestamp: string; note: string; kind: string }>(`
      SELECT id, timestamp, note, kind
      FROM agent_journal
      WHERE COALESCE(note, '') !~* '(geopolitika|meter|zoran)'
        AND kind IN ('analysis', 'decision', 'note')
      ORDER BY timestamp DESC
      LIMIT 30
    `);
    const sentimentMap: Record<string, string> = { analysis: "neutral", decision: "bullish", note: "neutral" };
    return NextResponse.json(rows.map((r) => ({ ...r, sentiment: sentimentMap[r.kind] ?? "neutral" })));
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}