import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

import { prefetchRoute } from '../../lib/routePreloader';
import { Icon } from '../ui';

import { SHORTCUT_HINTS } from './constants';
import { NavItemRow } from './NavItemRow';
import type { NavGroupRowProps } from './types';
import { renderIcon, highlightText } from './utils';

/**
 * Ovds SaaS style module icon colours.
 * Light tint backgrounds that work on a WHITE sidebar.
 */
const MODULE_HEX: Record<string, { iconBg: string; iconColor: string }> = {
  dashboard:            { iconBg: '#F0FDF4', iconColor: '#4FBA6F' },
  sales:                { iconBg: '#F0FDF4', iconColor: '#4FBA6F' },
  crm:                  { iconBg: '#EFF6FF', iconColor: '#2980B9' },
  trade:                { iconBg: '#F0FAF3', iconColor: '#16A085' },
  purchases:            { iconBg: '#FEF9EE', iconColor: '#E67E22' },
  inventory:            { iconBg: '#FFFBEB', iconColor: '#D97706' },
  banking:              { iconBg: '#EFF6FF', iconColor: '#2980B9' },
  tax_compliance:       { iconBg: '#FEF2F2', iconColor: '#E74C3C' },
  accounting:           { iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  ifrs_compliance:      { iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  aabe_compliance:      { iconBg: '#EFF6FF', iconColor: '#2980B9' },
  commercial_code:      { iconBg: '#F9FAFB', iconColor: '#6B7280' },
  reports:              { iconBg: '#F0FDF4', iconColor: '#4FBA6F' },
  hr_payroll:           { iconBg: '#F0FDFA', iconColor: '#0D9488' },
  system:               { iconBg: '#F9FAFB', iconColor: '#6B7280' },
  administration:       { iconBg: '#F9FAFB', iconColor: '#6B7280' },
  governance:           { iconBg: '#EFF6FF', iconColor: '#2980B9' },
  iot:                  { iconBg: '#F0FDFA', iconColor: '#0D9488' },
  device_control:       { iconBg: '#F9FAFB', iconColor: '#6B7280' },
  developer:            { iconBg: '#F9FAFB', iconColor: '#374151' },
  regulatory_reporting: { iconBg: '#F0FDF4', iconColor: '#4FBA6F' },
  ovds_module:          { iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  disaster_fund:        { iconBg: '#FEF2F2', iconColor: '#E74C3C' },
  // Consolidated parent keys
  tax:                  { iconBg: '#FEF2F2', iconColor: '#E74C3C' },
  finance:              { iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  system_admin:         { iconBg: '#F9FAFB', iconColor: '#6B7280' },
};

export const NavGroupRow = React.memo<NavGroupRowProps>(function NavGroupRow({
  group, visibleItems, isOpen, onToggle, onNavClick, pinnedRoutes, onTogglePin, onAction, searchQuery,
}) {
  const location = useLocation();
  const { t } = useTranslation();
  const groupLabel = group.i18nKey
    ? t(group.i18nKey, { defaultValue: group.label })
    : group.label;

  const mc = MODULE_HEX[group.key] ?? MODULE_HEX.system;

  const hasActiveChild = !group.flat && visibleItems.some(item => {
    const itemPath = item.to.split('?')[0];
    if (item.end) return location.pathname === itemPath;
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  });

  /* ── Flat (single-route) group ─────────────────────────────────────── */
  if (group.flat && group.to) {
    return (
      <NavLink
        to={group.to}
        end
        onClick={onNavClick}
        onMouseEnter={() => prefetchRoute(group.to ?? '')}
        style={{ textDecoration: 'none' }}
      >
        {({ isActive }) => (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              margin: '1px 6px',
              padding: '7px 10px',
              borderRadius: 6,
              cursor: 'pointer',
              background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
              transition: 'background 100ms',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--sidebar-hover-bg)';
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            {/* Ovds SaaS left-border active indicator */}
            {isActive && (
              <span
                style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20, borderRadius: '0 3px 3px 0',
                  background: 'var(--pro-azure)',
                }}
              />
            )}
            {/* Module icon — coloured on light tint */}
            <span
              style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? mc.iconBg : mc.iconBg,
                color: isActive ? 'var(--pro-azure)' : mc.iconColor,
                transition: 'background 150ms, color 150ms',
              }}
            >
              {renderIcon(group.icon, 14)}
            </span>
            <span
              style={{
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg)',
                letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {groupLabel}
            </span>
          </div>
        )}
      </NavLink>
    );
  }

  /* ── Collapsible group ─────────────────────────────────────────────── */
  return (
    <div style={{ marginBottom: 1 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: 'calc(100% - 12px)',
          display: 'flex', alignItems: 'center', gap: 9,
          margin: '1px 6px',
          padding: '7px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          background: hasActiveChild
            ? 'var(--sidebar-active-bg)'
            : isOpen
            ? 'var(--sys-bg-subtle)'
            : 'transparent',
          border: 'none',
          transition: 'background 100ms',
        }}
        onMouseEnter={e => {
          if (!hasActiveChild && !isOpen) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover-bg)';
          }
        }}
        onMouseLeave={e => {
          if (!hasActiveChild && !isOpen) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }
        }}
      >
        {/* Module icon */}
        <span
          style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: mc.iconBg,
            color: hasActiveChild ? 'var(--pro-azure)' : mc.iconColor,
            transition: 'color 150ms',
          }}
        >
          {renderIcon(group.icon, 14)}
        </span>

        {/* Label */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: hasActiveChild || isOpen ? 600 : 500,
            letterSpacing: '-0.01em',
            color: hasActiveChild
              ? 'var(--sidebar-active-fg)'
              : isOpen
              ? 'var(--sidebar-fg-hover)'
              : 'var(--sidebar-fg)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textAlign: 'left',
            transition: 'color 100ms',
          }}
        >
          {searchQuery ? highlightText(groupLabel, searchQuery) : groupLabel}
        </span>

        {/* Item count badge */}
        {visibleItems.length > 0 && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 9, fontWeight: 700,
              padding: '2px 5px', borderRadius: 99,
              background: hasActiveChild || isOpen
                ? 'rgba(79,186,111,0.15)'
                : 'var(--border-alt)',
              color: hasActiveChild || isOpen
                ? 'var(--pro-azure)'
                : 'var(--text-4)',
            }}
          >
            {visibleItems.length}
          </span>
        )}

        {/* Chevron */}
        <Icon
          name="CHEVRON_DOWN"
          size={12}
          style={{
            flexShrink: 0,
            color: isOpen ? 'var(--text-3)' : 'var(--text-4)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 180ms cubic-bezier(0.4,0,0.2,1), color 100ms',
          }}
        />
      </button>

      {/* ── Animated item list ────────────────────────────────────────── */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? `${visibleItems.length * 36 + 12}px` : 0,
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 200ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease',
        }}
      >
        <div style={{ paddingBottom: 4, paddingTop: 2 }}>
          {visibleItems.map(item => {
            const shortcut = SHORTCUT_HINTS[item.to];
            const pinned   = pinnedRoutes.has(item.to);
            return (
              <NavItemRow
                key={item.to}
                item={item}
                onNavClick={onNavClick}
                onAction={onAction}
                accentText=""
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
