/**
 * Confirm / Prompt — Ovds SaaS modal dialogs rendered into a portal.
 *
 * Design:
 *  - White surface card, 12px radius, card-shadow-raised
 *  - Backdrop: slate-900/45 + blur(3px)
 *  - Variant icons: rose (danger), amber (warning), green (info)
 *  - Cancel: white outline button, hover → surface-alt
 *  - Confirm: variant-coloured solid button
 *  - Focus ring: --pro-azure on all interactive elements
 *  - Keyboard: Enter = confirm, Escape = cancel
 */
import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, Trash2, Info, X, CheckCircle2 } from 'lucide-react';

/* ── Portal helper ─────────────────────────────────────────────── */
function mountPortal(node: React.ReactNode): () => void {
  const el = document.createElement('div');
  el.setAttribute('data-ovds-dialog', 'true');
  document.body.appendChild(el);
  const root = createRoot(el);
  root.render(<>{node}</>);
  return () => { root.unmount(); el.remove(); };
}

/* ── Shared backdrop + panel ──────────────────────────────────── */
const BACKDROP: React.CSSProperties = {
  position:        'fixed', inset: 0, zIndex: 9999,
  display:         'flex', alignItems: 'center', justifyContent: 'center',
  padding:         16,
  background:      'rgba(17,24,39,0.45)',
  backdropFilter:  'blur(3px)',
  WebkitBackdropFilter: 'blur(3px)',
  animation:       'aki-fade-in 160ms ease both',
};
const PANEL: React.CSSProperties = {
  position:     'relative',
  width:        '100%', maxWidth: 380,
  background:   'var(--surface)',
  border:       '1px solid var(--border)',
  borderRadius: 12,
  boxShadow:    'var(--modal-shadow)',
  overflow:     'hidden',
  animation:    'aki-enter 200ms cubic-bezier(0.16,1,0.3,1) both',
};

/* ── Variant config ───────────────────────────────────────────── */
type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

const VARIANT: Record<ConfirmVariant, {
  icon:       React.ReactNode;
  iconBg:     string;
  iconColor:  string;
  btnBg:      string;
  btnBgHover: string;
  btnShadow:  string;
}> = {
  danger: {
    icon:       <Trash2 size={18} />,
    iconBg:     '#FEF2F2',
    iconColor:  '#DC2626',
    btnBg:      '#DC2626',
    btnBgHover: '#B91C1C',
    btnShadow:  '0 2px 8px rgba(220,38,38,0.30)',
  },
  warning: {
    icon:       <AlertTriangle size={18} />,
    iconBg:     '#FFFBEB',
    iconColor:  '#D97706',
    btnBg:      '#D97706',
    btnBgHover: '#B45309',
    btnShadow:  '0 2px 8px rgba(217,119,6,0.28)',
  },
  info: {
    icon:       <Info size={18} />,
    iconBg:     'var(--pro-azure-50)',
    iconColor:  'var(--pro-azure)',
    btnBg:      'var(--pro-azure)',
    btnBgHover: 'var(--pro-azure-dark)',
    btnShadow:  '0 2px 8px rgba(79,186,111,0.30)',
  },
  success: {
    icon:       <CheckCircle2 size={18} />,
    iconBg:     'var(--pro-azure-50)',
    iconColor:  'var(--pro-azure)',
    btnBg:      'var(--pro-azure)',
    btnBgHover: 'var(--pro-azure-dark)',
    btnShadow:  '0 2px 8px rgba(79,186,111,0.30)',
  },
};

/* ── Shared button styles ─────────────────────────────────────── */
const cancelStyle: React.CSSProperties = {
  flex: 1, padding: '9px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 13, fontWeight: 600,
  color: 'var(--text-2)',
  cursor: 'pointer',
  transition: 'background 130ms, border-color 130ms',
  outline: 'none',
};

