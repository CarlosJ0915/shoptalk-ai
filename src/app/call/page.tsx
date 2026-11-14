"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useVoiceCall } from "@/lib/hooks";

const FIELDS: Array<{ key: string; label: string }> = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "vehicle", label: "Vehicle" },
  { key: "issue", label: "Issue" },
  { key: "preferred_time", label: "Preferred time" },
];

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-end justify-center gap-1 h-16" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full bg-[#c6ff00] ${active ? "waveform-bar" : "opacity-30"}`}
          style={{
            height: `${20 + ((i * 37) % 60)}%`,
            animationDelay: `${(i % 12) * 0.08}s`,
            animationDuration: active ? undefined : "0s",
          }}
        />
      ))}
    </div>
  );
}

export default function CallPage() {
  const { status, error, turns, conversationId, collected, start, end, sendText } = useVoiceCall();
  const [textInput, setTextInput] = useState("");
  const [showFallback, setShowFallback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns]);

  const active = status === "listening" || status === "speaking";

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Voice Call</h1>
        {conversationId && (
          <Link href={`/conversations/${conversationId}`} className="text-sm text-[#c6ff00] hover:underline">
            open transcript &amp; audit →
          </Link>
        )}
      </div>

      <section className="card p-6 text-center space-y-4">
        <Waveform active={active} />
        <p aria-live="polite" className="text-sm">
          {status === "idle" && "Press start and allow microphone access. Hable en inglés o español."}
          {status === "connecting" && <span className="text-[#8a8f98]">Connecting to the agent…</span>}
          {status === "listening" && <span className="text-[#c6ff00]">● Listening — speak now</span>}
          {status === "speaking" && <span className="text-[#c6ff00]">● ShopTalk is speaking…</span>}
          {status === "error" && <span className="text-red-400">Something went wrong.</span>}
          {status === "ended" && <span className="text-[#8a8f98]">Call ended.</span>}
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}{" "}
            <button className="underline" onClick={() => setShowFallback(true)}>
              Use the text fallback instead
            </button>
          </p>
        )}
        <div className="flex justify-center gap-3">
          {status === "idle" || status === "ended" || status === "error" ? (
            <button
              onClick={() => void start()}
              className="rounded-lg bg-[#c6ff00] text-black font-semibold px-6 py-2.5 hover:brightness-110"
            >
              {status === "idle" ? "Start voice call" : "Call again"}
            </button>
          ) : (
            <button
              onClick={() => void end()}
              className="rounded-lg border border-red-800 text-red-300 font-semibold px-6 py-2.5 hover:bg-red-950"
            >
              End call
            </button>
          )}
        </div>
        {(status === "idle" || status === "ended") && !showFallback && (
          <button className="text-xs text-[#8a8f98] underline" onClick={() => setShowFallback(true)}>
            Microphone not working? Use text fallback
          </button>
        )}
      </section>

      {showFallback && active && (
        <form
          className="card p-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!textInput.trim()) return;
            void sendText(textInput.trim());
            setTextInput("");
          }}
        >
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type what you would say… (escriba aquí)"
            aria-label="Text fallback input"
            className="flex-1 rounded-md bg-[#0a0a0a] border border-[#26282c] px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-[#c6ff00] text-black text-sm font-semibold px-4">
            Send
          </button>
        </form>
      )}

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Collected details</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {FIELDS.map((f) => (
            <li
              key={f.key}
              className={`rounded-md border px-2 py-1.5 text-xs ${
                collected[f.key]
                  ? "border-[#c6ff00]/50 text-white"
                  : "border-[#26282c] text-[#8a8f98]"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wide">{f.label}</span>
              {collected[f.key] ?? "—"}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-2">Live transcript (bilingual)</h2>
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          className="max-h-72 overflow-y-auto space-y-2 pr-1"
        >
          {turns.length === 0 && (
            <p className="text-sm text-[#8a8f98]">
              The bilingual transcript appears here during the call.
            </p>
          )}
          {turns.map((t, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                t.speaker === "agent"
                  ? "bg-[#1b1d20] text-[#f5f6f7] mr-auto"
                  : "bg-[#c6ff00]/10 text-[#e6ffb0] ml-auto text-right"
              }`}
            >
              <span className="block text-[10px] uppercase text-[#8a8f98]">
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
