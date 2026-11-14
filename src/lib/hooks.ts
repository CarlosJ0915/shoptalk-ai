"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Appointment, ConversationRecord, Language, TranscriptTurn } from "@/lib/types";

export interface DashboardFeed {
  demo_data: boolean;
  appointments: Appointment[];
  conversations: Array<
    Pick<
      ConversationRecord,
      | "id"
      | "startedAt"
      | "endedAt"
      | "language"
      | "languagesDetected"
      | "status"
      | "customerName"
      | "vehicle"
      | "appointmentId"
      | "humanFollowUpRequired"
      | "followUpReason"
    > & { turnCount: number; toolCallCount: number }
  >;
  nextOpenSlots: Array<{ date: string; time: string; labelEn: string; labelEs: string }>;
}

export function useDashboardFeed(intervalMs = 2000) {
  const [feed, setFeed] = useState<DashboardFeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFeed((await res.json()) as DashboardFeed);
      setError(null);
    } catch {
      setError("Could not reach the dashboard feed — is the server running?");
    }
  }, []);

  useEffect(() => {
    // Initial fetch deferred to a timer so setState never runs synchronously in the effect.
    const initial = setTimeout(refresh, 0);
    const t = setInterval(refresh, intervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, [refresh, intervalMs]);

  return { feed, error, refresh };
}

export function useConversationDetail(id: string, intervalMs = 2000) {
  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
        if (res.status === 404) {
          if (alive) setNotFound(true);
          return;
        }
        const data = (await res.json()) as { conversation: ConversationRecord };
        if (alive) setConversation(data.conversation);
      } catch {
        /* transient network error; next poll retries */
      }
    };
    void load();
    const t = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id, intervalMs]);

  return { conversation, notFound };
}

// Rough client-side language tag for the live transcript. The agent itself
// decides its own language server-side; this only colors the caption.
export function guessLanguage(text: string): Language {
  return /[¿áéíóúñ¡]|\b(hola|gracias|cita|carro|necesito|bueno)\b/i.test(text)
    ? "es"
    : "en";
}

export interface LiveTurn extends TranscriptTurn {
  lang: Language;
}

export interface ToolActivityEntry {
  at: string;
  tool: string;
  status: "running" | "ok" | "blocked";
  summary: string;
}

