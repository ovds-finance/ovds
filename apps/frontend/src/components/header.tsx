import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import { useTheme } from '@ovds/ui';
import { useClickOutside } from '../hooks';
import LanguageSwitcher from './languageSwitcher';
import api from '../services/api';
import { Icon } from './ui';
import { useNotifications } from '../hooks/useNotifications';

export interface HeaderProps {
  title: string;
  onMobileMenuToggle?: () => void;
  sidebarOpen?: boolean;
  onOpenSearch?: () => void;
}

// -- Quick Create Actions ------------------------------------------------------
const QUICK_CREATE = [
  { label: 'Invoice',       icon: 'INVOICE',    to: '/sales/invoices',       color: 'bg-sky-500 text-white' },
  { label: 'Bill',          icon: 'VENDOR',     to: '/purchases/bills',          color: 'bg-sky-500 text-white' },
  { label: 'Expense',       icon: 'MONEY',      to: '/purchases/expenses',       color: 'bg-sky-500 text-white' },
  { label: 'Customer',      icon: 'CUSTOMER',   to: '/accounting/hub?tab=CUSTOMERS', color: 'bg-sky-500 text-white' },
  { label: 'Vendor',        icon: 'COMPANY',    to: '/accounting/hub?tab=VENDORS',   color: 'bg-sky-500 text-white' },
  { label: 'Fund Transfer', icon: 'REFRESH',    to: '/banking/transfers', color: 'bg-sky-500 text-white' },
];

// -- Notification Item ---------------------------------------------------------
interface NotifItem {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const NOTIF_ICON: Record<string, any> = {
  info:    'INFO',
  warning: 'WARNING',
  success: 'SUCCESS',
  error:   'DANGER',
};

// -- Header --------------------------------------------------------------------
const Header: React.FC<HeaderProps> = ({
  title,
  onMobileMenuToggle,
  sidebarOpen,
  onOpenSearch,
}) => {
  const { t } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  const company = companies.find(c => c.id === selectedCompanyId);

  // -- Dropdown states --------------------------------------------------------
  const [showNotifs, setShowNotifs]       = useState(false);
  const [showProfile, setShowProfile]     = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showCompany, setShowCompany]     = useState(false);

  // -- Notifications (real-time via WebSocket + REST fallback) ---------------
  const {
    notifications: notifItems,
    unreadCount,
    loading: notifsLoading,
    markRead: markOneRead,
    markAllRead,
    refresh: fetchNotifs,
  } = useNotifications(!!user);

  // Map hook notifications to the header's internal shape
  const notifs = notifItems.map(n => ({
    id:        n.id,
    title:     n.title,
    body:      n.message,
    type:      'info' as const,
    read:      n.isRead,
    createdAt: n.createdAt,
    actionUrl: n.link,
  }));

  // -- Click-outside refs -----------------------------------------------------
  const notifsRef      = useRef<HTMLDivElement>(null);
  const profileRef     = useRef<HTMLDivElement>(null);
  const quickCreateRef = useRef<HTMLDivElement>(null);
  const companyRef     = useRef<HTMLDivElement>(null);

  useClickOutside(notifsRef,      () => setShowNotifs(false));
  useClickOutside(profileRef,     () => setShowProfile(false));
  useClickOutside(quickCreateRef, () => setShowQuickCreate(false));
  useClickOutside(companyRef,     () => setShowCompany(false));

