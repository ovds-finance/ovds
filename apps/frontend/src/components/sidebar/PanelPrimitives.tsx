import React from 'react';

export const PanelShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <>
    <div className="fixed inset-0 z-[290] bg-black/20 backdrop-blur-[2px] animate-aki-fade-in" onClick={onClose} aria-hidden="true" />
    <div
      className="fixed top-0 bottom-0 w-72 z-[300] flex flex-col bg-white border-r border-slate-200/80 shadow-2xl shadow-slate-300/30 overflow-hidden animate-aki-slide-in-left"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
        <p className="text-[12px] font-bold text-slate-700">{title}</p>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Icon name="CLOSE" size={14} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0">{children}</div>
    </div>
  </>
);

import { Icon } from '../ui';
import type { PanelRowProps } from './types';

export const PanelRow: React.FC<PanelRowProps> = ({ icon, label, sub, badge, badgeCls = 'bg-blue-100 text-blue-700', onClick, danger, right }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors group/pr ${danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
  >
    <span className={`shrink-0 transition-colors ${danger ? 'text-rose-500' : 'text-slate-400 group-hover/pr:text-slate-600'}`}>{icon}</span>
    <div className="flex-1 text-left min-w-0">
      <p className="text-[12px] font-semibold leading-none truncate">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
    {badge && <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>}
    {right && <span className="shrink-0 text-slate-300">{right}</span>}
  </button>
);

export const PanelDivider: React.FC = () => <div className="h-px bg-slate-100 my-1 mx-4" />;
export const PanelSectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
);
