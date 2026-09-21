import React from 'react';

import type { RailButtonProps } from './types';

export const RailButton: React.FC<RailButtonProps> = ({
  label, active = false, badge = 0, suppressTooltip = false, onClick, children,
}) => (
  <div className="relative group/rb">
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 38, height: 38,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8,
        transition: 'background 140ms, color 140ms',
        /* Ovds SaaS white rail: active = green tint, idle = grey icon */
        background: active
          ? 'var(--sidebar-active-bg)'
          : 'transparent',
        color: active ? 'var(--sidebar-active-fg)' : 'var(--sidebar-fg-muted)',
        border: active
          ? '1px solid rgba(79,186,111,0.25)'
          : '1px solid transparent',
        position: 'relative',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover-bg)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-fg)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--sidebar-fg-muted)';
        }
      }}
    >
      {children}
      {badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 4, right: 4,
            minWidth: 15, height: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--pro-rose)',
            color: '#fff',
            fontSize: 8, fontWeight: 800,
            borderRadius: 99,
            border: '1.5px solid var(--sidebar-rail-bg)',
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>

    {/* Tooltip — always dark for contrast regardless of sidebar colour */}
    {!suppressTooltip && (
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          left: 'calc(100% + 10px)',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 400,
          opacity: 0,
          transition: 'opacity 120ms 280ms',
          whiteSpace: 'nowrap',
        }}
        className="group-hover/rb:opacity-100"
      >
        <div
          style={{
            background: '#1F2937',
            color: '#F9FAFB',
            fontSize: 11, fontWeight: 600,
            padding: '5px 11px',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.06)',
            position: 'relative',
          }}
        >
          {label}
          {/* Arrow */}
          <span
            style={{
              position: 'absolute',
              right: '100%', top: '50%', transform: 'translateY(-50%)',
              borderWidth: 5, borderStyle: 'solid',
              borderColor: 'transparent #1F2937 transparent transparent',
            }}
          />
        </div>
      </div>
    )}
  </div>
);
