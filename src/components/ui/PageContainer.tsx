import type { ReactNode } from 'react';

export interface PageContainerProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: 'narrow' | 'default' | 'wide';
  className?: string;
}

const MAX_WIDTH = {
  narrow: 'max-w-2xl',
  default: 'max-w-6xl',
  wide: 'max-w-[100rem]',
};

/**
 * Page wrapper providing consistent horizontal padding, max width, and an
 * optional page header (title + description + actions). All pages render
 * inside this so spacing stays uniform.
 */
export function PageContainer({
  title,
  description,
  actions,
  children,
  maxWidth = 'default',
  className = '',
}: PageContainerProps) {
  return (
    <div className={['mx-auto w-full px-4 sm:px-6 lg:px-8', MAX_WIDTH[maxWidth], className].join(' ')}>
      {(title || description || actions) && (
        <header className="mb-6 flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-ink-900">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-ink-500 sm:text-base">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="animate-slide-up pb-12">{children}</div>
    </div>
  );
}
