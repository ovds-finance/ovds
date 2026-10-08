import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  /** Visibility flag. Every call site in the workspace uses `open`. */
  open: boolean;
  /** @deprecated Legacy alias for `open`, kept so external consumers still compile. */
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Footer content rendered in a bordered action bar below the body. */
  footer?: React.ReactNode;
  /** Tailwind max-width class, e.g. "max-w-2xl". Takes precedence over `size`. */
  width?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
} as const;

export const Modal = ({
  open,
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width,
  size = 'md',
  showCloseButton = true,
}: ModalProps) => {
  // The hook must run unconditionally on every render — declaring it *after* an
  // early `return null` violates the Rules of Hooks and makes React throw
  // "Rendered more hooks than during the previous render." the first time a
  // closed modal is opened, which takes down the whole page subtree.
  const isVisible = open ?? isOpen ?? false;

  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className={clsx(
            'relative w-full bg-white rounded-xl shadow-xl transform transition-all',
            width ?? SIZES[size],
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {(title || subtitle || showCloseButton) && (
            <div className="flex items-start justify-between gap-4 p-4 border-b border-gray-200">
              <div className="min-w-0">
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-4">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
