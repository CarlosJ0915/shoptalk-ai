"use client";

import { useDashboardFeed } from "@/lib/hooks";
import type { Appointment } from "@/lib/types";

// Booked-appointments list. Server-rendered for the first paint via
// initialAppointments, then kept live by the dashboard poll.
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
        <p role="alert" className="card p-3 text-sm text-red-400 border-red-900">
          {error}
        </p>
      )}

      <h2 className="font-semibold">
        Booked appointments <span className="demo-tag ml-1">demo data</span>
      </h2>
      {days.length === 0 && (
        <p className="text-sm text-[#8a8f98]">No appointments booked yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {days.map(([date, list]) => (
          <section key={date} className="card p-4">
            <h3 className="font-mono text-sm text-[#c6ff00] mb-3">{date}</h3>
            <ul className="space-y-3">
              {list.map((a) => (
                <li key={a.id} className="border-l-2 border-[#c6ff00]/40 pl-3">
                  <p className="font-mono text-sm">{a.time}</p>
                  <p className="text-sm font-semibold">{a.customerName}</p>
                  <p className="text-xs text-[#b8bcc4]">{a.vehicle}</p>
                  <p className="text-xs text-[#8a8f98]">{a.issue}</p>
                  <p className="text-[10px] text-[#8a8f98] mt-1">
                    {a.id} · {a.language === "es" ? "ES" : "EN"} · from voice call
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
