# Visual identity — "Modern service bay"

Redesigned for the Miami AI Hackathon. The earlier black/acid-green theme read as
generic AI demo-ware; this system is grounded in the world of an independent Miami
auto-repair shop: work-order tickets, inspection sheets, painted metal, and bright
daylight.

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| Paper | `#F4F2EC` | Page background — warm industrial off-white, inspection-sheet paper |
| Panel | `#FFFFFF` | Ticket and card surfaces |
| Ink | `#1E2430` | Primary text |
| Ink-soft | `#4A5160` | Secondary text, mono captions |
| Bay navy | `#17202B` | Header bar, section rules, strongest headings — painted-metal signage |
| Line | `#DDD9CF` | Hairline dividers |
| Safety orange | `#E8490F` | The single automotive accent — CTAs, ticket edge, booked slots, active states |
| Green | `#1F7A3D` | Reserved strictly for confirmed/booked status |
| Red | `#B3261E` | Blocked actions, human-escalation alerts |

## Typography

- **Geist Sans** for all UI text. Sentence case labels everywhere — no shouty uppercase.
- **Geist Mono** reserved for things that behave like shop paperwork: work-order numbers
  (`APT-0001`), appointment times, timestamps, "demo data" tags. Mono is a signal that
  the value is stamped/official, not decorative.

## Motifs

- **Work-order ticket** (`.ticket`): white sheet with a 4px safety-orange left edge —
  the clipboard/folder edge of a job ticket. Used instead of generic bordered cards.
- **Clip rows** (`.clip-row`): hairline-separated list rows, no container chrome.
- **Status tags** (`.tag`): sentence-case pills in soft tinted backgrounds — green for
  confirmed, orange for Spanish/attention, red for human follow-up.
- **Gauge waveform**: the call visualization is rendered as a torque-gauge tick strip
  (ink ticks that heat to orange while the agent speaks) instead of a generic blob.

## Page compositions

- **Voice call** is the centerpiece: a "Work order intake" sheet — language detection as
  EN/Español status stamps, collected details as a service-intake form with underlines
  that light up as fields fill, outcome banners (booked / escalated / blocked) that are
  impossible to miss, and an activity log written in plain language ("Checking calendar…").
- **Dashboard** answers the four staff questions in order: needs-a-human first (with the
  red escalation reason), then every conversation with its tool-call counts, then
  appointments in schedule order.
- **Schedule** calendar: booked slots are bold safety orange, open slots muted gray,
  Sundays grayed closed — scannable at a glance.
