import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../rbac/AuthContext';
import { prefetchRoute } from '../../lib/routePreloader';
import { Icon } from '../ui';
import { QUICK_CREATE_ACTIONS } from './constants';

interface QuickCreateMenuProps {
  onClose: () => void;
  onNavClick?: () => void;
}

export const QuickCreateMenu: React.FC<QuickCreateMenuProps> = ({ onClose, onNavClick }) => {
  const { can } = useAuth();
  const navigate = useNavigate();
  const ref = React.useRef<HTMLDivElement>(null);
  const visible = QUICK_CREATE_ACTIONS.filter(a => can(a.permission));

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (visible.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 z-[290]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={[
          'fixed top-0 z-[300] w-60',
          'max-h-screen flex flex-col',
          'bg-white border-r border-slate-200/80',
          'shadow-2xl shadow-slate-300/30 overflow-hidden',
          'animate-aki-slide-in-left',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <p className="text-[11px] font-bold text-slate-700">Quick Create</p>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <Icon name="CLOSE" size={13} />
          </button>
        </div>
        <div className="py-1.5 overflow-y-auto scrollbar-hide flex-1 min-h-0">
          {visible.map(action => (
            <button
              key={action.to}
              onClick={() => { navigate(action.to); onClose(); onNavClick?.(); }}
              onMouseEnter={() => prefetchRoute(action.to)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group/qc"
            >
              <span className={`w-8 h-8 rounded-xl ${action.color} flex items-center justify-center shrink-0 ${action.iconColor} transition-transform group-hover/qc:scale-110 duration-150`}>
                <Icon name={action.icon} size={15} />
              </span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[12px] font-semibold text-slate-700 leading-none truncate">{action.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{action.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
