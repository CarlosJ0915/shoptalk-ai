"use client";

import Link from "next/link";
import { useDashboardFeed } from "@/lib/hooks";

function LangTag({ lang }: { lang: string }) {
  return (
    <span className={`tag ${lang === "es" ? "tag-orange" : "tag-green"}`}>
      {lang === "es" ? "Español" : "English"}
    </span>
  );
}

export default function DashboardPage() {
  const { feed, error } = useDashboardFeed();

  const attention = feed?.conversations.filter((c) => c.humanFollowUpRequired) ?? [];
  const rest = feed?.conversations.filter((c) => !c.humanFollowUpRequired) ?? [];

  return (
    <div className="py-6 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#17202b] pb-3">
        <div>
          <p className="font-mono text-xs text-[#4a5160]">Miami Precision Auto · live service desk</p>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <Link
          href="/call"
          className="rounded bg-[#e8490f] text-white font-semibold px-4 py-2 hover:bg-[#cf3e0c]"
        >
          Start voice call →
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded bg-[#fdeceb] text-[#b3261e] px-4 py-2.5 text-sm font-medium">
          {error}
        </p>
      )}

      {/* 1 — Who needs attention? */}
      <section>
        <h2 className="font-bold mb-1">Needs a human</h2>
        <p className="text-sm text-[#4a5160] mb-3">
          {attention.length === 0
            ? "No conversations waiting on staff."
            : `${attention.length} conversation${attention.length > 1 ? "s" : ""} flagged for follow-up.`}
        </p>
        <div className="ticket">
          {attention.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#4a5160]">All clear — the agent handled everything.</p>
          ) : (
            attention.map((c) => (
              <div key={c.id} className="clip-row px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="tag tag-red">Follow up</span>
                <LangTag lang={c.language} />
                <span className="text-sm font-medium">
                  {c.customerName ?? "(details not collected)"}
                  {c.vehicle ? ` · ${c.vehicle}` : ""}
                </span>
                <span className="text-xs text-[#4a5160]">{c.followUpReason}</span>
                <Link href={`/conversations/${c.id}`} className="ml-auto text-sm text-[#e8490f] font-semibold hover:underline">
                  View →
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 2 — What did the agent do? */}
      <section>
        <h2 className="font-bold mb-1">Recent conversations</h2>
        <p className="text-sm text-[#4a5160] mb-3">Every call the agent handled, newest first.</p>
        <div className="ticket">
          {rest.length === 0 && attention.length === 0 && (
            <p className="px-4 py-3 text-sm text-[#4a5160]">No calls yet — start one from the Voice call screen.</p>
          )}
          {[...rest, ...(attention.length ? [] : [])].map((c) => (
            <div key={c.id} className="clip-row px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <LangTag lang={c.language} />
              <span className="text-sm font-medium">
                {c.customerName ?? "(collecting details…)"}
                {c.vehicle ? ` · ${c.vehicle}` : " · vehicle TBD"}
              </span>
              <span className="font-mono text-xs text-[#4a5160]">
                {c.turnCount} turns · {c.toolCallCount} tool calls
              </span>
              {c.appointmentId && <span className="tag tag-green">Booked {c.appointmentId}</span>}
              <Link href={`/conversations/${c.id}`} className="ml-auto text-sm text-[#e8490f] font-semibold hover:underline">
                Transcript &amp; audit →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — Which appointments were created? */}
      <section>
        <h2 className="font-bold mb-1">
          Upcoming appointments <span className="demo-tag ml-1">demo data</span>
        </h2>
        <p className="text-sm text-[#4a5160] mb-3">Booked through voice calls, in schedule order.</p>
        <div className="ticket">
          {feed?.appointments.map((a) => (
            <div key={a.id} className="clip-row px-4 py-3 grid gap-1 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
              <span className="font-mono text-sm font-semibold text-[#17202b]">
                {a.date} · {a.time}
              </span>
              <span className="text-sm">
                <strong>{a.customerName}</strong> · {a.vehicle}
                <span className="block text-xs text-[#4a5160]">{a.issue}</span>
              </span>
              <span className="font-mono text-xs text-[#4a5160] sm:text-right">
                {a.id} · {a.language === "es" ? "ES" : "EN"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
