import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { RouteId } from './nav';

export interface AppShellProps {
  active: RouteId;
  onNavigate: (route: RouteId) => void;
  children: ReactNode;
}

/**
 * Application shell: persistent sidebar + sticky header + scrollable content
 * area. Responsive — sidebar collapses to a drawer below the lg breakpoint.
 *
 * Member 3 renders dashboard pages inside this; App.tsx wires routing.
 */
export function AppShell({ active, onNavigate, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar
        active={active}
        onNavigate={onNavigate}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Content column — offset by sidebar width on desktop */}
      <div className="flex min-h-screen flex-col lg:pl-72">
        <Header
          active={active}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onNavigate={onNavigate}
        />
        <main className="flex-1 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
