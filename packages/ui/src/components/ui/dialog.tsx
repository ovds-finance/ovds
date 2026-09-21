import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Dialog — Ovds SaaS modal.
 *
 * Design:
 *  - White surface card, 1px border, 12px radius
 *  - Header: bottom border, 14px bold title, muted description
 *  - Footer: top border, slate-50 bg, right-aligned action buttons
 *  - Close button: ghost, 28px icon button, green focus ring
 *  - Backdrop: slate-900/45 + backdrop-blur(3px)
 *  - Entry: fade + scale-in 200ms ease-spring
 *  - Scroll lock on body while open
 *  - Full ARIA + focus trap + Escape
 */

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  /** Hide the close × button */
  hideClose?: boolean;
}

const MAX_W: Record<string, string> = {
  xs:   'max-w-xs',
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl':'max-w-2xl',
  full: 'max-w-4xl',
};

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  closeOnOverlay = true,
  closeOnEscape = true,
  className,
  hideClose = false,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLElement | null>(null);

  /* ── Focus trap ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;

    // Restore focus on close
    const prevFocus = document.activeElement as HTMLElement | null;

    // Auto-focus first focusable element
    const focusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

    const first = focusable()[0];
    if (first) {
      firstFocusRef.current = first;
      requestAnimationFrame(() => first.focus());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onOpenChange(false);
        return;
      }
      if (e.key === 'Tab') {
        const items = focusable();
        if (items.length === 0) return;
        const last  = items[items.length - 1];
        const firstEl = items[0];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocus?.focus();
    };
  }, [open, closeOnEscape, onOpenChange]);

  /* ── Body scroll lock ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  if (!open) return null;

  return (
    /* Portal layer */
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4" role="presentation">

      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-[aki-fade-in_160ms_ease_both]"
        style={{
          background: 'rgba(17,24,39,0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
        onClick={() => closeOnOverlay && onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-desc' : undefined}
        className={cn(
          'relative w-full flex flex-col overflow-hidden',
          'bg-white dark:bg-[var(--surface)]',
          'border border-[var(--border)] dark:border-[var(--border)]',
          'rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.14),0_4px_16px_rgba(0,0,0,0.07)]',
          'animate-[aki-enter_200ms_cubic-bezier(0.16,1,0.3,1)_both]',
          MAX_W[maxWidth],
          className,
        )}
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >

        {/* Header */}
        {(title || description || !hideClose) && (
          <div
            className="flex items-start justify-between gap-4 px-5 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--border-alt)' }}
          >
            <div className="min-w-0 flex-1">
              {title && (
                <h2
                  id="dialog-title"
                  className="text-[14px] font-bold leading-tight"
                  style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="dialog-desc"
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--text-4)' }}
                >
                  {description}
                </p>
              )}
            </div>

            {!hideClose && (
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Close dialog"
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  'transition-all duration-100',
                  'hover:bg-[var(--surface-alt)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1',
                  'active:scale-95',
                )}
                style={{ color: 'var(--text-4)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Body — scrollable */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
          style={{ minHeight: 0 }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="shrink-0 px-5 py-3 flex items-center justify-end gap-2"
            style={{
              borderTop: '1px solid var(--border-alt)',
              background: 'var(--surface-alt)',
            }}
          >
            {footer}
          </div>
        )}

      </div>
    </div>
  );
};
