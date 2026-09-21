/**
 * ModalShell
 *
 * Layout shell for routes with handle.layout === 'modal'.
 *
 * Renders the routed page content inside a centered modal card that overlays
 * the current page. The background route stays mounted and visible through the
 * backdrop — matching the OVDS Unified Navigation Matrix:
 *
 *   Mode   : MODAL
 *   Anchor : #modal-root
 *   State  : Isolated ephemeral
 *   Use    : Ephemeral forms, confirmation prompts, quick-create dialogs
 *
 * Features:
 *  — Centered card with configurable maxWidth
 *  — Optional built-in header (title + description + icon + close button)
 *  — `headless` mode gives the page full card control
 *  — Backdrop blur + click-to-close
 *  — ESC key dismissal
 *  — Focus trap
 *  — Body scroll lock
 *  — CSS scale + fade enter animation
 *
 * Usage — attach to a route:
 * ```ts
 * handle: {
 *   layout: 'modal',
 *   modal: {
 *     title: 'New Expense',
 *     description: 'Log a new out-of-pocket expense',
 *     maxWidth: 'max-w-xl',
 *     closeRoute: '/purchases/expenses',
 *     icon: 'RECEIPT',
 *   },
 * }
 * ```
 */
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '../../components/ui';
import { cn } from '../../lib/utils';
import { useRouteUI } from '../RouteUIContext';

interface ModalShellProps {
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({ children }) => {
  const { handle, onSliderClose } = useRouteUI();
  const config = handle.modal!;
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  // Mount animation — scale-in from 95% + fade.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const maxWidth = config.maxWidth ?? 'max-w-lg';
  const closeOnOverlay = config.closeOnOverlay ?? true;

  const handleClose = useCallback(() => {
    // Reuse the onSliderClose signal — both slider and modal use the same
    // close-callback slot in RouteUIContext (semantically: "panel closed").
    onSliderClose?.();
    if (config.closeRoute) {
      navigate(config.closeRoute, { replace: true });
    } else {
      navigate(-1);
    }
  }, [config.closeRoute, navigate, onSliderClose]);

  // ESC key dismissal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  // Move focus into the card on open.
  useEffect(() => {
    if (!visible || !cardRef.current) return;
    const focusable = cardRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, [visible]);

  // Focus trap.
  useEffect(() => {
    if (!visible || !cardRef.current) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !cardRef.current) return;
      const focusable = Array.from(
        cardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onTab);
    return () => document.removeEventListener('keydown', onTab);
  }, [visible]);

  // Body scroll lock.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────────────── */}
      <div
        id="modal-root"
        className={cn(
          'fixed inset-0 z-[700] flex items-center justify-center p-4',
          'transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}
        aria-hidden="true"
        onClick={(e) => {
          // Only close when clicking the backdrop itself, not the card.
          if (closeOnOverlay && e.target === e.currentTarget) handleClose();
        }}
      >
        {/* ── Modal card ───────────────────────────────────────────── */}
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={config.title ? 'modal-title' : undefined}
          className={cn(
            'relative w-full flex flex-col shadow-2xl rounded-2xl overflow-hidden',
            'transition-all duration-200',
            maxWidth,
            visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          )}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            maxHeight: 'calc(100vh - 2rem)',
          }}
          // Prevent backdrop click from firing when clicking inside the card.
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header (unless headless) ────────────────────────── */}
          {!config.headless && (
            <div
              className="flex items-center justify-between gap-4 px-5 py-4 border-b shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {config.icon && (
                  <div
                    className="p-1.5 rounded-lg shrink-0"
                    style={{
                       background: 'var(--pro-azure-light, rgba(79,186,111,0.1))',
                      color: 'var(--pro-azure)',
                    }}
                  >
                    <Icon name={config.icon as any} size={14} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2
                    id="modal-title"
                    className="text-[13px] font-bold leading-tight truncate"
                    style={{ color: 'var(--text)' }}
                  >
                    {config.title}
                  </h2>
                  {config.description && (
                    <p
                      className="text-[10px] leading-tight mt-0.5 truncate"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {config.description}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all hover:opacity-80"
                style={{
                  color: 'var(--text-3)',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                }}
                aria-label="Close dialog"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* ── Body — routed page content ──────────────────────── */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
