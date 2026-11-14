"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Staff Dashboard" },
  { href: "/call", label: "Voice Call" },
  { href: "/schedule", label: "Schedule" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-[#26282c] bg-[#0a0a0a]/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight mr-auto sm:mr-0">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#c6ff00]" aria-hidden />
          <span>
            SHOP<span className="text-[#c6ff00]">TALK</span>
            <span className="hidden sm:inline text-xs font-normal text-[#8a8f98] ml-2">
              bilingual voice service advisor
            </span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                  active
                    ? "bg-[#c6ff00] text-black font-semibold"
                    : "text-[#b8bcc4] hover:text-white hover:bg-[#1b1d20]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
