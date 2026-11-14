# ShopTalk AI — Responsible-AI Safeguards

Every safeguard below is enforced in **server code** where possible (testable), not only in the
agent's prompt.

## Hard limits on the agent

1. **No mechanical diagnosis.** The system prompt forbids naming faulty parts or advising
   repairs; the agent records only the customer's own words, and `create_appointment` stores the
   issue field verbatim from what the agent passed. The prompt directs the agent to say
   technicians diagnose in person.
2. **No invented prices.** `get_estimate` is the only source of numbers and serves fixed demo
   ranges only; unknown categories fall back to a generic diagnostics range, and every response
   carries a "not a quote, demo data" disclaimer that the prompt requires the agent to repeat.
3. **No repair approval.** The agent can only book an appointment slot; it has no tool that
   authorizes work, quotes a final price, or charges anything.
4. **Explicit confirmation gate.** `create_appointment` returns `confirmation_required` and saves
   nothing unless called with `confirmed=true` — enforced in `src/lib/tools.ts` and covered by
   tests. The prompt additionally requires the agent to read back every collected detail and ask
   before calling the tool.
5. **AI self-identification.** The agent's first message states it is the shop's AI assistant,
   and the prompt requires it to identify as AI whenever asked; it may never claim to be human.

## Human oversight

6. **Escalation tool.** `request_human_callback` flags a conversation for human follow-up; the
   dashboard surfaces it as a red badge with the reason. The prompt mandates escalation for
   angry or distressed customers, safety issues, pricing/insurance/legal topics, and any
   uncertainty.
7. **Safety-critical routing.** For unsafe-to-drive situations the agent is instructed to advise
   stopping driving and to escalate with high urgency.
8. **Full audit trail.** Every tool call — including blocked and failed ones — is recorded with
   timestamp, arguments and outcome, and shown on the conversation page.
9. **Complete transcript.** Both sides of every bilingual conversation are stored and reviewable
   by staff.

## Data and privacy

10. **Fictional demo data only.** The store is seeded with deterministic fictional records;
    every record and every price figure in the UI is labeled "demo data".
11. **Secrets stay server-side.** The ElevenLabs API key lives only in gitignored `.env.local`;
    the browser receives only a short-lived WebRTC session token. `.env.example` ships without
    secret values, and keys are never logged.
12. **No fabrication under uncertainty.** The agent is instructed to re-ask rather than guess
    details, and `create_appointment` rejects requests with missing required fields.
