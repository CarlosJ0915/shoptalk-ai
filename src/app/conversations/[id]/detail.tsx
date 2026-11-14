"use client";

import { useConversationDetail } from "@/lib/hooks";

export default function ConversationDetail({ id }: { id: string }) {
  const { conversation, notFound } = useConversationDetail(id);

  if (notFound) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Conversation not found</h1>
        <p className="text-sm text-[#8a8f98]">
          This conversation has no records yet — tool calls and transcripts appear once the call
          starts.
        </p>
      </div>
    );
  }
  if (!conversation) {
    return <div className="py-6 text-sm text-[#8a8f98]">Loading conversation…</div>;
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Conversation</h1>
          <p className="text-sm font-mono text-[#8a8f98]">{conversation.id}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge-volt px-2 py-1 rounded-full">
            detected: {conversation.languagesDetected.join(" + ") || conversation.language}
          </span>
          <span className="px-2 py-1 rounded-full border border-[#4a4e55] text-[#b8bcc4]">
            {conversation.status}
          </span>
          {conversation.humanFollowUpRequired && (
            <span className="px-2 py-1 rounded-full bg-red-950 text-red-300 border border-red-900">
              human follow-up required{conversation.followUpReason ? `: ${conversation.followUpReason}` : ""}
            </span>
          )}
          {conversation.appointmentId && (
            <span className="px-2 py-1 rounded-full border border-[#c6ff00]/50 text-[#c6ff00] font-mono">
              {conversation.appointmentId} booked
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-semibold mb-3">Structured details</h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-[#8a8f98]">Customer</dt>
            <dd>{conversation.customerName ?? "—"}</dd>
            <dt className="text-[#8a8f98]">Phone</dt>
            <dd className="font-mono">{conversation.phone ?? "—"}</dd>
            <dt className="text-[#8a8f98]">Vehicle</dt>
            <dd>{conversation.vehicle ?? "—"}</dd>
            <dt className="text-[#8a8f98]">Issue (customer words)</dt>
            <dd>{conversation.issue ?? "—"}</dd>
            <dt className="text-[#8a8f98]">Preferred time</dt>
            <dd>{conversation.preferredTime ?? "—"}</dd>
            <dt className="text-[#8a8f98]">Started</dt>
            <dd className="font-mono text-xs">{conversation.startedAt}</dd>
          </dl>
          <p className="demo-tag inline-block mt-3">demo data</p>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold mb-3">Agent audit trail</h2>
          {conversation.audit.length === 0 && (
            <p className="text-sm text-[#8a8f98]">No tool actions yet.</p>
          )}
          <ol className="space-y-2">
            {conversation.audit.map((a, i) => (
              <li
                key={i}
                className="border-l-2 pl-3 py-1 text-sm"
                style={{ borderColor: a.ok ? "#c6ff00" : "#ef4444" }}
              >
                <p className="font-mono text-xs text-[#8a8f98]">
                  {new Date(a.at).toLocaleTimeString()} · {a.tool} {a.ok ? "" : "· FAILED/BLOCKED"}
                </p>
                <p>{a.resultSummary}</p>
                <details className="text-xs text-[#8a8f98]">
                  <summary className="cursor-pointer select-none">arguments</summary>
                  <pre className="mt-1 overflow-x-auto">{JSON.stringify(a.arguments, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="font-semibold mb-3">Transcript</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {conversation.transcript.length === 0 && (
            <p className="text-sm text-[#8a8f98]">Transcript turns stream in during the call.</p>
          )}
          {conversation.transcript.map((t, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                t.speaker === "agent"
                  ? "bg-[#1b1d20] mr-auto"
                  : "bg-[#c6ff00]/10 text-[#e6ffb0] ml-auto text-right"
              }`}
            >
              <span className="block text-[10px] uppercase text-[#8a8f98]">
                {t.speaker === "agent" ? "ShopTalk" : "Customer"}
              </span>
              {t.text}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
