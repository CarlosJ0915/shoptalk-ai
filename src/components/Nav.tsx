"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/call", label: "Voice call" },
  { href: "/schedule", label: "Schedule" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 bg-[#17202b] text-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight mr-auto sm:mr-0">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#e8490f] shrink-0" aria-hidden />
          <span className="whitespace-nowrap">
            ShopTalk <span className="text-[#e8490f]">AI</span></span>
          <span className="hidden lg:inline text-xs font-normal text-[#8a94a3] ml-1">
            bilingual voice service advisor
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
                className={`whitespace-nowrap rounded px-3 py-1.5 text-sm ${
                  active
                    ? "bg-white text-[#17202b] font-semibold"
                    : "text-[#c3cad4] hover:text-white hover:bg-[#26303d]"
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
