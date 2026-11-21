import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ListChecks, FilePlus2 } from 'lucide-react';
import type { RouteId } from '@/components/layout/nav';

export interface AllComplaintsProps {
  onNavigate: (route: RouteId) => void;
}

/**
 * All Complaints page — layout shell only.
 *
 * Member 3 will implement the filter bar, ticket cards, and status management
 * here using the shared layout & UI components. No fake data is shown.
 */
export function AllComplaints({ onNavigate }: AllComplaintsProps) {
  return (
    <PageContainer
      title="All Complaints"
      description="Browse, filter, and manage every submitted ticket."
      actions={
        <Button onClick={() => onNavigate('submit')} leftIcon={<FilePlus2 className="h-4 w-4" />}>
          New complaint
        </Button>
      }
    >
      <Card padding="lg">
        <EmptyState
          icon={<ListChecks />}
          title="Complaint list coming soon"
          description="Member 3 will connect live ticket data, filters, and status management to this page. No mock data is shown."
          action={
            <Button variant="primary" onClick={() => onNavigate('submit')} leftIcon={<FilePlus2 className="h-4 w-4" />}>
              Submit a complaint
            </Button>
          }
        />
      </Card>
    </PageContainer>
  );
}
