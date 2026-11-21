# CivicLens — Member 1 Integration Documentation

This document is the hand-off from **Member 1 (AI engine & core functionality)**
to **Member 2 (frontend submission form)** and **Member 3 (dashboard & status management)**.

It describes exactly which functions to import, what they accept, and what they return.
You do **not** need to know how the AI or storage works internally — just use the APIs below.

---

## 1. Where things live

| Concern | File |
|---|---|
| Shared types | `src/types/complaint.ts` |
| Supabase client | `src/lib/supabase.ts` |
| AI analysis | `src/services/aiService.ts` |
| Complaint CRUD + image upload | `src/services/complaintService.ts` |
| Department routing | `src/services/departmentRouting.ts` |
| Duplicate detection | `src/services/duplicateDetection.ts` |
| Secure Gemini edge function | `supabase/functions/analyze-complaint/index.ts` |

Import everything via the `@/` alias, e.g. `import { createComplaintTicket } from "@/services/complaintService"`.

---

## 2. Shared types (`@/types/complaint`)

Import these to type your components and props.

```ts
type ComplaintCategory =
  | "Roads and potholes" | "Waste management" | "Water supply and leakage"
  | "Electricity and streetlights" | "Trees and fallen branches"
  | "Drainage and sewage" | "Other";

type Severity = "Critical" | "High" | "Medium" | "Low";
type TicketStatus = "Open" | "Acknowledged" | "In Progress" | "Resolved";
type Confidence = "High" | "Medium" | "Low";

type Department =
  | "Roads and Engineering" | "Solid Waste Management" | "Water Supply Department"
  | "Electrical Department" | "Parks and Horticulture"
  | "Stormwater and Drainage" | "Municipal General Complaints";

interface ComplaintInput {
  description: string;          // required
  image?: string;               // optional: data URL or http URL of a photo
  locality?: string;            // optional area/landmark
  analysis?: ComplaintAnalysis; // optional: skip if you want AI to run
  possibleDuplicateOf?: string; // optional: set by duplicate detection
}

interface ComplaintTicket {
  id: string;
  ticketNumber: string;         // e.g. "CIVIC-2026-000001"
  description: string;
  originalLanguage: string;
  translatedSummary: string;
  image: string | null;
  locality: string | null;
  category: ComplaintCategory;
  severity: Severity;
  severityReason: string;
  department: Department;
  suggestedAction: string;
  confidence: Confidence;
  status: TicketStatus;
  possibleDuplicateOf: string | null;
  createdAt: string;            // ISO timestamp
}

interface GetComplaintsOptions {
  category?: ComplaintCategory;
  severity?: Severity;
  status?: TicketStatus;
  department?: Department;
  sortBy?: "createdAt" | "severity" | "status" | "category";
  sortDir?: "asc" | "desc";
  limit?: number;               // default 100, max 500
}

interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matches: Array<{ ticket: ComplaintTicket; score: number; reason: string }>;
}
```

---

## 3. For Member 2 — the submission form

```ts
import { createComplaintTicket, uploadComplaintImage } from "@/services/complaintService";
import { detectDuplicate } from "@/services/duplicateDetection";
import type { ComplaintInput, ComplaintTicket } from "@/types/complaint";
```

### Submit a complaint (text + optional photo)

```ts
async function onSubmit(description: string, locality: string, photo?: File | null) {
  const input: ComplaintInput = { description, locality };

  if (photo) {
    // Upload first, then pass the returned URL to the ticket creator.
    input.image = await uploadComplaintImage(photo);
  }

  // Optional: warn the user if this looks like a duplicate BEFORE creating.
  const dup = await detectDuplicate(input);
  if (dup.isDuplicate) {
    // Show dup.matches[0].ticket.ticketNumber to the user and ask "still submit?"
  }

  const ticket: ComplaintTicket = await createComplaintTicket(input);
  // ticket.ticketNumber is the human-readable id to display as confirmation.
}
```

- `createComplaintTicket` runs the AI analysis automatically and stores the ticket.
- It throws on failure — wrap it in try/catch and show a friendly error.
- `uploadComplaintImage(file)` returns a public URL; pass it as `input.image`.
- Complaints can be submitted in English **or** any regional Indian language — the AI detects and translates. No language selector is needed.

### Error handling

`createComplaintTicket` and `uploadComplaintImage` throw `Error` with a `.message`.
`analyzeComplaint` (if you call it directly) throws `AiServiceError` with a `.status`.

---

## 4. For Member 3 — the dashboard

```ts
import {
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
} from "@/services/complaintService";
import type { ComplaintTicket, GetComplaintsOptions, TicketStatus } from "@/types/complaint";
```

### Load tickets (with filters)

```ts
const tickets: ComplaintTicket[] = await getComplaints({
  category: "Roads and potholes", // optional
  severity: "High",               // optional
  status: "Open",                 // optional
  department: "Roads and Engineering", // optional
  sortBy: "createdAt",
  sortDir: "desc",
  limit: 100,
});

// No args loads all tickets, newest first:
const all = await getComplaints();
```

### Update a ticket's status

```ts
const updated = await updateComplaintStatus(ticket.id, "In Progress");
// Valid statuses: "Open" | "Acknowledged" | "In Progress" | "Resolved"
```

### Statistics

Compute counts/severity breakdowns from the `ComplaintTicket[]` returned by `getComplaints()`.
Do **not** hardcode statistics — always derive them from live data so the dashboard reflects real submissions.

### Duplicate badges

A ticket with `possibleDuplicateOf !== null` is flagged as a possible duplicate of that ticket id.
Show a "Possible duplicate" badge and link to `possibleDuplicateOf`. Duplicates are **not** deleted automatically.

---

## 5. Required secret

The AI analysis uses the Google Gemini API via a Supabase Edge Function so the key never reaches the browser.

**Before the AI feature works, add this secret to the Supabase project:**

- Name: `GEMINI_API_KEY`
- Value: a Google AI Studio Gemini API key (get one free at https://aistudio.google.com/app/apikey)
- Optional: `GEMINI_MODEL` (defaults to `gemini-2.0-flash`).

Without `GEMINI_API_KEY`, `createComplaintTicket` will fail with a clear 503 error from the edge function. All other features (create text-only ticket with fallback analysis, list, update status) still work once the key is present.

---

## 6. Do not modify

Member 1 owns these files. If you need a signature change, coordinate first:

- `src/types/complaint.ts`
- `src/services/aiService.ts`
- `src/services/complaintService.ts`
- `src/services/departmentRouting.ts`
- `src/services/duplicateDetection.ts`
- `src/lib/supabase.ts`
- `supabase/functions/analyze-complaint/index.ts`
