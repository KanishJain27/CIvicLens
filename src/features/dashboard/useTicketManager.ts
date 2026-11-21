import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComplaintTicket, GetComplaintsOptions, TicketStatus } from '@/types/complaint';
import { getComplaints, updateComplaintStatus } from '@/services/complaintService';
import {
  applyFilters,
  computeStats,
  findDuplicateFlags,
  sortByPriority,
  type TicketFilterState,
  type TicketStats,
} from './dashboardUtils';

const STATUSES: TicketStatus[] = ['Open', 'Acknowledged', 'In Progress', 'Resolved'];

/**
 * Central dashboard data hook.
 *
 * Loads all tickets through Member 1's `getComplaints` service, derives
 * statistics and priority sorting, applies filters/search, and exposes
 * status updates through `updateComplaintStatus`. Changes persist to the
 * database immediately, and statistics are recomputed from the refreshed
 * ticket list so the dashboard always reflects real data.
 *
 * Refresh strategy: full reload after a status change keeps stats, list,
 * and any server-side derived fields (e.g. ticket numbers) consistent,
 * while an optimistic in-place patch renders the change instantly.
 */
export function useTicketManager(refreshKey: number = 0) {
  const [tickets, setTickets] = useState<ComplaintTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<TicketFilterState>({
    severity: 'all',
    category: 'all',
    department: 'all',
    status: 'all',
    search: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaints({ sortBy: 'createdAt', sortDir: 'desc', limit: 500 });
      setTickets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  /** Update a ticket's status through the real service, then refresh data. */
  const changeStatus = useCallback(
    async (ticket: ComplaintTicket, status: TicketStatus) => {
      if (ticket.status === status) return true;
      setUpdatingId(ticket.id);
      // Optimistic patch so the UI responds instantly.
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status } : t))
      );
      try {
        await updateComplaintStatus(ticket.id, status);
        await load(); // re-fetch so stats + list stay authoritative
        return true;
      } catch (e) {
        // Revert on failure and surface the error.
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, status: ticket.status } : t))
        );
        setError(
          e instanceof Error ? e.message : 'Failed to update ticket status.'
        );
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [load]
  );

  /** Live, unfiltered tickets — used for stats and category chart. */
  const allTickets = tickets;

  const stats: TicketStats = useMemo(() => computeStats(allTickets), [allTickets]);
  const duplicateFlags = useMemo(() => findDuplicateFlags(allTickets), [allTickets]);

  /** Filtered + priority-sorted list for the table. */
  const visibleTickets = useMemo(
    () => sortByPriority(applyFilters(allTickets, filters)),
    [allTickets, filters]
  );

  const departments = useMemo(
    () => [...new Set(allTickets.map((t) => t.department))].sort(),
    [allTickets]
  );

  return {
    tickets: allTickets,
    visibleTickets,
    stats,
    duplicateFlags,
    departments,
    filters,
    setFilters,
    loading,
    error,
    updatingId,
    changeStatus,
    reload: load,
  };
}

/** Options passthrough type re-export for consumers building custom queries. */
export type { GetComplaintsOptions };
export { STATUSES };
