// Shared domain types for ShopTalk AI

export type Language = "en" | "es";

export type AppointmentStatus = "confirmed" | "pending_review";

export interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  vehicle: string; // "2016 Toyota Corolla"
  issue: string; // customer's own words, never a diagnosis
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  language: Language;
  conversationId: string;
  status: AppointmentStatus;
  demoData: true;
  createdAt: string; // ISO
}

export interface TranscriptTurn {
  speaker: "user" | "agent";
  text: string;
  at: string; // ISO
}

export interface ToolAuditEntry {
  at: string; // ISO
  tool: string;
  arguments: Record<string, unknown>;
  resultSummary: string;
  ok: boolean;
}

export interface ConversationRecord {
  id: string;
  startedAt: string; // ISO
  language: Language;
  languagesDetected: Language[];
  status: "active" | "ended";
  endedAt?: string;
  transcript: TranscriptTurn[];
  audit: ToolAuditEntry[];
  customerName?: string;
  phone?: string;
  vehicle?: string;
  issue?: string;
  preferredTime?: string;
  appointmentId?: string;
  humanFollowUpRequired: boolean;
  followUpReason?: string;
  demoData: true;
}

export interface AvailabilitySlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  labelEn: string;
  labelEs: string;
}
