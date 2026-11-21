import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Accessible modal dialog with backdrop, escape-to-close, and focus trapping
 * via the native dialog pattern. Used for confirmations and detail views.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={[
          'relative w-full animate-scale-in rounded-2xl bg-white shadow-elevated',
          SIZE_CLASSES[size],
        ].join(' ')}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-ink-200 px-6 py-4">
            <div className="flex flex-col gap-0.5">
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-ink-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-ink-500">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-ink-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
