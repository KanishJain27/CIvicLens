import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import type { RouteId } from '@/components/layout/nav';
import { Overview } from '@/pages/Overview';
import { SubmitComplaint } from '@/pages/SubmitComplaint';
import { AllComplaints } from '@/pages/AllComplaints';

/**
 * CivicLens application root.
 *
 * Member 2 owns layout + design system + the submission page.
 * Routing is kept as lightweight client-side state so the prototype works
 * without adding a router dependency. Member 3 / future work can swap this
 * for react-router without touching the page components.
 */
function App() {
  const [route, setRoute] = useState<RouteId>('overview');

  function navigate(next: RouteId) {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <AppShell active={route} onNavigate={navigate}>
      {route === 'overview' && <Overview onNavigate={navigate} />}
      {route === 'submit' && (
        <SubmitComplaint
          onGoToComplaints={() => navigate('complaints')}
        />
      )}
      {route === 'complaints' && <AllComplaints onNavigate={navigate} />}
    </AppShell>
  );
}

export default App;
