"use client";

import { useEffect, useState } from "react";

interface DayGrid {
  date: string;
  weekday: number; // 0=Sun
  closed: boolean;
  slots: Array<{ time: string; taken: boolean; appointmentId?: string }>;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthCalendar({
  initialDays,
  initialMonth,
}: {
  initialDays: DayGrid[];
  initialMonth: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [days, setDays] = useState<DayGrid[]>(initialDays);
  const [error, setError] = useState<string | null>(null);

  // Server-rendered data is shown instantly; this refreshes when the user
  // navigates to another month (and once on mount to pick up new bookings).
  useEffect(() => {
    let alive = true;
    fetch(`/api/availability?month=${month}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { days: DayGrid[] }) => {
        if (alive) {
          setDays(d.days);
          setError(null);
        }
      })
      .catch(() => alive && setError("Could not load this month."));
    return () => {
      alive = false;
    };
  }, [month]);

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    setMonth(new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7));
  };

  const monthLabel = new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const openCount = days.reduce((n, d) => n + d.slots.filter((s) => !s.taken).length, 0);
  const leadBlanks = days.length > 0 ? days[0].weekday : 0;

  return (
    <section className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold mr-auto">
          Month view — {monthLabel} <span className="demo-tag ml-1">demo data</span>
        </h2>
        <button
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="rounded-md border border-[#26282c] px-3 py-1 text-sm hover:bg-[#1b1d20]"
        >
          ← Prev
        </button>
        <button
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="rounded-md border border-[#26282c] px-3 py-1 text-sm hover:bg-[#1b1d20]"
        >
          Next →
        </button>
      </div>

      <p className="text-xs text-[#8a8f98]">
        {error ??
          `${openCount} open slots · green dot = booked, dimmed = open, Sundays closed`}
      </p>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center font-semibold text-[#8a8f98] py-1">
            {w}
          </div>
        ))}
        {Array.from({ length: leadBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const open = d.slots.filter((s) => !s.taken).length;
          return (
            <div
              key={d.date}
              title={
                d.closed
                  ? `${d.date} — closed`
                  : `${d.date} — ${open} open of ${d.slots.length}`
              }
              className={`rounded-md border p-1 ${
                d.closed
                  ? "border-[#26282c] bg-[#0c0d0e] text-[#4a4e55]"
                  : open === 0
                    ? "border-[#26282c] bg-[#1b1d20]"
                    : "border-[#26282c] bg-[#111214]"
              }`}
            >
              <p className="font-mono">{Number(d.date.slice(8))}</p>
              {d.closed ? (
                <p className="text-[9px] mt-1">closed</p>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {d.slots.map((s) => (
                    <p
                      key={s.time}
                      className={`leading-tight ${
                        s.taken ? "text-[#c6ff00] font-semibold" : "text-[#5b6068]"
                      }`}
                    >
                      {s.time}
                      {s.taken && s.appointmentId ? " ●" : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
