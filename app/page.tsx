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
      WHERE LOWER(TRIM(status)) = 'open'
      ORDER BY timestamp DESC
    `);

    const [pnlRow] = await query<{ total_pnl: string; closed_count: number }>(`
      SELECT
        COALESCE(SUM(pl_eur), 0) AS total_pnl,
        COUNT(*) AS closed_count
      FROM trades
      WHERE LOWER(TRIM(status)) = 'closed'
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
      WHERE COALESCE(reason, '') !~* '(geopolitika|meter|zoran)'
      ORDER BY created_at DESC
      LIMIT 5
    `);
  } catch {
    return [];
  }
}

async function getV3Insight() {
  try {
    const [performance] = await query<{
      closed_count: string;
      wins: string;
      total_pnl: string;
      average_pnl: string;
      largest_loss: string;
      open_risk: string;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed') AS closed_count,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed' AND pl_eur > 0) AS wins,
        COALESCE(SUM(pl_eur) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed'), 0) AS total_pnl,
        COALESCE(AVG(pl_eur) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed'), 0) AS average_pnl,
        COALESCE(MIN(pl_eur) FILTER (WHERE LOWER(COALESCE(status, '')) = 'closed'), 0) AS largest_loss,
        COALESCE(SUM(estimated_risk_eur) FILTER (WHERE LOWER(COALESCE(status, 'open')) = 'open'), 0) AS open_risk
      FROM trades
      WHERE agent_version = '3.0'
    `);
    const [latest] = await query<{
      timestamp: string;
      outcome: string;
      summary: string;
      confidence_score: number | null;
    }>(`
      SELECT timestamp, outcome, summary, confidence_score
      FROM agent_decisions
      WHERE agent_version = '3.0'
      ORDER BY timestamp DESC, id DESC
      LIMIT 1
    `);
    const closed = Number(performance?.closed_count ?? 0);
    const wins = Number(performance?.wins ?? 0);
    return {
      closed,
      winRate: closed ? (wins / closed) * 100 : null,
      totalPnl: Number(performance?.total_pnl ?? 0),
      averagePnl: Number(performance?.average_pnl ?? 0),
      largestLoss: Number(performance?.largest_loss ?? 0),
      openRisk: Number(performance?.open_risk ?? 0),
      latest: latest ?? null,
    };
  } catch {
    return null;
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
  const [portfolio, schedule, v3] = await Promise.all([getPortfolio(), getSchedule(), getV3Insight()]);
  const nextWake = schedule?.[0];
  const pnlColor = portfolio?.totalPnl == null ? "" : portfolio.totalPnl > 0 ? "text-emerald-400" : portfolio.totalPnl < 0 ? "text-red-400" : "text-gray-300";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Pregled agenta</h1>
        <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-300">Verzija 3.0</span>
      </div>
      <p className="text-gray-400 mb-6">Ovdje vidiš koliko novca imamo, što je agent napravio i kada ponovno provjerava vijesti.</p>
      {!portfolio && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 mb-6">
          ⚠️ Trenutno ne mogu dohvatiti podatke. Pokušaj ponovno malo kasnije.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Početni iznos" value={`€${fmt(portfolio?.initialCapital)}`} />
        <StatCard label="Slobodno za nove odluke" value={`€${fmt(portfolio?.availableCash)}`} color="text-emerald-400" />
        <StatCard label="Trenutno uloženo" value={`€${fmt(portfolio?.committed)}`} color="text-yellow-400" />
        <StatCard label="Ukupna zarada ili gubitak" value={`€${fmt(portfolio?.totalPnl)}`} color={pnlColor} sub={`${portfolio?.closedCount ?? 0} završenih poteza`} />
      </div>
      <section className="mb-8 rounded-xl border border-emerald-900/70 bg-emerald-950/20 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Kako radi verzija 3.0</h2>
            <p className="mt-1 text-sm text-gray-400">Rezultati nove strože taktike odvojeni su od stare povijesti.</p>
          </div>
          <Link href="/decisions" className="text-sm text-emerald-400 hover:text-emerald-300">Pogledaj odluke i dokaze →</Link>
        </div>
        {!v3 ? (
          <p className="text-sm text-gray-500">Novi pregled će se pojaviti nakon prve provjere verzije 3.0.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-gray-950/70 p-4">
                <p className="text-xs text-gray-500">Završeni potezi</p>
                <p className="mt-1 text-xl font-bold">{v3.closed}</p>
              </div>
              <div className="rounded-lg bg-gray-950/70 p-4">
                <p className="text-xs text-gray-500">Uspješnost</p>
                <p className="mt-1 text-xl font-bold">{v3.winRate == null ? "Čeka podatke" : `${v3.winRate.toFixed(0)}%`}</p>
              </div>
              <div className="rounded-lg bg-gray-950/70 p-4">
                <p className="text-xs text-gray-500">Prosječan rezultat</p>
                <p className={`mt-1 text-xl font-bold ${v3.averagePnl > 0 ? "text-emerald-400" : v3.averagePnl < 0 ? "text-red-400" : ""}`}>€{fmt(v3.averagePnl)}</p>
              </div>
              <div className="rounded-lg bg-gray-950/70 p-4">
                <p className="text-xs text-gray-500">Trenutno mogući gubitak</p>
                <p className="mt-1 text-xl font-bold text-orange-300">€{fmt(v3.openRisk)}</p>
              </div>
            </div>
            {v3.latest && (
              <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Zadnja odluka · {fmtDate(v3.latest.timestamp)}</p>
                <p className="mt-2 text-sm text-gray-200">{v3.latest.summary}</p>
                {v3.latest.confidence_score != null && <p className="mt-1 text-xs text-gray-500">Sigurnost: {v3.latest.confidence_score}/100</p>}
              </div>
            )}
          </>
        )}
      </section>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="font-semibold text-lg mb-4">Trenutno aktivno ({portfolio?.openPositions?.length ?? 0})</h2>
          {!portfolio?.openPositions?.length ? (
            <p className="text-gray-500 text-sm">Agent trenutačno nema aktivnih kupnji ili prodaja.</p>
          ) : (
            <div className="space-y-3">
              {portfolio.openPositions.map((pos) => (
                <div key={pos.id} className="border border-gray-700 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">{pos.instrument}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${pos.action === "BUY" ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>{pos.action === "BUY" ? "Kupnja" : "Prodaja"}</span>
                  </div>
                  <div className="text-gray-400 mt-1 space-y-0.5">
                    <p>Uloženo €{fmt(pos.position_eur)} · početna cijena: {fmt(pos.entry_price, 4)}</p>
                    <p className="text-xs text-gray-500">{fmtDate(pos.timestamp)}</p>
                    {pos.confidence && <p className="text-gray-500 italic text-xs">{pos.confidence}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/trades" className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">Pogledaj sve poteze →</Link>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="font-semibold text-lg mb-4">Sljedeća provjera vijesti</h2>
          {!nextWake ? (
            <p className="text-gray-500 text-sm">Trenutno nema zakazane sljedeće provjere.</p>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-1">Agent ponovno provjerava vijesti</p>
              <p className="text-xl font-bold text-emerald-400">{fmtDate(nextWake.wake_at)}</p>
              <p className="text-sm text-emerald-300 mt-0.5">{timeUntil(nextWake.wake_at)}</p>
              {nextWake.reason && <p className="text-sm text-gray-500 mt-1">{nextWake.reason}</p>}
            </div>
          )}
          <Link href="/schedule" className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">Pogledaj cijeli raspored →</Link>
        </div>
      </div>
    </div>
  );
}
