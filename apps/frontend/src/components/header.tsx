import { useTheme } from '@ovds/ui';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { useBusiness } from '../context/businessContext';
import { useClickOutside } from '../hooks';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../rbac/AuthContext';

import LanguageSwitcher from './languageSwitcher';
import { Icon } from './ui';


export interface HeaderProps {
  title: string;
  onMobileMenuToggle?: () => void;
  sidebarOpen?: boolean;
  onOpenSearch?: () => void;
}

/* ── Quick-create items — Ovds SaaS colour vocabulary ─────────────── */
const QUICK_CREATE = [
  { label: 'Invoice',       icon: 'INVOICE',  to: '/sales/invoices?action=new',          color: '#4FBA6F', bg: '#F0FDF4' },
  { label: 'Bill',          icon: 'VENDOR',   to: '/purchases/bills?action=new',          color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Expense',       icon: 'MONEY',    to: '/purchases/expenses?action=new',       color: '#E67E22', bg: '#FFFBEB' },
  { label: 'Customer',      icon: 'CUSTOMER', to: '/accounting/hub?tab=CUSTOMERS',        color: '#2980B9', bg: '#EFF6FF' },
  { label: 'Vendor',        icon: 'COMPANY',  to: '/accounting/hub?tab=VENDORS',          color: '#0891B2', bg: '#ECFEFF' },
  { label: 'Fund Transfer', icon: 'REFRESH',  to: '/banking/transfers?action=new',        color: '#E74C3C', bg: '#FEF2F2' },
] as const;

/* ── Notification item type ───────────────────────────────────────────── */
interface NotifItem {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const _NOTIF_ICON: Record<string, string> = {
  info: 'INFO', warning: 'WARNING', success: 'SUCCESS', error: 'DANGER',
};

/* ── Notification type badge colours — green for info ───── */
const NOTIF_DOT: Record<string, string> = {
  info: '#4FBA6F', warning: '#E67E22', success: '#059669', error: '#E74C3C',
};

/* ── Role badge map ───────────────────────────────────────────────────── */
const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  SPURADMIN:    { label: 'SysAdmin',   color: '#BE123C',          bg: '#FFF1F2' },
  SUPERADMIN:   { label: 'SuperAdmin', color: '#BE123C',          bg: '#FFF1F2' },
  ADMIN:        { label: 'Admin',      color: '#4FBA6F',          bg: '#F0FDF4' },
  HR:           { label: 'HR',         color: '#065F46',          bg: '#ECFDF5' },
  ovds:         { label: 'OVDS',       color: '#4FBA6F',       bg: '#F0FDF4' },
  ACCOUNTING:   { label: 'Accounting', color: '#5B21B6',          bg: '#F5F3FF' },
  EMPLOYEE:     { label: 'Employee',   color: '#065F46',          bg: '#ECFDF5' },
  AUDITOR:      { label: 'Auditor',    color: '#92400E',          bg: '#FFFBEB' },
  IFRS_OFFICER: { label: 'IFRS',       color: '#4FBA6F',       bg: '#F0FDF4' },
};

/* ── Shared dropdown container styles — Ovds SaaS clean white card ── */
const DROPDOWN_STYLE: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 6px)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
  zIndex: 200,
  overflow: 'hidden',
  animation: 'aki-enter 150ms cubic-bezier(0.16,1,0.3,1) both',
};

