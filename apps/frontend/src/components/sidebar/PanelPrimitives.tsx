import React from 'react';

import { Icon } from '../ui';

import type { PanelRowProps } from './types';

/**
 * PanelPrimitives — Shared building blocks for sidebar flyover panels
 * (Profile, Notifications, QuickCreate, Support).
 *
 * These panels slide over the content area, so they use a slightly elevated
 * white surface consistent with the Ovds SaaS white-sidebar design.
 */

const PANEL_SHELL_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0, bottom: 0,
  width: 288,
  zIndex: 300,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--surface)',
  borderRight: '1px solid var(--border)',
  boxShadow: '8px 0 32px rgba(0,0,0,0.10), 2px 0 8px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  animation: 'aki-slide-in-left 220ms cubic-bezier(0.16,1,0.3,1) both',
};

const PANEL_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  borderBottom: '1px solid var(--border)',
  flexShrink: 0,
  background: 'var(--sys-bg-subtle)',
};

export const PanelShell: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <>
    {/* Backdrop */}
    <div
      onClick={onClose}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0,
        zIndex: 290,
        background: 'rgba(17,24,39,0.30)',
        backdropFilter: 'blur(2px)',
        animation: 'aki-fade-in 160ms ease both',
      }}
    />
    <div style={PANEL_SHELL_STYLE}>
      <div style={PANEL_HEADER_STYLE}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {title}
        </p>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-4)',
            cursor: 'pointer',
            transition: 'background 120ms, color 120ms',
          }}
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
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  </>
);

export const PanelRow: React.FC<PanelRowProps> = ({
  icon, label, sub, badge, badgeCls, onClick, danger, right,
}) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      transition: 'background 100ms, color 100ms',
      color: danger ? 'var(--pro-rose)' : 'var(--text-2)',
      textAlign: 'left',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLButtonElement).style.background = danger
        ? 'var(--sys-state-critical)'
        : 'var(--sys-bg-subtle)';
      (e.currentTarget as HTMLButtonElement).style.color = danger
        ? 'var(--pro-rose)'
        : 'var(--text)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      (e.currentTarget as HTMLButtonElement).style.color = danger
        ? 'var(--pro-rose)'
        : 'var(--text-2)';
    }}
  >
    <span style={{ flexShrink: 0, color: 'var(--text-4)' }}>{icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sub}
        </p>
      )}
    </div>
    {badge && (
      <span
        style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700,
          padding: '2px 7px', borderRadius: 99,
          background: 'var(--sidebar-new-badge-bg)',
          color: 'var(--sidebar-new-badge-fg)',
        }}
        className={badgeCls}
      >
        {badge}
      </span>
    )}
    {right && <span style={{ flexShrink: 0, color: 'var(--text-4)' }}>{right}</span>}
  </button>
);

export const PanelDivider: React.FC = () => (
  <div style={{ height: 1, background: 'var(--border)', margin: '4px 16px' }} />
);

export const PanelSectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <p style={{
    padding: '12px 16px 6px',
    fontSize: 9, fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--text-4)',
  }}>
    {label}
  </p>
);
