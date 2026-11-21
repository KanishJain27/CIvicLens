import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Placeholder shown when a list/section has no content yet.
 * Member 3 can use this on the dashboard when there are no tickets.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white/60 px-6 py-14 text-center',
        className,
      ].join(' ')}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-500 [&>svg]:h-7 [&>svg]:w-7">
        {icon ?? <Inbox />}
      </span>
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
