import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightAdornment?: ReactNode;
}

/**
 * Text input with label, hint, error, and optional adornments.
 * Designed for the complaint submission form and dashboard filters.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, hint, error, leftIcon, rightAdornment, id, className = '', ...rest },
    ref
  ) => {
    const inputId = id || rest.name || undefined;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <div
          className={[
            'flex items-center rounded-xl border bg-white transition-colors duration-150',
            error
              ? 'border-error-400 focus-within:border-error-500 focus-within:shadow-[0_0_0_3px_rgb(239_68_68_/_0.18)]'
              : 'border-ink-300 focus-within:border-primary-500 focus-within:shadow-focus',
          ].join(' ')}
        >
          {leftIcon && (
            <span className="pl-3.5 text-ink-400 [&>svg]:h-[18px] [&>svg]:w-[18px]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'h-11 w-full bg-transparent px-3.5 text-sm text-ink-900 placeholder:text-ink-400',
              'focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50',
              leftIcon ? 'pl-2' : '',
              rightAdornment ? 'pr-2' : '',
              className,
            ].join(' ')}
            {...rest}
          />
          {rightAdornment && <span className="pr-3.5">{rightAdornment}</span>}
        </div>
        {error ? (
          <p className="text-sm text-error-600">{error}</p>
        ) : hint ? (
          <p className="text-sm text-ink-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
