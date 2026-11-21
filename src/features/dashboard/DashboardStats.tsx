import { Inbox, AlertTriangle, Flame, CheckCircle2, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { TicketStats } from './dashboardUtils';

export interface DashboardStatsProps {
  stats: TicketStats;
  loading?: boolean;
}

interface StatTile {
  label: string;
  value: number;
  icon: typeof Inbox;
  tone: string;
  bg: string;
}

/**
 * Dynamic summary tiles: Total, Open, Critical, High-Priority, Resolved.
 * All values are computed from the live ticket list — never hardcoded.
 */
export function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
  const tiles: StatTile[] = [
    { label: 'Total Complaints', value: stats.total, icon: FileText, tone: 'text-primary-700', bg: 'bg-primary-50' },
    { label: 'Open', value: stats.open, icon: Inbox, tone: 'text-secondary-600', bg: 'bg-secondary-100' },
    { label: 'Critical', value: stats.critical, icon: Flame, tone: 'text-error-600', bg: 'bg-error-50' },
    { label: 'High Priority', value: stats.highPriority, icon: AlertTriangle, tone: 'text-warning-600', bg: 'bg-warning-50' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, tone: 'text-success-600', bg: 'bg-success-50' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Card key={tile.label} padding="md" hover>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
                {tile.label}
              </p>
              <span className={['flex h-8 w-8 items-center justify-center rounded-lg', tile.bg, tile.tone].join(' ')}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className={['mt-2 text-3xl font-bold tabular-nums', loading ? 'animate-pulse text-ink-300' : 'text-ink-900'].join(' ')}>
              {loading ? '—' : tile.value}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
