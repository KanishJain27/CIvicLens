import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import type { RouteId } from '@/components/layout/nav';
import { Overview } from '@/pages/Overview';
import { SubmitComplaint } from '@/pages/SubmitComplaint';
import { AllComplaints } from '@/pages/AllComplaints';

/**
 * CivicLens application root.
 *
 * Member 2 owns layout + design system + the submission page. Routing is
 * kept as lightweight client-side state so the prototype works without
 * adding a router dependency. A submission counter is passed to both pages
 * so newly created tickets appear on the dashboard without a manual refresh.
 */
function App() {
  const [route, setRoute] = useState<RouteId>('overview');
  const [submissionCount, setSubmissionCount] = useState(0);

  function navigate(next: RouteId) {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <AppShell active={route} onNavigate={navigate}>
      {route === 'overview' && (
        <Overview onNavigate={navigate} refreshKey={submissionCount} />
      )}
      {route === 'submit' && (
        <SubmitComplaint
          onSubmitted={() => setSubmissionCount((c) => c + 1)}
          onGoToComplaints={() => navigate('complaints')}
        />
      )}
      {route === 'complaints' && (
        <AllComplaints onNavigate={navigate} refreshKey={submissionCount} />
      )}
    </AppShell>
  );
}

export default App;
