"use client";

import { useConversationDetail } from "@/lib/hooks";
import type { ConversationRecord } from "@/lib/types";

export default function ConversationDetail({
  id,
  initial = null,
}: {
  id: string;
  initial?: ConversationRecord | null;
}) {
  const { conversation, notFound } = useConversationDetail(id, initial);

  if (notFound) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Conversation not found</h1>
        <p className="text-sm text-[#4a5160]">
          This conversation has no records yet — tool calls and transcripts appear once the call
          starts.
        </p>
      </div>
    );
  }
  if (!conversation) {
    return <div className="py-6 text-sm text-[#4a5160]">Loading conversation…</div>;
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#17202b] pb-3">
        <div>
          <p className="font-mono text-xs text-[#4a5160]">Work order</p>
          <h1 className="text-2xl font-bold">Conversation record</h1>
          <p className="font-mono text-xs text-[#4a5160] mt-1">{conversation.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={conversation.language === "es" ? "tag tag-orange" : "tag tag-green"}>
            {conversation.languagesDetected.length > 1
              ? conversation.languagesDetected.map((l) => (l === "es" ? "Español" : "English")).join(" + ")
              : conversation.language === "es" ? "Español" : "English"}
          </span>
          <span className="tag tag-neutral">{conversation.status}</span>
          {conversation.humanFollowUpRequired && (
            <span className="tag tag-red">
              Human follow-up{conversation.followUpReason ? ` — ${conversation.followUpReason}` : ""}
            </span>
          )}
          {conversation.appointmentId && (
            <span className="tag tag-green">Booked {conversation.appointmentId}</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ticket p-5">
          <h2 className="font-bold mb-3">Customer details</h2>
          <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
            <dt className="text-[#4a5160]">Customer</dt>
            <dd className="font-medium">{conversation.customerName ?? "—"}</dd>
            <dt className="text-[#4a5160]">Phone</dt>
            <dd className="font-mono">{conversation.phone ?? "—"}</dd>
            <dt className="text-[#4a5160]">Vehicle</dt>
            <dd>{conversation.vehicle ?? "—"}</dd>
            <dt className="text-[#4a5160]">Issue (customer words)</dt>
            <dd>{conversation.issue ?? "—"}</dd>
            <dt className="text-[#4a5160]">Preferred time</dt>
            <dd>{conversation.preferredTime ?? "—"}</dd>
            <dt className="text-[#4a5160]">Started</dt>
            <dd className="font-mono text-xs">{conversation.startedAt}</dd>
          </dl>
          <p className="demo-tag inline-block mt-4">demo data</p>
        </section>

        <section className="ticket p-5">
          <h2 className="font-bold mb-3">Agent activity</h2>
          {conversation.audit.length === 0 && (
            <p className="text-sm text-[#4a5160]">No tool actions yet.</p>
          )}
          <ol className="space-y-2">
            {conversation.audit.map((a, i) => (
              <li
                key={i}
                className={`border-l-[3px] pl-3 py-1 text-sm ${
                  a.ok ? "border-[#1f7a3d]" : "border-[#b3261e]"
                }`}
              >
                <p className="font-mono text-xs text-[#4a5160]">
                  {new Date(a.at).toLocaleTimeString()} · {a.tool} {a.ok ? "" : "· blocked"}
                </p>
                <p>{a.resultSummary}</p>
                <details className="text-xs text-[#4a5160]">
                  <summary className="cursor-pointer select-none">arguments</summary>
                  <pre className="mt-1 overflow-x-auto">{JSON.stringify(a.arguments, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="ticket p-5">
        <h2 className="font-bold mb-3">Transcript</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {conversation.transcript.length === 0 && (
            <p className="text-sm text-[#4a5160]">Transcript turns stream in during the call.</p>
          )}
          {conversation.transcript.map((t, i) => (
            <div
              key={i}
              className={`text-sm rounded px-3 py-2 max-w-[85%] ${
                t.speaker === "agent"
                  ? "bg-[#eceae3] text-[#1e2430] mr-auto"
                  : "bg-[#fdeee6] text-[#7a2c12] ml-auto text-right"
              }`}
            >
              <span className="block text-[10px] font-mono text-[#4a5160]">
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
