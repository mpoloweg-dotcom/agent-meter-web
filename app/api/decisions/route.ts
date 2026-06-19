import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query(`
      SELECT id, timestamp, outcome, instrument, action, summary, evidence,
             invalidation, confidence_score, current_price, previous_close,
             price_change_pct, strategy, trade_id, agent_version
      FROM agent_decisions
      WHERE agent_version = '3.0'
      ORDER BY timestamp DESC, id DESC
      LIMIT 100
    `);
    return NextResponse.json(rows);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
