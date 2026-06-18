import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const tradeId = Number(id);

    if (!Number.isSafeInteger(tradeId) || tradeId <= 0) {
      return NextResponse.json({ error: "Neispravan ID trejda." }, { status: 400 });
    }

    const deleted = await query<{ id: number }>(
      `DELETE FROM trades
       WHERE id = $1 AND LOWER(status) = 'closed'
       RETURNING id`,
      [tradeId]
    );

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Zatvoreni trejd nije pronađen ili se ne smije obrisati." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, deletedId: deleted[0].id });
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
