import { Suspense } from "react";
import ConversationDetail from "./detail";
import { getConversation } from "@/lib/store";
import type { ConversationRecord } from "@/lib/types";

// Conversation IDs are only known at request time; skip build-time prerendering.
export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Server-render from the in-memory store so the record appears immediately;
  // the client component keeps it live via polling.
  const conversation = getConversation(id) ?? null;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-[#4a5160]">Loading conversation…</div>}>
      <ConversationDetail id={id} initial={conversation as ConversationRecord | null} />
    </Suspense>
  );
}
