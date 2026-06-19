import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "agentRaider — pregled rada",
  description: "Jednostavan pregled rada agenta agentRaider",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="font-bold text-lg text-emerald-400 w-full sm:w-auto">🤖 agentRaider</span>
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">
            Pregled
          </Link>
          <Link href="/trades" className="text-gray-300 hover:text-white transition-colors">
            Kupnje i prodaje
          </Link>
          <Link href="/journal" className="text-gray-300 hover:text-white transition-colors">
            Bilješke
          </Link>
          <Link href="/schedule" className="text-gray-300 hover:text-white transition-colors">
            Raspored
          </Link>
          <Link href="/settings" className="text-gray-300 hover:text-white transition-colors">
            Postavke
          </Link>
        </nav>
        <main className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
