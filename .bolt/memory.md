# Project memory

## Product intent & audience

- **CivicLens**: civic complaint management platform for citizens to submit complaints (description, optional image, locality) that get AI-analyzed and routed to municipal officers.
- Team-based project; "Member 1" owns the existing complaint backend service (Supabase edge functions). Do not duplicate or replace their services.
- Citizens submit via a form; officers review via a dashboard table showing all tickets.

## Brand personality & voice

- Transparent and honest — never fabricate AI output; clearly label demo/pending states.
- User-facing errors must be surfaced with useful messages, never silent failures.

## Visual design & UX direction

- Stack: Vite + React + Tailwind CSS + Lucide React icons; path alias `@/` → `src/`.
- Ticket numbers formatted `CIVIC-YYYY-NNNNNN`.
- Yellow warning banner used for "AI analysis pending — demo mode" on the success screen.
- Success view shows generated ticket number and AI analysis result card.
- Loading indicator during submission; success and error states on the complaint form.
- Dashboard renders a complaints table; tickets must persist after page refresh.

## Decisions, constraints & rationale

- **AI is a degradable dependency, not a hard gate.** If Gemini is unavailable (503/502/network), `createComplaintTicket` still creates the ticket with analysis fields marked "Pending review" and returns `{ ticket, aiPending: true }`. Real validation errors still surface.
- `GEMINI_API_KEY` and `GEMINI_MODEL` are not yet configured in Supabase edge function secrets.
- Image upload failures are non-fatal — submission continues as text-only if storage fails.
- Supabase Row Level Security must stay enabled; never bypass DB security.
- Never expose API keys; never create fake AI analysis.
- No additional UI/icon/theme packages beyond the template defaults.

## Open questions & assumptions

- Supabase storage bucket for complaint images may not be configured (image upload errors treated as non-fatal as a workaround).
- Gemini integration will activate automatically once keys are added to edge function secrets — no code changes expected.
- Assumes Member 1's complaint service edge function accepts the fallback field values (`category: "Other"`, `severity: "Medium"`, `confidence: "Low"`) without schema violations.