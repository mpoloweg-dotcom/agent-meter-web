import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [capitalRow] = await query<{ initial_capital: string }>(`
      SELECT 1000 AS initial_capital
    `);

    const openRows = await query<{
      id: number;
      instrument: string;
      action: string;
      position_eur: string;
      entry_price: string;
      timestamp: string;
      confidence: string;
    }>(`
      SELECT id, instrument, action, position_eur, entry_price, timestamp, confidence
      FROM trades
      WHERE status = 'open'
      ORDER BY timestamp DESC
    `);

    const [pnlRow] = await query<{ total_pnl: string; closed_count: number }>(`
      SELECT
        COALESCE(SUM(pl_eur), 0) AS total_pnl,
        COUNT(*) AS closed_count
      FROM trades
      WHERE status = 'closed'
    `);

    const committed = openRows.reduce((sum, r) => sum + parseFloat(r.position_eur || "0"), 0);
    const totalPnl = parseFloat(pnlRow?.total_pnl || "0");
    const initialCapital = parseFloat(process.env.INITIAL_CAPITAL_EUR || "1000");
    const availableCash = initialCapital + totalPnl - committed;

    return NextResponse.json({
      initialCapital,
      availableCash: parseFloat(availableCash.toFixed(2)),
      committed: parseFloat(committed.toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      closedCount: Number(pnlRow?.closed_count || 0),
      openPositions: openRows.map((r) => ({
        ...r,
        position_eur: parseFloat(r.position_eur),
        entry_price: r.entry_price ? parseFloat(r.entry_price) : null,
      })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
