import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [row] = await query<Record<string, string>>(`
      SELECT
        COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed') AS closed_count,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed' AND pl_eur > 0) AS wins,
        COALESCE(SUM(pl_eur) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed'), 0) AS total_pnl,
        COALESCE(AVG(pl_eur) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed'), 0) AS average_pnl,
        COALESCE(MIN(pl_eur) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed'), 0) AS largest_loss,
        COALESCE(SUM(estimated_risk_eur) FILTER (WHERE LOWER(COALESCE(status, 'open')) = 'open'), 0) AS open_risk
      FROM trades
      WHERE agent_version = '4.0'
    `);
    const closed = Number(row?.closed_count ?? 0);
    const wins = Number(row?.wins ?? 0);
    return NextResponse.json({
      version: "4.0",
      closedCount: closed,
      wins,
      winRate: closed ? Number(((wins / closed) * 100).toFixed(1)) : null,
      totalPnl: Number(row?.total_pnl ?? 0),
      averagePnl: Number(row?.average_pnl ?? 0),
      largestLoss: Number(row?.largest_loss ?? 0),
      openRisk: Number(row?.open_risk ?? 0),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
