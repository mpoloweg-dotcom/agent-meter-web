import Link from "next/link";

async function getPortfolio() {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/portfolio`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getSchedule() {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/schedule`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
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

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
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

  const pnlColor =
    portfolio?.totalPnl == null
      ? ""
      : portfolio.totalPnl > 0
      ? "text-emerald-400"
      : portfolio.totalPnl < 0
      ? "text-red-400"
      : "text-gray-300";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {!portfolio && (
        <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 mb-6">
          ⚠️ Nije moguće spojiti se na bazu. Provjeri DATABASE_URL env var.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Inicijalni kapital"
          value={`€${fmt(portfolio?.initialCapital)}`}
        />
        <StatCard
          label="Dostupna gotovina"
          value={`€${fmt(portfolio?.availableCash)}`}
          color="text-emerald-400"
        />
        <StatCard
          label="Angažirano"
          value={`€${fmt(portfolio?.committed)}`}
          color="text-yellow-400"
        />
        <StatCard
          label="Ukupni P&L"
          value={`€${fmt(portfolio?.totalPnl)}`}
          color={pnlColor}
          sub={`${portfolio?.closedCount ?? 0} zatvorenih pozicija`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Open positions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="font-semibold text-lg mb-4">
            Otvorene pozicije ({portfolio?.openPositions?.length ?? 0})
          </h2>
          {!portfolio?.openPositions?.length ? (
            <p className="text-gray-500 text-sm">Nema otvorenih pozicija.</p>
          ) : (
            <div className="space-y-3">
              {portfolio.openPositions.map(
                (pos: {
                  id: number;
                  instrument: string;
                  side: string;
                  amount_eur: number;
                  entry_price: number | null;
                  opened_at: string;
                  thesis: string;
                }) => (
                  <div
                    key={pos.id}
                    className="border border-gray-700 rounded-lg p-3 text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">{pos.instrument}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          pos.side === "BUY"
                            ? "bg-emerald-900 text-emerald-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {pos.side}
                      </span>
                    </div>
                    <div className="text-gray-400 mt-1 space-y-0.5">
                      <p>€{fmt(pos.amount_eur)} · ulaz: {fmt(pos.entry_price, 4)}</p>
                      <p>{fmtDate(pos.opened_at)}</p>
                      {pos.thesis && (
                        <p className="text-gray-500 italic line-clamp-2">{pos.thesis}</p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
          <Link
            href="/trades"
            className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Sve pozicije →
          </Link>
        </div>

        {/* Schedule */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="font-semibold text-lg mb-4">Agent schedule</h2>
          {!nextWake ? (
            <p className="text-gray-500 text-sm">Nema zakazanog buđenja.</p>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-1">Sljedeće buđenje</p>
              <p className="text-xl font-bold text-emerald-400">
                {fmtDate(nextWake.wake_at)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{nextWake.reason}</p>
            </div>
          )}
          <Link
            href="/schedule"
            className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Cijeli schedule →
          </Link>
        </div>
      </div>
    </div>
  );
}
