// Server-side implementations of the four ShopTalk agent tools.
// Each returns { result } for ElevenLabs webhooks and records an audit entry.

import { availableSlots, estimateFor, addAppointment, appendAudit, nextAppointmentId, isSlotTaken, upsertConversation } from "./store";
import type { Appointment } from "./types";

export interface ToolRequest {
  tool_call_id?: string;
  tool_name?: string;
  conversation_id?: string;
  parameters?: Record<string, unknown>;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function audit(convId: string, tool: string, args: Record<string, unknown>, resultSummary: string, ok: boolean) {
  if (!convId || convId === "unknown") return;
  appendAudit(convId, { at: new Date().toISOString(), tool, arguments: args, resultSummary, ok });
}

export function handleCheckAvailability(params: Record<string, unknown>, conversationId: string) {
  const daysAhead = typeof params.days_ahead === "number" ? Math.min(14, Math.max(1, params.days_ahead)) : 7;
  const slots = availableSlots(daysAhead).slice(0, 6);
  const result = {
    demo_data: true,
    open_slots: slots.map((s) => ({ date: s.date, time: s.time, label_en: s.labelEn, label_es: s.labelEs })),
    note_en: "Demo data. Offer at most three of these times to the customer.",
    note_es: "Datos de demo. Ofrezca como máximo tres horarios al cliente.",
  };
  audit(conversationId, "check_availability", params, `${slots.length} open slots offered (demo data)`, true);
  return { result };
}

export function handleCreateAppointment(params: Record<string, unknown>, conversationId: string) {
  const required = ["customer_name", "phone", "vehicle", "issue", "date", "time"];
  const missing = required.filter((k) => !str(params[k]).trim());
  if (missing.length > 0) {
    const result = {
      created: false,
      error: `missing_required_fields: ${missing.join(", ")}`,
      note_en: "Ask the customer for the missing details, then call create_appointment again.",
    };
    audit(conversationId, "create_appointment", params, `rejected: missing ${missing.join(", ")}`, false);
    return { result };
  }
  const confirmed = params.confirmed === true || params.confirmed === "true";
  if (!confirmed) {
    const result = {
      created: false,
      error: "confirmation_required",
      note_en:
        "You must read back ALL collected details and get an explicit yes from the customer, then call again with confirmed=true.",
      note_es:
        "Debe repetir todos los datos y recibir un sí explícito del cliente, luego llamar de nuevo con confirmed=true.",
    };
    audit(conversationId, "create_appointment", params, "blocked: explicit confirmation required", false);
    return { result };
  }
  const date = str(params.date);
  const time = str(params.time);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    const result = { created: false, error: "invalid_date_or_time", note_en: "Use YYYY-MM-DD and HH:MM (24h)." };
    audit(conversationId, "create_appointment", params, "rejected: invalid date/time format", false);
    return { result };
  }
  if (isSlotTaken(date, time)) {
    const result = {
      created: false,
      error: "slot_taken",
      note_en: "That slot was just booked. Call check_availability again and offer another time.",
    };
    audit(conversationId, "create_appointment", params, `rejected: ${date} ${time} already taken`, false);
    return { result };
  }
  const appointment: Appointment = {
    id: nextAppointmentId(),
    customerName: str(params.customer_name),
    phone: str(params.phone),
    vehicle: str(params.vehicle),
    issue: str(params.issue),
    date,
    time,
    language: str(params.language) === "es" ? "es" : "en",
    conversationId,
    status: "confirmed",
    demoData: true,
    createdAt: new Date().toISOString(),
  };
  addAppointment(appointment);
  upsertConversation(conversationId, {
    customerName: appointment.customerName,
    phone: appointment.phone,
    vehicle: appointment.vehicle,
    issue: appointment.issue,
    appointmentId: appointment.id,
  });
  const result = {
    created: true,
    appointment_id: appointment.id,
    date,
    time,
    demo_data: true,
    note_en: "Tell the customer the appointment is booked. All figures are demo data.",
    note_es: "Informe al cliente que la cita está agendada. Todas las cifras son datos de demo.",
  };
  audit(conversationId, "create_appointment", params, `created ${appointment.id} on ${date} ${time}`, true);
  return { result };
}

export function handleGetEstimate(params: Record<string, unknown>, conversationId: string) {
  const category = str(params.category, "diagnostics");
  const est = estimateFor(category);
  const result = {
    demo_data: true,
    category: est.category,
    name_en: est.nameEn,
    name_es: est.nameEs,
    range_low_usd: est.low,
    range_high_usd: est.high,
    disclaimer_en: est.disclaimerEn,
    disclaimer_es: est.disclaimerEs,
    instruction_en:
      "State only that this is an indicative demo range and that the shop confirms the price after inspection. Never present it as a quote or diagnose the problem.",
    instruction_es:
      "Indique solo que es un rango indicativo de demo y que el taller confirma el precio tras la inspección. Nunca lo presente como cotización ni diagnostique el problema.",
  };
  audit(conversationId, "get_estimate", params, `range $${est.low}-$${est.high} (${est.category}) — demo data`, true);
  return { result };
}

export function handleRequestHumanCallback(params: Record<string, unknown>, conversationId: string) {
  const reason = str(params.reason, "customer requested human contact");
  const urgency = str(params.urgency, "normal");
  upsertConversation(conversationId, {
    humanFollowUpRequired: true,
    followUpReason: `${reason} (urgency: ${urgency})`,
  });
  const result = {
    scheduled: true,
    demo_data: true,
    note_en: "A staff member will call back. Tell the customer plainly; do not promise a specific time.",
    note_es: "Un miembro del personal llamará. Dígalo al cliente sin prometer una hora exacta.",
  };
  audit(conversationId, "request_human_callback", params, `escalated: ${reason}`, true);
  return { result };
}

export const TOOL_HANDLERS: Record<string, (p: Record<string, unknown>, c: string) => unknown> = {
  check_availability: handleCheckAvailability,
  create_appointment: handleCreateAppointment,
  get_estimate: handleGetEstimate,
  request_human_callback: handleRequestHumanCallback,
};
