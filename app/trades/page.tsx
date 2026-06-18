import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmt(val: number | null | undefined, decimals = 2) {
  if (val == null) return "—";
  return val.toFixed(decimals);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("hr-HR", { timeZone: "Europe/Zagreb" });
}

type Trade = {
  id: number;
  instrument: string;
  action: string;
  status: string;
  position_eur: number | null;
  entry_price: number | null;
  exit_price: number | null;
  pl_eur: number | null;
  reason: string | null;
  confidence: string | null;
  article_title: string | null;
  article_link: string | null;
  claude_summary: string | null;
  timestamp: string | null;
};

export default async function TradesPage() {
  let trades: Trade[] = [];
  let error: string | null = null;

  try {
    const rows = await query<{
      id: number; instrument: string; action: string; status: string;
      position_eur: string; entry_price: string; exit_price: string;
      pl_eur: string; reason: string; confidence: string;
      article_title: string; article_link: string; claude_summary: string; timestamp: string;
    }>(`
      SELECT id, instrument, action, status,
        position_eur, entry_price, exit_price,
        pl_eur, reason, confidence,
        article_title, article_link, claude_summary, timestamp
      FROM trades
      ORDER BY timestamp DESC
      LIMIT 200
    `);

    trades = rows.map((r) => ({
      ...r,
      position_eur: r.position_eur ? parseFloat(r.position_eur) : null,
      entry_price: r.entry_price ? parseFloat(r.entry_price) : null,
      exit_price: r.exit_price ? parseFloat(r.exit_price) : null,
      pl_eur: r.pl_eur ? parseFloat(r.pl_eur) : null,
    }));
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
  }

  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status === "closed");
  const totalPnl = closed.reduce((sum, t) => sum + (t.pl_eur ?? 0), 0);
  const wins = closed.filter((t) => (t.pl_eur ?? 0) > 0).length;
  const winRate = closed.length ? ((wins / closed.length) * 100).toFixed(0) : "—";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Trades</h1>
      {error && <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 mb-6">⚠️ {error}</div>}
      <div className="flex gap-6 text-sm text-gray-400 mb-6">
        <span>Otvorene: <span className="text-yellow-400 font-medium">{open.length}</span></span>
        <span>Zatvorene: <span className="text-white font-medium">{closed.length}</span></span>
        <span>Win rate: <span className="text-emerald-400 font-medium">{winRate}%</span></span>
        <span>Ukupni P&L: <span className={`font-medium ${totalPnl > 0 ? "text-emerald-400" : totalPnl < 0 ? "text-red-400" : "text-white"}`}>€{totalPnl.toFixed(2)}</span></span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-left">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Instrument</th>
              <th className="px-4 py-3">Side</th><th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Iznos</th><th className="px-4 py-3">Ulaz</th>
              <th className="px-4 py-3">Izlaz</th><th className="px-4 py-3">P&L</th>
              <th className="px-4 py-3">Datum</th><th className="px-4 py-3">Razlog</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && !error && <tr><td colSpan={10} className="px-4 py-6 text-center text-gray-500">Nema trade-ova.</td></tr>}
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="px-4 py-3 text-gray-500">{t.id}</td>
                <td className="px-4 py-3 font-medium">{t.instrument}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${t.action === "BUY" ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>{t.action}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${t.status === "open" ? "bg-yellow-900 text-yellow-300" : "bg-gray-800 text-gray-400"}`}>{t.status}</span></td>
                <td className="px-4 py-3">€{fmt(t.position_eur)}</td>
                <td className="px-4 py-3 font-mono">{fmt(t.entry_price, 4)}</td>
                <td className="px-4 py-3 font-mono">{fmt(t.exit_price, 4)}</td>
                <td className={`px-4 py-3 font-medium ${t.pl_eur == null ? "text-gray-500" : t.pl_eur > 0 ? "text-emerald-400" : "text-red-400"}`}>{t.pl_eur != null ? `€${fmt(t.pl_eur)}` : "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(t.timestamp)}</td>
                <td className="px-4 py-3 text-gray-400 max-w-xs"><span className="line-clamp-1 text-xs">{t.reason ?? "—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
