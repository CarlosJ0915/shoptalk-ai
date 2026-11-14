import { NextResponse } from "next/server";
import { listAppointments, listConversations, availableSlots, DEMO_SHOP } from "@/lib/store";

// Dashboard data feed: appointments, conversations, availability snapshot.
export async function GET() {
  return NextResponse.json({
    shop: DEMO_SHOP,
    demo_data: true,
    appointments: listAppointments(),
    conversations: listConversations().map((c) => ({
      id: c.id,
      startedAt: c.startedAt,
      endedAt: c.endedAt,
      language: c.language,
      languagesDetected: c.languagesDetected,
      status: c.status,
      customerName: c.customerName,
      vehicle: c.vehicle,
      appointmentId: c.appointmentId,
      humanFollowUpRequired: c.humanFollowUpRequired,
      followUpReason: c.followUpReason,
      turnCount: c.transcript.length,
      toolCallCount: c.audit.length,
    })),
    nextOpenSlots: availableSlots(7).slice(0, 6),
  });
}