  // Close all dropdowns on route change
  useEffect(() => {
    setShowNotifs(false);
    setShowProfile(false);
    setShowQuickCreate(false);
    setShowCompany(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
    SPURADMIN:  { label: 'SysAdmin',  cls: 'bg-rose-50 text-rose-600' },
    SUPERADMIN: { label: 'SuperAdmin',cls: 'bg-rose-50 text-rose-600' },
    ADMIN:      { label: 'Admin',     cls: 'bg-sky-50 text-sky-600' },
    HR:        { label: 'HR',       cls: 'bg-emerald-200/20 text-slate-800' },
    ovds:   { label: 'ovds',  cls: 'bg-emerald-200/20 text-slate-800' },
    ACCOUNTING:{ label: 'Accounting',cls:'bg-emerald-200/20 text-slate-800' },
    EMPLOYEE:  { label: 'Employee', cls: 'bg-emerald-200/10 text-emerald-600' },
    AUDITOR:   { label: 'Auditor',  cls: 'bg-amber-50 text-amber-600' },
    IFRS_OFFICER: { label: 'IFRS', cls: 'bg-sky-50 text-sky-600' },
  };
  const roleBadge = ROLE_BADGE[user?.role ?? ''] ?? { label: user?.role ?? '', cls: 'bg-ovds-muted text-slate-800' };

  return (
    <header 
      style={{ zIndex: 80 }}
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-5 sticky top-0 h-12 transition-colors duration-200"
    >

      {/* -- Left: Mobile Toggle + Page Title + Search --------------- */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-ovds-text-muted dark:text-ovds-text-subtle hover:bg-ovds-muted dark:hover:bg-ovds-muted-dark transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <Icon name="CLOSE" size={16} /> : <Icon name="MENU" size={16} />}
        </button>

        {/* Page title — shown on mobile where sidebar breadcrumb is hidden */}
        {title && (
          <span className="md:hidden ovds-card-title truncate max-w-[140px] ovds-module-title">
            {title}
          </span>
        )}

        {/* Search pill — desktop */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-ovds-muted dark:bg-ovds-muted-dark border border-ovds-border-subtle dark:border-ovds-muted-dark rounded-xl text-ovds-text-muted dark:text-ovds-text-subtle hover:border-ovds-accent/30 hover:bg-ovds-surface dark:hover:bg-ovds-surface-dark transition-all group min-w-[220px]"
          aria-label="Open search"
        >
          <Icon name="SEARCH" size={13} className="text-slate-400 shrink-0" />
          <span className="text-[12px] text-slate-400 flex-1 text-left">
            {t('header.search_placeholder') || 'Search customers, tickets, routes...'}
          </span>
          <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-ovds-surface dark:bg-ovds-surface-dark border border-ovds-border rounded-md text-[9px] font-mono leading-none text-ovds-text-muted dark:text-ovds-text-subtle shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* -- Right: Actions -------------------------------------------------- */}
      <div className="flex items-center gap-1">

        {/* Company switcher */}
        {companies.length > 0 && (
          <div ref={companyRef} className="relative hidden lg:block">
            <button
              onClick={() => setShowCompany(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all text-[11px] font-medium border border-transparent hover:border-slate-200"
            >
              <Icon name="COMPANY" size={13} className="text-slate-400 shrink-0" />
              <span className="truncate max-w-[90px]">{company?.name ?? t('header.select_company')}</span>
              <Icon name="CHEVRON_DOWN" size={10} className={`text-slate-400 transition-transform ${showCompany ? 'rotate-180' : ''}`} />
            </button>

            {showCompany && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-emerald-200/30 dark:border-slate-700 rounded-lg shadow-lg z-[200] overflow-hidden animate-aki-enter">
                <div className="px-3 py-1.5 border-b border-emerald-200/20 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">{t('header.switch_company')}</p>
                </div>
                <div className="py-0.5 max-h-44 overflow-y-auto">
                  {companies.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompanyId(c.id); setShowCompany(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-200/10 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className="w-5 h-5 rounded bg-emerald-200/20 dark:bg-emerald-200/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-[9px] font-bold shrink-0">
                        {c.name?.charAt(0)?.toUpperCase() ?? 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-ovds-text-main dark:text-ovds-text-subtle truncate">{c.name}</p>
                        {c.tin && <p className="text-[9px] text-emerald-400 truncate">TIN: {c.tin}</p>}
                      </div>
                      {c.id === selectedCompanyId && <Icon name="SUCCESS" size={11} className="text-emerald-600 shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-emerald-200/20 dark:border-slate-800 p-1.5">
                  <button
                    onClick={() => { navigate('/companies'); setShowCompany(false); }}
                    className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200/10 dark:hover:bg-emerald-200/10 rounded-md transition-colors font-medium"
                  >
                    <Icon name="ADD" size={10} /> {t('header.manage_companies')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Notifications */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => { setShowNotifs(v => !v); if (!showNotifs) fetchNotifs(); }}
            className="relative w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Icon name="NOTIFICATION" size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-900 border border-emerald-200/30 dark:border-slate-700 rounded-lg shadow-lg z-[200] overflow-hidden animate-aki-enter">
              <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-200/20 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Icon name="NOTIFICATION" size={11} className="text-emerald-600" />
                  <p className="text-[11px] font-semibold text-ovds-text-main dark:text-ovds-text-subtle">{t('header.notifications')}</p>
                  {unreadCount > 0 && (
                    <span className="px-1 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-500/30 dark:text-rose-600 text-[9px] font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                    {t('header.mark_all_read')}
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto">
                {notifsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Icon name="REFRESH" size={13} className="animate-spin text-emerald-400" />
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                    <Icon name="SUCCESS" size={16} className="text-emerald-400" />
                    <p className="text-[11px] text-emerald-400">{t('header.all_caught_up')}</p>
                  </div>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-2.5 px-3 py-2 border-b border-ovds-border dark:border-ovds-border-subtle/60 hover:bg-emerald-200/10 dark:hover:bg-ovds-muted-dark/40 transition-colors cursor-pointer ${!n.read ? 'bg-emerald-200/5 dark:bg-emerald-200/5' : ''}`}
                      onClick={() => { if (!n.read) markOneRead(n.id); if (n.actionUrl) navigate(n.actionUrl); setShowNotifs(false); }}
                    >
                      <div className="mt-0.5 shrink-0"><Icon name={NOTIF_ICON[n.type] ?? NOTIF_ICON.info} size={13} /></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-semibold truncate ${!n.read ? 'text-ovds-text-main dark:text-ovds-text-subtle' : 'text-slate-800 dark:text-ovds-text-muted'}`}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-emerald-400 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[9px] text-ovds-text-subtle dark:text-slate-800 mt-0.5">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-emerald-200/20 dark:border-slate-800 p-1.5">
                <button
                  onClick={() => { navigate('/notifications'); setShowNotifs(false); }}
                  className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200/10 dark:hover:bg-emerald-200/10 rounded-md transition-colors font-medium"
                >
                  {t('header.view_all_notifications')} <Icon name="CHEVRON_RIGHT" size={10} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher variant="dropdown" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Icon name="SUN" size={15} className="text-amber-400" /> : <Icon name="MOON" size={15} className="text-slate-500" />}
        </button>

        {/* Quick Create — CycleIQ "Start Shift" style CTA */}
        <div ref={quickCreateRef} className="relative">
          <button
            onClick={() => setShowQuickCreate(v => !v)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[12px] font-semibold transition-all shadow-sm shadow-emerald-500/20"
            aria-label="Quick create"
            title="Quick Create"
          >
            <Icon name="ADD" size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {showQuickCreate && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-emerald-200/40 dark:border-slate-700 rounded-lg shadow-lg z-[200] overflow-hidden animate-aki-enter">
              <div className="px-2.5 py-1.5 border-b border-emerald-200/20 dark:border-slate-800">
                <p className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">{t('header.quick_create')}</p>
              </div>
              <div className="py-0.5">
                {QUICK_CREATE.map(a => (
                  <button
                    key={a.to}
                    onClick={() => { navigate(a.to); setShowQuickCreate(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-emerald-200/10 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${a.color}`}>
                      <Icon name={a.icon as any} size={11} />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* User Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[12px] font-semibold text-slate-700 leading-none truncate max-w-[80px]">
                {user?.username ?? 'User'}
              </p>
            </div>
            <Icon name="CHEVRON_DOWN" size={11} className={`text-slate-400 hidden md:block transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-emerald-200/40 dark:border-slate-700 rounded-lg shadow-lg z-[200] overflow-hidden animate-aki-enter">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-emerald-200/20 dark:border-slate-800 bg-emerald-200/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.username}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block ${roleBadge.cls}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-0.5">
                {[
                  { icon: 'CUSTOMER', label: t('header.my_profile'), to: '/settings?tab=profile' },
                  { icon: 'SETTINGS', label: t('header.settings'), to: '/settings' },
                  { icon: 'SHIELD',  label: t('header.security'), to: '/settings?tab=taxes' },
                  { icon: 'KEYBOARD', label: t('header.keyboard_shortcuts'), action: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' })) },
                  { icon: 'ACTIVITY', label: t('header.activity_feed'), action: () => window.dispatchEvent(new CustomEvent('ovds:toggle-activity')) },
                ].map((item, i) => (
                  item.to ? (
                    <Link
                      key={i}
                      to={item.to}
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-emerald-200/10 dark:hover:bg-ovds-muted-dark transition-colors text-[11px] text-slate-800 dark:text-ovds-text-muted hover:text-ovds-text-main dark:hover:text-ovds-text-subtle"
                    >
                      <span className="text-emerald-400"><Icon name={item.icon as any} size={12} /></span>
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={i}
                      onClick={() => { item.action?.(); setShowProfile(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-emerald-200/10 dark:hover:bg-ovds-muted-dark transition-colors text-[11px] text-slate-800 dark:text-ovds-text-muted hover:text-ovds-text-main dark:hover:text-ovds-text-subtle"
                    >
                      <span className="text-emerald-400"><Icon name={item.icon as any} size={12} /></span>
                      {item.label}
                    </button>
                  )
                ))}
              </div>

              {/* Company info */}
              {company && (
                <div className="border-t border-emerald-200/20 dark:border-slate-800 px-3 py-2 bg-emerald-200/5 dark:bg-white/[0.01]">
                  <div className="flex items-center gap-1.5">
                    <Icon name="COMPANY" size={10} className="text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-800 dark:text-ovds-text-muted truncate">{company.name}</p>
                      {company.tin && <p className="text-[9px] text-emerald-400">TIN: {company.tin}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Logout */}
              <div className="border-t border-emerald-200/20 dark:border-slate-800 p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-[11px] text-rose-600 dark:text-rose-400 font-semibold"
                >
                  <Icon name="LOGOUT" size={12} />
                  {t('header.sign_out')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;


