"use client";

import Link from "next/link";
import { useDashboardFeed } from "@/lib/hooks";

function LangTag({ lang }: { lang: string }) {
  return (
    <span
      className={
        lang === "es"
          ? "badge-volt text-xs px-2 py-0.5 rounded-full"
          : "text-xs px-2 py-0.5 rounded-full border border-[#4a4e55] text-[#b8bcc4]"
      }
    >
      {lang === "es" ? "ES" : "EN"}
    </span>
  );
}

export default function DashboardPage() {
  const { feed, error } = useDashboardFeed();

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <p className="text-sm text-[#8a8f98]">
            Miami Precision Auto · live view <span className="demo-tag ml-1">demo data</span>
          </p>
        </div>
        <Link
          href="/call"
          className="rounded-lg bg-[#c6ff00] text-black font-semibold px-4 py-2 hover:brightness-110"
        >
          Start voice call →
        </Link>
      </div>

      {error && (
        <p role="alert" className="card p-3 text-sm text-red-400 border-red-900">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-[#8a8f98]">Appointments</p>
          <p className="text-3xl font-bold">{feed?.appointments.length ?? "–"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-[#8a8f98]">Conversations</p>
          <p className="text-3xl font-bold">{feed?.conversations.length ?? "–"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-[#8a8f98]">Needs human follow-up</p>
          <p className="text-3xl font-bold text-[#c6ff00]">
            {feed?.conversations.filter((c) => c.humanFollowUpRequired).length ?? "–"}
          </p>
        </div>
      </div>

      <section className="card p-4">
        <h2 className="font-semibold mb-3">Recent conversations</h2>
        {feed && feed.conversations.length === 0 && (
          <p className="text-sm text-[#8a8f98]">No calls yet — start one from the Voice Call screen.</p>
        )}
        <ul className="divide-y divide-[#26282c]">
          {feed?.conversations.map((c) => (
            <li key={c.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <LangTag lang={c.language} />
              <span className="text-sm text-[#b8bcc4]">
                {c.customerName ?? "(collecting details…)"} · {c.vehicle ?? "vehicle TBD"}
              </span>
              <span className="text-xs text-[#8a8f98]">
                {c.turnCount} turns · {c.toolCallCount} tool calls
              </span>
              {c.humanFollowUpRequired && (
                <span className="text-xs rounded-full bg-red-950 text-red-300 border border-red-900 px-2 py-0.5">
                  follow-up: {c.followUpReason ?? "requested"}
                </span>
              )}
              <Link
                href={`/conversations/${c.id}`}
                className="ml-auto text-sm text-[#c6ff00] hover:underline"
              >
                transcript &amp; audit →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-3">
          Upcoming appointments <span className="demo-tag ml-1">demo data</span>
        </h2>
        <ul className="divide-y divide-[#26282c]">
          {feed?.appointments.map((a) => (
            <li
              key={a.id}
              className="py-3 grid gap-1 sm:grid-cols-[10rem_1fr_auto] sm:items-center"
            >
              <span className="font-mono text-sm text-[#c6ff00]">
                {a.date} {a.time}
              </span>
              <span className="text-sm">
                <strong>{a.customerName}</strong> · {a.vehicle}
                <span className="block text-xs text-[#8a8f98]">{a.issue}</span>
              </span>
              <span className="text-xs text-[#8a8f98] sm:text-right">
                {a.id} · {a.language === "es" ? "ES" : "EN"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
