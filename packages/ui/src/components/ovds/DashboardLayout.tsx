/**
 * DashboardLayout — Ovds-inspired two-column shell for embedded ovds views.
 * Dark sidebar (--ovds-sidebar) + white main area.
 * Uses OVDS CSS variables — no legacy financial-* classes.
 */
import React, { ReactNode } from 'react';

export interface DashboardLayoutProps {
  children: ReactNode;
  /** Override the default nav items */
  menuItems?: string[];
  /** Active menu key */
  activeItem?: string;
  /** Called when a menu item is clicked */
  onMenuClick?: (item: string) => void;
  /** Page title shown in the topbar */
  title?: string;
  /** Primary action label */
  actionLabel?: string;
  /** Called when the primary CTA is clicked */
  onAction?: () => void;
}

const DEFAULT_MENU = ['Dashboard', 'Revenues', 'Expenses', 'Accounts', 'Reports', 'Settings'];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  menuItems = DEFAULT_MENU,
  activeItem,
  onMenuClick,
  title = 'Dashboard Overview',
  actionLabel = '+ Add Transaction',
  onAction,
}) => (
  <div
    className="flex min-h-screen antialiased"
    style={{
      background: 'var(--bg-main)',
      color: 'var(--text)',
      fontFamily: 'var(--font)',
      fontSize: 14,
    }}
  >
    {/* ── Navigation Drawer ─────────────────────────────────────────────── */}
    <aside
      className="w-64 flex-col fixed h-full z-30 hidden lg:flex"
      style={{ background: 'var(--sidebar-bg, var(--ovds-sidebar, #0B1221))', borderRight: 'none' }}
      aria-label="Sidebar navigation"
    >
      {/* Logo bar */}
      <div
        className="h-16 flex items-center px-6 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[15px] font-bold tracking-tight text-white">OVDS</span>
        <span className="ml-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-slate-500 bg-slate-800">
          v2
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" role="navigation">
        {menuItems.map((item) => {
          const isActive = item === (activeItem ?? menuItems[0]);
          return (
            <button
              key={item}
              onClick={() => onMenuClick?.(item)}
              className={[
                'w-full flex items-center px-3 py-2.5 text-[13px] font-medium rounded-md transition-all',
                isActive
                  ? 'bg-[rgba(0,86,210,0.15)] text-[#BFDBFE]'
                  : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0]',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              {item}
            </button>
          );
        })}
      </nav>
    </aside>

    {/* ── Main Viewport ─────────────────────────────────────────────────── */}
    <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
      {/* Topbar */}
      <header
        className="h-12 flex items-center justify-between px-6 sticky top-0 z-20"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
        {onAction && (
          <button
            onClick={onAction}
            className="aki-btn aki-btn-primary text-[12px]"
          >
            {actionLabel}
          </button>
        )}
      </header>

      {/* Page body */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-[var(--page-max)] mx-auto">
          {children}
        </div>
      </main>
    </div>
  </div>
);

export default DashboardLayout;
