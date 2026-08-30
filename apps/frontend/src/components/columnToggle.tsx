import React, { useState, useRef } from 'react';
import { Columns, Eye, EyeOff, RotateCcw, X } from 'lucide-react';
import { useClickOutside } from '../hooks';
import { useLocalStorage } from '../hooks';

export interface ColumnDef {
  key: string;
  label: string;
  required?: boolean; // cannot be hidden
}

interface ColumnToggleProps {
  columns: ColumnDef[];
  storageKey: string;
  /** Called with the set of currently visible column keys */
  onChange?: (visible: Set<string>) => void;
}

/**
 * Flexible column visibility toggle — renders a button that opens a popover
 * letting users show/hide columns. State persists to localStorage.
 */
const ColumnToggle: React.FC<ColumnToggleProps> = ({ columns, storageKey, onChange }) => {
  const defaultVisible = new Set(columns.map(c => c.key));
  const [visibleKeys, setVisibleKeys] = useLocalStorage<string[]>(
    `col_vis_${storageKey}`,
    columns.map(c => c.key),
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const visible = new Set(visibleKeys);
  const hiddenCount = columns.filter(c => !visible.has(c.key) && !c.required).length;

  const toggle = (key: string) => {
    const col = columns.find(c => c.key === key);
    if (col?.required) return;
    const next = new Set(visible);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const arr = [...next];
    setVisibleKeys(arr);
    onChange?.(next);
  };

  const reset = () => {
    const arr = columns.map(c => c.key);
    setVisibleKeys(arr);
    onChange?.(defaultVisible);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`aki-btn sm ${
          hiddenCount > 0
            ? 'aki-btn-soft-emerald'
            : 'aki-btn-secondary'
        }`}
        title="Toggle columns"
      >
        <Columns size={13} />
        <span>Columns</span>
        {hiddenCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'var(--aki-blue)', color: '#fff' }}>
            {hiddenCount} hidden
          </span>
        )}
      </button>

      {open && (
        <div className="aki-flyout-menu absolute right-0 top-full mt-2 w-56 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-alt)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Visible Columns</p>
            <div className="flex items-center gap-1">
              {hiddenCount > 0 && (
                <button onClick={reset} className="aki-btn aki-btn-secondary xs icon-only" title="Reset to default">
                  <RotateCcw size={12} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="aki-btn aki-btn-secondary xs icon-only">
                <X size={12} />
              </button>
            </div>
          </div>
          <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
            {columns.map(col => {
              const isVisible = visible.has(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  disabled={col.required}
                  className={`aki-btn-ghost w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left ${
                    isVisible ? '' : 'disabled:opacity-50'
                  } disabled:cursor-not-allowed`}
                  style={{ color: isVisible ? 'var(--text)' : 'var(--text-4)' }}
                >
                  <span className="shrink-0" style={{ color: isVisible ? 'var(--aki-blue)' : 'var(--text-4)' }}>
                    {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </span>
                  <span className="text-xs font-semibold flex-1">{col.label}</span>
                  {col.required && (
                    <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Required</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: '1px solid var(--border-alt)', color: 'var(--text-4)' }}>
            {visible.size} of {columns.length} columns shown
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnToggle;






