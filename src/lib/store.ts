// In-memory demo data store. Deterministic fictional data only — never real customers.
// Server-side module; Next.js dev keeps it warm via globalThis so HMR doesn't wipe state.

import type {
  Appointment,
  AvailabilitySlot,
  ConversationRecord,
  Language,
  ToolAuditEntry,
  TranscriptTurn,
} from "./types";

export const DEMO_SHOP = {
  nameEn: "Miami Precision Auto",
  nameEs: "Miami Precision Auto",
  address: "1420 NW 7th St, Miami, FL",
  hoursEn: "Mon–Fri 8:00–17:00, Sat 9:00–13:00",
  hoursEs: "Lun–Vie 8:00–17:00, Sáb 9:00–13:00",
};

function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// Fixed opening slots per weekday (0=Sun). Deterministic demo availability.
const WEEKDAY_SLOTS = ["08:30", "10:00", "13:30", "15:00", "16:30"];
const SATURDAY_SLOTS = ["09:00", "11:00"];

function slotLabels(date: string, time: string): { labelEn: string; labelEs: string } {
  const [y, m, day] = date.split("-").map(Number);
  const en = new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const es = new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("es-ES", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return { labelEn: `${en}, ${time}`, labelEs: `${es}, ${time}` };
}

interface Store {
  appointments: Appointment[];
  conversations: ConversationRecord[];
  seq: number;
}

function seed(): Store {
  const store: Store = { appointments: [], conversations: [], seq: 100 };

  // Two seeded demo appointments so the schedule isn't empty at demo start.
  store.appointments.push(
    {
      id: "APT-0001",
      customerName: "Demo Customer A (fictional)",
      phone: "305-555-0101",
      vehicle: "2016 Toyota Corolla",
      issue: "Squealing noise when braking (demo record)",
      date: isoDay(1),
      time: "10:00",
      language: "en",
      conversationId: "seed-en",
      status: "confirmed",
      demoData: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "APT-0002",
      customerName: "Cliente Demo B (ficticio)",
      phone: "786-555-0102",
      vehicle: "2019 Honda CR-V",
      issue: "Cambio de aceite y rotación de neumáticos (registro de demo)",
      date: isoDay(2),
      time: "13:30",
      language: "es",
      conversationId: "seed-es",
      status: "confirmed",
      demoData: true,
      createdAt: new Date().toISOString(),
    },
  );
  store.seq = 2;
  return store;
}

declare global {
  var __shoptalkStore: Store | undefined;
}

function db(): Store {
  if (!globalThis.__shoptalkStore) globalThis.__shoptalkStore = seed();
  return globalThis.__shoptalkStore;
}

export function nextAppointmentId(): string {
  const s = db();
  s.seq += 1;
  return `APT-${String(s.seq).padStart(4, "0")}`;
}

export function listAppointments(): Appointment[] {
  return [...db().appointments].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
  );
}

export function addAppointment(a: Appointment): void {
  db().appointments.push(a);
}

export function isSlotTaken(date: string, time: string): boolean {
  return db().appointments.some(
    (a) => a.date === date && a.time === time && a.status !== "pending_review",
  );
}

/** Open slots for the next `daysAhead` days that aren't already booked. */
export function availableSlots(daysAhead = 7): AvailabilitySlot[] {
  const out: AvailabilitySlot[] = [];
  for (let i = 1; i <= daysAhead; i++) {
    const date = isoDay(i);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (dow === 0) continue; // closed Sundays
    const times = dow === 6 ? SATURDAY_SLOTS : WEEKDAY_SLOTS;
    for (const time of times) {
      if (isSlotTaken(date, time)) continue;
      const { labelEn, labelEs } = slotLabels(date, time);
      out.push({ date, time, labelEn, labelEs });
    }
  }
  return out;
}

export function getConversation(id: string): ConversationRecord | undefined {
  return db().conversations.find((c) => c.id === id);
}

export function upsertConversation(id: string, patch: Partial<ConversationRecord>): ConversationRecord {
  const s = db();
  let conv = s.conversations.find((c) => c.id === id);
  if (!conv) {
    conv = {
      id,
      startedAt: new Date().toISOString(),
      language: "en",
      languagesDetected: [],
      status: "active",
      transcript: [],
      audit: [],
      humanFollowUpRequired: false,
      demoData: true,
    };
    s.conversations.unshift(conv);
  }
  Object.assign(conv, patch);
  return conv;
}

export function listConversations(): ConversationRecord[] {
  return [...db().conversations];
}

export function appendTranscript(id: string, turns: TranscriptTurn[]): void {
  const conv = upsertConversation(id, {});
  // Replace transcript wholesale on each ingest (client sends full history).
  conv.transcript = turns;
  for (const t of turns) {
    if (t.text) {
      const lang: Language = /[¿áéíóúñ¡]|\b(hola|gracias|cita|carro|necesito|bueno)\b/i.test(t.text)
        ? "es"
        : "en";
      if (!conv.languagesDetected.includes(lang)) conv.languagesDetected.push(lang);
      conv.language = lang;
    }
  }
}

export function appendAudit(id: string, entry: ToolAuditEntry): void {
  const conv = upsertConversation(id, {});
  conv.audit.push(entry);
}

/** Rough estimate band from a fixed demo price table. Never a diagnosis. */
const ESTIMATE_TABLE: Record<string, { en: string; es: string; low: number; high: number }> = {
  oil_change: {
    en: "Oil change service",
    es: "Cambio de aceite",
    low: 55,
    high: 85,
  },
  brakes: { en: "Brake service", es: "Servicio de frenos", low: 150, high: 400 },
  diagnostics: { en: "Diagnostic appointment", es: "Cita de diagnóstico", low: 89, high: 120 },
  tires: { en: "Tire service", es: "Servicio de neumáticos", low: 40, high: 180 },
  battery: { en: "Battery replacement", es: "Cambio de batería", low: 120, high: 280 },
};

export function estimateFor(category: string): {
  category: string;
  nameEn: string;
  nameEs: string;
  low: number;
  high: number;
  disclaimerEn: string;
  disclaimerEs: string;
} {
  const row = ESTIMATE_TABLE[category] ?? ESTIMATE_TABLE.diagnostics;
  const resolved = ESTIMATE_TABLE[category] ? category : "diagnostics";
  const r = ESTIMATE_TABLE[resolved];
  return {
    category: resolved,
    nameEn: r.en,
    nameEs: r.es,
    low: row.low,
    high: row.high,
    disclaimerEn:
      "DEMO DATA: indicative range only. The shop confirms the final price after inspection. This is not a quote or a diagnosis.",
    disclaimerEs:
      "DATOS DE DEMOSTRACIÓN: rango indicativo. El taller confirma el precio final tras la inspección. No es una cotización ni un diagnóstico.",
  };
}
