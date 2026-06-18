export const dynamic = "force-dynamic";

async function getJournal() {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const res = await fetch(`${base}/api/journal?limit=50`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("hr-HR", { timeZone: "Europe/Zagreb" });
}

type JournalEntry = {
  id: number;
  timestamp: string;
  kind: string;
  note: string;
};

const kindColors: Record<string, string> = {
  note: "bg-blue-900 text-blue-300",
  analysis: "bg-purple-900 text-purple-300",
  decision: "bg-yellow-900 text-yellow-300",
  error: "bg-red-900 text-red-300",
  trade: "bg-green-900 text-green-300",
};

export default async function JournalPage() {
  const entries: JournalEntry[] = await getJournal();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Agent Journal</h1>

      {entries.length === 0 && (
        <p className="text-gray-500">Nema journal entry-ja.</p>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  kindColors[entry.kind] ?? "bg-gray-800 text-gray-400"
                }`}
              >
                {entry.kind}
              </span>
              <span className="text-xs text-gray-500">{fmtDate(entry.timestamp)}</span>
            </div>
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {entry.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
