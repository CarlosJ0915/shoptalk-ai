import { NextRequest, NextResponse } from "next/server";
import { upsertConversation } from "@/lib/store";

// The agent's report_progress client tool lands here; persists collected
// customer details into the conversation record so the dashboard shows them.
const FIELD_MAP: Record<string, string> = {
  name: "customerName",
  phone: "phone",
  vehicle: "vehicle",
  issue: "issue",
  preferred_time: "preferredTime",
};

export async function POST(req: NextRequest) {
  let body: { conversation_id?: string; field?: string; value?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const id = body.conversation_id;
  const field = body.field ? FIELD_MAP[body.field] : undefined;
  if (!id || !field) {
    return NextResponse.json({ error: "conversation_id and valid field required" }, { status: 400 });
  }
  upsertConversation(id, { [field]: body.value ?? "" });
  return NextResponse.json({ ok: true });
}
