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
  evidence: Array<{ source: string; title: string; url?: string }> | null;
  invalidation: string | null;
  previous_close: number | null;
  price_change_pct: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  estimated_risk_eur: number | null;
  strategy_used: string | null;
  agent_version: string | null;
  timestamp: string | null;
};

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

  async function deleteFinished(body: { ids?: number[]; allFinished?: boolean }) {
    setDeleting(true);
    try {
      const r = await fetch("/api/trades", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Brisanje nije uspjelo.");
      if (!Array.isArray(data.deletedIds)) {
        throw new Error("Brisanje nije potvrđeno.");
      }

      const deletedIds = new Set<number>(data.deletedIds.map(Number));
      setTrades((prev) => prev.filter((t) => !deletedIds.has(t.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Brisanje nije uspjelo.");
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Želiš li trajno obrisati ovaj završeni zapis?")) return;
    setDeletingId(id);
    await deleteFinished({ ids: [id] });
  }

  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status === "closed");
  const totalPnl = closed.reduce((sum, t) => sum + (t.pl_eur ?? 0), 0);
  const wins = closed.filter((t) => (t.pl_eur ?? 0) > 0).length;
  const winRate = closed.length ? ((wins / closed.length) * 100).toFixed(0) : "—";
  const selectedClosedIds = closed.filter((t) => selectedIds.has(t.id)).map((t) => t.id);
  const allFinishedSelected = closed.length > 0 && selectedClosedIds.length === closed.length;

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFinished() {
    if (allFinishedSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(closed.map((t) => t.id)));
  }

  async function handleDeleteSelected() {
    if (selectedClosedIds.length === 0) return;
    if (!confirm(`Želiš li trajno obrisati ${selectedClosedIds.length} označenih zapisa?`)) return;
    await deleteFinished({ ids: selectedClosedIds });
  }

  async function handleDeleteAllFinished() {
    if (closed.length === 0) return;
    if (!confirm(`Ovo će trajno obrisati svih ${closed.length} završenih zapisa. Želiš li nastaviti?`)) return;
    await deleteFinished({ allFinished: true });
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Kupnje i prodaje</h1>
        <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-300">3.0</span>
      </div>
      <p className="text-gray-400 mb-6">Svi potezi koje je agent napravio s novcem za vježbu.</p>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 mb-6">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400 mb-6">
        <span>Aktivno: <span className="text-yellow-400 font-medium">{open.length}</span></span>
        <span>Završeno: <span className="text-white font-medium">{closed.length}</span></span>
        <span>Uspješnih: <span className="text-emerald-400 font-medium">{winRate}%</span></span>
        <span>
          Ukupna zarada ili gubitak:{" "}
          <span className={`font-medium ${totalPnl > 0 ? "text-emerald-400" : totalPnl < 0 ? "text-red-400" : "text-white"}`}>
            €{totalPnl.toFixed(2)}
          </span>
        </span>
      </div>

      {!loading && closed.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={allFinishedSelected}
              onChange={toggleAllFinished}
              disabled={deleting}
              className="h-4 w-4 accent-emerald-500"
            />
            Označi sve završene
          </label>
          <span className="text-sm text-gray-500">
            Označeno: {selectedClosedIds.length}
          </span>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={deleting || selectedClosedIds.length === 0}
              className="rounded-lg bg-red-900 px-3 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting && selectedClosedIds.length > 0 ? "Brišem…" : `Obriši označene (${selectedClosedIds.length})`}
            </button>
            <button
              type="button"
              onClick={handleDeleteAllFinished}
              disabled={deleting}
              className="rounded-lg border border-red-900 px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Obriši sve završene ({closed.length})
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-left">
              <th className="px-4 py-3">
                <span className="sr-only">Odabir</span>
              </th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Što</th>
              <th className="px-4 py-3">Potez</th>
              <th className="px-4 py-3">Stanje</th>
              <th className="px-4 py-3">Uloženo</th>
              <th className="px-4 py-3">Početna cijena</th>
              <th className="px-4 py-3">Završna cijena</th>
              <th className="px-4 py-3">Zarada/gubitak</th>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Razlog</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-gray-500">
                  Učitavam trejdove…
                </td>
              </tr>
            )}
            {!loading && trades.length === 0 && !error && (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-gray-500">
                  Još nema zabilježenih poteza.
                </td>
              </tr>
            )}
            {trades.map((t) => (
              <tr
                key={t.id}
                className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors"
              >
                <td className="px-4 py-3">
                  {t.status === "closed" && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleSelected(t.id)}
                      disabled={deleting}
                      className="h-4 w-4 accent-emerald-500"
                      aria-label={`Označi završeni zapis ${t.id}`}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{t.id}</td>
                <td className="px-4 py-3 font-medium">{t.instrument}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.action === "BUY" ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"
                  }`}>
                    {t.action === "BUY" ? "Kupnja" : "Prodaja"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    t.status === "open" ? "bg-yellow-900 text-yellow-300" : "bg-gray-800 text-gray-400"
                  }`}>
                    {t.status === "open" ? "Aktivno" : "Završeno"}
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
                  <span className="line-clamp-2 text-xs">{t.reason ?? "—"}</span>
                  {t.agent_version === "3.0" && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-emerald-400">Pogledaj plan i dokaze</summary>
                      <div className="mt-2 min-w-64 space-y-2 rounded-lg border border-gray-700 bg-gray-950 p-3 leading-relaxed">
                        {t.claude_summary && <p><span className="font-semibold text-gray-300">Objašnjenje:</span> {t.claude_summary}</p>}
                        {t.invalidation && <p><span className="font-semibold text-orange-300">Kad priznaje pogrešku:</span> {t.invalidation}</p>}
                        <p><span className="font-semibold text-gray-300">Granica gubitka:</span> {fmt(t.stop_loss_price, 4)}</p>
                        <p><span className="font-semibold text-gray-300">Cilj dobiti:</span> {fmt(t.take_profit_price, 4)}</p>
                        <p><span className="font-semibold text-gray-300">Najviše planira izgubiti:</span> €{fmt(t.estimated_risk_eur)}</p>
                        <p><span className="font-semibold text-gray-300">Kretanje cijene pri odluci:</span> {t.price_change_pct == null ? "—" : `${t.price_change_pct >= 0 ? "+" : ""}${t.price_change_pct.toFixed(2)}%`}</p>
                        {Array.isArray(t.evidence) && t.evidence.length > 0 && (
                          <div>
                            <p className="font-semibold text-gray-300">Izvori:</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">
                              {t.evidence.map((item, index) => <li key={`${item.source}-${index}`}>{item.source}: {item.title}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </td>
                <td className="px-4 py-3">
                  {t.status === "closed" && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting}
                      className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30 text-lg leading-none"
                      title="Obriši zapis"
                      aria-label={`Obriši završeni zapis ${t.id}`}
                    >
                      {deletingId === t.id ? "…" : "🗑"}
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
