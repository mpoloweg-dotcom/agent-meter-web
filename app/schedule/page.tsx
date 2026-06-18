import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
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

export default async function SchedulePage() {
  let rows: { id: number; created_at: string; wake_at: string; reason: string }[] = [];
  let error: string | null = null;
  try {
    rows = await query<{ id: number; created_at: string; wake_at: string; reason: string }>(`
      SELECT id, created_at, wake_at, reason
      FROM agent_schedule
      ORDER BY created_at DESC
      LIMIT 20
    `);
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
  }
  const next = rows[0];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Raspored provjera</h1>
      <p className="text-gray-400 mb-6">Kada agent ponovno čita vijesti i provjerava treba li nešto napraviti.</p>
      {error && <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 mb-6">⚠️ Trenutno ne mogu dohvatiti raspored.</div>}
      {next && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-5 mb-6">
          <p className="text-sm text-emerald-400 mb-1">Sljedeća provjera vijesti</p>
          <p className="text-2xl font-bold">{fmtDate(next.wake_at)}</p>
          <p className="text-emerald-400 text-sm mt-1">{timeUntil(next.wake_at)}</p>
          {next.reason && <p className="text-gray-400 text-sm mt-2">{next.reason}</p>}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-900 text-gray-400 text-left">
            <th className="px-4 py-3">ID</th><th className="px-4 py-3">Provjera je zakazana za</th><th className="px-4 py-3">Zapisano</th><th className="px-4 py-3">Zašto</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Trenutno nema zakazanih provjera.</td></tr>}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors">
                <td className="px-4 py-3 text-gray-500">{row.id}</td>
                <td className="px-4 py-3 font-medium">{fmtDate(row.wake_at)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(row.created_at)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{row.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
