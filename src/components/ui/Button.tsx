import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 shadow-sm disabled:bg-primary-300',
  secondary:
    'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 active:bg-secondary-300 disabled:opacity-60',
  outline:
    'border border-ink-300 bg-white text-ink-700 hover:bg-ink-50 active:bg-ink-100 disabled:opacity-50',
  ghost:
    'text-ink-600 hover:bg-ink-100 active:bg-ink-200 disabled:opacity-50',
  danger:
    'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-sm disabled:bg-error-300',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

/**
 * Primary reusable button. Used across the app for all actions.
 *
 * Props (in addition to native <button> attributes):
 *  - variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 *  - size: 'sm' | 'md' | 'lg'
 *  - loading: swaps content for a spinner and disables interaction
 *  - leftIcon / rightIcon: optional icon nodes
 *  - fullWidth: stretches to container width
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-150',
          'disabled:cursor-not-allowed select-none',
          VARIANTS[variant],
          SIZES[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {loading ? (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
