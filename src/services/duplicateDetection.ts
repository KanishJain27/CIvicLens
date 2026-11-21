import type {
  ComplaintInput,
  ComplaintTicket,
  DuplicateDetectionResult,
} from "@/types/complaint";
import { getComplaints } from "@/services/complaintService";

/**
 * Lightweight duplicate detection for civic complaints.
 *
 * Compares a candidate complaint against existing tickets using:
 *  - normalized text similarity (token-overlap / Jaccard) on the description,
 *  - category match,
 *  - locality match when the candidate provides a locality.
 *
 * A ticket is flagged as a possible duplicate when its composite score is at
 * least `DUPLICATE_THRESHOLD`. Complaints are never automatically rejected or
 * deleted — the caller decides what to do with the flag.
 */

/** Minimum composite score (0–1) to flag a possible duplicate. */
export const DUPLICATE_THRESHOLD = 0.55;

/** Weight of each signal in the composite score. */
const WEIGHTS = {
  text: 0.6,
  category: 0.25,
  locality: 0.15,
} as const;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter((t) => t.length > 2));
}

/** Jaccard similarity between two token sets. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function localitiesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalize(a) === normalize(b);
}

/**
 * Detect possible duplicates of a candidate complaint among existing tickets.
 *
 * @param input the candidate complaint (description + optional category/locality).
 * @param pool optional pre-fetched list of tickets to compare against. When
 *             omitted, existing tickets are fetched from storage via
 *             `getComplaints`. Pass a pool to avoid extra network calls when
 *             the caller already has the list.
 * @returns a `DuplicateDetectionResult` — `isDuplicate` plus ranked matches.
 */
export async function detectDuplicate(
  input: ComplaintInput,
  pool?: ComplaintTicket[]
): Promise<DuplicateDetectionResult> {
  const existing = pool ?? (await getComplaints({ limit: 500 }));

  const candidateTokens = tokenize(input.description);
  const candidateLocality = input.locality?.trim() || null;

  const matches: DuplicateDetectionResult["matches"] = [];

  for (const ticket of existing) {
    const textScore = jaccard(candidateTokens, tokenize(ticket.description));
    const categoryScore =
      input.analysis?.category === ticket.category ? 1 : 0;
    const localityScore = localitiesMatch(candidateLocality, ticket.locality)
      ? 1
      : 0;

    const score =
      textScore * WEIGHTS.text +
      categoryScore * WEIGHTS.category +
      localityScore * WEIGHTS.locality;

    if (score >= DUPLICATE_THRESHOLD) {
      const reasons: string[] = [];
      if (textScore > 0) reasons.push(`${Math.round(textScore * 100)}% text overlap`);
      if (categoryScore > 0) reasons.push("same category");
      if (localityScore > 0) reasons.push("same locality");
      matches.push({ ticket, score, reason: reasons.join(", ") });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return { isDuplicate: matches.length > 0, matches };
}
