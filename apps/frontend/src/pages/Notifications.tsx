/**
 * Full Notifications page — /notifications
 * Shows the user's complete notification feed with filter tabs, bulk actions,
 * and real-time updates via the useNotifications hook.
 */
import React, { useState } from 'react';
import {
  Bell, CheckCheck, Trash2, Check,
  Info, AlertTriangle, AlertCircle, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';
import { usePageTitle } from '../hooks/usePageTitle';

type FilterTab = 'all' | 'unread';

export default function NotificationsPage() {
  usePageTitle('Notifications');
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead, remove } =
    useNotifications(true);

  const [tab, setTab] = useState<FilterTab>('all');

  const displayed =
    tab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  const TypeIcon: React.FC<{ n: AppNotification }> = ({ n }) => {
    const t = (n as any).type as string | undefined;
    if (t === 'WARNING') return <AlertTriangle size={15} style={{ color: '#f59e0b' }} />;
    if (t === 'ERROR')   return <AlertCircle  size={15} style={{ color: '#ef4444' }} />;
    return                      <Info         size={15} style={{ color: 'var(--lv, #4f46e5)' }} />;
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--lv-dim, #eef2ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={17} style={{ color: 'var(--lv, #4f46e5)' }} />
          </div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#111827', lineHeight: 1.2 }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 1 }}>
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: '1.5px solid var(--border, #e5e7eb)',
              background: '#fff',
              fontSize: '0.8125rem', fontWeight: 600, color: '#374151',
              cursor: 'pointer',
            }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: 4,
        background: '#f3f4f6',
        borderRadius: 10, marginBottom: '1.25rem',
        width: 'fit-content',
      }}>
        {(['all', 'unread'] as FilterTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '5px 16px', borderRadius: 7,
              border: 'none',
              background:   tab === t ? '#fff' : 'transparent',
              boxShadow:    tab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              color:        tab === t ? '#111827' : '#6b7280',
              fontWeight:   tab === t ? 700 : 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {t === 'all' ? 'All' : `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{
        border: '1.5px solid var(--border, #e5e7eb)',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
      }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <Bell size={40} style={{ color: '#d1d5db', display: 'block', margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280', fontWeight: 600 }}>
              {tab === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: 6 }}>
              {tab === 'unread'
                ? 'You have no unread notifications.'
                : 'Notifications about tasks, invoices, and payments will appear here.'}
            </p>
          </div>
        ) : (
          displayed.map((n, idx) => (
            <div
              key={n.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 18px',
                background: n.isRead ? 'transparent' : 'oklch(0.97 0.02 278)',
                borderBottom: idx < displayed.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: n.link ? 'pointer' : 'default',
                transition: 'background .12s',
              }}
              onClick={() => {
                if (!n.isRead) markRead(n.id);
                if (n.link) navigate(n.link);
              }}
            >
              {/* Icon */}
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: n.isRead ? '#f3f4f6' : 'var(--lv-dim, #eef2ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 1,
              }}>
                <TypeIcon n={n} />
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <p style={{
                    fontWeight: n.isRead ? 500 : 700,
                    fontSize: '0.875rem', color: '#111827',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    flex: 1,
                  }}>
                    {n.title}
                  </p>
                  <span style={{ fontSize: '0.6875rem', color: '#9ca3af', flexShrink: 0 }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.8125rem', color: '#6b7280',
                  lineHeight: 1.55, marginTop: 2,
                }}>
                  {n.message}
                </p>
                {n.link && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: '0.75rem', color: 'var(--lv, #4f46e5)',
                    marginTop: 4, fontWeight: 600,
                  }}>
                    View details <ExternalLink size={11} />
                  </span>
                )}
              </div>

              {/* Actions */}
              <div
                style={{ display: 'flex', gap: 4, flexShrink: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {!n.isRead && (
                  <button
                    type="button"
                    aria-label="Mark as read"
                    title="Mark as read"
                    onClick={() => markRead(n.id)}
                    style={{
                      width: 28, height: 28, borderRadius: 7,
                      border: '1.5px solid #e5e7eb',
                      background: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#9ca3af',
                    }}
                  >
                    <Check size={13} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Delete"
                  title="Delete"
                  onClick={() => remove(n.id)}
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    border: '1.5px solid #e5e7eb',
                    background: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9ca3af',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
