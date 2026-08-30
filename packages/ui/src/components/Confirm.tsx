/**
 * confirm / prompt — proper modal dialogs rendered into a portal.
 * Drop-in replacements for window.confirm() and window.prompt().
 * Supports dark mode, keyboard (Enter/Escape), and focus trapping.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, Trash2, CheckCircle2, Info, X } from 'lucide-react';

// -- Shared portal helper ------------------------------------------------------
function mountPortal(node: React.ReactNode): () => void {
  const container = document.createElement('div');
  container.setAttribute('data-dialog', 'true');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<>{node}</>);
  return () => {
    root.unmount();
    container.remove();
  };
}

// -- Confirm -------------------------------------------------------------------
interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const VARIANT_CONFIG = {
  danger: {
    icon: <Trash2 size={20} />,
    iconBg: 'bg-rose-50 text-rose-600',
    btn: 'bg-rose-500 hover:bg-rose-500-dark focus:ring-rose-500/30',
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    iconBg: 'bg-amber-50 text-amber-600',
    btn: 'bg-amber-500 hover:bg-amber-500-dark focus:ring-amber-500/30',
  },
  info: {
    icon: <CheckCircle2 size={20} />,
    iconBg: 'bg-aki-blue-50 text-aki-blue',
    btn: 'bg-aki-blue hover:bg-aki-blue-dark focus:ring-aki-blue/30',
  },
};

const ConfirmDialog: React.FC<{
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}) => {
  const cfg = VARIANT_CONFIG[variant];
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus confirm button on mount
    const t = setTimeout(() => confirmRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onConfirm, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ovds-sidebar/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative bg-ovds-surface dark:bg-ovds-surface-dark rounded-2xl shadow-2xl border border-ovds-border dark:border-ovds-muted-dark w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-ovds-text-subtle hover:text-ovds-text-main hover:bg-ovds-muted dark:hover:bg-ovds-muted-dark transition-colors"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>

        <div className="p-6">
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-2.5 rounded-xl shrink-0 ${cfg.iconBg}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2
                id="confirm-title"
                className="text-base font-bold text-ovds-text-main dark:text-ovds-surface leading-snug"
              >
                {title}
              </h2>
              {message && (
                <p className="text-sm text-ovds-text-muted dark:text-ovds-text-subtle mt-1.5 leading-relaxed">
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 bg-ovds-muted dark:bg-ovds-muted-dark text-ovds-text-main dark:text-ovds-surface rounded-xl text-sm font-bold hover:bg-ovds-border-subtle dark:hover:bg-ovds-muted-dark/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ovds-border"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 text-white rounded-xl text-sm font-bold transition-colors focus:outline-none focus:ring-2 ${cfg.btn}`}
            >
              {confirmLabel}
            </button>
          </div>

          <p className="text-center text-[10px] text-ovds-text-subtle mt-3">
            <kbd className="px-1 py-0.5 bg-ovds-muted dark:bg-ovds-muted-dark rounded text-[9px] font-mono">
              Enter
            </kbd>{' '}
            confirm ·{' '}
            <kbd className="px-1 py-0.5 bg-ovds-muted dark:bg-ovds-muted-dark rounded text-[9px] font-mono">
              Esc
            </kbd>{' '}
            cancel
          </p>
        </div>
      </div>
    </div>
  );
};

export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  const {
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
  } = options;

  return new Promise((resolve) => {
    let unmount: (() => void) | null = null;

    const handleConfirm = () => {
      unmount?.();
      resolve(true);
    };
    const handleCancel = () => {
      unmount?.();
      resolve(false);
    };

    unmount = mountPortal(
      <ConfirmDialog
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    );
  });
}

// -- Prompt --------------------------------------------------------------------
interface PromptOptions {
  title?: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputType?: 'text' | 'number' | 'email';
}

const PromptDialog: React.FC<{
  title: string;
  message?: string;
  placeholder: string;
  defaultValue: string;
  confirmLabel: string;
  cancelLabel: string;
  inputType: 'text' | 'number' | 'email';
  onConfirm: (v: string) => void;
  onCancel: () => void;
}> = ({
  title,
  message,
  placeholder,
  defaultValue,
  confirmLabel,
  cancelLabel,
  inputType,
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-title"
    >
      <div
        className="absolute inset-0 bg-ovds-sidebar/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative bg-ovds-surface dark:bg-ovds-surface-dark rounded-2xl shadow-2xl border border-ovds-border dark:border-ovds-muted-dark w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-ovds-text-subtle hover:text-ovds-text-main hover:bg-ovds-muted dark:hover:bg-ovds-muted-dark transition-colors"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Info size={20} />
            </div>
            <div className="flex-1 pt-0.5">
              <h2
                id="prompt-title"
                className="text-base font-bold text-ovds-text-main dark:text-ovds-surface"
              >
                {title}
              </h2>
              {message && (
                <p className="text-sm text-ovds-text-muted dark:text-ovds-text-subtle mt-1">
                  {message}
                </p>
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm(value);
              }
            }}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-ovds-muted dark:bg-ovds-muted-dark border border-ovds-border dark:border-ovds-muted-dark rounded-xl text-sm text-ovds-text-main dark:text-ovds-surface placeholder-ovds-text-subtle focus:outline-none focus:ring-4 focus:ring-aki-blue/10 focus:border-aki-blue transition-all"
          />

          <div className="flex gap-2.5 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 bg-ovds-muted dark:bg-ovds-muted-dark text-ovds-text-main dark:text-ovds-surface rounded-xl text-sm font-bold hover:bg-ovds-border-subtle dark:hover:bg-ovds-muted-dark/50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => onConfirm(value)}
              className="flex-1 py-2.5 px-4 bg-aki-blue hover:bg-aki-blue-dark text-white rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-aki-blue/20"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -- useConfirm hook -----------------------------------------------------------
// React hook variant — returns a confirm() function + ConfirmDialog component
// to render inline in the tree (useful when portal-based confirm() isn't enough).

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface UseConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  /** Extra detail shown below the message in a muted style */
  detail?: string;
}

