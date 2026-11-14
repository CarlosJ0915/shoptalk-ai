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
    <div className="py-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings &amp; Demo Data</h1>
        <p className="text-sm text-[#8a8f98]">
          Everything below is fictional demonstration data used by the live demo.
        </p>
      </div>

      <section className="card p-4 space-y-1">
        <h2 className="font-semibold">Demo shop</h2>
        <p className="text-sm">Miami Precision Auto — 1420 NW 7th St, Miami, FL</p>
        <p className="text-sm text-[#8a8f98]">Mon–Fri 8:00–17:00, Sat 9:00–13:00, closed Sunday</p>
        <p className="text-xs text-[#8a8f98]">
          Booking slots: weekdays 08:30 / 10:00 / 13:30 / 15:00 / 16:30, Saturdays 09:00 / 11:00.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-3">
          Fictional estimate ranges <span className="demo-tag ml-1">demo data</span>
        </h2>
        <ul className="divide-y divide-[#26282c] text-sm">
          {ESTIMATE_TABLE.map((e) => (
            <li key={e.cat} className="py-2 flex justify-between gap-4">
              <span>{e.name}</span>
              <span className="font-mono text-[#c6ff00]">
                ${e.low}–${e.high}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#8a8f98] mt-3">
          Indicative ranges only — the shop confirms any price after in-person inspection. The
          agent may never invent a figure outside this table.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Next open slots the agent can offer</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {feed?.nextOpenSlots.map((s) => (
            <li key={`${s.date}T${s.time}`} className="rounded-md border border-[#26282c] px-2 py-1 font-mono text-xs">
              {s.date} {s.time}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
