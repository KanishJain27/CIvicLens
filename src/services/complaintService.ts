import { supabase, COMPLAINTS_TABLE } from "@/lib/supabase";
import type {
  ComplaintAnalysis,
  ComplaintInput,
  ComplaintTicket,
  GetComplaintsOptions,
  Severity,
  TicketStatus,
} from "@/types/complaint";
import { analyzeComplaint } from "@/services/aiService";

/**
 * CivicLens complaint service — the single entry point Members 2 & 3 use to
 * create, read, and update complaint tickets. All persistence goes through
 * the Supabase `complaints` table.
 *
 * Integration contract:
 *   createComplaintTicket(input: ComplaintInput): Promise<ComplaintTicket>
 *   getComplaints(options?: GetComplaintsOptions): Promise<ComplaintTicket[]>
 *   updateComplaintStatus(ticketId: string, status: TicketStatus): Promise<ComplaintTicket>
 *   getComplaintById(id: string): Promise<ComplaintTicket | null>
 *   uploadComplaintImage(file: File): Promise<string>
 */

/** Row shape returned by Supabase (snake_case DB columns). */
interface ComplaintRow {
  id: string;
  ticket_number: string;
  description: string;
  original_language: string;
  translated_summary: string;
  image_url: string | null;
  locality: string | null;
  category: ComplaintTicket["category"];
  severity: Severity;
  severity_reason: string;
  department: ComplaintTicket["department"];
  suggested_action: string;
  confidence: ComplaintTicket["confidence"];
  status: TicketStatus;
  possible_duplicate_of: string | null;
  created_at: string;
}

function rowToTicket(row: ComplaintRow): ComplaintTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    description: row.description,
    originalLanguage: row.original_language,
    translatedSummary: row.translated_summary,
    image: row.image_url,
    locality: row.locality,
    category: row.category,
    severity: row.severity,
    severityReason: row.severity_reason,
    department: row.department,
    suggestedAction: row.suggested_action,
    confidence: row.confidence,
    status: row.status,
    possibleDuplicateOf: row.possible_duplicate_of,
    createdAt: row.created_at,
  };
}

/**
 * Analyze a complaint with the AI service and persist it as a ticket.
 *
 * Steps:
 *  1. Run AI analysis (via the secure edge function) unless the caller
 *     supplied a pre-computed `analysis` (used in tests / re-submission).
 *  2. Insert the ticket into the `complaints` table. The ticket number is
 *     generated server-side by the database, so it is always unique.
 *  3. Return the fully-populated `ComplaintTicket`.
 *
 * @param input description (required) + optional image, locality, analysis,
 *              and possibleDuplicateOf.
 */
