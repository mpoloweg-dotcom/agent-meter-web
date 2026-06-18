import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getPortfolio() {
  try {
    const openRows = await query<{
      id: number;
      instrument: string;
      action: string;
      position_eur: string;
      entry_price: string;
      timestamp: string;
      confidence: string;
    }>(`
      SELECT id, instrument, action, position_eur, entry_price, timestamp, confidence
      FROM trades
      WHERE status = 'open'
      ORDER BY timestamp DESC
    `);

    const [pnlRow] = await query<{ total_pnl: string; closed_count: number }>(`
      SELECT
        COALESCE(SUM(pl_eur), 0) AS total_pnl,
        COUNT(*) AS closed_count
      FROM trades
      WHERE status = 'closed'
    `);

    const initialCapital = parseFloat(process.env.INITIAL_CAPITAL_EUR || "1000");
    const committed = openRows.reduce((s, r) => s + parseFloat(r.position_eur || "0"), 0);
    const totalPnl = parseFloat(pnlRow?.total_pnl || "0");
    const availableCash = initialCapital + totalPnl - committed;

    return {
      initialCapital,
      availableCash: parseFloat(availableCash.toFixed(2)),
      committed: parseFloat(committed.toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      closedCount: Number(pnlRow?.closed_count || 0),
      openPositions: openRows.map((r) => ({
        ...r,
        position_eur: parseFloat(r.position_eur),
        entry_price: r.entry_price ? parseFloat(r.entry_price) : null,
      })),
    };
  } catch {
    return null;
  }
}

async function getSchedule() {
  try {
    return await query<{
      id: number;
      created_at: string;
      wake_at: string;
      reason: string;
    }>(`
      SELECT id, created_at, wake_at, reason
      FROM agent_schedule
      ORDER BY created_at DESC
      LIMIT 5
    `);
  } catch {
    return [];
  }
}

function fmt(val: number | null | undefined, decimals = 2) {
  if (val == null) return "—";
  return val.toFixed(decimals);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("hr-HR", { timeZone: "Europe/Zagreb" });
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "prošlo";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `za ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `za ${hours}h ${mins % 60}min`;
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const [portfolio, schedule] = await Promise.all([getPortfolio(), getSchedule()]);
  const nextWake = schedule?.[0];
  const pnlColor = portfolio?.totalPnl == null ? "" : portfolio.totalPnl > 0 ? "text-emerald-400" : portfolio.totalPnl < 0 ? "text-red-400" : "text-gray-300";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {!portfolio && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 mb-6">
          ⚠️ Nije moguće spojiti se na bazu. Provjeri DATABASE_URL env var.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Inicijalni kapital" value={`€${fmt(portfolio?.initialCapital)}`} />
        <StatCard label="Dostupna gotovina" value={`€${fmt(portfolio?.availableCash)}`} color="text-emerald-400" />
        <StatCard label="Angažirano" value={`€${fmt(portfolio?.committed)}`} color="text-yellow-400" />
        <StatCard label="Ukupni P&L" value={`€${fmt(portfolio?.totalPnl)}`} color={pnlColor} sub={`${portfolio?.closedCount ?? 0} zatvorenih pozicija`} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="font-semibold text-lg mb-4">Otvorene pozicije ({portfolio?.openPositions?.length ?? 0})</h2>
          {!portfolio?.openPositions?.length ? (
            <p className="text-gray-500 text-sm">Nema otvorenih pozicija.</p>
          ) : (
            <div className="space-y-3">
              {portfolio.openPositions.map((pos) => (
                <div key={pos.id} className="border border-gray-700 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">{pos.instrument}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${pos.action === "BUY" ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>{pos.action}</span>
                  </div>
                  <div className="text-gray-400 mt-1 space-y-0.5">
                    <p>€{fmt(pos.position_eur)} · ulaz: {fmt(pos.entry_price, 4)}</p>
                    <p className="text-xs text-gray-500">{fmtDate(pos.timestamp)}</p>
                    {pos.confidence && <p className="text-gray-500 italic text-xs">{pos.confidence}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/trades" className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">Sve pozicije →</Link>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="font-semibold text-lg mb-4">Agent schedule</h2>
          {!nextWake ? (
            <p className="text-gray-500 text-sm">Nema zakazanog buđenja.</p>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-1">Sljedeće buđenje</p>
              <p className="text-xl font-bold text-emerald-400">{fmtDate(nextWake.wake_at)}</p>
              <p className="text-sm text-emerald-300 mt-0.5">{timeUntil(nextWake.wake_at)}</p>
              {nextWake.reason && <p className="text-sm text-gray-500 mt-1">{nextWake.reason}</p>}
            </div>
          )}
          <Link href="/schedule" className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">Cijeli schedule →</Link>
        </div>
      </div>
    </div>
  );
}