export function useCall() {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "listening" | "speaking" | "error" | "ended"
  >("idle");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [collected, setCollected] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<ToolActivityEntry[]>([]);
  // Session holds endSession and optionally sendUserMessage (text mode).
  const sessionRef = useRef<{
    endSession: () => Promise<void>;
    sendUserMessage?: (text: string) => void;
  } | null>(null);
  const transcriptRef = useRef<TranscriptTurn[]>([]);
  const conversationIdRef = useRef<string | null>(null);

  const addActivity = useCallback((entry: ToolActivityEntry) => {
    setActivity((prev) => [...prev, entry]);
  }, []);

  const pushTurn = useCallback(
    (turn: TranscriptTurn, convId: string | null) => {
      transcriptRef.current = [...transcriptRef.current.slice(-199), turn];
      setTurns(
        transcriptRef.current.map((t) => ({ ...t, lang: t.text ? guessLanguage(t.text) : "en" })),
      );
      void fetch("/api/transcript", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversation_id: convId, turns: transcriptRef.current }),
      }).catch(() => {});
    },
    [],
  );

  // Relay an agent tool call to our server API and return the result to the agent.
  const callTool = useCallback(
    async (tool: string, parameters: Record<string, unknown>, convId: string | null) => {
      const toolLabel: Record<string, string> = {
        check_availability: "Checking calendar",
        create_appointment: "Creating appointment",
        get_estimate: "Looking up estimate",
        request_human_callback: "Requesting human callback",
      };
      addActivity({
        at: new Date().toISOString(),
        tool,
        status: "running",
        summary: toolLabel[tool] ?? tool,
      });
      try {
        const res = await fetch(`/api/tools/${tool}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tool_name: tool, conversation_id: convId, parameters }),
        });
        const data = await res.json();
        const ok = res.ok && (data as { result?: { created?: boolean; error?: string } })?.result?.created !== false
          && !(data as { result?: { error?: string } })?.result?.error;
        const summary = ok
          ? tool === "check_availability"
            ? `${(data as { result?: { open_slots?: unknown[] } })?.result?.open_slots?.length ?? "?"} slots found`
            : tool === "create_appointment"
              ? `Appointment ${(data as { result?: { appointment_id?: string } })?.result?.appointment_id ?? ""} created`
              : tool === "get_estimate"
                ? `Range $${(data as { result?: { range_low_usd?: number } })?.result?.range_low_usd ?? "?"}–$${(data as { result?: { range_high_usd?: number } })?.result?.range_high_usd ?? "?"}`
                : "Follow-up requested"
          : `Blocked: ${(data as { result?: { error?: string } })?.result?.error ?? "failed"}`;
        addActivity({
          at: new Date().toISOString(),
          tool,
          status: ok ? "ok" : "blocked",
          summary,
        });
        return data;
      } catch {
        addActivity({
          at: new Date().toISOString(),
          tool,
          status: "blocked",
          summary: `${tool} unreachable from browser`,
        });
        return { error: `${tool} unreachable from the browser` };
      }
    },
    [addActivity],
  );

  const sendText = useCallback(
    (text: string) => {
      const session = sessionRef.current;
      if (!session?.sendUserMessage) {
        setError("No active session to send text to.");
        return;
      }
      pushTurn({ speaker: "user", text, at: new Date().toISOString() }, conversationIdRef.current);
      session.sendUserMessage(text);
    },
    [pushTurn],
  );

  const start = useCallback(
    async (textOnly: boolean) => {
      setStatus("connecting");
      setMode(textOnly ? "text" : "voice");
      setError(null);
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `session endpoint returned ${res.status}`);
        }
        const { token, conversationId: convId, agentId } = (await res.json()) as {
          token: string;
          conversationId: string;
          agentId: string;
        };
        setConversationId(convId);
        conversationIdRef.current = convId;

        const { Conversation } = await import("@elevenlabs/client");
        const session = await Conversation.startSession({
          agentId,
          connectionToken: token,
          textOnly,
          onConnect: () => setStatus("listening"),
          onDisconnect: () => setStatus("ended"),
          onError: (err: unknown) => {
            setError(String(err));
            setStatus("error");
          },
          onModeChange: ({ mode: m }: { mode: string }) =>
            setStatus(m === "speaking" ? "speaking" : "listening"),
          onMessage: (msg: { source: string; message: string }) => {
            if (msg.source === "user" || msg.source === "ai") {
              pushTurn(
                {
                  speaker: msg.source === "user" ? "user" : "agent",
                  text: msg.message,
                  at: new Date().toISOString(),
                },
                conversationIdRef.current,
              );
            }
          },
          clientTools: {
            check_availability: async (parameters: Record<string, unknown>) =>
              callTool("check_availability", parameters, conversationIdRef.current),
            create_appointment: async (parameters: Record<string, unknown>) =>
              callTool("create_appointment", parameters, conversationIdRef.current),
            get_estimate: async (parameters: Record<string, unknown>) =>
              callTool("get_estimate", parameters, conversationIdRef.current),
            request_human_callback: async (parameters: Record<string, unknown>) =>
              callTool("request_human_callback", parameters, conversationIdRef.current),
            report_progress: async ({ field, value }: { field: string; value: string }) => {
              setCollected((prev) => ({ ...prev, [field]: value }));
              addActivity({
                at: new Date().toISOString(),
                tool: "report_progress",
                status: "ok",
                summary: `Collected ${field}`,
              });
              void fetch("/api/progress", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ conversation_id: conversationIdRef.current, field, value }),
              }).catch(() => {});
            },
          },
        });
        sessionRef.current = session as unknown as typeof sessionRef.current;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    },
    [pushTurn, callTool, addActivity],
  );

  const end = useCallback(async () => {
    await sessionRef.current?.endSession().catch(() => {});
    sessionRef.current = null;
    if (conversationIdRef.current) {
      void fetch("/api/transcript", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationIdRef.current,
          turns: transcriptRef.current,
          ended: true,
        }),
      }).catch(() => {});
    }
    setStatus("ended");
  }, []);

  return { status, mode, error, turns, conversationId, collected, activity, start, end, sendText };
}
