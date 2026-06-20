"use client";

import { useLiveData, ErrorAlert, LoadingSpinner, EmptyState, fmtDate, NewsItem } from "@/components/dashboard";

const sentimentConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  bullish: { label: "Bikovsko", color: "text-[#00ff88]", bg: "bg-[#002211] border-[#00ff88]/20", icon: "📈" },
  bearish: { label: "Medvjeđe", color: "text-[#ff4444]", bg: "bg-[#220000] border-[#ff4444]/20", icon: "📉" },
  neutral: { label: "Neutralno", color: "text-gray-300", bg: "bg-[#1a1a1a] border-[#2a2a2a]", icon: "➖" },
};

const kindLabels: Record<string, string> = { analysis: "Analiza", decision: "Odluka", note: "Bilješka" };

export default function NewsPage() {
  const { data: news, error, loading } = useLiveData<(NewsItem & { sentiment: string })[]>("/api/news", 3000);
  if (loading) return <LoadingSpinner text="Dohvaćam vijesti..." />;
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Vijesti agenta</h1>
          <span className="rounded-full bg-[#002211] px-3 py-1 text-xs font-medium text-[#00ff88] border border-[#00ff88]/20">v4.0</span>
          <span className="flex items-center gap-1.5 text-xs text-[#00ff88]/70"><span className="news-dot" />Osvežava se svake 3s</span>
        </div>
        <p className="text-gray-500 text-sm">Što agent čita, analizira i odlučuje na temelju vijesti u stvarnom vremenu.</p>
      </div>
      {error && <ErrorAlert message={error} />}
      {news && news.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.entries(sentimentConfig).map(([key, cfg]) => {
            const count = news.filter((n) => n.sentiment === key).length;
            return (
              <div key={key} className={`card-glow rounded-lg p-3 border ${cfg.bg} text-center`}>
                <p className="text-xl mb-1">{cfg.icon}</p>
                <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      )}
      {!news || news.length === 0 ? (
        <EmptyState message="Još nema vijesti za prikaz." />
      ) : (
        <div className="space-y-3">
          {news.map((item) => {
            const s = sentimentConfig[item.sentiment] ?? sentimentConfig.neutral;
            const kindLabel = kindLabels[item.kind] ?? item.kind;
            return (
              <article key={item.id} className={`card-glow rounded-xl p-5 border animate-fade-in ${s.bg} transition-all duration-300 hover:border-[#3a3a3a]`}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-lg">{s.icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium border ${s.bg} ${s.color}`}>{s.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 px-2 py-0.5 rounded bg-[#141414]">{kindLabel}</span>
                  <span className="text-xs text-gray-500 ml-auto">{fmtDate(item.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{item.note}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-gray-600">ID: #{item.id}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
