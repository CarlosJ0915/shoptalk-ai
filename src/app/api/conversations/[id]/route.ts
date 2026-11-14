import { NextRequest, NextResponse } from "next/server";
import { getConversation } from "@/lib/store";

// Full conversation detail: transcript + agent audit trail.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const conv = getConversation(id);
  if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ conversation: conv, demo_data: true });
}
