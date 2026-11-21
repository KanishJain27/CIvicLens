import { useMemo, useState } from 'react';
import { RefreshCw, FilePlus2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardStats } from './DashboardStats';
import { TicketFilters } from './TicketFilters';
import { TicketTable } from './TicketTable';
import { TicketDetails } from './TicketDetails';
import { PrioritySection } from './PrioritySection';
import { CategoryChart } from './CategoryChart';
import { useTicketManager } from './useTicketManager';
import type { ComplaintTicket } from '@/types/complaint';

export interface ComplaintDashboardProps {
  /** Navigate to the submit page. */
  onSubmitNew?: () => void;
}

/**
 * Full complaint-management dashboard.
 * Combines live stats, priority table, search/filters, detail modal with
 * status management, urgent complaints panel, category chart, and duplicate
 * warnings — all driven by Member 1's complaint service.
 */
export function ComplaintDashboard({ onSubmitNew }: ComplaintDashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    tickets,
    visibleTickets,
    stats,
    departments,
    filters,
    setFilters,
    loading,
    error,
    updatingId,
    changeStatus,
    reload,
  } = useTicketManager(refreshKey);

  const [selected, setSelected] = useState<ComplaintTicket | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const ticketsById = useMemo(
    () => new Map(tickets.map((t) => [t.id, t])),
    [tickets]
  );

  function openDetails(t: ComplaintTicket) {
    setSelected(t);
    setDetailsOpen(true);
  }

  function inspectDuplicate(t: ComplaintTicket) {
    setSelected(t); // reuse same modal to show the flagged original
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh data
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error-600" />
          <p className="flex-1 text-sm text-error-700">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      {/* Summary statistics */}
      <DashboardStats stats={stats} loading={loading} />

      {/* Urgent complaints */}
      <PrioritySection tickets={tickets} loading={loading} onSelectTicket={openDetails} />

      {/* Search + filters */}
      <TicketFilters
        filters={filters}
        onChange={setFilters}
        departments={departments}
        resultCount={visibleTickets.length}
      />

      {/* Main grid: table + side panels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TicketTable
            tickets={visibleTickets}
            loading={loading}
            updatingId={updatingId}
            onSelectTicket={openDetails}
            onStatusChange={changeStatus}
            emptyAction={
              onSubmitNew ? (
                <Button onClick={onSubmitNew} leftIcon={<FilePlus2 className="h-4 w-4" />}>
                  Submit a complaint
                </Button>
              ) : undefined
            }
          />
        </div>

        <div className="flex flex-col gap-6">
          <CategoryChart tickets={tickets} loading={loading} />
        </div>
      </div>

      {/* Ticket detail modal */}
      <TicketDetails
        ticket={selected}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        ticketsById={ticketsById}
        onInspectDuplicate={inspectDuplicate}
        onStatusChange={changeStatus}
      />
    </div>
  );
}
