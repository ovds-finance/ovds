/**
 * Tooltip — accessible hover tooltip primitive.
 *
 * Positioned automatically (top by default, flips when near viewport edge).
 * Keyboard accessible: shows on focus, hides on Escape.
 * ARIA: uses role="tooltip" + aria-describedby for screen readers.
 *
 * Usage:
 *   <Tooltip content="Copy invoice number">
 *     <button onClick={copy}>Copy</button>
 *   </Tooltip>
 *
 *   // With custom placement
 *   <Tooltip content="Delete permanently" placement="bottom" variant="danger">
 *     <TrashIcon />
 *   </Tooltip>
 */
import React, {
  useState,
  useRef,
  useId,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipVariant   = 'default' | 'danger' | 'info' | 'success';

export interface TooltipProps {
  /** Tooltip text content */
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  variant?: TooltipVariant;
  /** Delay before showing in ms (default 300) */
  delay?: number;
  /** Max width of the tooltip bubble */
  maxWidth?: number;
  /** Disable the tooltip entirely */
  disabled?: boolean;
  className?: string;
}

const VARIANT_CLS: Record<TooltipVariant, string> = {
  default: 'bg-slate-800 text-white dark:bg-slate-700',
  danger:  'bg-rose-600 text-white',
  info:    'bg-sky-600 text-white',
  success: 'bg-emerald-600 text-white',
};

const ARROW_CLS: Record<TooltipVariant, string> = {
  default: 'border-t-slate-800 dark:border-t-slate-700',
  danger:  'border-t-rose-600',
  info:    'border-t-sky-600',
  success: 'border-t-emerald-600',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  variant = 'default',
  delay = 300,
  maxWidth = 220,
  disabled = false,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const wrapRef  = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const show = useCallback(() => {
    if (disabled || !content) return;
    timerRef.current = setTimeout(() => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const style: CSSProperties = {};

      // Position relative to the wrapper
      if (placement === 'top') {
        style.bottom = '100%';
        style.left   = '50%';
        style.transform = 'translateX(-50%) translateY(-4px)';
        style.marginBottom = '4px';
      } else if (placement === 'bottom') {
        style.top  = '100%';
        style.left = '50%';
        style.transform = 'translateX(-50%) translateY(4px)';
        style.marginTop = '4px';
      } else if (placement === 'left') {
        style.right = '100%';
        style.top   = '50%';
        style.transform = 'translateY(-50%) translateX(-4px)';
        style.marginRight = '4px';
      } else {
        style.left = '100%';
        style.top  = '50%';
        style.transform = 'translateY(-50%) translateX(4px)';
        style.marginLeft = '4px';
      }

      // Flip if too close to viewport edge
      if (placement === 'top' && rect.top < 60) {
        style.bottom = undefined;
        style.top = '100%';
        style.transform = 'translateX(-50%) translateY(4px)';
        style.marginBottom = undefined;
        style.marginTop = '4px';
      }

      setPos(style);
      setVisible(true);
    }, delay);
  }, [disabled, content, placement, delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') hide();
  }, [hide]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
      onKeyDown={onKeyDown}
      aria-describedby={visible ? id : undefined}
    >
      {children}

      {visible && (
        <span
          id={id}
          role="tooltip"
          style={{ ...pos, maxWidth, zIndex: 1800 }}
          className={[
            'absolute pointer-events-none px-2.5 py-1.5 rounded-lg',
            'text-[11px] font-medium leading-snug shadow-lg',
            'whitespace-normal break-words',
            'animate-in fade-in zoom-in-95 duration-100',
            VARIANT_CLS[variant],
            className,
          ].filter(Boolean).join(' ')}
        >
          {content}
          {/* Arrow — only for top/bottom placements */}
          {(placement === 'top') && (
            <span
              className={`absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-4 border-transparent ${ARROW_CLS[variant]}`}
              aria-hidden="true"
            />
          )}
          {(placement === 'bottom') && (
            <span
              className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-4 border-transparent border-b-slate-800 dark:border-b-slate-700"
              aria-hidden="true"
            />
          )}
        </span>
      )}
    </span>
  );
};
