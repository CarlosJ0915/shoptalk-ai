// API-level tests for the text-fallback code path. The browser text session sends
// user text to the agent, which calls the same tools with the same conversation_id;
// these tests verify that path end-to-end at the server boundary:
// progress → availability → confirmation-gated booking → transcript → dashboard.
// Run with: npm test

import test from "node:test";
import assert from "node:assert/strict";
import { TOOL_HANDLERS } from "../src/lib/tools.ts";
import {
  availableSlots,
  listAppointments,
  listConversations,
  appendTranscript,
  upsertConversation,
  getConversation,
} from "../src/lib/store.ts";

const create = TOOL_HANDLERS.create_appointment;
const estimate = TOOL_HANDLERS.get_estimate;
const callback = TOOL_HANDLERS.request_human_callback;

// The text fallback starts a session with no prior record — the conversation is
// created lazily on first progress/tool call, exactly as in voice mode.
test("text session: progress-style upsert creates a conversation without voice", () => {
  const conv = upsertConversation("text-en-1", { customerName: "Jamie Rivera", phone: "305-555-0160" });
  assert.equal(conv.customerName, "Jamie Rivera");
  assert.equal(conv.status, "active");
  assert.equal(listConversations().some((c) => c.id === "text-en-1"), true);
});

test("text session: English booking completes with same confirmation gate", () => {
  const slot = availableSlots(7)[0];
  // Agent attempts booking before confirmation — must be blocked.
  const blocked = create(
    {
      customer_name: "Jamie Rivera",
      phone: "305-555-0160",
      vehicle: "2020 Mazda CX-5",
      issue: "whining sound on startup",
      date: slot.date,
      time: slot.time,
      language: "en",
      confirmed: false,
    },
    "text-en-1",
  ) as { result: { created: boolean; error: string } };
  assert.equal(blocked.result.created, false);
  assert.equal(blocked.result.error, "confirmation_required");

  // After explicit confirmation the same call succeeds.
  const ok = create(
    {
      customer_name: "Jamie Rivera",
      phone: "305-555-0160",
      vehicle: "2020 Mazda CX-5",
      issue: "whining sound on startup",
      date: slot.date,
      time: slot.time,
      language: "en",
      confirmed: true,
    },
    "text-en-1",
  ) as { result: { created: boolean; appointment_id: string } };
  assert.equal(ok.result.created, true);
  assert.ok(listAppointments().find((a) => a.id === ok.result.appointment_id));
  // Structured details land on the conversation for the dashboard.
  const conv = getConversation("text-en-1");
  assert.equal(conv?.vehicle, "2020 Mazda CX-5");
  assert.equal(conv?.appointmentId, ok.result.appointment_id);
});

test("text session: Spanish input detected and booking persists as ES", () => {
  appendTranscript("text-es-1", [
    { speaker: "user", text: "Necesito una cita, mi carro hace un ruido raro", at: new Date().toISOString() },
  ]);
  const conv = getConversation("text-es-1");
  assert.equal(conv?.language, "es");
  assert.ok(conv?.languagesDetected.includes("es"));

  const slot = availableSlots(7)[0];
  const ok = create(
    {
      customer_name: "Lucía Gómez",
      phone: "786-555-0161",
      vehicle: "2019 Nissan Versa",
      issue: "ruido raro al arrancar",
      date: slot.date,
      time: slot.time,
      language: "es",
      confirmed: true,
    },
    "text-es-1",
  ) as { result: { created: boolean; appointment_id: string } };
  assert.equal(ok.result.created, true);
  assert.equal(listAppointments().find((a) => a.id === ok.result.appointment_id)?.language, "es");
});

test("text session: estimate returns fixed demo range only", () => {
  const res = estimate({ category: "brakes" }, "text-en-1") as {
    result: { range_low_usd: number; range_high_usd: number; disclaimer_en: string };
  };
  assert.equal(res.result.range_low_usd, 150);
  assert.match(res.result.disclaimer_en, /DEMO DATA/i);
});

test("text session: human escalation flags conversation for the dashboard", () => {
  callback({ reason: "customer asked for a human", urgency: "normal" }, "text-en-1");
  const conv = getConversation("text-en-1");
  assert.equal(conv?.humanFollowUpRequired, true);
  assert.match(conv?.followUpReason ?? "", /human/i);
});

test("text session: transcript and audit trail persist together", () => {
  const conv = getConversation("text-en-1");
  assert.ok(conv, "conversation exists");
  // Audit trail holds every tool action from the earlier tests in this file.
  const tools = (conv?.audit ?? []).map((a) => a.tool);
  assert.ok(tools.includes("create_appointment"));
  assert.ok(tools.includes("get_estimate"));
  assert.ok(tools.includes("request_human_callback"));
  // The audit records the blocked confirmation attempt as well as the success.
  const blockedEntry = conv?.audit.find((a) => a.tool === "create_appointment" && !a.ok);
  assert.ok(blockedEntry, "blocked confirmation attempt is audited");
});
