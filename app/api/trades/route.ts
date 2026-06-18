import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const body: { id?: unknown; ids?: unknown; allFinished?: unknown } =
      await request.json();

    if (body.allFinished === true) {
      const deleted = await query<{ id: number }>(
        `DELETE FROM trades
         WHERE LOWER(TRIM(status)) = 'closed'
         RETURNING id`
      );

      return NextResponse.json({
        ok: true,
        deletedIds: deleted.map((row) => Number(row.id)),
        deletedCount: deleted.length,
      });
    }

    const rawIds: unknown[] = Array.isArray(body.ids) ? body.ids : [body.id];
    const numericIds = rawIds.map((value) => Number(value));
    const ids = Array.from(new Set<number>(numericIds)).filter(
      (id: number) => Number.isSafeInteger(id) && id > 0
    );

    if (ids.length === 0 || ids.length !== rawIds.length || ids.length > 200) {
      return NextResponse.json(
        { error: "Odabir za brisanje nije ispravan." },
        { status: 400 }
      );
    }

    const deleted = await query<{ id: number }>(
      `DELETE FROM trades
       WHERE id = ANY($1::bigint[]) AND LOWER(TRIM(status)) = 'closed'
       RETURNING id`,
      [ids]
    );

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Odabrani završeni zapisi nisu pronađeni." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      deletedIds: deleted.map((row) => Number(row.id)),
      deletedCount: deleted.length,
    });
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
        action: r.action?.trim().toUpperCase(),
        status: r.status?.trim().toLowerCase(),
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
