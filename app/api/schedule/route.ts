import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<{
      id: number;
      created_at: string;
      wake_at: string;
      reason: string;
    }>(`
      SELECT id, created_at, wake_at, reason
      FROM agent_schedule
      ORDER BY created_at DESC
      LIMIT 20
    `);

    return NextResponse.json(rows);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
