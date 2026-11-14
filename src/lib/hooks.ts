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

export function useVoiceCall() {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "listening" | "speaking" | "error" | "ended"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [collected, setCollected] = useState<Record<string, string>>({});
  const sessionRef = useRef<{ endSession: () => Promise<void> } | null>(null);
  const transcriptRef = useRef<TranscriptTurn[]>([]);

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

  // Live conversation id for sendText/pushTurn closures; updated inside start().
  const conversationIdRef = useRef<string | null>(null);

  // Relay an agent tool call to our server API and return the result to the agent.
  const callTool = useCallback(
    async (tool: string, parameters: Record<string, unknown>, convId: string | null) => {
      try {
        const res = await fetch(`/api/tools/${tool}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tool_name: tool, conversation_id: convId, parameters }),
        });
        const data = await res.json();
        return data;
      } catch {
        return { error: `${tool} unreachable from the browser` };
      }
    },
    [],
  );

  const sendText = useCallback(
    async (text: string) => {
      const session = sessionRef.current as unknown as { sendUserText?: (t: string) => void } | null;
      if (!session?.sendUserText) {
        setError("Text input needs an active voice session.");
        return;
      }
      pushTurn({ speaker: "user", text, at: new Date().toISOString() }, conversationIdRef.current);
      session.sendUserText(text);
    },
    [pushTurn],
  );

  const start = useCallback(async () => {
    setStatus("connecting");
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
        onConnect: () => setStatus("listening"),
        onDisconnect: () => setStatus("ended"),
        onError: (err) => {
          setError(String(err));
          setStatus("error");
        },
        onModeChange: ({ mode }) => setStatus(mode === "speaking" ? "speaking" : "listening"),
        onMessage: (msg) => {
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
          // The agent's four tools execute in the browser against our own API,
          // so ElevenLabs never needs to reach this machine over the network.
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
            void fetch("/api/progress", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ conversation_id: conversationIdRef.current, field, value }),
            }).catch(() => {});
          },
        },
      });
      sessionRef.current = session as unknown as { endSession: () => Promise<void> };
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [pushTurn, callTool]);

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

  return { status, error, turns, conversationId, collected, start, end, sendText };
}
