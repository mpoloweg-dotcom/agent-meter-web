import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await query(`DELETE FROM trades WHERE id = $1 AND status = 'closed'`, [id]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await query<{
      id: number;
      instrument: string;
      action: string;
      status: string;
      position_eur: string;
      entry_price: string;
      exit_price: string;
      pl_eur: string;
      reason: string;
      confidence: string;
      article_title: string;
      article_link: string;
      claude_summary: string;
      timestamp: string;
    }>(`
      SELECT
        id, instrument, action, status,
        position_eur, entry_price, exit_price,
        pl_eur, reason, confidence,
        article_title, article_link, claude_summary,
        timestamp
      FROM trades
      ORDER BY timestamp DESC
      LIMIT 200
    `);

    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        position_eur: r.position_eur ? parseFloat(r.position_eur) : null,
        entry_price: r.entry_price ? parseFloat(r.entry_price) : null,
        exit_price: r.exit_price ? parseFloat(r.exit_price) : null,
        pl_eur: r.pl_eur ? parseFloat(r.pl_eur) : null,
      }))
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
