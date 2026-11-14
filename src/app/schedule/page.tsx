"use client";

import { useDashboardFeed } from "@/lib/hooks";
import MonthCalendar from "@/components/MonthCalendar";

export default function SchedulePage() {
  const { feed, error } = useDashboardFeed();

  const byDate = new Map<string, typeof feed extends null ? never[] : NonNullable<typeof feed>["appointments"]>();
  for (const a of feed?.appointments ?? []) {
    const list = byDate.get(a.date) ?? [];
    list.push(a);
    byDate.set(a.date, list);
  }
  const days = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointment Schedule</h1>
        <p className="text-sm text-[#8a8f98]">
          Booked slots only — the agent offers open times from the same calendar.{" "}
          <span className="demo-tag">demo data</span>
        </p>
      </div>

      {error && (
        <p role="alert" className="card p-3 text-sm text-red-400 border-red-900">
          {error}
        </p>
      )}

      <MonthCalendar />

      <h2 className="font-semibold">Booked appointments</h2>
      {days.length === 0 && <p className="text-sm text-[#8a8f98]">No appointments booked yet.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {days.map(([date, appts]) => (
          <section key={date} className="card p-4">
            <h2 className="font-mono text-sm text-[#c6ff00] mb-3">{date}</h2>
            <ul className="space-y-3">
              {appts.map((a) => (
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
    </div>
  );
}
