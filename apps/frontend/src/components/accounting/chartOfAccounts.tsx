import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Folder,
  DollarSign,
} from 'lucide-react';
import { Skeleton } from '@ovds/ui';
import { Button } from '@ovds/ui';
import { Badge } from '@ovds/ui';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  balance?: number;
  parentId?: string | null;
  children?: Account[];
  isActive: boolean;
}

interface Props {
  accounts?: Account[];
  previewMode?: boolean;
  onAccountSelect?: (account: Account) => void;
}

const ChartOfAccounts: React.FC<Props> = ({
  accounts: propAccounts,
  previewMode = false,
  onAccountSelect,
}) => {
  const { t } = useTranslation('ovds');
  const { can } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET',
    category: 'CURRENT_ASSET',
    parentId: '',
    description: '',
  });

  const canWrite = can('ovds:write');
  const canRead = can('ovds:read');

  const accountTypes = [
    { value: 'ASSET', label: t('ovds.coa.types.ASSET') },
    { value: 'LIABILITY', label: t('ovds.coa.types.LIABILITY') },
    { value: 'EQUITY', label: t('ovds.coa.types.EQUITY') },
    { value: 'INCOME', label: t('ovds.coa.types.INCOME') },
    { value: 'EXPENSE', label: t('ovds.coa.types.EXPENSE') },
  ];

  const accountCategories = [
    'CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'INVENTORY',
    'FIXED_ASSET', 'CURRENT_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
    'EQUITY', 'REVENUE', 'OTHER_INCOME', 'OPERATING_EXPENSE', 'COST_OF_GOODS_SOLD', 'OTHER_EXPENSE'
  ];

  const loadAccounts = async () => {
    if (!canRead || previewMode) return;
    setLoading(true);
    try {
      const res = await api.get('/ovds/accounts');
      const raw = res.data?.data || res.data;
      buildAccountTree(Array.isArray(raw) ? raw : raw?.data ?? []);
    } catch {
      toast.error(t('error.load'));
    } finally {
      setLoading(false);
    }
  };

  const buildAccountTree = (flatList: Account[]) => {
    setFlatAccounts(flatList);
    const idMap = new Map(flatList.map(acc => [acc.id, { ...acc, children: [] as Account[] }]));
    const roots: Account[] = [];
    for (const acc of flatList) {
      if (acc.parentId && idMap.has(acc.parentId)) {
        idMap.get(acc.parentId)!.children!.push(idMap.get(acc.id)!);
      } else {
        roots.push(idMap.get(acc.id)!);
      }
    }
    setAccounts(roots);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  };

  const createAccount = async (data: any) => {
    if (!canWrite) return;
    try {
      await api.post('/ovds/accounts', data);
      toast.success(t('success.created'));
      setShowCreateModal(false);
      loadAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error.save'));
    }
  };

  const updateAccount = async (id: string, data: any) => {
    if (!canWrite) return;
    try {
      await api.patch(`/ovds/accounts/${id}`, data);
      toast.success(t('success.updated'));
      setEditingAccount(null);
      loadAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error.save'));
    }
  };

  const deleteAccount = async (id: string) => {
    if (!canWrite) return;
    if (!confirm(t('warning.confirm'))) return;
    try {
      await api.delete(`/ovds/accounts/${id}`);
      toast.success(t('success.delete'));
      loadAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('error.delete'));
    }
  };

  useEffect(() => {
    if (propAccounts) {
      buildAccountTree(propAccounts);
    } else {
      loadAccounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propAccounts]);

  const renderAccount = (account: Account, level = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expanded.has(account.id);
    const typeColor: Record<string, string> = {
      ASSET: 'bg-emerald-100 text-emerald-700',
      LIABILITY: 'bg-sky-100 text-sky-700',
      EQUITY: 'bg-purple-100 text-purple-700',
      INCOME: 'bg-emerald-100 text-emerald-700',
      EXPENSE: 'bg-orange-100 text-orange-700',
    };

    return (
      <div key={account.id} className="flex items-center gap-3 py-2 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
        <div 
          className="flex items-center gap-2 flex-1 cursor-pointer select-none"
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={() => {
            if (hasChildren) toggleExpand(account.id);
            onAccountSelect?.(account);
          }}
        >
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(account.id); }}>
              {isExpanded ? (
                <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-500 transition-transform" />
              ) : (
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-500 transition-transform" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <div className="w-20 font-mono text-sm font-semibold text-slate-600 truncate">
            {account.code}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-slate-800 truncate max-w-xs">{account.name}</span>
              <Badge size="xs" className={`!px-1.5 !py-0.5 !text-[10px] ${typeColor[account.type] || 'bg-slate-100 text-slate-700'}`}>
                {t(`ovds.coa.types.${account.type}`)}
              </Badge>
              {!account.isActive && (
                <Badge variant="gray" size="xs">{t('ovds.coa.statuses.inactive')}</Badge>
              )}
            </div>
            {account.balance !== undefined && (
              <div className="text-xs text-slate-500 flex items-baseline gap-2">
                <span>{account.balance >= 0 ? 'Dr' : 'Cr'}</span>
                <span className="font-mono">{Math.abs(account.balance).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {canWrite && !previewMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); setEditingAccount(account); }}
              className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-600 dark:text-emerald-400 transition-all"
              title={t('common.edit')}
            >
              <Edit3 size={14} />
            </button>
            {!account.children?.length && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteAccount(account.id); }}
                className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-500 hover:text-rose-600 transition-all"
                title={t('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ovds-widget-card shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Folder size={20} />
          {t('ovds.coa.title')}
          {!previewMode && <Badge>{t('ovds.coa.accounts_count', { count: flatAccounts.length })}</Badge>}
        </h3>
        <div className="flex items-center gap-2">
          {!previewMode && flatAccounts.length > 0 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('ovds.coa.search_placeholder')}
                className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-400/20 w-48 dark:text-slate-200"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          )}
          {!previewMode && canWrite && (
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="gap-1.5"
            >
              <Plus size={14} />
              {t('ovds.coa.add_btn')}
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <Skeleton.Table rows={8} cols={4} className="max-h-96" />
        ) : accounts.length === 0 ? (
          <div className="text-center py-16">
            <Folder size={64} className="mx-auto mb-4 text-slate-300" />
            <h4 className="text-lg font-bold text-slate-800 mb-2">{t('ovds.coa.no_accounts')}</h4>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {t('ovds.coa.no_accounts_hint')}
            </p>
            {canWrite && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={async () => {
                  try {
                    const res = await api.post('/ovds/accounts/seed');
                    toast.success(res.data?.message || t('success.updated'));
                    loadAccounts();
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || t('error.generic'));
                  }
                }}>
                  <DollarSign size={14} />
                  {t('ovds.coa.seed_btn')}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                  <Plus size={14} />
                  {t('ovds.coa.create_manually_btn')}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const filterTree = (accs: Account[]): Account[] =>
                accs.flatMap((acc) => {
                  const match = !q || acc.name.toLowerCase().includes(q) || acc.code.toLowerCase().includes(q);
                  const filteredChildren = filterTree(acc.children ?? []);
                  if (match) return [{ ...acc, children: acc.children }];
                  if (filteredChildren.length) return [{ ...acc, children: filteredChildren }];
                  return [];
                });
              const filtered = q ? filterTree(accounts) : accounts;
              return filtered.map((account) => (
                <React.Fragment key={account.id}>
                  {renderAccount(account, 0)}
                  {(expanded.has(account.id) || q) && account.children?.map((child) => renderAccount(child, 1))}
                </React.Fragment>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAccount) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {editingAccount ? t('ovds.coa.modal.edit_title') : t('ovds.coa.modal.add_title')}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAccount(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('ovds.coa.modal.code')}</label>
                <input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
                  placeholder="1010"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('ovds.coa.modal.name')}</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
                  placeholder="Cash on Hand"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('ovds.coa.modal.type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
                  >
                    {accountTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('ovds.coa.modal.category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">{t('common.search')}</option>
                    {accountCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('ovds.coa.modal.parent')}</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">None (Top level)</option>
                  {flatAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} — {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('ovds.coa.modal.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all text-sm resize-vertical bg-white dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button 
                onClick={() => {
                  const data = { ...formData };
                  if (editingAccount) {
                    updateAccount(editingAccount.id, data);
                  } else {
                    createAccount(data);
                  }
                }}
                className="flex-1 gap-2 font-semibold"
                disabled={!formData.code || !formData.name}
              >
                {editingAccount ? t('ovds.coa.modal.save') : t('ovds.coa.add_btn')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAccount(null);
                  setFormData({ code: '', name: '', type: 'ASSET', category: '', parentId: '', description: '' });
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;







