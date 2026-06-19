import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Evidence = { source: string; title: string; url?: string };
type Decision = {
  id: number;
  timestamp: string;
  outcome: string;
  instrument: string | null;
  action: string | null;
  summary: string;
  evidence: Evidence[] | null;
  invalidation: string | null;
  confidence_score: number | null;
  current_price: string | null;
  price_change_pct: string | null;
  strategy: string | null;
};

function fmtDate(value: string) {
  return new Date(value).toLocaleString("hr-HR", { timeZone: "Europe/Zagreb" });
}

const outcomeLabel: Record<string, string> = {
  WAIT: "Čeka",
  OPEN: "Novi potez",
  CLOSE: "Završen potez",
};

export default async function DecisionsPage() {
  let decisions: Decision[] = [];
  let error = false;
  try {
    decisions = await query<Decision>(`
      SELECT id, timestamp, outcome, instrument, action, summary, evidence,
             invalidation, confidence_score, current_price, price_change_pct, strategy
      FROM agent_decisions
      WHERE agent_version = '3.0'
      ORDER BY timestamp DESC, id DESC
      LIMIT 50
    `);
  } catch {
    error = true;
  }

  return (
    <div>
      <div className="mb-6">
        <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-300">Verzija 3.0</span>
        <h1 className="mt-3 text-2xl font-bold">Odluke i dokazi</h1>
        <p className="mt-2 text-gray-400">Ovdje vidiš zašto je agent nešto napravio ili zašto je odlučio čekati.</p>
      </div>

      {error && <div className="rounded-xl border border-yellow-900 bg-yellow-950/40 p-4 text-yellow-200">Nova evidencija se upravo priprema. Pokušaj ponovno malo kasnije.</div>}
      {!error && decisions.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-400">
          Verzija 3.0 je tek krenula. Prva odluka pojavit će se nakon sljedeće provjere vijesti.
        </div>
      )}

      <div className="space-y-4">
        {decisions.map((decision) => {
          const movement = decision.price_change_pct == null ? null : Number(decision.price_change_pct);
          const evidence = Array.isArray(decision.evidence) ? decision.evidence : [];
          return (
            <article key={decision.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${decision.outcome === "WAIT" ? "bg-blue-950 text-blue-300" : decision.outcome === "OPEN" ? "bg-emerald-950 text-emerald-300" : "bg-purple-950 text-purple-300"}`}>
                  {outcomeLabel[decision.outcome] ?? decision.outcome}
                </span>
                {decision.instrument && <span className="text-sm font-medium">{decision.instrument}</span>}
                <span className="text-xs text-gray-500">{fmtDate(decision.timestamp)}</span>
              </div>

              <p className="leading-relaxed text-gray-100">{decision.summary}</p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-gray-950 p-3">
                  <p className="text-gray-500">Sigurnost</p>
                  <p className="mt-1 font-semibold">{decision.confidence_score == null ? "Nije ocijenjeno" : `${decision.confidence_score}/100`}</p>
                </div>
                <div className="rounded-lg bg-gray-950 p-3">
                  <p className="text-gray-500">Stvarna cijena</p>
                  <p className="mt-1 font-semibold">{decision.current_price == null ? "Nije provjerena" : Number(decision.current_price).toFixed(4)}</p>
                </div>
                <div className="rounded-lg bg-gray-950 p-3">
                  <p className="text-gray-500">Kretanje cijene</p>
                  <p className={`mt-1 font-semibold ${movement == null ? "" : movement >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {movement == null ? "Nije dostupno" : `${movement >= 0 ? "+" : ""}${movement.toFixed(2)}%`}
                  </p>
                </div>
              </div>

              {evidence.length > 0 && (
                <div className="mt-4">
                  <h2 className="mb-2 text-sm font-semibold text-gray-300">Dokazi koje je koristio</h2>
                  <ul className="space-y-2">
                    {evidence.map((item, index) => (
                      <li key={`${item.source}-${index}`} className="rounded-lg border border-gray-800 p-3 text-sm">
                        <span className="font-semibold text-emerald-400">{item.source}:</span>{" "}
                        {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="text-gray-200 underline decoration-gray-600 underline-offset-2">{item.title}</a> : <span>{item.title}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {decision.invalidation && (
                <div className="mt-4 rounded-lg border border-orange-900/60 bg-orange-950/20 p-3 text-sm">
                  <span className="font-semibold text-orange-300">Što bi promijenilo odluku: </span>
                  <span className="text-gray-300">{decision.invalidation}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