/* ─────────────────────────────────────────────────────────────────────── */

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

  const [showNotifs,      setShowNotifs]      = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showCompany,     setShowCompany]     = useState(false);

  const {
    notifications: notifItems,
    unreadCount,
    loading: notifsLoading,
    markRead: markOneRead,
    markAllRead,
    refresh: fetchNotifs,
  } = useNotifications(!!user);

  const notifs: NotifItem[] = notifItems.map(n => ({
    id: n.id, title: n.title, body: n.message,
    type: 'info' as const, read: n.isRead,
    createdAt: n.createdAt, actionUrl: n.link,
  }));

  const notifsRef      = useRef<HTMLDivElement>(null);
  const profileRef     = useRef<HTMLDivElement>(null);
  const quickCreateRef = useRef<HTMLDivElement>(null);
  const companyRef     = useRef<HTMLDivElement>(null);

  useClickOutside(notifsRef,      () => setShowNotifs(false));
  useClickOutside(profileRef,     () => setShowProfile(false));
  useClickOutside(quickCreateRef, () => setShowQuickCreate(false));
  useClickOutside(companyRef,     () => setShowCompany(false));

  useEffect(() => {
    setShowNotifs(false);
    setShowProfile(false);
    setShowQuickCreate(false);
    setShowCompany(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const roleBadge = ROLE_BADGE[user?.role ?? ''] ?? { label: user?.role ?? '', color: '#64748B', bg: '#F1F5F9' };

  /* ── icon button shared style ─────────────────────────────────────── */
  const iconBtnCls = `
    w-8 h-8 flex items-center justify-center rounded-lg transition-all
    hover:bg-[var(--surface-alt)] active:scale-95
  `;

  return (
    <header
      style={{
        zIndex: 80,
        height: 'var(--header-h)',
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--header-border)',
        boxShadow: 'var(--header-shadow)',
        position: 'sticky',
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: 8,
      }}
    >
      {/* ── Left ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">

        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className={`${iconBtnCls} lg:hidden`}
          aria-label="Toggle menu"
          style={{ color: 'var(--text-3)' }}
        >
          {sidebarOpen
            ? <Icon name="CLOSE" size={16} />
            : <Icon name="MENU" size={16} />}
        </button>

        {/* Desktop page title — Ovds SaaS shows current page name in header */}
        {title && (
          <span
            className="hidden lg:block truncate max-w-[200px] font-semibold text-[14px]"
            style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}
          >
            {title}
          </span>
        )}

        {/* Mobile page title */}
        {title && (
          <span
            className="lg:hidden truncate max-w-[140px] font-semibold text-[13px]"
            style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}
          >
            {title}
          </span>
        )}

        {/* ── Search pill — desktop ─────────────────────────────────── */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2.5 rounded-lg transition-all"
          style={{
            minWidth: 220,
            padding: '7px 12px',
            background: 'var(--sys-bg-subtle)',
            border: '1px solid var(--border)',
            color: 'var(--text-4)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--pro-azure)';
            (e.currentTarget as HTMLButtonElement).style.background  = 'var(--surface)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.background  = 'var(--sys-bg-subtle)';
          }}
          aria-label="Open command palette"
        >
          <Icon name="SEARCH" size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
          <span
            className="flex-1 text-left text-[12px] font-medium"
            style={{ color: 'var(--text-4)' }}
          >
            {t('header.search_placeholder') || 'Search anything…'}
          </span>
          <kbd
            className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-4)',
              flexShrink: 0,
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Right ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5">

        {/* Company switcher — desktop only */}
        {companies.length > 0 && (
          <div ref={companyRef} className="relative hidden lg:block mx-1">
            <button
              onClick={() => setShowCompany(v => !v)}
              className="flex items-center gap-1.5 rounded-lg transition-all text-[12px] font-semibold"
              style={{
                padding: '5px 10px',
                color: 'var(--text-3)',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background    = 'var(--surface-alt)';
                (e.currentTarget as HTMLButtonElement).style.borderColor   = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color         = 'var(--text)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background    = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.borderColor   = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color         = 'var(--text-3)';
              }}
            >
              {/* Company avatar */}
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: 'var(--pro-azure-50)', color: 'var(--pro-azure)' }}
              >
                {company?.name?.charAt(0)?.toUpperCase() ?? 'C'}
              </div>
              <span className="truncate max-w-[96px]">
                {company?.name ?? t('header.select_company')}
              </span>
              <Icon
                name="CHEVRON_DOWN" size={11}
                style={{
                  color: 'var(--text-5)',
                  transform: showCompany ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 150ms',
                  flexShrink: 0,
                }}
              />
            </button>

            {showCompany && (
              <div style={{ ...DROPDOWN_STYLE, width: 220 }}>
                <div
                  className="px-3 py-2 flex items-center gap-2"
                  style={{ borderBottom: '1px solid var(--border-alt)' }}
                >
                  <Icon name="COMPANY" size={11} style={{ color: 'var(--text-5)' }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
                    {t('header.switch_company')}
                  </p>
                </div>
                <div className="py-1 max-h-48 overflow-y-auto">
                  {companies.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompanyId(c.id); setShowCompany(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left"
                      style={{ background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: 'var(--pro-azure-50)', color: 'var(--pro-azure)' }}
                      >
                        {c.name?.charAt(0)?.toUpperCase() ?? 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {c.name}
                        </p>
                        {c.tin && (
                          <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>
                            TIN: {c.tin}
                          </p>
                        )}
                      </div>
                      {c.id === selectedCompanyId && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'var(--pro-azure)', color: '#fff' }}
                        >
                          <Icon name="SUCCESS" size={9} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border-alt)', padding: '6px' }}>
                  <button
                    onClick={() => { navigate('/companies'); setShowCompany(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
                    style={{ color: 'var(--pro-azure)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--pro-azure-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon name="ADD" size={11} />
                    {t('header.manage_companies')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        <div
          className="hidden sm:block mx-1"
          style={{ width: 1, height: 18, background: 'var(--border)' }}
        />

        {/* Notifications */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => { setShowNotifs(v => !v); if (!showNotifs) fetchNotifs(); }}
            className={`${iconBtnCls} relative`}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            style={{ color: 'var(--text-3)' }}
          >
            <Icon name="NOTIFICATION" size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute flex items-center justify-center font-bold"
                style={{
                  top: 4, right: 4,
                  minWidth: 14, height: 14,
                  fontSize: 8, lineHeight: 1,
                  borderRadius: 99,
                  background: 'var(--pro-rose)',
                  color: '#fff',
                  border: '1.5px solid var(--surface)',
                  padding: '0 2px',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{ ...DROPDOWN_STYLE, width: 320, right: 0 }}>
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid var(--border-alt)' }}
              >
                <div className="flex items-center gap-2">
                  <Icon name="NOTIFICATION" size={13} style={{ color: 'var(--pro-azure)' }} />
                  <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                    {t('header.notifications')}
                  </span>
                  {unreadCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'var(--pro-azure-50)', color: 'var(--pro-azure)' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold transition-colors"
                    style={{ color: 'var(--pro-azure)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {t('header.mark_all_read')}
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
                {notifsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Icon name="REFRESH" size={14} className="animate-aki-spin" style={{ color: 'var(--text-4)' }} />
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--surface-alt)', color: 'var(--text-4)' }}
                    >
                      <Icon name="SUCCESS" size={18} />
                    </div>
                    <p className="text-[12px] font-medium" style={{ color: 'var(--text-4)' }}>
                      {t('header.all_caught_up')}
                    </p>
                  </div>
                ) : (
                  notifs.map(n => (
                    <button
                      key={n.id}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                      style={{
                        background: !n.read ? 'var(--sys-bg-accent)' : 'transparent',
                        borderBottom: '1px solid var(--border-alt)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = !n.read ? 'var(--sys-bg-accent)' : 'transparent')}
                      onClick={() => {
                        if (!n.read) markOneRead(n.id);
                        if (n.actionUrl) navigate(n.actionUrl);
                        setShowNotifs(false);
                      }}
                    >
                      {/* Type dot */}
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: NOTIF_DOT[n.type] ?? 'var(--pro-azure)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12px] font-semibold truncate"
                          style={{ color: n.read ? 'var(--text-3)' : 'var(--text)' }}
                        >
                          {n.title}
                        </p>
                        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-4)' }}>
                          {n.body}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-5)' }}>
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && (
                        <div
                          className="w-2 h-2 rounded-full mt-1 shrink-0"
                          style={{ background: 'var(--pro-azure)' }}
                        />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid var(--border-alt)', padding: '6px' }}>
                <button
                  onClick={() => { navigate('/notifications'); setShowNotifs(false); }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
                  style={{ color: 'var(--pro-azure)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--pro-azure-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {t('header.view_all_notifications')}
                  <Icon name="CHEVRON_RIGHT" size={11} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Language switcher */}
        <LanguageSwitcher variant="dropdown" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={iconBtnCls}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ color: isDark ? '#FCD34D' : 'var(--text-3)' }}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark
            ? <Icon name="SUN"  size={15} />
            : <Icon name="MOON" size={15} />}
        </button>

        {/* Separator */}
        <div
          className="hidden sm:block mx-0.5"
          style={{ width: 1, height: 18, background: 'var(--border)' }}
        />

        {/* ── Quick Create — Ovds SaaS green "New" button ───────────── */}
        <div ref={quickCreateRef} className="relative ml-0.5">
          <button
            onClick={() => setShowQuickCreate(v => !v)}
            className="flex items-center gap-1.5 rounded-lg text-[12px] font-bold transition-all"
            style={{
              padding: '6px 14px',
              background: showQuickCreate ? 'var(--pro-azure-dark)' : 'var(--pro-azure)',
              color: '#fff',
              boxShadow: '0 1px 4px rgba(79,186,111,0.35)',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(79,186,111,0.45)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(79,186,111,0.35)')}
            aria-label="Quick create"
          >
            <Icon name="ADD" size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">New</span>
          </button>

          {showQuickCreate && (
            <div style={{ ...DROPDOWN_STYLE, width: 196 }}>
              <div
                className="px-3 py-2"
                style={{ borderBottom: '1px solid var(--border-alt)' }}
              >
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-5)' }}>
                  {t('header.quick_create')}
                </p>
              </div>
              <div className="py-1">
                {QUICK_CREATE.map(a => (
                  <button
                    key={a.to}
                    onClick={() => { navigate(a.to); setShowQuickCreate(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: a.bg, color: a.color }}
                    >
                      <Icon name={a.icon as any} size={12} />
                    </span>
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div
          className="hidden sm:block mx-1"
          style={{ width: 1, height: 18, background: 'var(--border)' }}
        />

        {/* ── User profile ──────────────────────────────────────────── */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-2 rounded-lg transition-all"
            style={{
              padding: '5px 8px',
              border: '1px solid transparent',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background    = 'var(--surface-alt)';
              (e.currentTarget as HTMLButtonElement).style.borderColor   = 'var(--border)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background    = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.borderColor   = 'transparent';
            }}
            aria-label="User menu"
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{
                background: 'var(--pro-gradient-primary)',
                boxShadow: '0 2px 8px rgba(79,186,111,0.30)',
              }}
            >
              {user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            {/* Name — desktop */}
            <div className="hidden md:block text-left">
              <p
                className="text-[12px] font-semibold leading-tight truncate max-w-[80px]"
                style={{ color: 'var(--text)' }}
              >
                {user?.username ?? 'User'}
              </p>
            </div>
            <Icon
              name="CHEVRON_DOWN" size={11}
              className="hidden md:block"
              style={{
                color: 'var(--text-5)',
                transform: showProfile ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 150ms',
              }}
            />
          </button>

          {showProfile && (
            <div style={{ ...DROPDOWN_STYLE, width: 224 }}>
              {/* User info */}
              <div
                className="px-4 py-3"
                style={{
                  borderBottom: '1px solid var(--border-alt)',
                  background: 'var(--surface-alt)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                    style={{
                      background: 'var(--pro-gradient-primary)',
                      boxShadow: '0 2px 10px rgba(79,186,111,0.30)',
                    }}
                  >
                    {user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-bold truncate"
                      style={{ color: 'var(--text)' }}
                    >
                      {user?.username}
                    </p>
                    <span
                      className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: roleBadge.bg, color: roleBadge.color }}
                    >
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {[
                  { icon: 'CUSTOMER',  label: t('header.my_profile'),        to: '/settings?tab=profile' },
                  { icon: 'SETTINGS',  label: t('header.settings'),           to: '/settings' },
                  { icon: 'SHIELD',    label: t('header.security'),           to: '/settings?tab=taxes' },
                  { icon: 'KEYBOARD',  label: t('header.keyboard_shortcuts'), action: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' })) },
                  { icon: 'ACTIVITY',  label: t('header.activity_feed'),      action: () => window.dispatchEvent(new CustomEvent('ovds:toggle-activity')) },
                ].map((item, i) => (
                  item.to ? (
                    <Link
                      key={i}
                      to={item.to}
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-2.5 px-4 py-2 transition-colors text-[12px] font-medium"
                      style={{ color: 'var(--text-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Icon name={item.icon as any} size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={i}
                      onClick={() => { item.action?.(); setShowProfile(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 transition-colors text-[12px] font-medium"
                      style={{ background: 'transparent', color: 'var(--text-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Icon name={item.icon as any} size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                      {item.label}
                    </button>
                  )
                ))}
              </div>

              {/* Company strip */}
              {company && (
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{
                    borderTop: '1px solid var(--border-alt)',
                    background: 'var(--surface-alt)',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: 'var(--pro-azure-50)', color: 'var(--pro-azure)' }}
                  >
                    {company.name?.charAt(0)?.toUpperCase() ?? 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-2)' }}>
                      {company.name}
                    </p>
                    {company.tin && (
                      <p className="text-[9px]" style={{ color: 'var(--text-4)' }}>
                        TIN: {company.tin}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Logout */}
              <div style={{ borderTop: '1px solid var(--border-alt)', padding: '6px' }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors text-[12px] font-semibold"
                  style={{ color: '#BE123C', background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FFF1F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon name="LOGOUT" size={13} />
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
