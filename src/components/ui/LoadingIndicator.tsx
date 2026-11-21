import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  children?: ReactNode;
}

const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * Spinner with optional label. Use inline for buttons (use Button's `loading`
 * prop instead) or as a full-area placeholder while data loads.
 */
export function LoadingIndicator({
  size = 'md',
  label,
  className = '',
  children,
}: LoadingIndicatorProps) {
  return (
    <div
      className={['flex flex-col items-center justify-center gap-3', className].join(' ')}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={[SIZES[size], 'animate-spin text-primary-600'].join(' ')} />
      {label && <p className="text-sm text-ink-500">{label}</p>}
      {children}
    </div>
  );
}
