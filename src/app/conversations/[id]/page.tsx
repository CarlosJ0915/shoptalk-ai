import { Suspense } from "react";
import ConversationDetail from "./detail";

// Conversation IDs are only known at request time; skip build-time prerendering.
export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-6 text-sm text-[#8a8f98]">Loading conversation…</div>}>
      <ConversationDetail id={id} />
    </Suspense>
  );
}
