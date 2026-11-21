import { ShieldCheck, X } from 'lucide-react';
import { NAV_ITEMS, type RouteId } from './nav';

export interface SidebarProps {
  active: RouteId;
  onNavigate: (route: RouteId) => void;
  /** Mobile drawer open state. When true the sidebar slides in. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Application sidebar. Renders as a fixed column on desktop (lg+) and as a
 * slide-in drawer on mobile. Navigation is driven by `NAV_ITEMS`.
 */
export function Sidebar({ active, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ink-200 bg-white',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Primary navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-ink-200 px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-ink-900">
                CivicLens
              </span>
              <span className="text-xs font-medium text-ink-400">
                Civic Complaint Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Menu
          </p>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-800 ring-1 ring-inset ring-primary-200'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'h-[18px] w-[18px] shrink-0',
                        isActive ? 'text-primary-700' : 'text-ink-400 group-hover:text-ink-600',
                      ].join(' ')}
                    />
                    <span className="flex flex-col items-start leading-tight">
                      <span>{item.label}</span>
                      <span
                        className={[
                          'text-xs font-normal',
                          isActive ? 'text-primary-600' : 'text-ink-400',
                        ].join(' ')}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-ink-200 px-5 py-4">
          <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              CL
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-ink-700">Municipal Officer</span>
              <span className="text-xs text-ink-400">City Administration</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