interface UseConfirmState extends UseConfirmOptions {
  open: boolean;
  resolve: ((confirmed: boolean) => void) | null;
}

const HOOK_VARIANT_CONFIG: Record<ConfirmVariant, {
  icon: React.ReactNode;
  iconBg: string;
  confirmCls: string;
}> = {
  danger: {
    icon: <Trash2 size={20} />,
    iconBg: 'bg-rose-50 text-rose-600',
    confirmCls: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20',
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    iconBg: 'bg-amber-50 text-amber-600',
    confirmCls: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
  },
  info: {
    icon: <Info size={20} />,
    iconBg: 'bg-aki-blue-50 text-aki-blue',
    confirmCls: 'bg-aki-blue hover:bg-aki-blue-dark text-white shadow-aki-blue/20',
  },
};

export function useConfirm() {
  const [state, setState] = useState<UseConfirmState>({
    open: false,
    message: '',
    resolve: null,
  });
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const showConfirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setState((s) => ({ ...s, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setState((s) => ({ ...s, open: false }));
  }, []);

  const ConfirmDialog: React.FC = useCallback(() => {
    if (!state.open) return null;
    const variant = state.variant ?? 'danger';
    const cfg = HOOK_VARIANT_CONFIG[variant];

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleCancel}
        />
        <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-xl shrink-0 ${cfg.iconBg}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              {state.title && (
                <h2
                  id="confirm-title"
                  className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight"
                >
                  {state.title}
                </h2>
              )}
              <p
                id="confirm-message"
                className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed"
              >
                {state.message}
              </p>
              {state.detail && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                  {state.detail}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              autoFocus
            >
              {state.cancelLabel ?? 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all hover:-translate-y-px active:translate-y-0 ${cfg.confirmCls}`}
            >
              {state.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  }, [state, handleConfirm, handleCancel]) as React.FC;

  return { confirm: showConfirm, ConfirmDialog };
}

export function prompt(options: PromptOptions = {}): Promise<string | null> {
  const {
    title = 'Enter a value',
    message,
    placeholder = '',
    defaultValue = '',
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    inputType = 'text',
  } = options;

  return new Promise((resolve) => {
    let unmount: (() => void) | null = null;

    const handleConfirm = (v: string) => {
      unmount?.();
      resolve(v || null);
    };
    const handleCancel = () => {
      unmount?.();
      resolve(null);
    };

    unmount = mountPortal(
      <PromptDialog
        title={title}
        message={message}
        placeholder={placeholder}
        defaultValue={defaultValue}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        inputType={inputType}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    );
  });
}


