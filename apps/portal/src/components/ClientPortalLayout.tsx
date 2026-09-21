import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@ovds/ui';

interface ClientPortalLayoutProps {
  children: React.ReactNode;
}

const ClientPortalLayout: React.FC<ClientPortalLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/invoices', label: 'Invoices', icon: 'FILE_TEXT' },
    { to: '/payments', label: 'Payments', icon: 'CREDIT_CARD' },
    { to: '/profile', label: 'Profile', icon: 'USER' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Icon name="MENU" size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--pro-azure)] to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                O
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-sm">OVDS</span>
                <span className="hidden sm:inline text-slate-400 dark:text-slate-500 text-xs ml-2">| Client Portal</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="text-xs font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:text-[var(--pro-azure-dark)] dark:hover:text-[var(--pro-azure-light)]"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 py-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon name={item.icon as any} size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Mobile sidebar */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-2xl p-4 z-50 animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Menu</span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Icon name="X" size={18} className="text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon name={item.icon as any} size={16} />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalLayout;

