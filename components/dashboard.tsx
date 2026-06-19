"use client";

import { useEffect, useState, useCallback } from "react";

// ===== TYPES =====
export interface Trade {
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
  timestamp: string | null;
  agent_version: string | null;
}

export interface PortfolioData {
  initialCapital: number;
  availableCash: number;
  committed: number;
  totalPnl: number;
  closedCount: number;
  openPositions: Trade[];
}

export interface PerformanceData {
  version: string;
  closedCount: number;
  wins: number;
  winRate: number | null;
  totalPnl: number;
  averagePnl: number;
  largestLoss: number;
  openRisk: number;
}

export interface NewsItem {
  id: number;
  timestamp: string;
  kind: string;
  note: string;
}

// ===== FORMATTERS =====
export function fmt(val: number | null | undefined, decimals = 2): string {
  if (val == null) return "\u2014";
  return val.toFixed(decimals);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString("hr-HR", { timeZone: "Europe/Zagreb" });
}

export function fmtPnl(val: number | null | undefined): string {
  if (val == null) return "\u2014";
  const prefix = val > 0 ? "+" : "";
  return `${prefix}\u20ac${val.toFixed(2)}`;
}

export function pnlColor(val: number | null | undefined): string {
  if (val == null) return "text-gray-400";
  if (val > 0) return "text-[#00ff88]";
  if (val < 0) return "text-[#ff4444]";
  return "text-gray-400";
}

// ===== HOOK: useLiveData =====
export function useLiveData<T>(url: string, intervalMs = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(url);
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Dohvat nije uspio.");
      setData(json);
      setError(null);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs]);

  return { data, error, loading, refetch: fetchData };
}

// ===== COMPONENT: StatCard =====
export function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: string;
}) {
  return (
    <div className="card-glow bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a] animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${color ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ===== COMPONENT: PnLGauge =====
export function PnLGauge({ totalPnl, initialCapital }: { totalPnl: number; initialCapital: number }) {
  const pct = initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0;
  const clamped = Math.max(-100, Math.min(100, pct));
  const isPositive = clamped >= 0;
  const absAngle = Math.abs(clamped) * 1.8;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110" className="drop-shadow-lg">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={isPositive ? "#00ff88" : "#ff4444"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${absAngle} 180`}
          style={{ filter: `drop-shadow(0 0 8px ${isPositive ? "rgba(0,255,136,0.4)" : "rgba(255,68,68,0.4)"})`, transition: "stroke-dasharray 0.8s ease" }}
        />
        <line x1="100" y1="95" x2="100" y2="105" stroke="#444" strokeWidth="2" />
      </svg>
      <div className="absolute top-[65px] text-center">
        <p className={`text-3xl font-bold ${isPositive ? "text-[#00ff88]" : "text-[#ff4444]"}`}>{clamped >= 0 ? "+" : ""}{clamped.toFixed(1)}%</p>
      </div>
      <p className="mt-3 text-lg font-semibold">
        <span className={totalPnl >= 0 ? "text-[#00ff88]" : "text-[#ff4444]"}>{fmtPnl(totalPnl)}</span>
      </p>
    </div>
  );
}

// ===== COMPONENT: ErrorAlert =====
export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="bg-[#220000] border border-[#ff4444]/30 text-[#ff6666] rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-center gap-2"><span>{"\u26a0\ufe0f"}</span><span className="text-sm">{message}</span></div>
    </div>
  );
}

// ===== COMPONENT: EmptyState =====
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="card-glow bg-[#1a1a1a] rounded-xl p-8 text-center border border-[#2a2a2a]">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

// ===== COMPONENT: LoadingSpinner =====
export function LoadingSpinner({ text = "U\u010ditavam..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-[#00ff88] rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

// ===== COMPONENT: Sparkline =====
export function Sparkline({ data, width = 120, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const isUp = data[data.length - 1] >= data[0];
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={isUp ? "#00ff88" : "#ff4444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}