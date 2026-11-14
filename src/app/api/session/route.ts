import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Mint a short-lived WebRTC session token for the browser call screen.
// The API key stays server-side; the client only ever sees the token.
export async function GET(req: NextRequest) {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!agentId) {
    return NextResponse.json({ error: "ELEVENLABS_AGENT_ID is not configured" }, { status: 500 });
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured" }, { status: 500 });
  }
  try {
    const client = new ElevenLabsClient({ apiKey });
    const session = await client.conversationalAi.conversations.getWebrtcToken({ agentId });
    void req;
    return NextResponse.json({
      token: session.token,
      conversationId: session.conversationId,
      agentId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "session_token_failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
