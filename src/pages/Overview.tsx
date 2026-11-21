import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { ComplaintDashboard } from '@/features/dashboard';
import { FilePlus2 } from 'lucide-react';
import type { RouteId } from '@/components/layout/nav';

export interface OverviewProps {
  onNavigate: (route: RouteId) => void;
}

/**
 * Overview / dashboard landing page.
 * Renders the full live complaint-management dashboard (Member 3) inside
 * Member 2's page layout. All statistics derive from real complaint data.
 */
export function Overview({ onNavigate }: OverviewProps) {
  return (
    <PageContainer
      title="Overview"
      description="Monitor, prioritise, and manage citizen complaints in real time."
      maxWidth="wide"
      actions={
        <Button onClick={() => onNavigate('submit')} leftIcon={<FilePlus2 className="h-4 w-4" />}>
          New complaint
        </Button>
      }
    >
      <ComplaintDashboard onSubmitNew={() => onNavigate('submit')} />
    </PageContainer>
  );
}
