# ShopTalk AI — 90-Second Demo Script

**Setup before the clock starts:** dev server running (`npm run dev`), dashboard open on the
projector, mic permission granted, volume up, `npm test` passing.

| Time | Action | What to say |
|------|--------|-------------|
| 0:00–0:10 | Show the Staff Dashboard. Point at the seeded appointments and the empty conversations list. | "This is Miami Precision Auto's service desk. Like most independent shops in Miami, the phone rings while the mechanic is under a car — and half those calls speak Spanish. ShopTalk AI answers every one." |
| 0:10–0:20 | Click **Start voice call**. Waveform animates; agent greets bilingually. | "An ElevenLabs voice agent picks up instantly, in English or Spanish." |
| 0:20–0:40 | Speak **in Spanish**: "Necesito una cita porque mi carro está vibrando cuando freno. Es un Honda Accord 2018." Watch the live transcript colorize as ES and the Collected-details tiles fill in as the agent asks for name and phone. Answer: "Maria Fernandez, 305-555-0142." | "Notice three things: it answered in Spanish without being asked, it logged the customer's own words — 'vibrating when I brake' — and it never diagnoses. It just booked the symptom." |
| 0:40–0:55 | The agent calls `check_availability` (point at the call screen note, then switch to the conversation page on the second half of the screen or after the call). It offers two or three slots. Pick one. | "That offer came from the shop's real calendar — the same seeded availability the dashboard uses. No invented times." |
| 0:55–1:10 | The agent reads back every detail and asks "¿Puedo confirmar la cita?" Say **"Sí."** | "Nothing is saved until the customer explicitly confirms. That confirmation gate is enforced in server code, not just the prompt." |
| 1:10–1:25 | Switch to the Staff Dashboard. APT-000N appears within two seconds, tagged ES, with the transcript, structured customer/vehicle data, and the full agent audit trail: check_availability → create_appointment, with timestamps and arguments. | "The shop sees the appointment, the bilingual transcript, exactly which tools the agent ran and what it passed them — an audit trail, not a black box." |
| 1:25–1:40 | Quick second scenario: ask **in English** "How much to fix my brakes?" The agent quotes only the fixed demo range ($150–$400, labeled demo data, not a quote), and when you push on price it escalates: `request_human_callback`. The dashboard flags the conversation red as needing human follow-up. | "It never invents a price, never diagnoses, and it escalates price, anger and safety conversations to a human. Every record you've seen is labeled demo data. That's ShopTalk AI." |

**Fallback if the microphone fails:** click "Use text fallback" on the call screen and type the
same lines — the agent, transcript, tools and dashboard flow are identical.

**Rehearsal notes:**
- Restart the dev server before the demo for clean, deterministic seeded data.
- Speak the Spanish opener exactly — it's the strongest moment; the instant language switch is
  the wow.
- The dashboard polls every 2 seconds; when pointing at the audit trail, open
  `/conversations/<id>` from the dashboard link.
