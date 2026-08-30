import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { prefetchRoute } from '../../lib/routePreloader';
import { Icon } from '../ui';
import { ROLE_BADGE } from './constants';
import { renderIcon, highlightText } from './utils';
import type { NavItem } from './types';

interface NavItemRowProps {
  item: NavItem;
  onNavClick?: () => void;
  onAction?: (action: string) => void;
  accentText: string;
  shortcut?: string;
  pinned?: boolean;
  onTogglePin: (to: string) => void;
  searchQuery?: string;
}

export const NavItemRow: React.FC<NavItemRowProps> = ({
  item, onNavClick, onAction, accentText, shortcut, pinned, onTogglePin, searchQuery,
}) => {
  const isAction = item.to.startsWith('#');
  const location = useLocation();
  const permBadge = item.permission ? ROLE_BADGE[item.permission] ?? null : null;

  return (
    <NavLink
      key={item.to}
      to={isAction ? location.pathname : item.to}
      end={item.end}
      onClick={(e) => {
        if (isAction) { e.preventDefault(); onAction?.(item.to); }
        else { onNavClick?.(); }
      }}
      onMouseEnter={() => { if (!isAction) prefetchRoute(item.to); }}
      className={({ isActive }) =>
        [
          'group/nav relative flex items-center gap-2.5 pl-[46px] pr-3 py-[7px] text-[12px] font-medium rounded-xl mx-1.5 transition-all duration-100 border-l-2',
          isActive
            ? `bg-blue-50 ${accentText} border-l-blue-500`
            : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-700 border-l-transparent',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span className={`shrink-0 transition-colors ${isActive ? accentText : 'text-slate-400 group-hover/nav:text-slate-600'}`}>
            {renderIcon(item.icon, 12)}
          </span>
          <span className="flex-1 truncate leading-tight">{searchQuery ? highlightText(item.label, searchQuery) : item.label}</span>
          {/* Permission badge */}
          {permBadge && !isActive && (
            <span className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${permBadge.cls} opacity-0 group-hover/nav:opacity-100 transition-opacity`}>
              {permBadge.label}
            </span>
          )}
          {/* Shortcut hint */}
          {shortcut && !isActive && (
            <kbd className="shrink-0 text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 leading-none opacity-0 group-hover/nav:opacity-100 transition-opacity">
              {shortcut}
            </kbd>
          )}
          {/* Pin/favorite toggle */}
          {item.pinnable && !isActive && (
            <button
              type="button"
              title={pinned ? 'Remove from Favorites' : 'Add to Favorites'}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onTogglePin(item.to); }}
              className={['shrink-0 p-0.5 rounded transition-all opacity-0 group-hover/nav:opacity-100', pinned ? 'text-amber-400 opacity-100' : 'text-slate-400 hover:text-amber-400'].join(' ')}
            >
              <Icon name="STAR" size={10} className={pinned ? 'fill-current' : ''} />
            </button>
          )}
          {/* "New" badge */}
          {item.isNew && (
            <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide leading-none">
              New
            </span>
          )}
          {/* Numeric badge */}
          {!!item.badge && item.badge > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-rose-500 text-white rounded-full px-1 leading-none">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};
