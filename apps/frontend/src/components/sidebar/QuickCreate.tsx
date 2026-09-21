import React from 'react';
import { useNavigate } from 'react-router-dom';

import { prefetchRoute } from '../../lib/routePreloader';
import { useAuth } from '../../rbac/AuthContext';
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
        className="fixed top-0 z-[300] w-60 max-h-screen flex flex-col overflow-hidden animate-aki-slide-in-left"
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          boxShadow: '8px 0 32px rgba(0,0,0,0.10), 2px 0 8px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--sys-bg-subtle)' }}
        >
          <p className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>Quick Create</p>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-accent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--pro-azure)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)';
            }}
          >
            <Icon name="CLOSE" size={13} />
          </button>
        </div>

        {/* Action list */}
        <div className="py-1.5 overflow-y-auto flex-1 min-h-0">
          {visible.map(action => (
            <button
              key={action.to}
              onClick={() => { navigate(action.to); onClose(); onNavClick?.(); }}
              onMouseEnter={(e) => {
                prefetchRoute(action.to);
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-subtle)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors group/qc"
              style={{ background: 'transparent' }}
            >
              {/* Icon tile */}
              <span
                className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center shrink-0 ${action.iconColor} transition-transform group-hover/qc:scale-105 duration-150`}
              >
                <Icon name={action.icon} size={15} />
              </span>

              {/* Label + sub */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-[12px] font-semibold leading-none truncate" style={{ color: 'var(--text)' }}>
                  {action.label}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>
                  {action.sub}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
