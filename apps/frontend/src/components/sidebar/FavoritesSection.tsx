import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { prefetchRoute } from '../../lib/routePreloader';
import { Icon } from '../ui';
import { renderIcon } from './utils';
import type { NavItem } from './types';

interface FavoritesSectionProps {
  favItems: NavItem[];
  onNavClick?: () => void;
  onTogglePin: (to: string) => void;
}

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({ favItems, onNavClick, onTogglePin }) => {
  const { t } = useTranslation();

  if (favItems.length === 0) return null;

  return (
    <div className="pt-2 pb-1">
      <div className="flex items-center gap-1.5 px-4 mb-1">
        <Icon name="STAR" size={9} className="text-amber-400 fill-amber-400 shrink-0" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
          {t('sidebar.favorites', { defaultValue: 'Favorites' })}
        </span>
      </div>
      {favItems.map(item => (
        <NavLink
          key={`fav-${item.to}`}
          to={item.to}
          onClick={onNavClick}
          onMouseEnter={() => prefetchRoute(item.to)}
          className={({ isActive }) =>
            ['group/fav flex items-center gap-2.5 px-3 py-[7px] text-[12px] font-medium transition-all rounded-xl mx-1.5',
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-800',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{renderIcon(item.icon)}</span>
              <span className="flex-1 truncate">{item.label}</span>
              <button
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onTogglePin(item.to); }}
                className="shrink-0 text-amber-400 hover:text-rose-400 transition-colors opacity-0 group-hover/fav:opacity-100"
                title="Remove from Favorites"
              >
                <Icon name="STAR" size={10} className="fill-current" />
              </button>
            </>
          )}
        </NavLink>
      ))}
      <div className="h-px bg-slate-100 mx-3 mt-2 mb-0.5" />
    </div>
  );
};
