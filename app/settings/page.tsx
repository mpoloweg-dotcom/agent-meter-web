"use client";

import { useEffect, useState } from "react";

type Strategy = "patient" | "fast";
type SettingsData = {
  strategy: Strategy;
  updatedAt: string | null;
  checkIntervalMinutes: number;
  sources: string[];
  tactics: Record<Strategy, { limit: number; windowHours: number; used: number; minimumConfidence: number; maximumRiskPercent: number }>;
};

const tacticCopy = {
  patient: {
    name: "Strpljiva taktika",
    description: "Agent čeka jače prilike, traži najmanje dva izvora i smije otvoriti najviše 3 nova poteza u 7 dana.",
    button: "Uključi strpljivu taktiku",
  },
  fast: {
    name: "Brza taktika",
    description: "Agent ranije reagira samo na snažan događaj potvrđen stvarnom cijenom. Najviše 3 nova poteza u 24 sata.",
    button: "Uključi brzu taktiku",
  },
} satisfies Record<Strategy, { name: string; description: string; button: string }>;

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Strategy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Postavke nisu dostupne.");
        return result;
      })
      .then(setData)
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("Trenutno ne mogu dohvatiti postavke.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function changeStrategy(strategy: Strategy) {
    const name = tacticCopy[strategy].name.toLowerCase();
    if (!confirm(`Želiš li uključiti ${name}? Promjena će vrijediti od sljedeće provjere vijesti.`)) {
      return;
    }
    setSaving(strategy);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Promjena nije spremljena.");
      setData(result);
      setMessage(`${tacticCopy[strategy].name} je uključena.`);
    } catch {
      setError("Promjena nije spremljena. Pokušaj ponovno.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Postavke agenta</h1>
        <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-300">4.0</span>
      </div>
      <p className="mb-6 text-gray-400">
        Ovdje biraš koliko će agent biti strpljiv ili brz. Vijesti u oba slučaja provjerava svakih 5 minuta.
      </p>

      {loading && <p className="text-gray-500">Učitavam postavke…</p>}
      {error && <div className="mb-5 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300">⚠️ {error}</div>}
      {message && <div className="mb-5 rounded-lg border border-emerald-800 bg-emerald-950 p-4 text-emerald-300">✓ {message}</div>}

      {data && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {(Object.keys(tacticCopy) as Strategy[]).map((strategy) => {
              const active = data.strategy === strategy;
              const usage = data.tactics[strategy];
              const remaining = Math.max(0, usage.limit - usage.used);
              return (
                <section
                  key={strategy}
                  className={`rounded-xl border p-5 ${active ? "border-emerald-600 bg-emerald-950/40" : "border-gray-800 bg-gray-900"}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">{tacticCopy[strategy].name}</h2>
                    {active && <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-medium text-emerald-200">Trenutno uključena</span>}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-300">{tacticCopy[strategy].description}</p>
                  <p className="mb-4 text-sm text-gray-400">
                    Preostalo sada: <span className="font-semibold text-white">{remaining} od {usage.limit}</span>
                  </p>
                  <div className="mb-4 space-y-1 rounded-lg bg-gray-950/70 p-3 text-xs text-gray-400">
                    <p>Najmanja sigurnost: <span className="font-semibold text-white">{usage.minimumConfidence}/100</span></p>
                    <p>Najveći mogući gubitak po potezu: <span className="font-semibold text-white">{usage.maximumRiskPercent}% novca</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => changeStrategy(strategy)}
                    disabled={active || saving !== null}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving === strategy ? "Spremam…" : active ? "Uključena" : tacticCopy[strategy].button}
                  </button>
                </section>
              );
            })}
          </div>

          <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-3 text-lg font-semibold">Odakle agent čita informacije</h2>
            <div className="flex flex-wrap gap-2">
              {data.sources.map((source) => (
                <span key={source} className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-200">{source}</span>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Provjera se radi svakih {data.checkIntervalMinutes} minuta. Zatvaranje postojećeg poteza nije ograničeno ako agent treba zaštititi novac.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Novi potez nije dopušten bez najmanje dva izvora, potvrde stvarnog kretanja cijene i unaprijed određene granice gubitka.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
