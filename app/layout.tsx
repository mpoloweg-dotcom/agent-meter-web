import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agent Meter Dashboard",
  description: "Geopolitics trading agent monitor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-6">
          <span className="font-bold text-lg text-emerald-400">🤖 Agent Meter</span>
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/trades" className="text-gray-300 hover:text-white transition-colors">
            Trades
          </Link>
          <Link href="/journal" className="text-gray-300 hover:text-white transition-colors">
            Journal
          </Link>
          <Link href="/schedule" className="text-gray-300 hover:text-white transition-colors">
            Schedule
          </Link>
        </nav>
        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
