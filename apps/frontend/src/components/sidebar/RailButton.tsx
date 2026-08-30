import React from 'react';
import type { RailButtonProps } from './types';

export const RailButton: React.FC<RailButtonProps> = ({
  label, active = false, badge = 0, suppressTooltip = false, onClick, children,
}) => (
  <div className="relative group/rb">
    <button
      onClick={onClick}
      aria-label={label}
      className={[
        'w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150',
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
      ].join(' ')}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-[14px] h-[14px] flex items-center justify-center bg-rose-500 text-white text-[8px] font-bold rounded-full border-2 border-white leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
    {!suppressTooltip && (
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[400] opacity-0 group-hover/rb:opacity-100 transition-opacity duration-100 delay-300">
        <div className="bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          {label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </div>
      </div>
    )}
  </div>
);
