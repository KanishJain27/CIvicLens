import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ComplaintDashboard } from '@/features/dashboard';
import { FilePlus2 } from 'lucide-react';
import type { RouteId } from '@/components/layout/nav';

export interface AllComplaintsProps {
  onNavigate: (route: RouteId) => void;
  /** Bumped after each new submission so the dashboard reloads its data. */
  refreshKey?: number;
}

/**
 * All Complaints page.
 * Uses the same live dashboard (table, filters, details, status management)
 * as the Overview — a single source of truth with no duplicated state.
 */
export function AllComplaints({ onNavigate, refreshKey }: AllComplaintsProps) {
  return (
    <PageContainer
      title="All Complaints"
      description="Browse, filter, and manage every submitted ticket."
      maxWidth="wide"
      actions={
        <Button onClick={() => onNavigate('submit')} leftIcon={<FilePlus2 className="h-4 w-4" />}>
          New complaint
        </Button>
      }
    >
      <ComplaintDashboard onSubmitNew={() => onNavigate('submit')} refreshKey={refreshKey} />
    </PageContainer>
  );
}
