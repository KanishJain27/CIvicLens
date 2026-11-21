import type { HTMLAttributes, ReactNode } from 'react';

type Padding = 'sm' | 'md' | 'lg' | 'none';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  hover?: boolean;
  as?: 'div' | 'section' | 'article';
}

const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Surface container used for cards, panels, and summary tiles.
 * Member 3 can wrap ticket lists and statistics in this.
 */
export function Card({
  padding = 'md',
  hover = false,
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={[
        'rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card transition-shadow duration-200',
        hover ? 'hover:shadow-card-hover' : '',
        PADDING[padding],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Optional header block with icon, title, subtitle, and trailing action. */
export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={['flex items-start justify-between gap-4', className].join(' ')}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 [&>svg]:h-[18px] [&>svg]:w-[18px]">
            {icon}
          </span>
        )}
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
