import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { prefetchRoute } from '../../lib/routePreloader';
import { Icon } from '../ui';
import { MODULE_COLORS, ITEM_ACCENT, SHORTCUT_HINTS } from './constants';
import { renderIcon, highlightText } from './utils';
import { NavItemRow } from './NavItemRow';
import type { NavGroupRowProps } from './types';

export const NavGroupRow = React.memo<NavGroupRowProps>(function NavGroupRow({
  group, visibleItems, isOpen, onToggle, onNavClick, pinnedRoutes, onTogglePin, onAction, searchQuery,
}) {
  const location = useLocation();
  const { t } = useTranslation();
  const groupLabel = group.i18nKey ? t(group.i18nKey, { defaultValue: group.label }) : group.label;
  const mc = MODULE_COLORS[group.key] ?? MODULE_COLORS.system;
  const accentText = ITEM_ACCENT[group.key] ?? 'text-slate-600';

  const hasActiveChild = !group.flat && visibleItems.some(item => {
    const itemPath = item.to.split('?')[0];
    if (item.end) return location.pathname === itemPath;
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  });

  if (group.flat && group.to) {
    return (
      <NavLink
        to={group.to}
        end
        onClick={onNavClick}
        onMouseEnter={() => prefetchRoute(group.to ?? '')}
        className={({ isActive }) =>
          [
            'flex items-center gap-3 px-3 py-2 rounded-xl mx-1.5 transition-all duration-150',
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-800',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : `${mc.bg} ${mc.text}`} transition-all duration-150`}>
              {renderIcon(group.icon, 13)}
            </span>
            <span className={`text-[13px] font-semibold ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>{groupLabel}</span>
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={[
          'w-full flex items-center gap-3 px-3 py-2 rounded-xl mx-1.5 transition-all duration-150 group/grp',
          hasActiveChild || isOpen
            ? 'bg-slate-50/80 text-slate-800'
            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-800',
        ].join(' ')}
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${hasActiveChild || isOpen ? `${mc.bg} ${mc.text}` : 'bg-slate-100 text-slate-500 group-hover/grp:bg-slate-200 group-hover/grp:text-slate-600'}`}>
          {renderIcon(group.icon, 13)}
        </span>
        <span className={`flex-1 text-left text-[13px] font-semibold truncate transition-colors duration-150 ${hasActiveChild ? 'text-slate-800' : 'text-slate-600'}`}>
          {searchQuery ? highlightText(groupLabel, searchQuery) : groupLabel}
        </span>
        {visibleItems.length > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${hasActiveChild || isOpen ? mc.bg + ' ' + mc.text : 'bg-slate-100 text-slate-400'}`}>
            {visibleItems.length}
          </span>
        )}
        <Icon
          name="CHEVRON_DOWN"
          size={12}
          className={`shrink-0 transition-all duration-200 ${isOpen ? 'rotate-180 text-slate-500' : 'text-slate-400 group-hover/grp:text-slate-500'}`}
        />
      </button>

      {/* Items — animated expand */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pb-1 pt-0.5 space-y-0">
          {visibleItems.map(item => {
            const shortcut = SHORTCUT_HINTS[item.to];
            const pinned = pinnedRoutes.has(item.to);

            return (
              <NavItemRow
                key={item.to}
                item={item}
                onNavClick={onNavClick}
                onAction={onAction}
                accentText={accentText}
                shortcut={shortcut}
                pinned={pinned}
                onTogglePin={onTogglePin}
                searchQuery={searchQuery}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
