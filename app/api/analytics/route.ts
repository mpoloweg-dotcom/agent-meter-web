import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pnlHistory = await query<{ day: string; daily_pnl: string; cumulative_pnl: string }>(`
      WITH daily AS (
        SELECT DATE(timestamp) AS day, SUM(pl_eur) AS daily_pnl
        FROM trades WHERE LOWER(TRIM(status)) = 'closed' AND timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
      )
      SELECT day::text, daily_pnl::text, SUM(daily_pnl) OVER (ORDER BY day)::text AS cumulative_pnl
      FROM daily ORDER BY day
    `);
    const byInstrument = await query<{ instrument: string; total: string; wins: string; total_pnl: string }>(`
      SELECT instrument, COUNT(*)::text AS total, COUNT(*) FILTER (WHERE pl_eur > 0)::text AS wins, SUM(pl_eur)::text AS total_pnl
      FROM trades WHERE LOWER(TRIM(status)) = 'closed' GROUP BY instrument ORDER BY SUM(pl_eur) DESC LIMIT 10
    `);
    const monthly = await query<{ month: string; pnl: string; trades: string }>(`
      SELECT TO_CHAR(DATE_TRUNC('month', timestamp), 'YYYY-MM') AS month, SUM(pl_eur)::text AS pnl, COUNT(*)::text AS trades
      FROM trades WHERE LOWER(TRIM(status)) = 'closed' GROUP BY DATE_TRUNC('month', timestamp) ORDER BY month DESC LIMIT 12
    `);
    const actionDist = await query<{ action: string; count: string }>(`
      SELECT COALESCE(action, 'N/A') AS action, COUNT(*)::text AS count
      FROM trades WHERE LOWER(TRIM(status)) = 'closed' GROUP BY action
    `);
    return NextResponse.json({
      pnlHistory: pnlHistory.map((r) => ({ day: r.day, dailyPnl: parseFloat(r.daily_pnl), cumulativePnl: parseFloat(r.cumulative_pnl) })),
      byInstrument: byInstrument.map((r) => ({ instrument: r.instrument, total: parseInt(r.total), wins: parseInt(r.wins), totalPnl: parseFloat(r.total_pnl) })),
      monthly: monthly.map((r) => ({ month: r.month, pnl: parseFloat(r.pnl), trades: parseInt(r.trades) })),
      actionDist: actionDist.map((r) => ({ action: r.action, count: parseInt(r.count) })),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}