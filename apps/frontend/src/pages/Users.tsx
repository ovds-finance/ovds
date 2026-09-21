/**
 * Users — enhanced user management
 * Rich data table · Role distribution chart · Activity heatmap
 * Inline editing · Bulk actions · App access control
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input,
  SearchBar, EmptyState, Pagination, Icon,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { type AppRole, ROLE_METADATA, ROLE_GROUPS } from '../rbac/rbac';
import api from '../services/api';
import { confirm } from '../utils/confirm';

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface SystemUser {
  id: string;
  username: string;
  role: AppRole;
  companyId?: string;
  employeeId?: string;
  createdAt: string;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  isActive?: boolean;
  email?: string;
  appAccess?: Array<{ appId: string; appSlug?: string; appName?: string; accessLevel: string }>;
}

type FilterTab = 'ALL' | 'ADMIN' | 'OVDS' | 'HR' | 'LOCKED';
type SortField = 'username' | 'role' | 'createdAt' | 'lastLoginAt';
type SortDir   = 'asc' | 'desc';

/* ── Constants ──────────────────────────────────────────────────────────────── */
const SYSTEM_ROLES: AppRole[] = [
  'ADMIN', 'OVDS', 'ACCOUNTING', 'HR', 'EMPLOYEE',
  'DATA_CLERK', 'AUDITOR', 'IFRS_OFFICER', 'BANK_LIAISON', 'CRM', 'DEVELOPER',
];

const ROLE_BADGE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  ADMIN:        { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500'  },
  SPURADMIN:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500'    },
  SUPERADMIN:   { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500'    },
  DEVELOPER:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500'    },
  ovds:         { bg: 'bg-[var(--pro-azure-50)]', text: 'text-[var(--pro-azure-dark)]', border: 'border-[var(--pro-azure-100)]', dot: 'bg-[var(--pro-azure)]' },
  ACCOUNTING:   { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    dot: 'bg-teal-500'    },
  HR:           { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-500'     },
  EMPLOYEE:     { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
  DATA_CLERK:   { bg: 'bg-lime-50',    text: 'text-lime-700',    border: 'border-lime-200',    dot: 'bg-lime-500'    },
  AUDITOR:      { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  IFRS_OFFICER: { bg: 'bg-[var(--pro-azure-50)]',  text: 'text-[var(--pro-azure-dark)]',  border: 'border-[var(--pro-azure-100)]',  dot: 'bg-[var(--pro-azure)]'  },
  BANK_LIAISON: { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    dot: 'bg-cyan-500'    },
  CRM:          { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500'  },
};

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-green-500 to-green-600',
  'from-sky-500 to-blue-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-[var(--pro-azure)] to-violet-600',
  'from-teal-500 to-indigo-600',
  'from-cyan-500 to-sky-600',
];

const APP_ACCESS_LEVELS = [
  { value: 'none',  label: 'No Access', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  { value: 'read',  label: 'Read',      cls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]' },
  { value: 'write', label: 'Write',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'admin', label: 'Admin',     cls: 'bg-rose-50 text-rose-700 border-rose-200' },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function avatarGradient(username: string): string {
  const idx = username.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function relativeTime(iso?: string): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function getRoleDisplay(role: string): string {
  return (ROLE_METADATA as any)[role]?.label ?? role.replace(/_/g, ' ');
}

function getGroupLabel(role: string): string {
  for (const [, group] of Object.entries(ROLE_GROUPS)) {
    if ((group.roles as string[]).includes(role)) return group.label;
  }
  return 'Other';
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

/** Animated avatar with initials and gradient */
const Avatar: React.FC<{ username: string; size?: 'sm' | 'md' | 'lg'; isYou?: boolean }> = ({
  username, size = 'md', isYou,
}) => {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-11 h-11 text-sm' : 'w-8 h-8 text-[11px]';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${avatarGradient(username)} flex items-center justify-center text-white font-bold shrink-0 relative`}>
      {username.charAt(0).toUpperCase()}
      {isYou && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--pro-azure)] border-2 border-white rounded-full" />
      )}
    </div>
  );
};

/** Role badge with dot indicator */
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const cls = ROLE_BADGE[role] ?? ROLE_BADGE.EMPLOYEE;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls.bg} ${cls.text} ${cls.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cls.dot} shrink-0`} />
      {getRoleDisplay(role)}
    </span>
  );
};

/** Failed-attempts warning pill */
const FailedAttemptsPill: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  const cls = count >= 5 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${cls}`}>
      <Icon name="SHIELD_ALERT" size={8} />
      {count} failed
    </span>
  );
};

