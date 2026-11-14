# ShopTalk AI — Bilingual Voice Service Advisor (Hackathon Demo)

ShopTalk AI answers an auto-repair shop's phone as an ElevenLabs voice agent. It understands
English or Spanish (and switches mid-conversation), collects the customer's details, checks real
availability, and books an appointment **only after explicit confirmation** — then hands the shop
a structured record, bilingual transcript and full tool audit trail.

> ⚠️ **This is a hackathon demo.** Every customer, appointment and price figure is fictional
> demo data, labeled as such throughout the UI.

## Quick start

```bash
npm install
cp .env.example .env.local
# then fill in .env.local:
#   ELEVENLABS_API_KEY   — from https://elevenlabs.io/app/settings/api-keys
#   ELEVENLABS_AGENT_ID  — your Conversational AI agent id (see below)
npm run dev
```

Open http://localhost:3000 — **Voice Call** to talk to the agent, the dashboard for the staff
view. Microphone permission is required for voice; a text fallback is offered if it fails or if
you prefer to type.

## The ElevenLabs agent

The agent configuration lives in `src/lib/agent-config.json` (system prompt, five tools, voice
settings). To (re)create it on your ElevenLabs account:

```bash
npx -y @elevenlabs/cli@latest agents init
npx -y @elevenlabs/cli@latest agents add "ShopTalk AI" --from-file src/lib/agent-config.json
npx -y @elevenlabs/cli@latest agents list   # copy the agent_id into .env.local
```

## How tools work

All five agent tools are **client tools** — the browser executes them by calling our own
Next.js API routes, and the server returns the result. ElevenLabs never calls our server
directly; the tool execution happens entirely in the browser session. This means:

- No tunnels or public URLs needed during the demo
- Tool calls work in both voice mode and text-only fallback mode
- The server enforces all business rules (confirmation gate, demo data, audit trail)

The five tools: `check_availability`, `create_appointment`, `get_estimate`,
`request_human_callback`, plus `report_progress` (a UI helper that updates the collected-details
display and persists to the conversation record).

## What's inside

| Path | Purpose |
|------|---------|
| `src/app/call` | Voice-call screen: waveform, live bilingual transcript, collected-details tiles, agent activity panel, text fallback |
| `src/app/page.tsx` | Staff dashboard (live-polled appointments, conversations, follow-up flags) |
| `src/app/schedule` | Appointment schedule with month-view calendar |
| `src/app/conversations/[id]` | Transcript + structured details + agent audit trail |
| `src/app/settings` | Demo-data reference (shop hours, slots, estimate ranges) |
| `src/app/api/session` | Mints short-lived WebRTC tokens server-side |
| `src/app/api/tools/[tool]` | The four business tools: `check_availability`, `create_appointment`, `get_estimate`, `request_human_callback` |
| `src/app/api/progress` | Persists collected customer details from the agent's `report_progress` calls |
| `src/lib/store.ts` | In-memory deterministic demo store (seeded fictional data) |
| `src/lib/tools.ts` | Tool handlers incl. the server-enforced confirmation gate |
| `tests/appointment.test.ts` | 8 tests: confirmation gating, validation, slot conflicts, estimate bounds |

## Tests

```bash
npm test
```

## Docs

- `docs/DEMO_SCRIPT.md` — the 90-second live demo run sheet
- `docs/ARCHITECTURE.md` — judge-facing architecture overview
- `docs/SAFEGUARDS.md` — responsible-AI safeguards and where each is enforced

## Safety design (short version)

The agent never diagnoses, never invents a price (only fixed demo ranges from `get_estimate`),
never approves repairs, and books nothing without an explicit customer "yes" — a gate enforced
in server code and covered by tests. Escalation (`request_human_callback`) routes price
disputes, distress, safety issues and uncertainty to a human, flagged on the dashboard.
