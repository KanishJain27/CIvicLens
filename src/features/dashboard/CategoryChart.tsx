import { BarChart3 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { computeCategoryCounts } from './dashboardUtils';
import type { ComplaintTicket } from '@/types/complaint';

const CATEGORY_COLORS = [
  'bg-primary-600',
  'bg-accent-500',
  'bg-warning-500',
  'bg-error-500',
  'bg-secondary-500',
  'bg-success-500',
  'bg-ink-400',
];

export interface CategoryChartProps {
  tickets: ComplaintTicket[];
  loading?: boolean;
}

/**
 * Horizontal bar chart of complaint counts by category.
 * Purely derived from the live ticket list — no hardcoded values.
 */
export function CategoryChart({ tickets, loading = false }: CategoryChartProps) {
  const counts = computeCategoryCounts(tickets);
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const max = counts[0]?.count ?? 0;

  return (
    <Card padding="lg">
      <CardHeader
        title="Category distribution"
        subtitle="Complaints grouped by AI-detected category."
        icon={<BarChart3 className="h-[18px] w-[18px]" />}
      />

      <div className="mt-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-ink-100" />
            ))}
          </div>
        ) : counts.length === 0 ? (
          <EmptyState
            icon={<BarChart3 />}
            title="No complaints yet"
            description="Category distribution will appear once complaints are submitted."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {counts.map((c, i) => {
              const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
              const widthPct = max > 0 ? (c.count / max) * 100 : 0;
              return (
                <div key={c.category} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">{c.category}</span>
                    <span className="tabular-nums text-ink-500">
                      {c.count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={['h-full rounded-full transition-all duration-500', CATEGORY_COLORS[i % CATEGORY_COLORS.length]].join(' ')}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
