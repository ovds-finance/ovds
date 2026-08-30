/**
 * AdvancedLayout — OVDS premium layout primitives
 *
 * Implements:
 *   SplitLayout         — 60/40 left-form + right-preview (invoice creation pattern)
 *   StickyTableBar      — sticky bottom action / summary bar for tables
 *   StickySummaryBar    — sticky invoice totals bar with subtotal/tax/total
 *   MegaMenu            — flyout mega-menu with categories + thumbnails
 *   DynamicToolbar      — scroll-aware sticky toolbar that condenses on scroll
 *   ScrollySection      — section revealed as user scrolls into view
 *   PageProgressBar     — top-of-page loading progress indicator
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// SplitLayout (60/40 form + preview)
// ---------------------------------------------------------------------------
export interface SplitLayoutProps {
  /** Left panel — form area (60%) */
  form: React.ReactNode;
  /** Right panel — live preview (40%, sticky) */
  preview: React.ReactNode;
  previewTitle?: string;
  previewIcon?: React.ReactNode;
  className?: string;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  form,
  preview,
  previewTitle = 'Live Preview',
  previewIcon,
  className,
}) => (
  <div className={cn('aki-split-layout', className)}>
    {/* Form side */}
    <div className="aki-split-form">{form}</div>

    {/* Preview side */}
    <div className="aki-split-preview">
      <div className="aki-split-preview-header">
        {previewIcon && <span className="opacity-60">{previewIcon}</span>}
        {previewTitle}
      </div>
      <div className="aki-split-preview-body">{preview}</div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// StickyTableBar — bulk action bar that appears on row selection
// ---------------------------------------------------------------------------
export interface StickyTableBarProps {
  /** Number of selected rows */
  selectedCount: number;
  /** Called to clear selection */
  onClearSelection?: () => void;
  /** Action buttons / controls */
  actions?: React.ReactNode;
  className?: string;
}

export const StickyTableBar: React.FC<StickyTableBarProps> = ({
  selectedCount,
  onClearSelection,
  actions,
  className,
}) => {
  if (selectedCount === 0) return null;
  return (
    <div className={cn('sticky-table-bar', className)}>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-200">
          <span className="w-5 h-5 rounded-full bg-aki-blue text-white text-[10px] font-black flex items-center justify-center">
            {selectedCount > 99 ? '99+' : selectedCount}
          </span>
          selected
        </span>
        {onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-[11px] text-slate-400 hover:text-rose-500 font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// StickySummaryBar — sticky invoice/bill totals
// ---------------------------------------------------------------------------
export interface SummaryLineItem {
  label: string;
  value: string;
  /** Accent the final total line */
  highlight?: boolean;
  muted?: boolean;
}

export interface StickySummaryBarProps {
  lines: SummaryLineItem[];
  currency?: string;
  className?: string;
}

export const StickySummaryBar: React.FC<StickySummaryBarProps> = ({
  lines,
  currency = 'ETB',
  className,
}) => (
  <div className={cn('sticky-summary-bar', className)}>
    {currency && (
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mr-auto">
        {currency}
      </span>
    )}
    {lines.map((line, i) => (
      <div key={i} className="flex items-center gap-3">
        <span className={cn(
          'text-[11px]',
          line.muted ? 'opacity-60' : 'font-medium',
          line.highlight ? 'font-bold text-white' : '',
        )}>
          {line.label}
        </span>
        <span className={cn(
          'font-mono tabular-nums',
          line.highlight ? 'sticky-summary-total' : 'text-[13px] font-bold',
          line.muted ? 'opacity-60' : '',
        )}>
          {line.value}
        </span>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// DynamicToolbar — condenses after scrollY > threshold
// ---------------------------------------------------------------------------
export interface DynamicToolbarProps {
  children: React.ReactNode;
  /** px scroll distance before condensing */
  threshold?: number;
  className?: string;
}

export const DynamicToolbar: React.FC<DynamicToolbarProps> = ({
  children,
  threshold = 60,
  className,
}) => {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const handler = () => setCondensed(window.scrollY > threshold);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);

  return (
    <div className={cn('aki-toolbar', condensed && 'condensed', className)}>
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MegaMenu — flyout with categories, icon links, and quick-links
// ---------------------------------------------------------------------------
export interface MegaMenuLink {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  description?: string;
  onClick?: () => void;
}

export interface MegaMenuCategory {
  title: string;
  links: MegaMenuLink[];
}

export interface MegaMenuProps {
  open: boolean;
  categories: MegaMenuCategory[];
  footer?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  open,
  categories,
  footer,
  onClose,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !onClose) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'absolute left-0 right-0 top-full bg-white dark:bg-slate-950',
        'border-b border-slate-200 dark:border-slate-800',
        'shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-50',
        'p-6 grid gap-8',
        'animate-[aki-enter_150ms_ease_both]',
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, minmax(0,1fr))`,
      }}
      role="menu"
    >
      {categories.map((cat, ci) => (
        <div key={ci}>
          <h3 className="ovds-section-title mb-3">{cat.title}</h3>
          <ul className="space-y-0.5">
            {cat.links.map((link, li) => {
              const content = (
                <>
                  {link.icon && (
                    <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                      {link.icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">{link.label}</p>
                    {link.description && (
                      <p className="ovds-caption mt-0.5 leading-snug">{link.description}</p>
                    )}
                  </div>
                </>
              );
              return (
                <li key={li}>
                  {link.href ? (
                    <a
                      href={link.href}
                      onClick={onClose}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                      role="menuitem"
                    >
                      {content}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { link.onClick?.(); onClose?.(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
                      role="menuitem"
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {footer && (
        <div className="col-span-full border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
          {footer}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ScrollySection — reveals content as user scrolls into view
// ---------------------------------------------------------------------------
export interface ScrollySectionProps {
  children: React.ReactNode;
  /** Animation delay multiplier in ms */
  delay?: number;
  className?: string;
}

export const ScrollySection: React.FC<ScrollySectionProps> = ({
  children,
  delay = 0,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 400ms ease ${delay}ms, transform 400ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// PageProgressBar — thin top-of-page progress indicator
// ---------------------------------------------------------------------------
export interface PageProgressBarProps {
  loading?: boolean;
  progress?: number; // 0–100, if controlled
  color?: string;
}

export const PageProgressBar: React.FC<PageProgressBarProps> = ({
  loading = true,
  progress,
  color = '#0056D2',
}) => {
  if (!loading && progress === undefined) return null;
  return (
    <div
      className="fixed top-0 left-0 right-0 h-0.5 z-[600] overflow-hidden"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
    >
      {progress !== undefined ? (
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, background: color }}
        />
      ) : (
        <div
          className="h-full absolute"
          style={{
            background: color,
            animation: 'loading-bar 1.4s ease-in-out infinite',
            width: '40%',
          }}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// QuickCreateButton — floating action button for new document creation
// ---------------------------------------------------------------------------
export interface QuickCreateOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface QuickCreateButtonProps {
  options: QuickCreateOption[];
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export const QuickCreateButton: React.FC<QuickCreateButtonProps> = ({
  options,
  icon,
  label,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="aki-btn aki-btn-primary flex items-center gap-2"
      >
        {icon ?? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
        {label ?? 'Create'}
        {options.length > 0 && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn('transition-transform duration-150', open && 'rotate-180')}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {open && options.length > 0 && (
        <div
          className="aki-flyout-menu absolute right-0 top-full mt-1.5 w-52 py-1.5 z-50"
          role="menu"
        >
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => { opt.onClick(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              {opt.icon && <span className="text-slate-400">{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
