"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCall } from "@/lib/hooks";

const FIELDS: Array<{ key: string; label: string }> = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "vehicle", label: "Vehicle" },
  { key: "issue", label: "Issue" },
  { key: "preferred_time", label: "Preferred time" },
];

// Inspection-gauge visualization: a row of torque-gauge ticks that heat up
// (ink → safety orange) while the agent is speaking.
function Gauge({ state }: { state: "idle" | "listening" | "speaking" }) {
  const active = state !== "idle";
  return (
    <div className="flex items-end justify-center gap-[3px] h-20" aria-hidden>
      {Array.from({ length: 36 }).map((_, i) => {
        const h = 18 + ((i * 53) % 62);
        const hot = state === "speaking" ? i % 3 === 0 : i % 7 === 0;
        return (
          <span
            key={i}
            className={`w-[3px] rounded-sm gauge-tick ${hot ? "hot" : ""} ${active ? "" : "opacity-20"}`}
            style={{
              height: `${h}%`,
              animationDelay: active ? `${(i % 12) * 0.07}s` : "0s",
              animationDuration: active ? undefined : "0s",
            }}
          />
        );
      })}
    </div>
  );
}

export default function CallPage() {
  const { status, mode, error, turns, conversationId, collected, activity, start, end, sendText } =
    useCall();
  const [textInput, setTextInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns]);

  const active = status === "listening" || status === "speaking";
  const isTextMode = mode === "text";
  const latestLang = [...turns].reverse().find((t) => t.speaker === "user")?.lang;

  const collectedCount = FIELDS.filter((f) => collected[f.key]).length;
  const hasBlocked = activity.some((a) => a.status === "blocked");
  const hasEscalation = activity.some((a) => a.tool === "request_human_callback" && a.status === "ok");
  const hasBooking = activity.some((a) => a.tool === "create_appointment" && a.status === "ok");

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-5">
      {/* Work-order header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#17202b] pb-3">
        <div>
          <p className="font-mono text-xs text-[#4a5160]">Work order intake</p>
          <h1 className="text-2xl font-bold">
            {isTextMode ? "Text intake — demo mode" : "Live service call"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {latestLang && (
            <span className={`tag ${latestLang === "es" ? "tag-orange" : "tag-green"}`}>
              {latestLang === "es" ? "Español detected" : "English detected"}
            </span>
          )}
          {conversationId && (
            <Link href={`/conversations/${conversationId}`} className="text-sm text-[#e8490f] font-semibold hover:underline">
              View ticket →
            </Link>
          )}
        </div>
      </div>

      {/* Console */}
      <section className="ticket p-6 text-center space-y-4">
        {!isTextMode && (
          <Gauge state={active ? (status === "speaking" ? "speaking" : "listening") : "idle"} />
        )}
        {isTextMode && (
          <p className="text-sm text-[#4a5160] font-medium">Text intake — the agent replies in writing, not voice</p>
        )}
        <p aria-live="polite" className="text-sm font-medium">
          {status === "idle" && "Start a call and allow microphone access. Hable en inglés o español."}
          {status === "connecting" && <span className="text-[#4a5160]">Connecting to the service desk…</span>}
          {status === "listening" && isTextMode && <span className="text-[#e8490f]">Type the customer&apos;s message below.</span>}
          {status === "listening" && !isTextMode && <span className="text-[#e8490f]">● Listening — speak now</span>}
          {status === "speaking" && <span className="text-[#17202b]">● ShopTalk is responding…</span>}
          {status === "error" && <span className="text-[#b3261e]">Something went wrong.</span>}
          {status === "ended" && <span className="text-[#4a5160]">Session ended.</span>}
        </p>
        {error && (
          <p role="alert" className="text-sm text-[#b3261e] bg-[#fdeceb] rounded px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-center gap-3 flex-wrap">
          {(status === "idle" || status === "ended" || status === "error") && (
            <>
              <button
                onClick={() => void start(false)}
                className="rounded bg-[#e8490f] text-white font-semibold px-6 py-2.5 hover:bg-[#cf3e0c]"
              >
                {status === "idle" ? "Start voice call" : "Call again"}
              </button>
              {(status === "idle" || status === "error") && (
                <button
                  onClick={() => void start(true)}
                  className="rounded border border-[#17202b] text-[#17202b] font-semibold px-6 py-2.5 hover:bg-[#eceae3]"
                >
                  Start text intake
                </button>
              )}
            </>
          )}
          {active && (
            <button
              onClick={() => void end()}
              className="rounded border border-[#b3261e] text-[#b3261e] font-semibold px-6 py-2.5 hover:bg-[#fdeceb]"
            >
              End session
            </button>
          )}
        </div>
        {status === "idle" && (
          <p className="text-xs text-[#4a5160]">
            No microphone? Use <strong>Start text intake</strong> — same agent, same tools, typed instead of spoken.
          </p>
        )}
      </section>

      {/* Service intake form — fills in as the agent collects details */}
      <section className="ticket p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-bold">Service intake</h2>
          <span className="font-mono text-xs text-[#4a5160]">{collectedCount}/{FIELDS.length} collected</span>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {FIELDS.map((f) => (
            <li
              key={f.key}
              className={`border-b-2 pb-1.5 text-sm ${
                collected[f.key] ? "border-[#e8490f]" : "border-[#ddd9cf]"
              }`}
            >
              <span className="block text-xs text-[#4a5160]">{f.label}</span>
              <span className={collected[f.key] ? "font-semibold" : "text-[#9aa0ab]"}>
                {collected[f.key] ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Unmistakable outcome banners */}
      {hasBooking && (
        <p role="status" className="rounded bg-[#e6f4ea] text-[#1f7a3d] font-semibold px-4 py-2.5 text-sm">
          ✓ Appointment booked — confirmation received from the customer.
        </p>
      )}
      {hasEscalation && (
        <p role="status" className="rounded bg-[#fdeceb] text-[#b3261e] font-semibold px-4 py-2.5 text-sm">
          ⚠ Human follow-up requested — the shop must call this customer back.
        </p>
      )}
      {hasBlocked && (
        <p role="status" className="rounded bg-[#fdeee6] text-[#e8490f] font-semibold px-4 py-2.5 text-sm">
          ⚠ A tool action was blocked — see the activity log below.
        </p>
      )}

      {/* Agent activity — readable by nontechnical judges */}
      {activity.length > 0 && (
        <section className="ticket p-5">
          <h2 className="font-bold mb-3">What the agent did</h2>
          <ol className="space-y-1.5">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-[#4a5160] w-16 shrink-0">
                  {new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    a.status === "running" ? "bg-[#4a5160] animate-pulse" : a.status === "ok" ? "bg-[#1f7a3d]" : "bg-[#b3261e]"
                  }`}
                  aria-hidden
                />
                <span className={a.status === "blocked" ? "text-[#b3261e] font-medium" : ""}>{a.summary}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Text input */}
      {active && isTextMode && (
        <form
          className="ticket p-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!textInput.trim()) return;
            sendText(textInput.trim());
            setTextInput("");
          }}
        >
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type what the customer says… (escriba aquí)"
            aria-label="Text input"
            className="flex-1 rounded bg-[#f4f2ec] border border-[#ddd9cf] px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-[#e8490f] text-white text-sm font-semibold px-4 hover:bg-[#cf3e0c]">
            Send
          </button>
        </form>
      )}

      {/* Transcript */}
      <section className="ticket p-5">
        <h2 className="font-bold mb-3">Transcript</h2>
        <div ref={scrollRef} role="log" aria-live="polite" className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {turns.length === 0 && (
            <p className="text-sm text-[#4a5160]">The bilingual transcript appears here during the session.</p>
          )}
          {turns.map((t, i) => (
            <div
              key={i}
              className={`text-sm rounded px-3 py-2 max-w-[85%] ${
                t.speaker === "agent"
                  ? "bg-[#eceae3] text-[#1e2430] mr-auto"
                  : "bg-[#fdeee6] text-[#7a2c12] ml-auto text-right"
              }`}
            >
              <span className="block text-[10px] font-mono text-[#4a5160]">
                {t.speaker === "agent" ? "ShopTalk" : "Customer"} · {t.lang.toUpperCase()}
              </span>
              {t.text}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
