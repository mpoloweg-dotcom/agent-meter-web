"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Pregled", icon: "\ud83d\udcca" },
  { href: "/trades", label: "Trejdovi", icon: "\ud83d\udcc8" },
  { href: "/news", label: "Vijesti", icon: "\ud83d\udcf0" },
  { href: "/analytics", label: "Analitika", icon: "\ud83d\udcc9" },
  { href: "/settings", label: "Postavke", icon: "\u2699\ufe0f" },
];

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#2a2a2a]">
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="text-xl">{"\ud83e\udd16"}</span>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm text-white tracking-tight">agentRaider</span>
              <span className="text-[10px] text-[#00ff88]/60 tracking-wider uppercase">Terminal 4.0</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active ? "bg-[#1a1a1a] text-[#00ff88] border border-[#2a2a2a]" : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]/50"
                  }`}>
                  <span className="text-xs">{link.icon}</span>{link.label}
                </Link>
              );
            })}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400 hover:text-white" aria-label="Izbornik">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M6 6l8 8M14 6l-8 8" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
            </svg>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-[#1a1a1a] pt-2 animate-fade-in">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? "bg-[#1a1a1a] text-[#00ff88]" : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]/50"
                  }`}>
                  <span>{link.icon}</span>{link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
