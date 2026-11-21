/**
 * CivicLens — Shared complaint & ticket types.
 *
 * These types are the integration contract between:
 *  - Member 1 (AI engine & core services)  — defines and produces them.
 *  - Member 2 (frontend submission form)   — consumes `ComplaintInput` to call `createComplaintTicket`.
 *  - Member 3 (dashboard & status mgmt)    — consumes `ComplaintTicket[]` and calls `updateComplaintStatus`.
 *
 * Import from: `@/types/complaint`
 */

/** Supported complaint categories. */
export type ComplaintCategory =
  | "Roads and potholes"
  | "Waste management"
  | "Water supply and leakage"
  | "Electricity and streetlights"
  | "Trees and fallen branches"
  | "Drainage and sewage"
  | "Other";

/** Four-level severity scale. */
export type Severity = "Critical" | "High" | "Medium" | "Low";

/** Ticket lifecycle status. */
export type TicketStatus = "Open" | "Acknowledged" | "In Progress" | "Resolved";

/** AI confidence in its own classification. */
export type Confidence = "High" | "Medium" | "Low";

/** Departments complaints are routed to. */
export type Department =
  | "Roads and Engineering"
  | "Solid Waste Management"
  | "Water Supply Department"
  | "Electrical Department"
  | "Parks and Horticulture"
  | "Stormwater and Drainage"
  | "Municipal General Complaints";

/**
 * Structured result returned by the AI analysis service.
 * Every field is required so downstream code never has to null-check.
 */
export interface ComplaintAnalysis {
  originalLanguage: string;
  translatedSummary: string;
  category: ComplaintCategory;
  severity: Severity;
  severityReason: string;
  department: Department;
  suggestedAction: string;
  confidence: Confidence;
}

/**
 * Input accepted by `createComplaintTicket`.
 * Only `description` is required — everything else is optional.
 */
export interface ComplaintInput {
  description: string;
  /** Optional uploaded photo. Member 2 may pass either a Storage public URL or a base64 data URL. */
  image?: string;
  /** Optional locality / area name. */
  locality?: string;
  /**
   * Optional pre-computed AI analysis. Member 1's service computes this when omitted;
   * Member 2 rarely needs to pass it. Exposed for testing and advanced flows.
   */
  analysis?: ComplaintAnalysis;
  /**
   * Optional id of another ticket flagged as a likely duplicate.
   * Usually set automatically by duplicate detection — leave undefined for new submissions.
   */
  possibleDuplicateOf?: string;
}

/**
 * The full complaint ticket. This is the shape returned by `getComplaints`,
 * `createComplaintTicket`, and `updateComplaintStatus`, and the row shape the
 * dashboard (Member 3) renders.
 */
export interface ComplaintTicket {
  id: string;
  /** Human-readable id, e.g. `CIVIC-2026-000001`. */
  ticketNumber: string;
  description: string;
  originalLanguage: string;
  translatedSummary: string;
  /** Public URL or data URL of the photo, or null. */
  image: string | null;
  locality: string | null;
  category: ComplaintCategory;
  severity: Severity;
  severityReason: string;
  department: Department;
  suggestedAction: string;
  confidence: Confidence;
  status: TicketStatus;
  /** Id of another ticket flagged as a likely duplicate, or null. */
  possibleDuplicateOf: string | null;
  createdAt: string;
}

/** Options accepted by `getComplaints` for filtering & sorting. */
export interface GetComplaintsOptions {
  category?: ComplaintCategory;
  severity?: Severity;
  status?: TicketStatus;
  department?: Department;
  /** Sort field — defaults to `createdAt`. */
  sortBy?: "createdAt" | "severity" | "status" | "category";
  /** Sort direction — defaults to `desc`. */
  sortDir?: "asc" | "desc";
  /** Limit number of rows (default 100, max 500). */
  limit?: number;
}

/** Result of duplicate detection for a candidate complaint. */
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  /** The ticket(s) flagged as possible duplicates, strongest match first. */
  matches: Array<{
    ticket: ComplaintTicket;
    /** 0–1 similarity score. */
    score: number;
    reason: string;
  }>;
}
