"use client";

import { useDashboardFeed } from "@/lib/hooks";

const ESTIMATE_TABLE = [
  { name: "Oil change service", cat: "oil_change", low: 55, high: 85 },
  { name: "Brake service", cat: "brakes", low: 150, high: 400 },
  { name: "Diagnostic appointment", cat: "diagnostics", low: 89, high: 120 },
  { name: "Tire service", cat: "tires", low: 40, high: 180 },
  { name: "Battery replacement", cat: "battery", low: 120, high: 280 },
];

export default function SettingsPage() {
  const { feed } = useDashboardFeed();

  return (
    <div className="py-6 space-y-8 max-w-3xl">
      <div className="border-b-2 border-[#17202b] pb-3">
        <p className="font-mono text-xs text-[#4a5160]">Reference</p>
        <h1 className="text-2xl font-bold">Settings &amp; demo data</h1>
        <p className="text-sm text-[#4a5160]">
          Everything below is fictional demonstration data used by the live demo.
        </p>
      </div>

      <section className="ticket p-5 space-y-1">
        <h2 className="font-bold">Demo shop</h2>
        <p className="text-sm font-medium">Miami Precision Auto — 1420 NW 7th St, Miami, FL</p>
        <p className="text-sm text-[#4a5160]">Mon–Fri 8:00–17:00, Sat 9:00–13:00, closed Sunday</p>
        <p className="font-mono text-xs text-[#4a5160]">
          Booking slots: weekdays 08:30 / 10:00 / 13:30 / 15:00 / 16:30 · Saturdays 09:00 / 11:00
        </p>
      </section>

      <section className="ticket p-5">
        <h2 className="font-bold mb-3">
          Fictional estimate ranges <span className="demo-tag ml-1">demo data</span>
        </h2>
        <div className="text-sm">
          {ESTIMATE_TABLE.map((e) => (
            <div key={e.cat} className="clip-row py-2 flex justify-between gap-4">
              <span>{e.name}</span>
              <span className="font-mono font-semibold text-[#e8490f]">
                ${e.low}–${e.high}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#4a5160] mt-4">
          Indicative ranges only — the shop confirms any price after in-person inspection. The
          agent may never invent a figure outside this table.
        </p>
      </section>

      <section className="ticket p-5">
        <h2 className="font-bold mb-2">Next open slots the agent can offer</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {feed?.nextOpenSlots.map((s) => (
            <li
              key={`${s.date}T${s.time}`}
              className="rounded border border-[#ddd9cf] bg-white px-2.5 py-1 font-mono text-xs"
            >
              {s.date} · {s.time}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
