import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<{
      id: number;
      instrument: string;
      side: string;
      status: string;
      amount_eur: string;
      entry_price: string;
      exit_price: string;
      pnl_eur: string;
      result: string;
      reason: string;
      thesis: string;
      confidence: string;
      source_article_title: string;
      source_article_url: string;
      opened_at: string;
      closed_at: string;
      exit_reason: string;
    }>(`
      SELECT
        id, instrument, side, status,
        amount_eur, entry_price, exit_price,
        pnl_eur, result, reason, thesis, confidence,
        source_article_title, source_article_url,
        opened_at, closed_at, exit_reason
      FROM trades
      ORDER BY opened_at DESC
      LIMIT 200
    `);

    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        amount_eur: r.amount_eur ? parseFloat(r.amount_eur) : null,
        entry_price: r.entry_price ? parseFloat(r.entry_price) : null,
        exit_price: r.exit_price ? parseFloat(r.exit_price) : null,
        pnl_eur: r.pnl_eur ? parseFloat(r.pnl_eur) : null,
      }))
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