/** Role distribution mini-bar chart */
const RoleDistributionBar: React.FC<{ rows: SystemUser[] }> = ({ rows }) => {
  if (rows.length === 0) return null;
  const counts = Object.entries(
    rows.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Role Distribution</p>
      <div className="space-y-2">
        {counts.map(([role, count]) => {
          const cls = ROLE_BADGE[role] ?? ROLE_BADGE.EMPLOYEE;
          const pct = Math.round((count / rows.length) * 100);
          return (
            <div key={role} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cls.dot}`} />
              <span className="text-[10px] text-slate-600 dark:text-slate-400 w-24 truncate">{getRoleDisplay(role)}</span>
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${cls.dot}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Activity heatmap — login recency grid */
const ActivityHeatmap: React.FC<{ rows: SystemUser[] }> = ({ rows }) => {
  const now = Date.now();
  const buckets = [
    { label: 'Today',   max: 86_400_000,     color: 'bg-[var(--pro-azure)]', count: 0 },
    { label: '7d',      max: 7 * 86_400_000, color: 'bg-[var(--pro-azure-light)]', count: 0 },
    { label: '30d',     max: 30 * 86_400_000,color: 'bg-[var(--pro-azure-100)]', count: 0 },
    { label: 'Older',   max: Infinity,        color: 'bg-slate-200 dark:bg-slate-700', count: 0 },
    { label: 'Never',   max: -1,              color: 'bg-slate-100 dark:bg-slate-800', count: 0 },
  ];
  rows.forEach(u => {
    if (!u.lastLoginAt) { buckets[4].count++; return; }
    const diff = now - new Date(u.lastLoginAt).getTime();
    if      (diff < buckets[0].max) buckets[0].count++;
    else if (diff < buckets[1].max) buckets[1].count++;
    else if (diff < buckets[2].max) buckets[2].count++;
    else                            buckets[3].count++;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Login Activity</p>
      <div className="flex items-end gap-2 h-14">
        {buckets.map(b => {
          const pct = rows.length > 0 ? (b.count / rows.length) * 100 : 0;
          return (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-slate-500">{b.count}</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden h-8 flex items-end">
                <div
                  className={`w-full ${b.color} rounded-sm transition-all duration-700`}
                  style={{ height: `${Math.max(pct, b.count > 0 ? 8 : 0)}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-400">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Inline sortable column header */
const SortableTh: React.FC<{
  field: SortField; sortBy: SortField; sortDir: SortDir;
  onSort: (f: SortField) => void; children: React.ReactNode; align?: 'left' | 'right';
}> = ({ field, sortBy, sortDir, onSort, children, align = 'left' }) => {
  const active = sortBy === field;
  return (
    <AppTh align={align}>
      <button
        className={`flex items-center gap-1 ${align === 'right' ? 'ml-auto' : ''} hover:text-slate-900 dark:hover:text-white transition-colors ${active ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : ''}`}
        onClick={() => onSort(field)}
      >
        {children}
        <span className="text-[9px] opacity-60">
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </AppTh>
  );
};

/* ── User Form ──────────────────────────────────────────────────────────────── */
const UserForm: React.FC<{
  data: Partial<SystemUser & { password?: string }>;
  onChange: (d: any) => void;
  isEdit: boolean;
}> = ({ data, onChange, isEdit }) => {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Username" required>
          <Input
            value={data.username ?? ''}
            onChange={e => set('username', e.target.value)}
            placeholder="john.doe"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Role" required>
          <select
            value={data.role ?? 'EMPLOYEE'}
            onChange={e => set('role', e.target.value)}
            className="w-full h-9 text-[12px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all"
          >
            {SYSTEM_ROLES.map(r => (
              <option key={r} value={r}>{getRoleDisplay(r)}</option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Email" hint="Optional — used for password reset notifications">
        <Input
          type="email"
          value={(data as any).email ?? ''}
          onChange={e => set('email', e.target.value)}
          placeholder="john.doe@company.com"
        />
      </FormField>
      {!isEdit && (
        <FormField label="Password" required hint="Default: ChangeMe123! — user must change on first login">
          <Input
            type="password"
            value={(data as any).password ?? ''}
            onChange={e => set('password', e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </FormField>
      )}
      {data.role && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Role scope</p>
          <div className="flex items-center gap-2">
            <RoleBadge role={data.role} />
            <span className="text-[11px] text-slate-500">{getGroupLabel(data.role)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── App Access Panel (inside modal) ────────────────────────────────────────── */
const AppAccessPanel: React.FC<{
  userId: string;
  apps: Array<{ id: string; name: string; slug: string }>;
  access: Record<string, string>;
  onSet: (userId: string, appId: string, level: string) => Promise<void>;
  onRemove: (userId: string, appId: string) => Promise<void>;
}> = ({ userId, apps, access, onSet, onRemove }) => {
  if (apps.length === 0) return null;
  return (
    <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700">
      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <Icon name="LAYOUT_GRID" size={12} />
        App Access
      </p>
      <div className="space-y-2">
        {apps.map(app => {
          const level = access[app.id] ?? 'none';
          const info  = APP_ACCESS_LEVELS.find(l => l.value === level);
          return (
            <div key={app.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon name="LAYOUT_GRID" size={10} className="text-slate-400" />
                </div>
                <span className="text-[11px] text-slate-700 dark:text-slate-300">{app.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${info?.cls ?? ''}`}>
                  {info?.label ?? level}
                </span>
                <select
                  value={level}
                  onChange={e => onSet(userId, app.id, e.target.value)}
                  className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  {APP_ACCESS_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                {level !== 'none' && (
                  <button
                    onClick={() => onRemove(userId, app.id)}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                    title="Remove access"
                  >
                    <Icon name="DELETE" size={10} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Bulk action toolbar ────────────────────────────────────────────────────── */
const BulkBar: React.FC<{
  selected: Set<string>;
  onLock: () => void;
  onUnlock: () => void;
  onBulkRoles: () => void;
  onClear: () => void;
  loading?: boolean;
}> = ({ selected, onLock, onUnlock, onBulkRoles, onClear, loading }) => {
  if (selected.size === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--pro-azure-50)] dark:bg-green-950/40 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl mb-3 animate-in slide-in-from-top-1 duration-200">
      <div className="w-5 h-5 rounded bg-[var(--pro-azure)] flex items-center justify-center">
        <span className="text-[9px] text-white font-bold">{selected.size}</span>
      </div>
      <span className="text-[11px] font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
        {selected.size} user{selected.size > 1 ? 's' : ''} selected
      </span>
      <div className="flex-1" />
      <Btn variant="ghost" size="sm" loading={loading} onClick={onLock} icon={<Icon name="LOCK" size={10} />}>
        Lock all
      </Btn>
      <Btn variant="ghost" size="sm" loading={loading} onClick={onUnlock} icon={<Icon name="UNLOCK" size={10} />}>
        Unlock all
      </Btn>
      <button
        onClick={onBulkRoles}
        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-violet-400 hover:text-violet-700 transition-all"
        title="Assign custom roles to selected users"
      >
        Assign Roles
      </button>
      <button
        onClick={onClear}
        className="w-5 h-5 rounded flex items-center justify-center text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900 transition-all"
        title="Clear selection"
      >
        <Icon name="CLOSE" size={11} />
      </button>
    </div>
  );
};

/* ── Main Users page ────────────────────────────────────────────────────────── */
const Users: React.FC = () => {
  usePageTitle('Users');
  const { can, user: currentUser } = useAuth();
  const { selectedCompanyId } = useBusiness();

  /* ── Filter / sort / search state ── */
  const [tab,     setTab    ] = useState<FilterTab>('ALL');
  const [search,  setSearch ] = useState('');
  const [sortBy,  setSortBy ] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [roleFilter, setRoleFilter] = useState<string>('');

  /* ── Modal / selection state ── */
  const [modal,    setModal   ] = useState<{ open: boolean; data: any }>({ open: false, data: {} });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  /* ── App access state ── */
  const [apps,          setApps         ] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [userAppAccess, setUserAppAccess] = useState<Record<string, string>>({});

  /* ── Custom roles state ── */
  const [customRoles, setCustomRoles] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [userCustomRoles, setUserCustomRoles] = useState<Set<string>>(new Set());
  const [bulkRoleModal, setBulkRoleModal] = useState<{ open: boolean; roleIds: string[] }>({ open: false, roleIds: [] });
  const qc = useQueryClient();

  const { data: rolesData } = useQuery({
    queryKey: ['custom-roles-list'],
    queryFn: async () => {
      const res = await api.get('/settings/rbac/roles');
      return (res.data?.data ?? res.data ?? []) as Array<{ id: string; name: string; description?: string }>;
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (rolesData) setCustomRoles(rolesData);
  }, [rolesData]);

  const assignRolesMutation = useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      api.post(`/auth/users/${userId}/roles`, { roleIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-roles-list'] });
    },
  });

  /* ── Data ── */
  const { rows, total, page, loading, saving, save, remove, refetch, setPage } =
    useApiCrud<SystemUser>({
      endpoint:   '/auth/users',
      companyId:  selectedCompanyId,
      pageSize:   25,
      pollMs:     120_000,
    });

  /* ── Roles (system + custom) ── */
  const { data: allRoles } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const [systemRes, customRes] = await Promise.all([
        api.get('/settings/rbac/hierarchy'),
        api.get('/settings/rbac/roles'),
      ]);
      const systemRoles = (systemRes.data?.data?.roles ?? []).map((r: any) => ({ id: r.role, name: r.label, isSystem: true }));
      const customRoles = (customRes.data?.data ?? customRes.data ?? []).map((r: any) => ({ id: r.id, name: r.name, isSystem: false }));
      return [...systemRoles, ...customRoles];
    },
    staleTime: 5 * 60_000,
  });

  const availableRoles = useMemo(() => (allRoles ?? []).map(r => r.id), [allRoles]);

  /* ── Load installable apps ── */
  useEffect(() => {
    if (!can('apps:read')) return;
    api.get('/app-access/apps')
      .then((res: any) => setApps(res.data ?? []))
      .catch(() => {});
  }, [can]);

  /* ── Load per-user app access when opening edit modal ── */
  const loadUserAppAccess = useCallback(async (userId: string) => {
    try {
      const res = await api.get(`/app-access/users/${userId}`);
      const map: Record<string, string> = {};
      (res.data ?? []).forEach((a: any) => { map[a.appId] = a.accessLevel; });
      setUserAppAccess(map);
    } catch { setUserAppAccess({}); }
  }, []);

  const handleSetUserAppAccess = useCallback(async (userId: string, appId: string, level: string) => {
    try {
      await api.post('/app-access/users', { userId, appId, accessLevel: level, grantedBy: currentUser?.id });
      setUserAppAccess(p => ({ ...p, [appId]: level }));
      toast.success('App access updated');
    } catch { toast.error('Failed to update app access'); }
  }, [currentUser]);

  const handleRemoveUserAppAccess = useCallback(async (userId: string, appId: string) => {
    try {
      await api.delete(`/app-access/users/${userId}/${appId}`);
      setUserAppAccess(p => { const n = { ...p }; delete n[appId]; return n; });
      toast.success('App access removed');
    } catch { toast.error('Failed to remove app access'); }
  }, []);

  /* ── Derived filtered + sorted list ── */
  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'ADMIN')  list = list.filter(u => ['ADMIN', 'SPURADMIN', 'SUPERADMIN'].includes(u.role));
    if (tab === 'OVDS')   list = list.filter(u => ['OVDS', 'ACCOUNTING'].includes(u.role));
    if (tab === 'HR')     list = list.filter(u => u.role === 'HR');
    if (tab === 'LOCKED') list = list.filter(u => u.isLocked || (u.failedLoginAttempts ?? 0) >= 5);
    if (roleFilter)       list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        [u.username, u.role, u.email].some(v => String(v ?? '').toLowerCase().includes(q))
      );
    }
    // Sort
    return [...list].sort((a, b) => {
      let va: any, vb: any;
      if (sortBy === 'username')    { va = a.username ?? '';        vb = b.username ?? '';        }
      if (sortBy === 'role')        { va = a.role ?? '';             vb = b.role ?? '';             }
      if (sortBy === 'createdAt')   { va = new Date(a.createdAt);   vb = new Date(b.createdAt);   }
      if (sortBy === 'lastLoginAt') { va = new Date(a.lastLoginAt ?? 0); vb = new Date(b.lastLoginAt ?? 0); }
      if (va < vb) return sortDir === 'asc' ? -1 :  1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [rows, tab, search, roleFilter, sortBy, sortDir]);

  const handleSort = useCallback((f: SortField) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(f); setSortDir('asc'); }
  }, [sortBy]);

  /* ── KPIs ── */
  const kpiCells = useMemo(() => [
    { label: 'Total',   value: rows.length,  color: 'green' as const },
    { label: 'Active',  value: rows.filter(u => !u.isLocked && (u.failedLoginAttempts ?? 0) < 5).length,                color: 'sky'     as const },
    { label: 'Admins',  value: rows.filter(u => ['ADMIN', 'SPURADMIN', 'SUPERADMIN'].includes(u.role)).length,          color: 'violet'  as const },
    { label: 'Locked',  value: rows.filter(u => u.isLocked || (u.failedLoginAttempts ?? 0) >= 5).length,                color: 'rose'    as const },
  ], [rows]);

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (!modal.data.username?.trim()) { toast.error('Username is required'); return; }
    if (modal.data.id) {
      const ok = await save({ ...modal.data });
      if (ok) setModal(m => ({ ...m, open: false }));
    } else {
      try {
        await api.post('/auth/register', {
          username:   modal.data.username,
          password:   modal.data.password || 'ChangeMe123!',
          role:       modal.data.role || 'EMPLOYEE',
          email:      modal.data.email || undefined,
          employeeId: modal.data.employeeId || undefined,
        });
        toast.success('User created — default password: ChangeMe123!');
        setModal(m => ({ ...m, open: false }));
        refetch();
      } catch { /* interceptor handles toast */ }
    }
  }, [modal.data, save, refetch]);

  const loadUserCustomRoles = useCallback(async (userId: string) => {
    try {
      const res = await api.get(`/auth/users/${userId}/roles`);
      const roles = (res.data?.data ?? res.data ?? []) as Array<{ id: string }>;
      setUserCustomRoles(new Set(roles.map(r => r.id)));
    } catch {
      setUserCustomRoles(new Set());
    }
  }, []);

  const handleEdit = useCallback((u: SystemUser) => {
    setModal({ open: true, data: { ...u } });
    if (can('apps:read')) loadUserAppAccess(u.id);
    loadUserCustomRoles(u.id);
  }, [can, loadUserAppAccess, loadUserCustomRoles]);

  const handleQuickRoleChange = useCallback(async (u: SystemUser, newRole: string) => {
    try {
      await api.patch(`/auth/users/${u.id}`, { role: newRole });
      toast.success(`Role updated to ${getRoleDisplay(newRole)}`);
      refetch();
    } catch { toast.error('Failed to update role'); }
  }, [refetch]);

  const handleSaveCustomRoles = useCallback(async (userId: string) => {
    try {
      await assignRolesMutation.mutateAsync({ userId, roleIds: Array.from(userCustomRoles) });
      toast.success('Custom roles updated');
    } catch { toast.error('Failed to update roles'); }
  }, [userCustomRoles, assignRolesMutation]);

  const handleBulkAssignRoles = useCallback(async () => {
    if (bulkRoleModal.roleIds.length === 0) { toast.error('Select at least one role'); return; }
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selected).map(userId =>
        api.post(`/auth/users/${userId}/roles`, { roleIds: bulkRoleModal.roleIds })
      ));
      toast.success(`Roles assigned to ${selected.size} users`);
      setSelected(new Set());
      setBulkRoleModal({ open: false, roleIds: [] });
      refetch();
    } catch { toast.error('Bulk role assignment failed'); }
    finally { setBulkLoading(false); }
  }, [selected, bulkRoleModal.roleIds, refetch]);

  /* ── Lock / unlock ── */
  const handleLockToggle = async (u: SystemUser) => {
    try {
      await api.patch(`/auth/users/${u.id}`, { isLocked: !u.isLocked });
      toast.success(u.isLocked ? 'User unlocked' : 'User locked');
      refetch();
    } catch { toast.error('Action failed'); }
  };

  /* ── Password reset ── */
  const handleResetPassword = async (u: SystemUser) => {
    if (!(await confirm({ title: `Reset password for "${u.username}"?`, variant: 'info',
      message: 'Password will be reset to Temp@1234. User must change it on next login.' }))) return;
    try {
      await api.patch(`/auth/users/${u.id}/reset-password`, { newPassword: 'Temp@1234' });
      toast.success('Password reset → Temp@1234');
    } catch { toast.error('Reset failed'); }
  };

  /* ── Bulk actions ── */
  const handleBulkLock = async (lock: boolean) => {
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map(id => api.patch(`/auth/users/${id}`, { isLocked: lock })));
      toast.success(`${selected.size} users ${lock ? 'locked' : 'unlocked'}`);
      setSelected(new Set());
      refetch();
    } catch { toast.error('Bulk action failed'); }
    finally { setBulkLoading(false); }
  };

  /* ── Export ── */
  const handleExport = () => {
    const header = 'Username,Email,Role,Group,Company,Created,Last Login,Locked\n';
    const csv = filtered.map(u =>
      `"${u.username}","${u.email ?? ''}","${u.role}","${getGroupLabel(u.role)}","${u.companyId ?? ''}","${u.createdAt}","${u.lastLoginAt ?? ''}","${u.isLocked ? 'Yes' : 'No'}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} users`);
  };

  /* ── Select all on current page ── */
  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));
  const toggleAll   = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.filter(u => u.id !== currentUser?.id).map(u => u.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
    });
  };

  const colCount = can('apps:read') ? 8 : 7;

  /* ── Render ── */
  return (
    <AppPage
      title="Users"
      subtitle="RBAC roles · Session management · App access control · Bulk operations"
      icon={<Icon name="USERS_2" size={18} />}
      iconBg="bg-violet-600"
      crumbs={[{ label: 'System Administration' }, { label: 'Users' }]}
      loading={loading}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',    label: 'All',    count: rows.length },
            { key: 'ADMIN',  label: 'Admins', count: rows.filter(u => ['ADMIN','SPURADMIN','SUPERADMIN'].includes(u.role)).length },
            { key: 'OVDS',   label: 'OVDS',   count: rows.filter(u => ['OVDS','ACCOUNTING'].includes(u.role)).length },
            { key: 'HR',     label: 'HR',     count: rows.filter(u => u.role === 'HR').length },
            { key: 'LOCKED', label: 'Locked', count: rows.filter(u => u.isLocked || (u.failedLoginAttempts ?? 0) >= 5).length },
          ]}
          active={tab}
          onChange={k => { setTab(k as FilterTab); setSelected(new Set()); }}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={11} />} onClick={refetch}>
            Refresh
          </Btn>
          <Btn variant="secondary" size="sm" icon={<Icon name="DOWNLOAD" size={11} />} onClick={handleExport}>
            Export CSV
          </Btn>
          {can('users:write') && (
            <Btn
              variant="primary" size="sm"
              icon={<Icon name="ADD" size={12} />}
              onClick={() => setModal({ open: true, data: { role: 'EMPLOYEE' } })}
            >
              New User
            </Btn>
          )}
        </>
      }
    >
      {/* KPI row */}
      <AppKpi cells={kpiCells} />

      {/* Charts row */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <RoleDistributionBar rows={rows} />
          <ActivityHeatmap rows={rows} />
        </div>
      )}

      {/* Toolbar: search + role filter + count */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search username, email, role…"
          className="w-52"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="h-8 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all"
        >
          <option value="">All roles</option>
          {(availableRoles.length > 0 ? availableRoles : SYSTEM_ROLES).map(r => (
            <option key={r} value={r}>{getRoleDisplay(r)}</option>
          ))}
        </select>
        <div className="flex-1" />
        <span className="text-[10px] text-slate-400">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Bulk bar */}
      <BulkBar
        selected={selected}
        onLock={() => handleBulkLock(true)}
        onUnlock={() => handleBulkLock(false)}
        onBulkRoles={() => setBulkRoleModal({ open: true, roleIds: [] })}
        onClear={() => setSelected(new Set())}
        loading={bulkLoading}
      />

      {/* Table */}
      <AppTable>
        <thead>
          <tr>
            {can('users:write') && (
              <AppTh width="36px">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500"
                  title="Select all"
                />
              </AppTh>
            )}
            <SortableTh field="username" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>User</SortableTh>
            <SortableTh field="role"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Role</SortableTh>
            <AppTh>Group</AppTh>
            <AppTh>Company</AppTh>
            <SortableTh field="lastLoginAt" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Last Login</SortableTh>
            <AppTh>Status</AppTh>
            {can('apps:read') && <AppTh>App Access</AppTh>}
            <AppTh align="right" width="120px">Actions</AppTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            /* Skeleton rows */
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                {Array.from({ length: colCount }).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" style={{ width: `${60 + (j * 13) % 40}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={colCount}>
                <EmptyState
                  icon={<Icon name="USERS_2" size={20} />}
                  title="No users found"
                  desc={search || roleFilter ? 'Try adjusting your search or filters' : 'Create the first user account to get started'}
                  action={can('users:write') ? {
                    label: 'New User',
                    onClick: () => setModal({ open: true, data: { role: 'EMPLOYEE' } }),
                  } : undefined}
                />
              </td>
            </tr>
          ) : filtered.map(u => {
            const isMe     = u.id === currentUser?.id;
            const isLocked = u.isLocked || (u.failedLoginAttempts ?? 0) >= 5;
            const isChecked = selected.has(u.id);

            return (
              <AppTr key={u.id}>
                {/* Checkbox */}
                {can('users:write') && (
                  <AppTd>
                    {!isMe && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(u.id)}
                        className="rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500"
                      />
                    )}
                  </AppTd>
                )}

                {/* User */}
                <AppTd>
                  <div className="flex items-center gap-2.5">
                    <Avatar username={u.username} isYou={isMe} />
                    <div className="min-w-0">
                      <p className={`text-[12px] font-semibold leading-tight truncate ${isMe ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-slate-800 dark:text-slate-100'}`}>
                        {u.username}
                        {isMe && <span className="ml-1 text-[9px] font-bold text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950 px-1 py-0.5 rounded">you</span>}
                      </p>
                      {u.email && (
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      )}
                      <FailedAttemptsPill count={u.failedLoginAttempts ?? 0} />
                    </div>
                  </div>
                </AppTd>

                {/* Role */}
                <AppTd>
                  <div className="flex items-center gap-1.5">
                    <RoleBadge role={u.role} />
                    {can('users:write') && !isMe && (
                      <select
                        value={u.role}
                        onChange={e => handleQuickRoleChange(u, e.target.value)}
                        className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-600 dark:text-slate-300 focus:outline-none"
                      >
                        {(availableRoles.length > 0 ? availableRoles : SYSTEM_ROLES).map(r => (
                          <option key={r} value={r}>{getRoleDisplay(r)}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </AppTd>

                {/* Group */}
                <AppTd>
                  <span className="text-[10px] text-slate-500">{getGroupLabel(u.role)}</span>
                </AppTd>

                {/* Company */}
                <AppTd>
                  {u.companyId
                    ? <span className="text-[10px] text-slate-500 font-mono">{u.companyId.slice(0, 8)}…</span>
                    : <span className="text-[10px] text-slate-300">—</span>
                  }
                </AppTd>

                {/* Last login */}
                <AppTd>
                  <span className={`text-[10px] ${u.lastLoginAt ? 'text-slate-500' : 'text-slate-300'}`}>
                    {relativeTime(u.lastLoginAt)}
                  </span>
                </AppTd>

                {/* Status */}
                <AppTd>
                  <StatusBadge
                    status={isLocked ? 'INACTIVE' : 'ACTIVE'}
                    label={isLocked ? 'Locked' : 'Active'}
                  />
                </AppTd>

                {/* App access summary */}
                {can('apps:read') && (
                  <AppTd>
                    {(u.appAccess ?? []).length > 0 ? (
                      <div className="flex items-center gap-0.5">
                        {(u.appAccess ?? []).slice(0, 3).map(a => {
                          const info = APP_ACCESS_LEVELS.find(l => l.value === a.accessLevel);
                          return (
                            <span key={a.appId} className={`text-[8px] px-1 py-0.5 rounded border font-semibold ${info?.cls ?? ''}`} title={a.appName ?? a.appId}>
                              {(a.appName ?? a.appId).slice(0, 3)}
                            </span>
                          );
                        })}
                        {(u.appAccess ?? []).length > 3 && (
                          <span className="text-[9px] text-slate-400">+{(u.appAccess ?? []).length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </AppTd>
                )}

                {/* Actions */}
                <AppTd align="right">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {can('users:write') && !isMe && (
                      <>
                        <button
                          onClick={() => handleLockToggle(u)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                            isLocked
                              ? 'text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] dark:hover:bg-green-950'
                              : 'text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950'
                          }`}
                          title={isLocked ? 'Unlock user' : 'Lock user'}
                        >
                          {isLocked ? <Icon name="UNLOCK" size={11} /> : <Icon name="LOCK" size={11} />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950 transition-all"
                          title="Reset password"
                        >
                          <Icon name="KEY" size={11} />
                        </button>
                        <button
                          onClick={() => handleEdit(u)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950 transition-all"
                          title="Edit user"
                        >
                          <Icon name="EDIT" size={11} />
                        </button>
                        <button
                          onClick={async () => {
                            if (await confirm({ title: `Delete "${u.username}"?`, variant: 'danger',
                              message: 'This cannot be undone.' }))
                              remove(u.id);
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 transition-all"
                          title="Delete user"
                        >
                          <Icon name="DELETE" size={11} />
                        </button>
                      </>
                    )}
                    {isMe && (
                      <span className="text-[9px] text-slate-300 pr-1">—</span>
                    )}
                  </div>
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
      </AppTable>

      <div className="mt-3">
        <Pagination page={page} total={total} pageSize={25} onChange={setPage} />
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? `Edit: ${modal.data.username}` : 'New User'}
        subtitle={modal.data.id
          ? `Role · App access · Session control`
          : 'Create a system user with RBAC role assignment'
        }
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>
              Cancel
            </Btn>
            <Btn variant="primary" loading={saving} onClick={handleSave}>
              {modal.data.id ? 'Save Changes' : 'Create User'}
            </Btn>
          </>
        }
      >
        <UserForm
          data={modal.data}
          onChange={d => setModal(m => ({ ...m, data: d }))}
          isEdit={!!modal.data.id}
        />
        {modal.data.id && can('apps:read') && (
          <AppAccessPanel
            userId={modal.data.id}
            apps={apps}
            access={userAppAccess}
            onSet={handleSetUserAppAccess}
            onRemove={handleRemoveUserAppAccess}
          />
        )}
        {modal.data.id && customRoles.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Icon name="SHIELD" size={12} />
              Custom Roles
            </p>
            <div className="space-y-2">
              {customRoles.map(role => {
                const isSelected = userCustomRoles.has(role.id);
                return (
                  <label key={role.id} className="flex items-center gap-2 cursor-pointer py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setUserCustomRoles(prev => {
                          const next = new Set(prev);
                          if (next.has(role.id)) next.delete(role.id);
                          else next.add(role.id);
                          return next;
                        });
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-violet-600 focus:ring-violet-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{role.name}</span>
                      {role.description && (
                        <span className="text-[10px] text-slate-400 ml-1.5 truncate">{role.description}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="mt-3">
              <Btn
                variant="secondary"
                size="sm"
                loading={assignRolesMutation.isPending}
                onClick={() => handleSaveCustomRoles(modal.data.id)}
              >
                Save Custom Roles
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {bulkRoleModal.open && (
        <Modal
          open={bulkRoleModal.open}
          onClose={() => setBulkRoleModal({ open: false, roleIds: [] })}
          title="Bulk Assign Custom Roles"
          subtitle={`Assign roles to ${selected.size} selected users`}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setBulkRoleModal({ open: false, roleIds: [] })}>
                Cancel
              </Btn>
              <Btn variant="primary" loading={bulkLoading} onClick={handleBulkAssignRoles}>
                Assign Roles
              </Btn>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Select the custom roles to assign to all selected users. This will replace any existing custom role assignments for these users.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customRoles.map(role => {
                const isSelected = bulkRoleModal.roleIds.includes(role.id);
                return (
                  <label key={role.id} className="flex items-center gap-2 cursor-pointer py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setBulkRoleModal(prev => ({
                          ...prev,
                          roleIds: isSelected
                            ? prev.roleIds.filter(id => id !== role.id)
                            : [...prev.roleIds, role.id],
                        }));
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-violet-600 focus:ring-violet-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{role.name}</span>
                      {role.description && (
                        <span className="text-[10px] text-slate-400 ml-1.5 truncate">{role.description}</span>
                      )}
                    </div>
                  </label>
                );
              })}
              {customRoles.length === 0 && (
                <p className="text-xs text-slate-400">No custom roles available. Create roles first in Roles & Permissions.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </AppPage>
  );
};

export default Users;
