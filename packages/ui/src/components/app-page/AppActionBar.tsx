import React from 'react';
import { X } from 'lucide-react';

export interface AppActionBarProps {
  count: number;
  label?: string;
  actions: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
  }[];
  onClear: () => void;
}

export const AppActionBar: React.FC<AppActionBarProps> = ({ count, label = 'selected', actions, onClear }) => {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-slate-900/30">
        <span className="text-[12px] font-semibold text-slate-300">
          <span className="text-white font-bold">{count}</span> {label}
        </span>
        <div className="w-px h-4 bg-slate-700" />
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all',
              a.danger ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' : 'bg-white/10 text-white hover:bg-white/20',
            ].join(' ')}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
        <button
          onClick={onClear}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all ml-1"
          aria-label="Clear selection"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
