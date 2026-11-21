import { Menu, Bell, Search } from 'lucide-react';
import { NAV_ITEMS, type RouteId } from './nav';

export interface HeaderProps {
  active: RouteId;
  onOpenMobileNav: () => void;
  onNavigate: (route: RouteId) => void;
}

/**
 * Top navigation bar. Shows the current page title, a search affordance,
 * a notification bell, and a mobile menu trigger.
 */
export function Header({ active, onOpenMobileNav, onNavigate }: HeaderProps) {
  const current = NAV_ITEMS.find((n) => n.id === active);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title (mobile) / breadcrumb (desktop) */}
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
          CivicLens
        </span>
        <h2 className="text-base font-semibold text-ink-900 sm:text-lg">
          {current?.label ?? 'Overview'}
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search — decorative affordance; Member 3 can wire to ticket search */}
        <div className="hidden items-center rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-400 md:flex">
          <Search className="mr-2 h-[18px] w-[18px]" />
          <span>Search complaints…</span>
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-sm font-semibold text-white">
            CL
          </span>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium text-ink-800">Officer</span>
            <span className="text-xs text-ink-400">Administrator</span>
          </div>
        </div>

        {/* Desktop quick nav (kept minimal; sidebar is primary) */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={[
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active === item.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
