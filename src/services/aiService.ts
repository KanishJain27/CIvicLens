import { supabase, COMPLAINTS_TABLE } from "@/lib/supabase";
import type {
  ComplaintAnalysis,
  ComplaintInput,
} from "@/types/complaint";
import { routeDepartment } from "@/services/departmentRouting";

/**
 * CivicLens AI analysis service.
 *
 * `analyzeComplaint` proxies the complaint text (+ optional image) to the
 * secure `analyze-complaint` Supabase Edge Function, which calls the Gemini
 * API server-side so the API key never reaches the browser. The function
 * returns a fully-validated `ComplaintAnalysis` object, or throws a typed
 * error the caller can surface to the user.
 *
 * Function signature (integration contract for Members 2 & 3):
 *   analyzeComplaint(description: string, image?: string): Promise<ComplaintAnalysis>
 */

export class AiServiceError extends Error {
  /** HTTP-ish status code for surfacing appropriate UI feedback. */
  readonly status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "AiServiceError";
    this.status = status;
  }
}

const ALLOWED_CATEGORIES = [
  "Roads and potholes",
  "Waste management",
  "Water supply and leakage",
  "Electricity and streetlights",
  "Trees and fallen branches",
  "Drainage and sewage",
  "Other",
] as const;

const ALLOWED_SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
const ALLOWED_CONFIDENCE = ["High", "Medium", "Low"] as const;

type RawAnalysis = Partial<{
  originalLanguage: string;
  translatedSummary: string;
  category: string;
  severity: string;
  severityReason: string;
  department: string;
  suggestedAction: string;
  confidence: string;
}>;

function coerce<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value === "string") {
    const v = value.trim() as T;
    if (allowed.includes(v)) return v;
  }
  return fallback;
}

/**
 * Analyze a complaint using the secure Gemini edge function.
 *
 * @param description the complaint text (English or regional Indian language). Required.
 * @param image optional photo as a data URL (e.g. `data:image/jpeg;base64,...`) or an http(s) URL.
 * @returns a validated `ComplaintAnalysis`. The `department` is always
 *          re-derived from the category via `routeDepartment` so the mapping
 *          is guaranteed consistent even if the model drifts.
 * @throws `AiServiceError` on network, config, or parsing failures.
 */
export async function analyzeComplaint(
  description: string,
  image?: string
): Promise<ComplaintAnalysis> {
  const text = (description ?? "").trim();
  if (!text) {
    throw new AiServiceError("Complaint description is required.", 400);
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-complaint`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };

  let res: Response;
  try {
    res = await fetch(functionUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ description: text, image }),
    });
  } catch (e) {
    throw new AiServiceError(
      "Could not reach the AI service. Check your connection and try again.",
      0
    );
  }

  if (!res.ok) {
    let message = "AI analysis failed.";
    try {
      const errBody = await res.json();
      if (errBody?.error) message = errBody.error;
    } catch {
      // keep default
    }
    throw new AiServiceError(message, res.status);
  }

  const raw = (await res.json()) as RawAnalysis;

  const category = coerce(raw.category, ALLOWED_CATEGORIES, "Other");

  const analysis: ComplaintAnalysis = {
    originalLanguage: (raw.originalLanguage ?? "Unknown").trim() || "Unknown",
    translatedSummary:
      (raw.translatedSummary ?? text).trim().slice(0, 500) || text.slice(0, 500),
    category,
    severity: coerce(raw.severity, ALLOWED_SEVERITIES, "Medium"),
    severityReason:
      (raw.severityReason ?? "Severity could not be determined from the complaint.")
        .trim()
        .slice(0, 200) || "Severity could not be determined.",
    // Always re-derive department from the category so routing is consistent.
    department: routeDepartment(category),
    suggestedAction:
      (raw.suggestedAction ?? "Forward to the responsible department for inspection.")
        .trim()
        .slice(0, 200) || "Forward to the responsible department.",
    confidence: coerce(raw.confidence, ALLOWED_CONFIDENCE, "Medium"),
  };

  return analysis;
}
