import type { SettingDefinition } from '@ovds/shared';
import { Skeleton, GridHero, ContextStrip, ContextPill } from '@ovds/ui';
import {
  Settings2, Plus, Trash2, Edit3, LayoutGrid,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../rbac';
import settingsCatalogApi from '../../services/settingsCatalogApi';


type Tab = 'categories' | 'groups' | 'definitions';

interface Category {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  groups?: Group[];
}

interface Group {
  id: string;
  categoryId: string;
  key: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

interface Definition {
  id: string;
  key: string;
  value: string;
  type: string;
  categoryId: string;
  groupId?: string;
  companyId?: string;
  defaultValue?: string;
  options?: string;
  isRequired: boolean;
  isGlobal: boolean;
  isEncrypted: boolean;
  sortOrder: number;
  placeholder?: string;
  hint?: string;
  module?: string;
}

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'categories', label: 'Categories', icon: <LayoutGrid size={14} />, desc: 'Top-level settings headings' },
  { id: 'groups',     label: 'Groups',     icon: <LayoutGrid size={14} />, desc: 'Sub-groups within categories' },
  { id: 'definitions',label: 'Definitions',icon: <Settings2 size={14} />, desc: 'Individual setting fields' },
];

const SettingsCatalog: React.FC = () => {
  const { can } = useAuth();
  const canWrite = can('settings:write');
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [definitions, setDefinitions] = useState<Definition[]>([]);

  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState<Partial<Category>>({});

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState<Partial<Group>>({});

  const [showDefForm, setShowDefForm] = useState(false);
  const [defForm, setDefForm] = useState<Partial<Definition>>({});

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsCatalogApi.categories.list();
      setCategories(data ?? []);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsCatalogApi.groups.list();
      setGroups(data ?? []);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  }, []);

  const loadDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsCatalogApi.definitions.list();
      setDefinitions(data ?? []);
    } catch { toast.error('Failed to load definitions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') loadCategories();
    else if (activeTab === 'groups') loadGroups();
    else loadDefinitions();
  }, [activeTab, loadCategories, loadGroups, loadDefinitions]);

  const handleSaveCategory = async () => {
    if (!catForm.key || !catForm.name) { toast.error('Key and name are required'); return; }
    setSaving(true);
    try {
      if (catForm.id) {
        await settingsCatalogApi.categories.update(catForm.key, catForm);
        toast.success('Category updated');
      } else {
        await settingsCatalogApi.categories.create(catForm as { key: string; name: string; description?: string; icon?: string });
        toast.success('Category created');
      }
      setShowCatForm(false); setCatForm({}); loadCategories();
    } catch { toast.error('Failed to save category'); }
    finally { setSaving(false); }
  };

  const handleDeleteCategory = async (key: string) => {
    if (!confirm('Delete this category and all its groups/definitions?')) return;
    try {
      await settingsCatalogApi.categories.delete(key);
      toast.success('Category deleted');
      loadCategories();
    } catch { toast.error('Failed to delete category'); }
  };

  const handleSaveGroup = async () => {
    if (!groupForm.categoryId || !groupForm.key || !groupForm.name) { toast.error('Category, key and name are required'); return; }
    setSaving(true);
    try {
      if (groupForm.id) {
        await settingsCatalogApi.groups.update(groupForm.id, groupForm);
        toast.success('Group updated');
      } else {
        await settingsCatalogApi.groups.create(groupForm as { categoryId: string; key: string; name: string; description?: string });
        toast.success('Group created');
      }
      setShowGroupForm(false); setGroupForm({}); loadGroups();
    } catch { toast.error('Failed to save group'); }
    finally { setSaving(false); }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    try {
      await settingsCatalogApi.groups.delete(id);
      toast.success('Group deleted');
      loadGroups();
    } catch { toast.error('Failed to delete group'); }
  };

  const handleSaveDefinition = async () => {
    if (!defForm.key || !defForm.type || !defForm.categoryId) { toast.error('Key, type and category are required'); return; }
    setSaving(true);
    try {
      if (defForm.id) {
        await settingsCatalogApi.definitions.update(defForm.id, defForm as SettingDefinition);
        toast.success('Definition updated');
      } else {
        await settingsCatalogApi.definitions.create(defForm as SettingDefinition);
        toast.success('Definition created');
      }
      setShowDefForm(false); setDefForm({}); loadDefinitions();
    } catch { toast.error('Failed to save definition'); }
    finally { setSaving(false); }
  };

  const handleDeleteDefinition = async (id: string) => {
    if (!confirm('Delete this definition?')) return;
    try {
      await settingsCatalogApi.definitions.delete(id);
      toast.success('Definition deleted');
      loadDefinitions();
    } catch { toast.error('Failed to delete definition'); }
  };

  const activeLabel = TAB_CONFIG.find(t => t.id === activeTab)?.label ?? 'Catalog';

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <GridHero
        title="Settings Catalog"
        subtitle="Define structured configuration categories, groups and typed fields for the modular settings system"
        crumbs={[{ label: 'System Administration' }, { label: 'Settings Catalog' }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (activeTab === 'categories') setCatForm({});
              else if (activeTab === 'groups') setGroupForm({ categoryId: categories[0]?.id ?? '' });
              else setDefForm({ categoryId: categories[0]?.id ?? '', type: 'text' });
              if (activeTab === 'categories') setShowCatForm(!showCatForm);
              else if (activeTab === 'groups') setShowGroupForm(!showGroupForm);
              else setShowDefForm(!showDefForm);
            }} disabled={!canWrite}
              className="ovds-btn-primary flex items-center gap-2 disabled:opacity-50">
              <Plus size={13} /> New {activeLabel.replace(/s$/, '')}
            </button>
          </div>
        }
      />

      <ContextStrip>
        <ContextPill leading={<Settings2 size={11} />} label={activeLabel} />
        <span className="text-[10px] font-semibold text-slate-500 ml-2">
          {categories.length} categories · {groups.length} groups · {definitions.length} definitions
        </span>
      </ContextStrip>

      <div className="grid gap-5" style={{ gridTemplateColumns: '220px 1fr' }}>
        {/* Sidebar */}
        <div className="min-w-0">
          <div className="ovds-widget-card overflow-hidden">
            <nav className="py-2" aria-label="Settings catalog navigation">
              {TAB_CONFIG.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowCatForm(false); setShowGroupForm(false); setShowDefForm(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 transition-all ${activeTab === tab.id ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">{tab.icon}</div>
                  <div className="text-left">
                    <p className="text-xs font-medium">{tab.label}</p>
                    <p className="text-[9px] text-slate-400">{tab.desc}</p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="settings-tab-content">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton.Line key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'categories' && (
                <div className="space-y-4">
                  {showCatForm && (
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">New Category</p>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="ovds-input" placeholder="Key (e.g. company)" value={catForm.key ?? ''} onChange={e => setCatForm({ ...catForm, key: e.target.value })} />
                        <input className="ovds-input" placeholder="Display Name" value={catForm.name ?? ''} onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
                      </div>
                      <input className="ovds-input" placeholder="Description" value={catForm.description ?? ''} onChange={e => setCatForm({ ...catForm, description: e.target.value })} />
                      <div className="flex gap-2">
                        <input className="ovds-input" placeholder="Icon (optional)" value={catForm.icon ?? ''} onChange={e => setCatForm({ ...catForm, icon: e.target.value })} />
                        <button onClick={handleSaveCategory} disabled={saving} className="ovds-btn-primary">{saving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => { setShowCatForm(false); setCatForm({}); }} className="ovds-btn-secondary">Cancel</button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                          {cat.icon && <span className="text-lg">{cat.icon}</span>}
                          <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cat.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{cat.key}</p>
                            {cat.description && <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setCatForm(cat); setShowCatForm(true); }} className="p-2 text-slate-400 hover:text-teal-600"><Edit3 size={14} /></button>
                          <button onClick={() => handleDeleteCategory(cat.key)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    {categories.length === 0 && !loading && <p className="text-xs text-slate-400 py-6 text-center">No categories yet. Add your first category above.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="space-y-4">
                  {showGroupForm && (
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">New Group</p>
                      <select className="ovds-input" value={groupForm.categoryId ?? ''} onChange={e => setGroupForm({ ...groupForm, categoryId: e.target.value })}>
                        <option value="">Select category…</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="ovds-input" placeholder="Key" value={groupForm.key ?? ''} onChange={e => setGroupForm({ ...groupForm, key: e.target.value })} />
                        <input className="ovds-input" placeholder="Display Name" value={groupForm.name ?? ''} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveGroup} disabled={saving} className="ovds-btn-primary">{saving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => { setShowGroupForm(false); setGroupForm({}); }} className="ovds-btn-secondary">Cancel</button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {groups.map(grp => {
                      const cat = categories.find(c => c.id === grp.categoryId);
                      return (
                        <div key={grp.id} className="flex items-center justify-between px-5 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{grp.name}</p>
                              {cat && <span className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">{cat.name}</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{grp.key}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setGroupForm({ ...grp, categoryId: grp.categoryId }); setShowGroupForm(true); }} className="p-2 text-slate-400 hover:text-teal-600"><Edit3 size={14} /></button>
                            <button onClick={() => handleDeleteGroup(grp.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                    {groups.length === 0 && !loading && <p className="text-xs text-slate-400 py-6 text-center">No groups yet. Create a group to organize settings.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'definitions' && (
                <div className="space-y-4">
                  {showDefForm && (
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">New Definition</p>
                      <div className="grid grid-cols-2 gap-3">
                        <select className="ovds-input" value={defForm.categoryId ?? ''} onChange={e => setDefForm({ ...defForm, categoryId: e.target.value })}>
                          <option value="">Select category…</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select className="ovds-input" value={defForm.groupId ?? ''} onChange={e => setDefForm({ ...defForm, groupId: e.target.value })}>
                          <option value="">Select group…</option>
                          {groups.filter(g => g.categoryId === defForm.categoryId).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="ovds-input" placeholder="Setting key (e.g. vat_rate)" value={defForm.key ?? ''} onChange={e => setDefForm({ ...defForm, key: e.target.value })} />
                        <select className="ovds-input" value={defForm.type ?? 'text'} onChange={e => setDefForm({ ...defForm, type: e.target.value })}>
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                          <option value="toggle">Toggle</option>
                          <option value="date">Date</option>
                          <option value="email">Email</option>
                          <option value="url">URL</option>
                          <option value="image">Image</option>
                          <option value="json">JSON</option>
                          <option value="password">Password</option>
                        </select>
                      </div>
                      <input className="ovds-input" placeholder="Default value" value={defForm.defaultValue ?? ''} onChange={e => setDefForm({ ...defForm, defaultValue: e.target.value })} />
                      <div className="flex gap-2">
                        <button onClick={handleSaveDefinition} disabled={saving} className="ovds-btn-primary">{saving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => { setShowDefForm(false); setDefForm({}); }} className="ovds-btn-secondary">Cancel</button>
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {definitions.map(def => {
                      const cat = categories.find(c => c.id === def.categoryId);
                      const grp = def.groupId ? groups.find(g => g.id === def.groupId) : null;
                      return (
                        <div key={def.id} className="flex items-center justify-between px-5 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{def.key}</p>
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-mono">{def.type}</span>
                              {def.isGlobal && <span className="text-[9px] px-1.5 py-0.5 bg-[var(--pro-azure-50)] text-[var(--pro-azure)] rounded">GLOBAL</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {cat && <span className="text-[10px] text-slate-400">{cat.name}</span>}
                              {grp && <><span className="text-slate-300">·</span><span className="text-[10px] text-slate-400">{grp.name}</span></>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setDefForm({ ...def, categoryId: def.categoryId, groupId: def.groupId ?? '', type: def.type }); setShowDefForm(true); }} className="p-2 text-slate-400 hover:text-teal-600"><Edit3 size={14} /></button>
                            <button onClick={() => handleDeleteDefinition(def.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                    {definitions.length === 0 && !loading && <p className="text-xs text-slate-400 py-6 text-center">No definitions yet. Create typed setting fields here.</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsCatalog;
