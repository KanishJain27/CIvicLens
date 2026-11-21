import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';
import type { RouteId } from '@/components/layout/nav';

export interface OverviewProps {
  onNavigate: (route: RouteId) => void;
}

/**
 * Overview / dashboard landing page — visual foundation only.
 *
 * Member 3 will replace the placeholder summary area with live statistics,
 * charts, and ticket cards using the layout components from this file.
 * No fake data is rendered here.
 */
export function Overview({ onNavigate }: OverviewProps) {
  return (
    <PageContainer
      title="Overview"
      description="Civic complaint intelligence at a glance."
      actions={
        <Button onClick={() => onNavigate('submit')} leftIcon={<FilePlus2 className="h-4 w-4" />}>
          New complaint
        </Button>
      }
    >
      {/* Welcome banner */}
      <Card padding="lg" className="mb-6 overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900 text-white ring-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary-100" />
              <h2 className="text-xl font-bold text-white">CivicLens Control Centre</h2>
            </div>
            <p className="max-w-xl text-sm text-primary-100">
              AI-assisted civic complaint intake, triage, and departmental routing.
              Submit issues in any Indian language and let the platform categorise,
              prioritise, and assign them automatically.
            </p>
          </div>
        </div>
      </Card>

      {/* Summary card container — Member 3 will populate with live tiles */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTileSkeleton label="Total complaints" />
        <SummaryTileSkeleton label="Open" />
        <SummaryTileSkeleton label="Critical severity" />
        <SummaryTileSkeleton label="Resolved" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <CardHeader
            title="Recent complaints"
            subtitle="Latest tickets across all departments."
            icon={<ListChecks className="h-[18px] w-[18px]" />}
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('complaints')}>
                View all
              </Button>
            }
          />
          <div className="mt-5">
            <EmptyState
              icon={<LayoutDashboard />}
              title="Dashboard data will appear here"
              description="Member 3 will connect live complaint data to this panel. No mock data is shown."
            />
          </div>
        </Card>

        <Card padding="lg">
          <CardHeader
            title="Quick actions"
            subtitle="Common tasks for officers."
            icon={<FilePlus2 className="h-[18px] w-[18px]" />}
          />
          <div className="mt-5 flex flex-col gap-2">
            <Button variant="outline" fullWidth onClick={() => onNavigate('submit')} leftIcon={<FilePlus2 className="h-4 w-4" />}>
              Submit a complaint
            </Button>
            <Button variant="outline" fullWidth onClick={() => onNavigate('complaints')} leftIcon={<ListChecks className="h-4 w-4" />}>
              Browse all complaints
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

/** Neutral placeholder tile. Member 3 replaces with a live stat tile. */
function SummaryTileSkeleton({ label }: { label: string }) {
  return (
    <Card padding="md" hover>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tabular-nums text-ink-300">—</p>
    </Card>
  );
}
