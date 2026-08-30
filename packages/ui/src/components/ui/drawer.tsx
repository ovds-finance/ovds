import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  side?: 'left' | 'right';
  width?: string;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  children,
  title,
  description,
  footer,
  side = 'right',
  width = 'w-[420px]',
  closeOnOverlay = true,
  closeOnEscape = true,
  className,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault();
        onOpenChange(false);
      }
      if (e.key === 'Tab') {
        const focusable = drawerRef.current!.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as NodeListOf<HTMLElement>;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  if (!open) return null;

  const slideClass = side === 'right'
    ? 'animate-in slide-in-from-right'
    : 'animate-in slide-in-from-left';

  return (
    <div className="fixed inset-0 z-[700] flex">
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm"
        onClick={() => closeOnOverlay && onOpenChange(false)}
      />
      <div
        ref={drawerRef}
        className={cn(
          'relative h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col',
          slideClass,
          width,
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="min-w-0">
              {title && <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{title}</h2>}
              {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
              aria-label="Close drawer"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div ref={drawerRef} className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
