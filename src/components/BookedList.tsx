"use client";

import { useDashboardFeed } from "@/lib/hooks";
import type { Appointment } from "@/lib/types";

export default function BookedList({
  initialAppointments,
}: {
  initialAppointments: Appointment[];
}) {
  const { feed, error } = useDashboardFeed();
  const appts = feed?.appointments ?? initialAppointments;

  const byDate = new Map<string, Appointment[]>();
  for (const a of appts) {
    const list = byDate.get(a.date) ?? [];
    list.push(a);
    byDate.set(a.date, list);
  }
  const days = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      {error && (
        <p role="alert" className="rounded bg-[#fdeceb] text-[#b3261e] px-4 py-2.5 text-sm font-medium">
          {error}
        </p>
      )}

      <h2 className="font-bold">
        Booked appointments <span className="demo-tag ml-1">demo data</span>
      </h2>
      {days.length === 0 && (
        <p className="text-sm text-[#4a5160]">No appointments booked yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {days.map(([date, list]) => (
          <section key={date} className="ticket p-4">
            <h3 className="font-mono text-sm font-bold text-[#17202b] mb-3 border-b border-[#ddd9cf] pb-2">
              {date}
            </h3>
            <ul className="space-y-3">
              {list.map((a) => (
                <li key={a.id} className="border-l-[3px] border-[#e8490f] pl-3">
                  <p className="font-mono text-sm font-semibold">{a.time}</p>
                  <p className="text-sm font-semibold">{a.customerName}</p>
                  <p className="text-xs text-[#4a5160]">{a.vehicle}</p>
                  <p className="text-xs text-[#4a5160]">{a.issue}</p>
                  <p className="font-mono text-[10px] text-[#9aa0ab] mt-1">
                    {a.id} · {a.language === "es" ? "ES" : "EN"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
