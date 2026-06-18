import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Capital summary
    const [capitalRow] = await query<{ initial_capital: string }>(`
      SELECT 1000 AS initial_capital
    `);

    // Open positions with committed capital
    const openRows = await query<{
      id: number;
      instrument: string;
      side: string;
      amount_eur: string;
      entry_price: string;
      opened_at: string;
      thesis: string;
      confidence: string;
    }>(`
      SELECT id, instrument, side, amount_eur, entry_price, opened_at, thesis, confidence
      FROM trades
      WHERE status = 'open'
      ORDER BY opened_at DESC
    `);

    // Closed trades P&L sum
    const [pnlRow] = await query<{ total_pnl: string; closed_count: number }>(`
      SELECT
        COALESCE(SUM(pnl_eur), 0) AS total_pnl,
        COUNT(*) AS closed_count
      FROM trades
      WHERE status = 'closed'
    `);

    const committed = openRows.reduce((sum, r) => sum + parseFloat(r.amount_eur || "0"), 0);
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
        amount_eur: parseFloat(r.amount_eur),
        entry_price: r.entry_price ? parseFloat(r.entry_price) : null,
      })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
