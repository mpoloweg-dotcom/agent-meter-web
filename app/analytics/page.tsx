"use client";

import { useLiveData, ErrorAlert, LoadingSpinner, EmptyState, fmt, fmtPnl, pnlColor } from "@/components/dashboard";

interface AnalyticsData {
  pnlHistory: { day: string; dailyPnl: number; cumulativePnl: number }[];
  byInstrument: { instrument: string; total: number; wins: number; totalPnl: number }[];
  monthly: { month: string; pnl: number; trades: number }[];
  actionDist: { action: string; count: number }[];
}

export default function AnalyticsPage() {
  const { data, error, loading } = useLiveData<AnalyticsData>("/api/analytics", 3000);
  if (loading) return <LoadingSpinner text="Učitavam analitiku..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return <ErrorAlert message="Nema podataka za analitiku." />;

  const hasPnl = data.pnlHistory.length > 0;
  const latestCumulative = hasPnl ? data.pnlHistory[data.pnlHistory.length - 1].cumulativePnl : 0;
  const maxBarValue = hasPnl ? Math.max(...data.pnlHistory.map((d) => Math.abs(d.cumulativePnl)), 1) : 1;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Analitika</h1>
          <span className="rounded-full bg-[#002211] px-3 py-1 text-xs font-medium text-[#00ff88] border border-[#00ff88]/20">v4.0</span>
        </div>
        <p className="text-gray-500 text-sm">Detaljna analiza performansi — P&amp;L kroz vrijeme, uspješnost po instrumentu i mjesečni pregled.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card-glow bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Kumulativni P&amp;L (30 dana)</h2>
            <span className={pnlColor(latestCumulative) + " font-bold text-sm"}>{fmtPnl(latestCumulative)}</span>
          </div>
          {!hasPnl ? <EmptyState message="Još nema podataka." /> : (
            <div className="space-y-1">
              {data.pnlHistory.slice(-30).map((day) => {
                const pct = maxBarValue > 0 ? Math.abs(day.cumulativePnl) / maxBarValue * 100 : 0;
                const isPositive = day.cumulativePnl >= 0;
                return (
                  <div key={day.day} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-gray-500 text-right shrink-0">{day.day.slice(5)}</span>
                    <div className="flex-1 h-5 bg-[#0a0a0a] rounded relative overflow-hidden">
                      <div className={`absolute top-0 h-full rounded transition-all duration-500 ${isPositive ? "bg-[#00ff88]/30" : "bg-[#ff4444]/30"}`} style={{ width: `${pct}%`, left: isPositive ? "0" : "auto", right: isPositive ? "auto" : "0" }} />
                    </div>
                    <span className={`w-16 text-right font-mono ${pnlColor(day.cumulativePnl)}`}>{fmtPnl(day.cumulativePnl)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card-glow bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Ključni pokazatelji</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.byInstrument.length > 0 ? (() => {
              const totalTrades = data.byInstrument.reduce((s, i) => s + i.total, 0);
              const totalWins = data.byInstrument.reduce((s, i) => s + i.wins, 0);
              const totalPnl = data.byInstrument.reduce((s, i) => s + i.totalPnl, 0);
              return (<>
                <div className="bg-[#141414] rounded-lg p-4 border border-[#2a2a2a]"><p className="text-xs text-gray-500">Ukupno trejdova</p><p className="text-2xl font-bold mt-1">{totalTrades}</p></div>
                <div className="bg-[#141414] rounded-lg p-4 border border-[#2a2a2a]"><p className="text-xs text-gray-500">Uspješnost</p><p className="text-2xl font-bold mt-1 text-[#00ff88]">{totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : "—"}%</p></div>
                <div className="bg-[#141414] rounded-lg p-4 border border-[#2a2a2a]"><p className="text-xs text-gray-500">Ukupni P&amp;L</p><p className={`text-2xl font-bold mt-1 ${pnlColor(totalPnl)}`}>{fmtPnl(totalPnl)}</p></div>
                <div className="bg-[#141414] rounded-lg p-4 border border-[#2a2a2a]"><p className="text-xs text-gray-500">Prosječni P&amp;L</p><p className={`text-2xl font-bold mt-1 ${pnlColor(totalTrades > 0 ? totalPnl / totalTrades : 0)}`}>{totalTrades > 0 ? fmtPnl(totalPnl / totalTrades) : "—"}</p></div>
              </>);
            })() : <div className="col-span-2"><EmptyState message="Još nema podataka." /></div>}
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card-glow bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Po instrumentu</h2>
          {data.byInstrument.length === 0 ? <EmptyState message="Još nema podataka." /> : (
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-[#2a2a2a]"><th className="text-left py-2 pr-4">Instrument</th><th className="text-right py-2 px-2">Ukupno</th><th className="text-right py-2 px-2">Pobjede</th><th className="text-right py-2 pl-2">P&amp;L</th></tr></thead>
                <tbody>
                  {data.byInstrument.map((row) => (
                    <tr key={row.instrument} className="border-b border-[#1a1a1a] hover:bg-[#141414]/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">{row.instrument}</td>
                      <td className="py-3 px-2 text-right text-gray-400">{row.total}</td>
                      <td className="py-3 px-2 text-right"><span className="text-[#00ff88]">{row.wins}</span><span className="text-gray-600 text-xs ml-1">({row.total > 0 ? ((row.wins / row.total) * 100).toFixed(0) : "—"}%)</span></td>
                      <td className={`py-3 pl-2 text-right font-mono ${pnlColor(row.totalPnl)}`}>{fmtPnl(row.totalPnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card-glow bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Mjesečni pregled</h2>
          {data.monthly.length === 0 ? <EmptyState message="Još nema podataka." /> : (
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-[#2a2a2a]"><th className="text-left py-2 pr-4">Mjesec</th><th className="text-right py-2 px-2">Trejdovi</th><th className="text-right py-2 pl-2">P&amp;L</th></tr></thead>
                <tbody>
                  {data.monthly.map((row) => (
                    <tr key={row.month} className="border-b border-[#1a1a1a] hover:bg-[#141414]/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">{row.month}</td>
                      <td className="py-3 px-2 text-right text-gray-400">{row.trades}</td>
                      <td className={`py-3 pl-2 text-right font-mono font-semibold ${pnlColor(row.pnl)}`}>{fmtPnl(row.pnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className="card-glow bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Distribucija poteza</h2>
        {data.actionDist.length === 0 ? <EmptyState message="Još nema podataka." /> : (
          <div className="flex flex-wrap gap-4">
            {data.actionDist.map((item) => {
              const total = data.actionDist.reduce((s, i) => s + i.count, 0);
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : "0";
              return (
                <div key={item.action} className="flex-1 min-w-[120px] bg-[#141414] rounded-lg p-4 border border-[#2a2a2a] text-center">
                  <p className="text-2xl font-bold text-white">{item.count}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.action === "BUY" ? "Kupnja" : item.action === "SELL" ? "Prodaja" : item.action}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{pct}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
