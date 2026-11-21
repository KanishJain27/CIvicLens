import type { ReactNode } from 'react';

type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  success: 'bg-success-50 text-success-700 ring-success-200',
  warning: 'bg-warning-50 text-warning-700 ring-warning-200',
  error: 'bg-error-50 text-error-700 ring-error-200',
  info: 'bg-accent-50 text-accent-700 ring-accent-200',
};

const SIZES = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
};

/**
 * Small pill-shaped label. Member 3 can use this for severity, status, and
 * category tags on ticket cards.
 */
export function Badge({
  children,
  tone = 'neutral',
  icon,
  size = 'md',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        TONES[tone],
        SIZES[size],
        className,
      ].join(' ')}
    >
      {icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
      {children}
    </span>
  );
}
