import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { prefetchRoute } from '../../lib/routePreloader';
import { Icon } from '../ui';

import type { NavItem } from './types';
import { renderIcon } from './utils';

interface FavoritesSectionProps {
  favItems: NavItem[];
  onNavClick?: () => void;
  onTogglePin: (to: string) => void;
}

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favItems, onNavClick, onTogglePin,
}) => {
  const { t } = useTranslation();
  if (favItems.length === 0) return null;

  return (
    <div style={{ paddingTop: 8, paddingBottom: 4 }}>
      {/* Section label */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 16px 6px',
        }}
      >
        <Icon
          name="STAR"
          size={9}
          style={{ color: 'var(--pro-azure)', flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 9, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: 'var(--text-4)',
          }}
        >
          {t('sidebar.favorites', { defaultValue: 'Favorites' })}
        </span>
      </div>

      {/* Items */}
      {favItems.map(item => (
        <NavLink
          key={`fav-${item.to}`}
          to={item.to}
          onClick={onNavClick}
          onMouseEnter={() => prefetchRoute(item.to)}
          style={{ textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <div
              className="group/fav"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                margin: '1px 8px',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                transition: 'background 100ms, color 100ms',
                color: isActive ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--sidebar-hover-bg)';
                  (e.currentTarget as HTMLDivElement).style.color = 'var(--sidebar-fg-hover)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  (e.currentTarget as HTMLDivElement).style.color = 'var(--sidebar-fg)';
                }
              }}
            >
              {/* Active left bar */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 16, borderRadius: '0 3px 3px 0',
                    background: 'var(--pro-azure)',
                  }}
                />
              )}
              <span style={{ flexShrink: 0, color: isActive ? 'var(--pro-azure)' : 'var(--text-4)', fontSize: 12 }}>
                {renderIcon(item.icon, 12)}
              </span>
              <span
                style={{
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontSize: 12, fontWeight: isActive ? 600 : 500,
                }}
              >
                {item.label}
              </span>
              {/* Unpin */}
              <button
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onTogglePin(item.to); }}
                className="opacity-0 group-hover/fav:opacity-100 transition-opacity"
                style={{
                  flexShrink: 0,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--pro-azure)', padding: 2, borderRadius: 4,
                  display: 'flex', alignItems: 'center',
                }}
                title="Remove from Favorites"
              >
                <Icon name="STAR" size={10} />
              </button>
            </div>
          )}
        </NavLink>
      ))}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '6px 12px 2px' }} />
    </div>
  );
};
