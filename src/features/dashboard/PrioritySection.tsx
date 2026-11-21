import { Flame, ChevronRight, AlertOctagon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { SeverityBadge, StatusBadge } from '@/components/ui/StatusBadges';
import { sortByPriority } from './dashboardUtils';
import type { ComplaintTicket } from '@/types/complaint';

export interface PrioritySectionProps {
  tickets: ComplaintTicket[];
  loading?: boolean;
  onSelectTicket: (ticket: ComplaintTicket) => void;
  maxItems?: number;
}

/**
 * Urgent complaints panel — shows Critical tickets first, then High.
 * Each row is clickable to open the ticket detail modal.
 */
export function PrioritySection({
  tickets,
  loading = false,
  onSelectTicket,
  maxItems = 5,
}: PrioritySectionProps) {
  const urgent = sortByPriority(
    tickets.filter((t) => t.severity === 'Critical' || t.severity === 'High')
  ).slice(0, maxItems);

  return (
    <Card padding="lg">
      <CardHeader
        title="Urgent complaints"
        subtitle="Critical and high-severity issues, longest-waiting first."
        icon={<Flame className="h-[18px] w-[18px]" />}
        action={
          <Badge tone="error" size="sm">
            {urgent.length} urgent
          </Badge>
        }
      />

      <div className="mt-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />
            ))}
          </div>
        ) : urgent.length === 0 ? (
          <EmptyState
            icon={<AlertOctagon />}
            title="No urgent complaints"
            description="Nothing flagged as Critical or High severity right now."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="flex flex-col divide-y divide-ink-200">
            {urgent.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onSelectTicket(t)}
                  className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-ink-50"
                >
                  {t.severity === 'Critical' && (
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error-500" />
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary-700">
                        {t.ticketNumber}
                      </span>
                      <SeverityBadge severity={t.severity} />
                      {t.possibleDuplicateOf && (
                        <Badge tone="warning" size="sm">
                          Possible duplicate
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-ink-700">
                      {t.translatedSummary || t.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
                      <StatusBadge status={t.status} />
                      <span>{t.department}</span>
                      {t.locality && <span>· {t.locality}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
