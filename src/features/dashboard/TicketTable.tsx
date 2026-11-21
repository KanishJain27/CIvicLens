import { useState } from 'react';
import { ChevronDown, Copy, Check, MapPin, Building2 } from 'lucide-react';
import { SeverityBadge, StatusBadge, ConfidenceBadge } from '@/components/ui/StatusBadges';
import { Badge } from '@/components/ui/Badge';
import type { ComplaintTicket, TicketStatus } from '@/types/complaint';
import { STATUSES } from './useTicketManager';

const SEVERITY_ROW_TONE: Record<string, string> = {
  Critical: 'border-l-4 border-l-error-500 bg-error-50/40',
  High: 'border-l-4 border-l-warning-500',
  Medium: 'border-l-4 border-l-yellow-400',
  Low: 'border-l-4 border-l-success-500',
};

export interface TicketTableProps {
  tickets: ComplaintTicket[];
  loading?: boolean;
  updatingId?: string | null;
  onSelectTicket: (ticket: ComplaintTicket) => void;
  onStatusChange: (ticket: ComplaintTicket, status: TicketStatus) => Promise<boolean>;
  emptyAction?: React.ReactNode;
}

/**
 * Priority-sorted ticket management table.
 * Sorted Critical → High → Medium → Low; within a severity, unresolved
 * tickets appear first and older before newer. Each row expands inline to
 * reveal a status dropdown and a details toggle.
 */
export function TicketTable({
  tickets,
  loading = false,
  updatingId,
  onSelectTicket,
  onStatusChange,
  emptyAction,
}: TicketTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyTicketNumber(t: ComplaintTicket) {
    navigator.clipboard?.writeText(t.ticketNumber).then(() => {
      setCopiedId(t.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white/60 px-6 py-14 text-center">
        <h3 className="text-base font-semibold text-ink-800">No complaints found</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-500">
          No tickets match the current filters. Try clearing filters or submitting a new complaint.
        </p>
        {emptyAction && <div className="mt-5">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
      {/* Table header — desktop */}
      <div className="hidden grid-cols-12 gap-3 border-b border-ink-200 bg-ink-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-400 lg:grid">
        <span className="col-span-2">Ticket</span>
        <span className="col-span-4">Description</span>
        <span className="col-span-2">Category</span>
        <span className="col-span-1">Severity</span>
        <span className="col-span-2">Department</span>
        <span className="col-span-1">Status</span>
      </div>

      <ul className="divide-y divide-ink-200">
        {tickets.map((t) => {
          const isExpanded = expandedId === t.id;
          const isUpdating = updatingId === t.id;
          return (
            <li key={t.id} className={SEVERITY_ROW_TONE[t.severity] ?? ''}>
              <button
                onClick={() => onSelectTicket(t)}
                className="grid w-full grid-cols-1 gap-3 px-5 py-4 text-left transition-colors hover:bg-ink-50/70 lg:grid-cols-12 lg:items-center"
              >
                {/* Ticket ID + locality */}
                <span className="col-span-2 flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-primary-700">
                    {t.ticketNumber}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTicketNumber(t);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          copyTicketNumber(t);
                        }
                      }}
                      className="text-ink-300 hover:text-ink-600"
                      aria-label={`Copy ticket number ${t.ticketNumber}`}
                    >
                      {copiedId === t.id ? (
                        <Check className="h-3.5 w-3.5 text-success-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </span>
                  {t.locality && (
                    <span className="flex items-center gap-1 text-xs text-ink-400">
                      <MapPin className="h-3 w-3" />
                      {t.locality}
                    </span>
                  )}
                </span>

                {/* Description */}
                <span className="col-span-4 text-sm text-ink-800">
                  {t.translatedSummary || t.description}
                </span>

                {/* Category */}
                <span className="col-span-2 text-sm text-ink-600">{t.category}</span>

                {/* Severity */}
                <span className="col-span-1">
                  <SeverityBadge severity={t.severity} />
                </span>

                {/* Department */}
                <span className="col-span-2 flex items-center gap-1.5 text-sm text-ink-600">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                  <span className="truncate">{t.department}</span>
                </span>

                {/* Status */}
                <span className="col-span-1">
                  <StatusBadge status={t.status} />
                </span>
              </button>

              {/* Inline status control + expand toggle */}
              <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
                <label className="flex items-center gap-2 text-xs font-medium text-ink-500">
                  Update status
                  <select
                    value={t.status}
                    disabled={isUpdating}
                    onChange={(e) => onStatusChange(t, e.target.value as TicketStatus)}
                    className="h-8 rounded-lg border border-ink-300 bg-white px-2 text-xs text-ink-800 focus:border-primary-500 focus:outline-none focus:shadow-focus disabled:opacity-60"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {isUpdating && (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  )}
                </label>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
                >
                  Quick view
                  <ChevronDown
                    className={['h-3.5 w-3.5 transition-transform', isExpanded ? 'rotate-180' : ''].join(' ')}
                  />
                </button>

                {t.possibleDuplicateOf && (
                  <Badge tone="warning" size="sm">
                    Possible duplicate
                  </Badge>
                )}
              </div>

              {/* Expanded quick view */}
              {isExpanded && (
                <div className="animate-slide-up border-t border-ink-200 bg-ink-50/50 px-5 py-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
                        Original complaint
                      </p>
                      <p className="mt-1 text-sm text-ink-700">{t.description}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
                        Language detected
                      </p>
                      <p className="mt-1 text-sm text-ink-700">{t.originalLanguage}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
                        English summary
                      </p>
                      <p className="mt-1 text-sm text-ink-700">{t.translatedSummary}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
                        Suggested action
                      </p>
                      <p className="mt-1 text-sm text-ink-700">{t.suggestedAction}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
                        Submitted
                      </p>
                      <p className="mt-1 text-sm text-ink-700">
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
