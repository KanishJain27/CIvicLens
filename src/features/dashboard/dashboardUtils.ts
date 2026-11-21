import type {
  ComplaintCategory,
  ComplaintTicket,
  Severity,
  TicketStatus,
} from '@/types/complaint';

/**
 * Dashboard data utilities: sorting, filtering, and derived statistics.
 * All functions are pure so they can be unit-tested and reused by hooks.
 */

/** Severity rank for priority sorting (lower = more urgent). */
const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

/** Status rank: unresolved statuses come before resolved ones. */
const STATUS_RANK: Record<TicketStatus, number> = {
  Open: 0,
  Acknowledged: 1,
  'In Progress': 2,
  Resolved: 3,
};

/**
 * Dashboard summary statistics derived from the full ticket list.
 * Everything is computed client-side from real data — never hardcoded.
 */
export interface TicketStats {
  total: number;
  open: number;
  critical: number;
  highPriority: number;
  resolved: number;
}

export function computeStats(tickets: ComplaintTicket[]): TicketStats {
  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status !== 'Resolved').length,
    critical: tickets.filter((t) => t.severity === 'Critical').length,
    highPriority: tickets.filter(
      (t) => t.severity === 'Critical' || t.severity === 'High'
    ).length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
  };
}

/**
 * Sort tickets by severity priority (Critical → High → Medium → Low).
 * Within the same severity, unresolved tickets come first and older tickets
 * rank before newer ones, so officers see the longest-waiting urgent issues
 * at the top.
 */
export function sortByPriority(tickets: ComplaintTicket[]): ComplaintTicket[] {
  return [...tickets].sort((a, b) => {
    const sevDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sevDiff !== 0) return sevDiff;

    const statusDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (statusDiff !== 0) return statusDiff;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/** Active filter state shared by the filter bar and table. */
export interface TicketFilterState {
  severity: Severity | 'all';
  category: ComplaintCategory | 'all';
  department: string;
  status: TicketStatus | 'all';
  search: string;
}

export const INITIAL_FILTERS: TicketFilterState = {
  severity: 'all',
  category: 'all',
  department: 'all',
  status: 'all',
  search: '',
};

/** Apply all filters together (AND logic). Search covers ticket id, description, locality. */
export function applyFilters(
  tickets: ComplaintTicket[],
  filters: TicketFilterState
): ComplaintTicket[] {
  const q = filters.search.trim().toLowerCase();

  return tickets.filter((t) => {
    if (filters.severity !== 'all' && t.severity !== filters.severity) return false;
    if (filters.category !== 'all' && t.category !== filters.category) return false;
    if (filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.department !== 'all' && t.department !== filters.department) return false;

    if (q) {
      const haystack = [
        t.ticketNumber,
        t.id,
        t.description,
        t.translatedSummary,
        t.locality ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** Count of complaints per category, sorted descending by count. */
export function computeCategoryCounts(
  tickets: ComplaintTicket[]
): Array<{ category: ComplaintCategory; count: number }> {
  const counts = new Map<ComplaintCategory, number>();
  for (const t of tickets) {
    counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/** Tickets flagged as possible duplicates (never auto-deleted, only surfaced). */
export function findDuplicateFlags(tickets: ComplaintTicket[]): ComplaintTicket[] {
  return tickets.filter((t) => t.possibleDuplicateOf !== null);
}
