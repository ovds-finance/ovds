import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { prefetchRoute } from '../../lib/routePreloader';
import { Icon } from '../ui';

import { ROLE_BADGE } from './constants';
import type { NavItem } from './types';
import { renderIcon, highlightText } from './utils';

interface NavItemRowProps {
  item: NavItem;
  onNavClick?: () => void;
  onAction?: (action: string) => void;
  accentText: string;          // kept for type compat
  shortcut?: string;
  pinned?: boolean;
  onTogglePin: (to: string) => void;
  searchQuery?: string;
}

export const NavItemRow: React.FC<NavItemRowProps> = ({
  item, onNavClick, onAction, shortcut, pinned, onTogglePin, searchQuery,
}) => {
  const isAction = item.to.startsWith('#');
  const location = useLocation();
  const permBadge = item.permission ? ROLE_BADGE[item.permission] ?? null : null;

  return (
    <NavLink
      to={isAction ? location.pathname : item.to}
      end={item.end}
      onClick={(e) => {
        if (isAction) { e.preventDefault(); onAction?.(item.to); }
        else { onNavClick?.(); }
      }}
      onMouseEnter={() => { if (!isAction) prefetchRoute(item.to); }}
      style={{ textDecoration: 'none' }}
    >
      {({ isActive }) => (
        <div
          className="group/nav"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            /* Indent under group icon area */
            paddingLeft: 46,
            paddingRight: 8,
            paddingTop: 5,
            paddingBottom: 5,
            margin: '1px 6px',
            borderRadius: 6,
            cursor: 'pointer',
            background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
            transition: 'background 100ms',
            color: isActive ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)',
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
          {/* Ovds SaaS active indicator — green left stripe */}
          {isActive && (
            <span
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: 3, height: 16, borderRadius: '0 3px 3px 0',
                background: 'var(--pro-azure)',
              }}
            />
          )}

          {/* Icon */}
          <span
            style={{
              flexShrink: 0,
              color: isActive ? 'var(--pro-azure)' : 'var(--text-4)',
              transition: 'color 100ms',
            }}
          >
            {renderIcon(item.icon, 12)}
          </span>

          {/* Label */}
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12, fontWeight: isActive ? 600 : 500, lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.005em',
            }}
          >
            {searchQuery ? highlightText(item.label, searchQuery) : item.label}
          </span>

          {/* Permission badge — visible on hover */}
          {permBadge && !isActive && (
            <span
              className="opacity-0 group-hover/nav:opacity-100 transition-opacity"
              style={{
                flexShrink: 0, fontSize: 8, fontWeight: 700,
                padding: '2px 5px', borderRadius: 99,
                background: 'var(--sidebar-new-badge-bg)',
                color: 'var(--sidebar-new-badge-fg)',
              }}
            >
              {permBadge.label}
            </span>
          )}

          {/* Shortcut hint */}
          {shortcut && !isActive && (
            <kbd
              className="opacity-0 group-hover/nav:opacity-100 transition-opacity"
              style={{
                flexShrink: 0, fontSize: 8, fontWeight: 600,
                fontFamily: 'monospace',
                padding: '2px 5px', borderRadius: 4,
                background: 'var(--border-alt)',
                color: 'var(--text-4)',
                lineHeight: 1,
                border: '1px solid var(--border)',
              }}
            >
              {shortcut}
            </kbd>
          )}

          {/* Pin toggle */}
          {item.pinnable && !isActive && (
            <button
              type="button"
              title={pinned ? 'Remove from Favorites' : 'Add to Favorites'}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onTogglePin(item.to); }}
              className="opacity-0 group-hover/nav:opacity-100 transition-opacity"
              style={{
                flexShrink: 0, background: 'none', border: 'none',
                cursor: 'pointer', padding: 2, borderRadius: 4,
                display: 'flex', alignItems: 'center',
                color: pinned ? 'var(--pro-azure)' : 'var(--text-4)',
                transition: 'color 100ms',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--pro-azure)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = pinned ? 'var(--pro-azure)' : 'var(--text-4)')}
            >
              <Icon name="STAR" size={10} style={{ fill: pinned ? 'var(--pro-azure)' : 'none' }} />
            </button>
          )}

          {/* "New" badge — Ovds SaaS green */}
          {item.isNew && (
            <span
              style={{
                flexShrink: 0, fontSize: 8, fontWeight: 800,
                padding: '2px 6px', borderRadius: 99,
                background: 'var(--sidebar-new-badge-bg)',
                color: 'var(--sidebar-new-badge-fg)',
                textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1,
              }}
            >
              New
            </span>
          )}

          {/* Numeric badge */}
          {!!item.badge && item.badge > 0 && (
            <span
              style={{
                flexShrink: 0, minWidth: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800,
                background: 'var(--pro-rose)', color: '#fff',
                borderRadius: 99, padding: '0 4px', lineHeight: 1,
              }}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
};
