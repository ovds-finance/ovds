/**
 * SliderShell
 *
 * Layout shell for routes with handle.layout === 'slider'.
 *
 * Renders the routed page content inside a slide-out panel that overlays the
 * previously active page. The background route stays mounted and visible
 * through the backdrop — providing the contextual "drawer over current page"
 * UX pattern familiar from Ovds SaaS's contextual panels.
 *
 * How it works:
 *  1. The SliderShell renders a fixed-position panel (not a <dialog> or
 *     portal) so it participates in the normal React Router outlet tree.
 *  2. The backdrop sits between the background content and the panel.
 *  3. Closing navigates to handle.slider.closeRoute or back() if absent.
 *
 * Usage — attach to a route:
 * ```ts
 * handle: {
 *   layout: 'slider',
 *   slider: {
 *     title: 'Invoice Details',
 *     description: 'Review and manage this invoice',
 *     width: 'w-[640px]',
 *     closeRoute: '/sales/invoices',
 *     icon: 'INVOICE',
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

interface SliderShellProps {
  children: React.ReactNode;
}

export const SliderShell: React.FC<SliderShellProps> = ({ children }) => {
  const { handle, onSliderClose } = useRouteUI();
  const config = handle.slider!;
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Animate on mount: panel enters from the configured side.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Allow a single frame before triggering the CSS transition.
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const side = config.side ?? 'right';
  const width = config.width ?? 'w-[520px]';
  const closeOnOverlay = config.closeOnOverlay ?? true;

  const handleClose = useCallback(() => {
    // Signal context consumers (e.g. parent page refresh).
    onSliderClose?.();
    if (config.closeRoute) {
      navigate(config.closeRoute, { replace: true });
    } else {
      navigate(-1);
    }
  }, [config.closeRoute, navigate, onSliderClose]);

  // ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  // Focus management — move focus into the panel on open.
  useEffect(() => {
    if (!visible || !panelRef.current) return;
    const focusable = panelRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, [visible]);

  // Focus trap inside the panel.
  useEffect(() => {
    if (!visible || !panelRef.current) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
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

  // Prevent body scroll while slider is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Translate classes for enter animation.
  const translateInit = side === 'right' ? 'translate-x-full' : '-translate-x-full';
  const translateOpen = 'translate-x-0';

  // Panel position classes.
  const positionClass = side === 'right' ? 'right-0' : 'left-0';

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-[600] transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}
        aria-hidden="true"
        onClick={() => closeOnOverlay && handleClose()}
      />

      {/* ── Slide-out panel ──────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={config.title}
        className={cn(
          'fixed top-0 h-full z-[610] flex flex-col shadow-2xl',
          'transition-transform duration-300 ease-out',
          width,
          positionClass,
          visible ? translateOpen : translateInit,
        )}
        style={{
          background: 'var(--surface)',
          borderLeft: side === 'right' ? '1px solid var(--border)' : undefined,
          borderRight: side === 'left' ? '1px solid var(--border)' : undefined,
        }}
      >
        {/* ── Panel header ──────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-3.5 border-b shrink-0"
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
            aria-label="Close panel"
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Panel body — the routed page content ─────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};
