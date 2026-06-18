import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  try {
    const rows = await query<{
      id: number;
      created_at: string;
      entry_type: string;
      content: string;
      metadata: Record<string, unknown>;
    }>(`
      SELECT id, created_at, entry_type, content, metadata
      FROM agent_journal
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return NextResponse.json(rows);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
