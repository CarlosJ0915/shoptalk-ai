import { NextRequest, NextResponse } from "next/server";
import { TOOL_HANDLERS } from "@/lib/tools";
import type { ToolRequest } from "@/lib/tools";

// ElevenLabs webhook tools endpoint: POST /api/tools/<tool_name>
export async function POST(req: NextRequest, ctx: { params: Promise<{ tool: string }> }) {
  const { tool } = await ctx.params;
  const handler = TOOL_HANDLERS[tool];
  if (!handler) {
    return NextResponse.json({ error: `unknown tool: ${tool}` }, { status: 404 });
  }
  let body: ToolRequest;
  try {
    body = (await req.json()) as ToolRequest;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const conversationId = body.conversation_id || "unknown";
  try {
    const out = handler(body.parameters ?? {}, conversationId);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: "tool_failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
