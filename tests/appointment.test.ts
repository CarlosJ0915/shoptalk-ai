// Unit tests for the appointment tool: confirmation gating, validation, availability.
// Run with: node --test --experimental-strip-types --env-file=.env.local tests/appointment.test.ts
// (or: npm test)

import test from "node:test";
import assert from "node:assert/strict";
import { TOOL_HANDLERS } from "../src/lib/tools.ts";
import { availableSlots, listAppointments, isSlotTaken } from "../src/lib/store.ts";

const check = TOOL_HANDLERS.check_availability;
const create = TOOL_HANDLERS.create_appointment;
const estimate = TOOL_HANDLERS.get_estimate;
const callback = TOOL_HANDLERS.request_human_callback;

const conv = "test-conversation-1";

test("check_availability returns seeded open slots", () => {
  const res = check({}, conv) as { result: { open_slots: Array<{ date: string; time: string }> } };
  assert.ok(res.result.open_slots.length > 0, "should offer at least one slot");
  assert.ok(res.result.open_slots.length <= 6);
});

test("create_appointment refuses without explicit confirmation", () => {
  const res = create(
    {
      customer_name: "Maria Fernandez",
      phone: "305-555-0142",
      vehicle: "2018 Honda Accord",
      issue: "Vibración al frenar (customer's words)",
      date: availableSlots(7)[0].date,
      time: availableSlots(7)[0].time,
      language: "es",
      confirmed: false,
    },
    conv,
  ) as { result: { created: boolean; error: string } };
  assert.equal(res.result.created, false);
  assert.equal(res.result.error, "confirmation_required");
  assert.equal(listAppointments().some((a) => a.phone === "305-555-0142"), false);
});

test("create_appointment refuses missing fields", () => {
  const res = create({ customer_name: "Maria" }, conv) as { result: { error: string } };
  assert.equal(res.result.error.startsWith("missing_required_fields"), true);
});

test("create_appointment refuses invalid date format", () => {
  const slot = availableSlots(7)[0];
  const res = create(
    {
      customer_name: "Maria Fernandez",
      phone: "305-555-0142",
      vehicle: "2018 Honda Accord",
      issue: "vibración",
      date: "tomorrow",
      time: slot.time,
      confirmed: true,
    },
    conv,
  ) as { result: { error: string } };
  assert.equal(res.result.error, "invalid_date_or_time");
});

test("create_appointment succeeds after confirmation and books the slot", () => {
  const slot = availableSlots(7)[0];
  const res = create(
    {
      customer_name: "Maria Fernandez",
      phone: "305-555-0142",
      vehicle: "2018 Honda Accord",
      issue: "El carro vibra cuando freno (customer's words, not a diagnosis)",
      date: slot.date,
      time: slot.time,
      language: "es",
      confirmed: true,
    },
    conv,
  ) as { result: { created: boolean; appointment_id: string } };
  assert.equal(res.result.created, true);
  const saved = listAppointments().find((a) => a.id === res.result.appointment_id);
  assert.ok(saved, "appointment appears in the store");
  assert.equal(saved.language, "es");
  assert.equal(isSlotTaken(slot.date, slot.time), true, "slot is now taken");
});

test("create_appointment refuses a slot that was just taken", () => {
  const slot = availableSlots(7)[0]; // some later slot
  create(
    {
      customer_name: "John Demo",
      phone: "786-555-0177",
      vehicle: "2014 Ford Focus",
      issue: "rattle over bumps",
      date: slot.date,
      time: slot.time,
      confirmed: true,
    },
    "test-conversation-2",
  );
  const res = create(
    {
      customer_name: "Other Customer",
      phone: "305-555-0199",
      vehicle: "2010 Nissan Altima",
      issue: "noise",
      date: slot.date,
      time: slot.time,
      confirmed: true,
    },
    "test-conversation-3",
  ) as { result: { error: string } };
  assert.equal(res.result.error, "slot_taken");
});

test("get_estimate returns only fixed demo ranges with disclaimer", () => {
  const res = estimate({ category: "brakes" }, conv) as {
    result: { range_low_usd: number; range_high_usd: number; disclaimer_en: string };
  };
  assert.equal(res.result.range_low_usd, 150);
  assert.equal(res.result.range_high_usd, 400);
  assert.match(res.result.disclaimer_en, /DEMO DATA/i);
  // Unknown category falls back to diagnostics, never invents numbers.
  const res2 = estimate({ category: "transmission_rebuild" }, conv) as {
    result: { category: string };
  };
  assert.equal(res2.result.category, "diagnostics");
});

test("request_human_callback flags the conversation for follow-up", () => {
  const res = callback({ reason: "customer wants a human", urgency: "high" }, conv) as {
    result: { scheduled: boolean };
  };
  assert.equal(res.result.scheduled, true);
});