/* ─────────────────────────────────────────────────────────────── */
/* ConfirmDialog — portal variant                                  */
/* ─────────────────────────────────────────────────────────────── */
interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialogInner: React.FC<ConfirmDialogProps> = ({
  title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel,
}) => {
  const cfg        = VARIANT[variant];
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId    = useId();

  useEffect(() => {
    const t = setTimeout(() => confirmRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onConfirm, onCancel]);

  return (
    <div style={BACKDROP} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div style={PANEL}>
        {/* Close × */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, background: 'transparent', border: 'none',
            color: 'var(--text-4)', cursor: 'pointer',
            transition: 'background 120ms, color 120ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)'; }}
          aria-label="Cancel"
        >
          <X size={14} />
        </button>

        <div style={{ padding: '24px 24px 20px' }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: cfg.iconBg, color: cfg.iconColor,
              }}
            >
              {cfg.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <h2 id={titleId} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {title}
              </h2>
              {message && (
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.55 }}>
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              style={cancelStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sys-border-surface)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              onClick={onConfirm}
              style={{
                flex: 1, padding: '9px 16px',
                background: cfg.btnBg, color: '#fff',
                border: `1px solid ${cfg.btnBg}`,
                borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                boxShadow: cfg.btnShadow,
                transition: 'background 130ms, box-shadow 130ms, transform 80ms',
                outline: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = cfg.btnBgHover; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = cfg.btnBg; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
              onFocus={e => { (e.currentTarget as HTMLButtonElement).style.outline = `2px solid var(--pro-azure)`; (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px'; }}
              onBlur={e => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; }}
            >
              {confirmLabel}
            </button>
          </div>

          {/* Keyboard hint */}
          <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-5)', marginTop: 12 }}>
            <kbd style={{ padding: '1px 5px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'monospace', fontSize: 9 }}>Enter</kbd>
            {' '}confirm ·{' '}
            <kbd style={{ padding: '1px 5px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'monospace', fontSize: 9 }}>Esc</kbd>
            {' '}cancel
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────── */
/* Public imperative API                                           */
/* ─────────────────────────────────────────────────────────────── */
export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  const {
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel  = 'Cancel',
    variant      = 'danger',
  } = options;

  return new Promise((resolve) => {
    let unmount: (() => void) | null = null;
    const handle = (v: boolean) => { unmount?.(); resolve(v); };
    unmount = mountPortal(
      <ConfirmDialogInner
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant}
        onConfirm={() => handle(true)}
        onCancel={() => handle(false)}
      />,
    );
  });
}

/* ─────────────────────────────────────────────────────────────── */
/* useConfirm — React hook variant for inline rendering            */
/* ─────────────────────────────────────────────────────────────── */
export type { ConfirmVariant };

export interface UseConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  detail?: string;
}

interface UseConfirmState extends UseConfirmOptions {
  open: boolean;
  resolve: ((confirmed: boolean) => void) | null;
}

export function useConfirm() {
  const [state, setState] = useState<UseConfirmState>({
    open: false, message: '', resolve: null,
  });
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const showConfirm = useCallback((opts: UseConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...opts, open: true, resolve });
    }),
  []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setState(s => ({ ...s, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setState(s => ({ ...s, open: false }));
  }, []);

  const Dialog: React.FC = useCallback(() => {
    if (!state.open) return null;
    const variant = state.variant ?? 'danger';
    const cfg = VARIANT[variant];
    return (
      <div style={BACKDROP} role="dialog" aria-modal="true">
        <div
          style={{ ...PANEL, animation: 'aki-enter 200ms cubic-bezier(0.16,1,0.3,1) both' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '24px 24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: cfg.iconBg, color: cfg.iconColor,
                }}
              >
                {cfg.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                {state.title && (
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                    {state.title}
                  </h2>
                )}
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: state.title ? 6 : 0, lineHeight: 1.55 }}>
                  {state.message}
                </p>
                {state.detail && (
                  <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4, lineHeight: 1.5 }}>
                    {state.detail}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCancel}
                autoFocus
                style={cancelStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; }}
              >
                {state.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '9px 16px',
                  background: cfg.btnBg, color: '#fff',
                  border: `1px solid ${cfg.btnBg}`,
                  borderRadius: 8,
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: cfg.btnShadow,
                  transition: 'background 130ms, transform 80ms',
                  outline: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = cfg.btnBgHover; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = cfg.btnBg; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
              >
                {state.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [state, handleConfirm, handleCancel]) as React.FC;

  return { confirm: showConfirm, ConfirmDialog: Dialog };
}

/* ─────────────────────────────────────────────────────────────── */
/* Prompt — text input modal                                       */
/* ─────────────────────────────────────────────────────────────── */
export interface PromptOptions {
  title?: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputType?: 'text' | 'number' | 'email';
}

const PromptInner: React.FC<{
  title: string;
  message?: string;
  placeholder: string;
  defaultValue: string;
  confirmLabel: string;
  cancelLabel: string;
  inputType: 'text' | 'number' | 'email';
  onConfirm: (v: string) => void;
  onCancel: () => void;
}> = ({ title, message, placeholder, defaultValue, confirmLabel, cancelLabel, inputType, onConfirm, onCancel }) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId  = useId();

  useEffect(() => {
    const t = setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onCancel(); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div style={BACKDROP} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div style={PANEL}>
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--pro-azure-50)', color: 'var(--pro-azure)',
              }}
            >
              <Info size={18} />
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <h2 id={titleId} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{title}</h2>
              {message && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>{message}</p>}
            </div>
          </div>

          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onConfirm(value); } }}
            placeholder={placeholder}
            style={{
              display: 'block', width: '100%',
              padding: '9px 12px', marginBottom: 16,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: 'var(--text)', outline: 'none',
              transition: 'border-color 130ms, box-shadow 130ms',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--pro-azure)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,186,111,0.18)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              style={cancelStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => onConfirm(value)}
              style={{
                flex: 1, padding: '9px 16px',
                background: 'var(--pro-azure)', color: '#fff',
                border: '1px solid var(--pro-azure)',
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79,186,111,0.30)',
                transition: 'background 130ms, transform 80ms', outline: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure-dark)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure)'; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function prompt(options: PromptOptions = {}): Promise<string | null> {
  const {
    title         = 'Enter a value',
    message,
    placeholder   = '',
    defaultValue  = '',
    confirmLabel  = 'OK',
    cancelLabel   = 'Cancel',
    inputType     = 'text',
  } = options;

  return new Promise((resolve) => {
    let unmount: (() => void) | null = null;
    const handle = (v: string | null) => { unmount?.(); resolve(v); };
    unmount = mountPortal(
      <PromptInner
        title={title}
        message={message}
        placeholder={placeholder}
        defaultValue={defaultValue}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        inputType={inputType}
        onConfirm={v => handle(v || null)}
        onCancel={() => handle(null)}
      />,
    );
  });
}
