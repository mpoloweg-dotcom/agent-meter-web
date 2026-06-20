import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "agentRaider 4.0 — pregled rada",
  description: "Kontrolni centar agenta agentRaider 4.0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <NavBar />
        <main className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
