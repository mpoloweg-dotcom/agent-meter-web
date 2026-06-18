"use client";

import { useEffect, useState } from "react";

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

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/trades", { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Dohvat nije uspio.");
        return data;
      })
      .then((data) => {
        if (Array.isArray(data)) setTrades(data);
        else throw new Error("Poslužitelj je vratio neočekivan odgovor.");
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Želiš li trajno obrisati ovaj zatvoreni trejd?")) return;
    setDeleting(id);
    try {
      const r = await fetch("/api/trades", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Brisanje nije uspjelo.");
      if (data.deletedId !== id) throw new Error("Poslužitelj nije potvrdio brisanje.");

      setTrades((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Brisanje nije uspjelo.");
    } finally {
      setDeleting(null);
    }
  }

  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status === "closed");
  const totalPnl = closed.reduce((sum, t) => sum + (t.pl_eur ?? 0), 0);
  const wins = closed.filter((t) => (t.pl_eur ?? 0) > 0).length;
  const winRate = closed.length ? ((wins / closed.length) * 100).toFixed(0) : "—";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Trades</h1>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 mb-6">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-6 text-sm text-gray-400 mb-6">
        <span>Otvorene: <span className="text-yellow-400 font-medium">{open.length}</span></span>
        <span>Zatvorene: <span className="text-white font-medium">{closed.length}</span></span>
        <span>Win rate: <span className="text-emerald-400 font-medium">{winRate}%</span></span>
        <span>
          Ukupni P&L:{" "}
          <span className={`font-medium ${totalPnl > 0 ? "text-emerald-400" : totalPnl < 0 ? "text-red-400" : "text-white"}`}>
            €{totalPnl.toFixed(2)}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-left">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Instrument</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Iznos</th>
              <th className="px-4 py-3">Ulaz</th>
              <th className="px-4 py-3">Izlaz</th>
              <th className="px-4 py-3">P&L</th>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Razlog</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
                  Učitavam trejdove…
                </td>
              </tr>
            )}
            {!loading && trades.length === 0 && !error && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
                  Nema trade-ova.
                </td>
              </tr>
            )}
            {trades.map((t) => (
              <tr
                key={t.id}
                className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-500">{t.id}</td>
                <td className="px-4 py-3 font-medium">{t.instrument}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.action === "BUY" ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"
                  }`}>
                    {t.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    t.status === "open" ? "bg-yellow-900 text-yellow-300" : "bg-gray-800 text-gray-400"
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3">€{fmt(t.position_eur)}</td>
                <td className="px-4 py-3 font-mono">{fmt(t.entry_price, 4)}</td>
                <td className="px-4 py-3 font-mono">{fmt(t.exit_price, 4)}</td>
                <td className={`px-4 py-3 font-medium ${
                  t.pl_eur == null ? "text-gray-500" : t.pl_eur > 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {t.pl_eur != null ? `€${fmt(t.pl_eur)}` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(t.timestamp)}</td>
                <td className="px-4 py-3 text-gray-400 max-w-xs">
                  <span className="line-clamp-1 text-xs">{t.reason ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  {t.status === "closed" && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30 text-lg leading-none"
                      title="Obriši trade"
                      aria-label={`Obriši zatvoreni trejd ${t.id}`}
                    >
                      {deleting === t.id ? "…" : "🗑"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