export async function createComplaintTicket(
  input: ComplaintInput
): Promise<ComplaintTicket> {
  const description = (input.description ?? "").trim();
  if (!description) {
    throw new Error("Complaint description is required.");
  }

  const analysis: ComplaintAnalysis =
    input.analysis ?? (await analyzeComplaint(description, input.image));

  const insertRow = {
    description,
    original_language: analysis.originalLanguage,
    translated_summary: analysis.translatedSummary,
    image_url: input.image ?? null,
    locality: input.locality?.trim() || null,
    category: analysis.category,
    severity: analysis.severity,
    severity_reason: analysis.severityReason,
    department: analysis.department,
    suggested_action: analysis.suggestedAction,
    confidence: analysis.confidence,
    status: "Open" as TicketStatus,
    possible_duplicate_of: input.possibleDuplicateOf ?? null,
  };

  const { data, error } = await supabase
    .from(COMPLAINTS_TABLE)
    .insert(insertRow)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create complaint ticket: ${error?.message ?? "unknown error"}`
    );
  }

  return rowToTicket(data as ComplaintRow);
}

/**
 * Retrieve complaint tickets with optional filtering and sorting.
 *
 * @param options category / severity / status / department filters plus
 *                sortBy, sortDir, and limit (default 100, capped at 500).
 * @returns an array of `ComplaintTicket`, newest first by default.
 */
export async function getComplaints(
  options: GetComplaintsOptions = {}
): Promise<ComplaintTicket[]> {
  const {
    category,
    severity,
    status,
    department,
    sortBy = "createdAt",
    sortDir = "desc",
    limit = 100,
  } = options;

  const cappedLimit = Math.min(Math.max(1, limit), 500);

  let query = supabase.from(COMPLAINTS_TABLE).select("*");

  if (category) query = query.eq("category", category);
  if (severity) query = query.eq("severity", severity);
  if (status) query = query.eq("status", status);
  if (department) query = query.eq("department", department);

  const columnMap: Record<NonNullable<GetComplaintsOptions["sortBy"]>, string> = {
    createdAt: "created_at",
    severity: "severity",
    status: "status",
    category: "category",
  };
  query = query.order(columnMap[sortBy], {
    ascending: sortDir === "asc",
  });

  // Severity is text ("Critical" > "High" > "Medium" > "Low"); when sorting by
  // severity, a secondary created_at sort keeps a stable order within a level.
  if (sortBy === "severity") {
    query = query.order("created_at", { ascending: false });
  }

  query = query.limit(cappedLimit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch complaints: ${error.message}`);
  }
  if (!data) return [];

  return (data as ComplaintRow[]).map(rowToTicket);
}

/**
 * Fetch a single ticket by id.
 * @returns the ticket, or `null` if not found.
 */
export async function getComplaintById(
  id: string
): Promise<ComplaintTicket | null> {
  const { data, error } = await supabase
    .from(COMPLAINTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch complaint ${id}: ${error.message}`);
  }
  if (!data) return null;
  return rowToTicket(data as ComplaintRow);
}

/**
 * Update the status of a ticket (e.g. Open → Acknowledged → In Progress → Resolved).
 * @returns the updated ticket.
 */
export async function updateComplaintStatus(
  ticketId: string,
  status: TicketStatus
): Promise<ComplaintTicket> {
  const { data, error } = await supabase
    .from(COMPLAINTS_TABLE)
    .update({ status })
    .eq("id", ticketId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update ticket ${ticketId}: ${error?.message ?? "not found"}`
    );
  }

  return rowToTicket(data as ComplaintRow);
}

/**
 * Mark a ticket as a possible duplicate of another by storing the reference id.
 * Does not delete or reject the ticket — it only sets the `possible_duplicate_of`
 * pointer so the dashboard can surface the relationship.
 */
export async function flagDuplicate(
  ticketId: string,
  duplicateOfId: string | null
): Promise<ComplaintTicket> {
  const { data, error } = await supabase
    .from(COMPLAINTS_TABLE)
    .update({ possible_duplicate_of: duplicateOfId })
    .eq("id", ticketId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to flag duplicate on ticket ${ticketId}: ${
        error?.message ?? "not found"
      }`
    );
  }
  return rowToTicket(data as ComplaintRow);
}

/**
 * Upload a complaint photo to Supabase Storage and return its public URL.
 *
 * The frontend form (Member 2) can call this when the user attaches an image,
 * then pass the returned URL as `input.image` to `createComplaintTicket`.
 *
 * @param file the photo selected by the user.
 * @returns a public URL that can be stored on the ticket and rendered in the dashboard.
 */
export async function uploadComplaintImage(file: File): Promise<string> {
  // Lazy import to avoid pulling storage types into every consumer.
  const { COMPLAINTS_BUCKET } = await import("@/lib/supabase");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(COMPLAINTS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (upErr) {
    throw new Error(`Image upload failed: ${upErr.message}`);
  }

  const { data: pub } = supabase.storage
    .from(COMPLAINTS_BUCKET)
    .getPublicUrl(path);

  return pub.publicUrl;
}
