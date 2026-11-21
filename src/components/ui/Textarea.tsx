import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  maxChars?: number;
}

/**
 * Multi-line textarea with label, char counter, hint, and error.
 * Primary input for the complaint description field.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, hint, error, maxChars, id, value, className = '', ...rest },
    ref
  ) => {
    const textareaId = id || rest.name || undefined;
    const charCount =
      typeof value === 'string' ? value.length : 0;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className="text-sm font-medium text-ink-700"
            >
              {label}
            </label>
            {maxChars && (
              <span
                className={[
                  'text-xs tabular-nums',
                  charCount > maxChars ? 'text-error-600' : 'text-ink-400',
                ].join(' ')}
              >
                {charCount}/{maxChars}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          className={[
            'min-h-[120px] w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm text-ink-900',
            'placeholder:text-ink-400 transition-colors duration-150',
            'focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50',
            error
              ? 'border-error-400 focus:border-error-500 focus:shadow-[0_0_0_3px_rgb(239_68_68_/_0.18)]'
              : 'border-ink-300 focus:border-primary-500 focus:shadow-focus',
            className,
          ].join(' ')}
          {...rest}
        />
        {error ? (
          <p className="text-sm text-error-600">{error}</p>
        ) : hint ? (
          <p className="text-sm text-ink-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
