import { NextRequest, NextResponse } from "next/server";
import { appendTranscript, upsertConversation } from "@/lib/store";
import type { TranscriptTurn } from "@/lib/types";

// The call screen streams the live transcript here so the dashboard shows it in real time.
export async function POST(req: NextRequest) {
  let body: { conversation_id?: string; turns?: TranscriptTurn[]; ended?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const id = body.conversation_id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
  }
  if (Array.isArray(body.turns)) {
    const safe = body.turns
      .filter((t) => t && (t.speaker === "user" || t.speaker === "agent") && typeof t.text === "string")
      .slice(-200);
    appendTranscript(id, safe);
  }
  if (body.ended) upsertConversation(id, { status: "ended", endedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
