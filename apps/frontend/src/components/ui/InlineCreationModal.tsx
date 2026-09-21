/**
 * InlineCreationModal — Ovds SaaS Grid-over-Card Layout System
 * ─────────────────────────────────────────────────────────────
 * Context-aware nested sub-modal for inline entity creation.
 *
 * Design principles:
 *  • Isolated state machine — the sub-modal owns its own form state and never
 *    mutates the parent's transaction state while open.
 *  • Parent context preserved — the parent invoice/bill form stays mounted
 *    and interactive behind this modal; no full-page navigation occurs.
 *  • Portal-based rendering — mounts into #modal-root (or document.body
 *    if the root isn't present) so z-index layering is clean.
 *  • Keyboard accessible: Escape closes, focus trap, return focus on close.
 *  • Generic slot-based — accepts any `children` as the form content.
 *    The caller is responsible for the form fields; this component owns
 *    the chrome (header, overlay, close button, save/cancel footer).
 *
 * Usage:
 *   <InlineCreationModal
 *     open={showNewCustomer}
 *     title="New Customer"
 *     description="Add a customer without leaving the invoice form."
 *     onClose={() => setShowNewCustomer(false)}
 *     onSave={handleSaveCustomer}
 *     saving={isSavingCustomer}
 *     saveLabel="Add Customer"
 *   >
 *     <CustomerFormFields ... />
 *   </InlineCreationModal>
 */

import { X, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface InlineCreationModalProps {
  /** Controls visibility. */
  open: boolean;
  /** Modal heading. */
  title: string;
  /** Optional sub-heading / helper text rendered below the title. */
  description?: string;
  /** Called when the user closes the modal (Escape, × button, backdrop). */
  onClose: () => void;
  /**
   * Called when the user clicks the save button.
   * The modal does NOT close itself — the parent decides whether to close
   * based on save success/failure.
   */
  onSave: () => void | Promise<void>;
  /** Label for the save button. Defaults to "Save". */
  saveLabel?: string;
  /** Whether the save operation is in progress — disables controls and shows spinner. */
  saving?: boolean;
  /**
   * Whether the backdrop click should close the modal.
   * Defaults to true. Set to false when the save action is in progress.
   */
  closeOnBackdrop?: boolean;
  /**
   * Modal width preset.
   * sm  = max-w-sm  (360px) — tiny forms like "Add Tag"
   * md  = max-w-md  (448px) — standard inline form (default)
   * lg  = max-w-lg  (512px) — extended forms with multiple sections
   * xl  = max-w-xl  (576px) — wide forms
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Form content — rendered inside the scrollable body zone. */
  children: React.ReactNode;
  /**
   * Optional icon rendered in the modal header next to the title.
   * Pass a small (w-4 h-4) Lucide icon element.
   */
  headerIcon?: React.ReactNode;
  /** Extra footer slot — rendered left-aligned, before Cancel/Save. */
  footerExtra?: React.ReactNode;
  /** Whether the save button is disabled independently of `saving`. */
  saveDisabled?: boolean;
}

// ── Size map ──────────────────────────────────────────────────────────────────

const SIZE_CLASS: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

// ── Focus trap ────────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function trapFocus(container: HTMLElement, e: KeyboardEvent) {
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

// ── InlineCreationModal component ─────────────────────────────────────────────

export const InlineCreationModal: React.FC<InlineCreationModalProps> = ({
  open,
  title,
  description,
  onClose,
  onSave,
  saveLabel = 'Save',
  saving = false,
  closeOnBackdrop = true,
  size = 'md',
  children,
  headerIcon,
  footerExtra,
  saveDisabled = false,
}) => {
  const dialogId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // ── Lock body scroll while open ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // ── Save + restore focus ──────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      // Focus the dialog after the next paint
      requestAnimationFrame(() => {
        dialogRef.current?.focus();
      });
    } else if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // ── Keyboard handling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
        return;
      }
      if (dialogRef.current) trapFocus(dialogRef.current, e);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, saving, onClose]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop && !saving) onClose();
  }, [closeOnBackdrop, saving, onClose]);

  const handleDialogClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // ── Portal target ─────────────────────────────────────────────────────────
  const portalTarget =
    (typeof document !== 'undefined' && document.getElementById('modal-root')) ||
    (typeof document !== 'undefined' ? document.body : null);

  if (!open || !portalTarget) return null;

  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={handleDialogClick}
        className={[
          'relative z-10 w-full flex flex-col max-h-[90dvh]',
          sizeClass,
          'bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-slate-900/60',
          'border border-slate-200 dark:border-slate-700',
          'animate-in fade-in slide-in-from-bottom-2 duration-200',
          'focus-visible:outline-none',
        ].join(' ')}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {headerIcon && (
              <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--pro-azure-50)] dark:bg-green-900/20 flex items-center justify-center text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                {headerIcon}
              </div>
            )}
            <div className="min-w-0">
              <h2
                id={`${dialogId}-title`}
                className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug"
              >
                {title}
              </h2>
              {description && (
                <p
                  id={descriptionId}
                  className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            disabled={saving}
            onClick={onClose}
            className={[
              'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
              'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
              'hover:bg-slate-100 dark:hover:bg-slate-800 transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40',
              saving ? 'opacity-40 cursor-not-allowed' : '',
            ].join(' ')}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 min-h-0">
          {children}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
          <div className="flex items-center gap-2">
            {footerExtra}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className={[
                'h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold',
                'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900',
                'hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600',
                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]/40',
                saving ? 'opacity-40 cursor-not-allowed' : '',
              ].join(' ')}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving || saveDisabled}
              onClick={onSave}
              className={[
                'h-9 px-5 rounded-xl text-sm font-bold text-white',
                'bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] active:bg-[var(--pro-azure-dark)]',
                'shadow-sm shadow-green-500/20 dark:shadow-green-500/10',
                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40',
                saving || saveDisabled ? 'opacity-50 cursor-not-allowed' : '',
                'inline-flex items-center gap-2',
              ].join(' ')}
            >
              {saving && (
                <Loader2 size={13} className="animate-spin shrink-0" aria-hidden="true" />
              )}
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  );
};

// ── useInlineModal hook ───────────────────────────────────────────────────────
/**
 * Convenience hook for managing inline modal state.
 *
 * Usage:
 *   const customerModal = useInlineModal<{ name: string }>();
 *   <InlineCreationModal open={customerModal.open} onClose={customerModal.close} ... />
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useInlineModal<TContext = undefined>() {
  const [open, setOpen] = React.useState(false);
  const [context, setContext] = React.useState<TContext | undefined>(undefined);

  return {
    open,
    context,
    show: (ctx?: TContext) => {
      setContext(ctx);
      setOpen(true);
    },
    close: () => setOpen(false),
    reset: () => {
      setOpen(false);
      setContext(undefined);
    },
  };
}
