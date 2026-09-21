import {
  useAccreditationList,
  useAccreditation,
  useCreateAccreditation,
  useUpdateAccreditation,
  useDeleteAccreditation,
  useAccreditationItems,
  useUpdateAccreditationItem,
  useAccreditationSummary,
} from '@ovds/features/eims';
import { ACCREDITATION_SECTION_META, ACCREDITATION_SECTION_ORDER } from '@ovds/shared';
import {
  Shield, Plus, ChevronRight, ChevronLeft, Trash2, Search,
  ClipboardList, BarChart3, FileText, CheckCircle2, X, Save,
  Printer, Calendar, Building, User, Phone, Mail, Globe,
  Server, Smartphone, Monitor, Cloud, ShoppingCart, Award,
  UserCheck, FlaskConical, AlertTriangle,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-slate-600 bg-slate-100',
  IN_PROGRESS: 'text-amber-600 bg-amber-50',
  COMPLETED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  PENDING: 'text-slate-500 bg-slate-100',
  PASS: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  FAIL: 'text-rose-600 bg-rose-50',
  NOT_APPLICABLE: 'text-slate-400 bg-slate-50',
  RECOMMENDED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  NOT_RECOMMENDED: 'text-rose-600 bg-rose-50',
  WITH_CONDITIONS: 'text-amber-600 bg-amber-50',
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  documentation: <FileText size={14} />,
  article4_general: <ClipboardList size={14} />,
  article4_data_exchange: <Shield size={14} />,
  article4_operational: <CheckCircle2 size={14} />,
  article4_mpos: <Smartphone size={14} />,
  article4_hardware_pos: <Monitor size={14} />,
  article5_saas: <Cloud size={14} />,
  article6_ecommerce: <ShoppingCart size={14} />,
  article7_general_license: <Award size={14} />,
  article8_exclusive_use: <UserCheck size={14} />,
  article9_testing: <FlaskConical size={14} />,
  onprem_erp_pos: <Server size={14} />,
};

const Badge: React.FC<{ status: string; size?: 'xs' | 'sm' }> = ({ status, size = 'xs' }) => {
  const sizeCls = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase ${sizeCls} ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const GradeSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50"
  >
    <option value="PENDING">Pending</option>
    <option value="PASS">Pass</option>
    <option value="FAIL">Fail</option>
    <option value="NOT_APPLICABLE">N/A</option>
  </select>
);

const AccreditationChecklistPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [itemFilter, setItemFilter] = useState<string>('');

  const { data: listData, isLoading: loadingList, refetch: refetchList } = useAccreditationList();
  const { data: detail } = useAccreditation(selectedId || '');
  const { data: itemsData, refetch: refetchItems } = useAccreditationItems(selectedId || '');
  const { data: summaryData } = useAccreditationSummary();

  const createChecklist = useCreateAccreditation();
  const updateChecklist = useUpdateAccreditation();
  const deleteChecklist = useDeleteAccreditation();
  const updateItem = useUpdateAccreditationItem();

  const [form, setForm] = useState({
    title: '',
    softwareType: '',
    softwareName: '',
    softwareVersion: '',
    providerContactName: '',
    providerCompanyName: '',
    providerPosition: '',
    providerAddress: '',
    providerMobile: '',
    providerTelephone: '',
    providerFax: '',
    providerEmail: '',
    ownerLegalName: '',
    ownerAddress: '',
    ownerCity: '',
    ownerCountry: '',
    ownerTelephone: '',
    ownerContactName: '',
    ownerWebEmail: '',
  });

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    try {
      await createChecklist.mutateAsync(form);
      toast.success('Accreditation checklist created');
      setForm({
        title: '', softwareType: '', softwareName: '', softwareVersion: '',
        providerContactName: '', providerCompanyName: '', providerPosition: '',
        providerAddress: '', providerMobile: '', providerTelephone: '',
        providerFax: '', providerEmail: '', ownerLegalName: '', ownerAddress: '',
        ownerCity: '', ownerCountry: '', ownerTelephone: '', ownerContactName: '',
        ownerWebEmail: '',
      });
      setShowCreate(false);
      refetchList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this accreditation checklist and all its items?')) return;
    try {
      await deleteChecklist.mutateAsync(id);
      toast.success('Checklist deleted');
      if (selectedId === id) setSelectedId(null);
      refetchList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateItem = async (id: string, data: Record<string, unknown>) => {
    try {
      await updateItem.mutateAsync({ checklistId: selectedId ?? '', itemId: id, data });
      refetchItems();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedId) return;
    try {
      await updateChecklist.mutateAsync({ id: selectedId, data: { status } });
      toast.success(`Status updated to ${status}`);
      refetchList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredChecklists = useMemo(() => {
    if (!listData) return [];
    return (listData as any[]).filter((c: any) => {
      const matchesSearch = !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.softwareName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.providerCompanyName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !filterStatus || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [listData, searchQuery, filterStatus]);

  const groupedItems = useMemo(() => {
    if (!itemsData) return {};
    const groups: Record<string, any[]> = {};
    for (const item of itemsData) {
      if (!groups[item.sectionKey]) groups[item.sectionKey] = [];
      groups[item.sectionKey].push(item);
    }
    return groups;
  }, [itemsData]);

  const filteredGroupedItems = useMemo(() => {
    const result: Record<string, any[]> = {};
    for (const [section, items] of Object.entries(groupedItems)) {
      result[section] = items.filter((item) => {
        if (itemFilter === 'PASS') return item.status === 'PASS';
        if (itemFilter === 'FAIL') return item.status === 'FAIL';
        if (itemFilter === 'PENDING') return item.status === 'PENDING';
        if (itemFilter === 'NOT_APPLICABLE') return item.status === 'NOT_APPLICABLE';
        return true;
      });
    }
    return result;
  }, [groupedItems, itemFilter]);

  const sectionStats = useMemo(() => {
    const stats: Record<string, { pass: number; fail: number; na: number; pending: number; total: number }> = {};
    for (const [section, items] of Object.entries(groupedItems)) {
      stats[section] = {
        pass: items.filter((i) => i.status === 'PASS').length,
        fail: items.filter((i) => i.status === 'FAIL').length,
        na: items.filter((i) => i.status === 'NOT_APPLICABLE').length,
        pending: items.filter((i) => i.status === 'PENDING').length,
        total: items.length,
      };
    }
    return stats;
  }, [groupedItems]);

  const overallStats = useMemo(() => {
    if (!itemsData) return { pass: 0, fail: 0, na: 0, pending: 0, total: 0, score: 0 };
    const pass = itemsData.filter((i) => i.status === 'PASS').length;
    const fail = itemsData.filter((i) => i.status === 'FAIL').length;
    const na = itemsData.filter((i) => i.status === 'NOT_APPLICABLE').length;
    const pending = itemsData.filter((i) => i.status === 'PENDING').length;
    const total = itemsData.length;
    const graded = pass + fail + na;
    const score = graded > 0 ? Math.round((pass / graded) * 100) : 0;
    return { pass, fail, na, pending, total, score };
  }, [itemsData]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (!selectedId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="text-[var(--pro-azure)]" size={22} />
              Sales Registration Systems Accreditation
            </h1>
            <p className="text-sm text-slate-500 mt-1">Directive No. 1142/2026 Compliance Checklist</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-lg hover:bg-[var(--pro-azure-dark)] text-sm font-medium"
          >
            <Plus size={16} />
            New Checklist
          </button>
        </div>

        {/* Summary Cards */}
        {summaryData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-bold text-slate-900">{summaryData.totalChecklists}</div>
              <div className="text-xs text-slate-500 mt-1">Total Checklists</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-bold text-amber-600">{summaryData.inProgressChecklists}</div>
              <div className="text-xs text-slate-500 mt-1">In Progress</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-bold text-[var(--pro-azure)]">{summaryData.completedChecklists}</div>
              <div className="text-xs text-slate-500 mt-1">Completed</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-bold text-[var(--pro-azure)]">{summaryData.complianceScore}%</div>
              <div className="text-xs text-slate-500 mt-1">Avg Compliance</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search checklists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Checklist Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Software</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Provider</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredChecklists.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No checklists found</td></tr>
              ) : (
                filteredChecklists.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className="font-medium text-slate-900 hover:text-[var(--pro-azure)]"
                      >
                        {c.title}
                      </button>
                      {c.dateOfAdmission && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(c.dateOfAdmission).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.softwareName || '—'}
                      {c.softwareVersion && <span className="text-xs text-slate-400 ml-1">v{c.softwareVersion}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.providerCompanyName || '—'}</td>
                    <td className="px-4 py-3"><Badge status={c.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className="p-1.5 text-slate-400 hover:text-[var(--pro-azure)] rounded"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded ml-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">New Accreditation Checklist</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Accreditation for [System Name]"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Software Type</label>
                    <select
                      value={form.softwareType}
                      onChange={(e) => setForm({ ...form, softwareType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Select type...</option>
                      <option value="SaaS">SaaS</option>
                      <option value="On-Premise">On-Premise</option>
                      <option value="Hardware POS">Hardware POS</option>
                      <option value="Mobile POS">Mobile POS</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="ERP">ERP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Software Name & Version</label>
                    <input
                      type="text"
                      value={form.softwareName}
                      onChange={(e) => setForm({ ...form, softwareName: e.target.value })}
                      placeholder="System name"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Provider/Company Name</label>
                    <input
                      type="text"
                      value={form.providerCompanyName}
                      onChange={(e) => setForm({ ...form, providerCompanyName: e.target.value })}
                      placeholder="Company name"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={form.providerEmail}
                      onChange={(e) => setForm({ ...form, providerEmail: e.target.value })}
                      placeholder="email@company.com"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-slate-200">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createChecklist.isPending}
                  className="px-4 py-2 text-sm bg-[var(--pro-azure)] text-white rounded-lg hover:bg-[var(--pro-azure-dark)] disabled:opacity-50"
                >
                  {createChecklist.isPending ? 'Creating...' : 'Create Checklist'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedId(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{detail?.title || 'Accreditation Checklist'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {detail?.softwareName && `${detail.softwareName} `}
              {detail?.softwareVersion && `v${detail.softwareVersion} `}
              {detail?.providerCompanyName && `— ${detail.providerCompanyName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 print:hidden"
          >
            <Printer size={14} />
            Print
          </button>
          <select
            value={detail?.status || 'DRAFT'}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white print:hidden"
          >
            <option value="DRAFT">Draft</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Overall Score Bar */}
      {itemsData && itemsData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Overall Compliance</span>
            <span className="text-lg font-bold text-[var(--pro-azure)]">{overallStats.score}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
            {overallStats.pass > 0 && (
              <div className="bg-[var(--pro-azure-50)]0 h-full" style={{ width: `${(overallStats.pass / overallStats.total) * 100}%` }} />
            )}
            {overallStats.na > 0 && (
              <div className="bg-slate-300 h-full" style={{ width: `${(overallStats.na / overallStats.total) * 100}%` }} />
            )}
            {overallStats.fail > 0 && (
              <div className="bg-rose-500 h-full" style={{ width: `${(overallStats.fail / overallStats.total) * 100}%` }} />
            )}
            {overallStats.pending > 0 && (
              <div className="bg-slate-100 h-full border-l border-white" style={{ width: `${(overallStats.pending / overallStats.total) * 100}%` }} />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--pro-azure-50)]0" /> Pass: {overallStats.pass}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Fail: {overallStats.fail}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> N/A: {overallStats.na}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-100 border border-slate-200" /> Pending: {overallStats.pending}</span>
          </div>
        </div>
      )}

      {/* Applicant Info Cards */}
      {detail && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <Building size={12} /> Software Data
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="text-slate-400">Type:</span> <span className="text-slate-700">{detail.softwareType || '—'}</span></div>
              <div><span className="text-slate-400">Name:</span> <span className="text-slate-700">{detail.softwareName || '—'}</span></div>
              <div><span className="text-slate-400">Version:</span> <span className="text-slate-700">{detail.softwareVersion || '—'}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <User size={12} /> Provider / Applicant
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="text-slate-400">Company:</span> <span className="text-slate-700">{detail.providerCompanyName || '—'}</span></div>
              <div><span className="text-slate-400">Contact:</span> <span className="text-slate-700">{detail.providerContactName || '—'}</span></div>
              <div><span className="text-slate-400">Email:</span> <span className="text-slate-700">{detail.providerEmail || '—'}</span></div>
              <div><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{detail.providerMobile || detail.providerTelephone || '—'}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <Globe size={12} /> Software Owner
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="text-slate-400">Legal Name:</span> <span className="text-slate-700">{detail.ownerLegalName || '—'}</span></div>
              <div><span className="text-slate-400">City:</span> <span className="text-slate-700">{detail.ownerCity || '—'}</span></div>
              <div><span className="text-slate-400">Country:</span> <span className="text-slate-700">{detail.ownerCountry || '—'}</span></div>
              <div><span className="text-slate-400">Web/Email:</span> <span className="text-slate-700">{detail.ownerWebEmail || '—'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <span className="text-xs font-semibold text-slate-500">Filter:</span>
        {['', 'PASS', 'FAIL', 'PENDING', 'NOT_APPLICABLE'].map((f) => (
          <button
            key={f}
            onClick={() => setItemFilter(f)}
            className={`px-2.5 py-1 text-xs rounded-full font-medium ${
              itemFilter === f
                ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Checklist Sections */}
      <div className="space-y-4">
        {ACCREDITATION_SECTION_ORDER.map((sectionKey) => {
          const items = filteredGroupedItems[sectionKey] || [];
          const meta = ACCREDITATION_SECTION_META[sectionKey];
          const stats = sectionStats[sectionKey];
          if (!meta) return null;

          return (
            <div key={sectionKey} className="rounded-xl border border-slate-200 overflow-hidden">
              {/* Section Header */}
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--pro-azure)]">{SECTION_ICONS[sectionKey]}</span>
                  <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
                  <span className="text-xs text-slate-400">({meta.directive})</span>
                </div>
                {stats && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--pro-azure)] font-medium">{stats.pass}P</span>
                    <span className="text-rose-600 font-medium">{stats.fail}F</span>
                    <span className="text-slate-400 font-medium">{stats.na}N/A</span>
                    <span className="text-slate-400">({stats.total})</span>
                  </div>
                )}
              </div>
              {/* Items */}
              <div className="bg-white divide-y divide-slate-100">
                {items.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">No items match filter</div>
                ) : (
                  items.map((item: any) => (
                    <div key={item.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {item.itemKey}
                          </span>
                          <span className="text-xs text-slate-700 leading-snug">{item.itemText}</span>
                        </div>
                        {item.comment && (
                          <p className="text-xs text-slate-500 mt-1 ml-12 italic">{item.comment}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 print:hidden">
                        <GradeSelect
                          value={item.status}
                          onChange={(v) => handleUpdateItem(item.id, { status: v })}
                        />
                      </div>
                      {/* Print-only status */}
                      <span className="hidden print:inline text-xs font-semibold">
                        [{item.status}]
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Assessment Section */}
      {detail && (
        <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-[var(--pro-azure)]" />
              <span className="text-sm font-semibold text-slate-700">Overall Assessment & Recommendation</span>
            </div>
          </div>
          <div className="bg-white p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Strengths / Positive Observations</label>
                <textarea
                  value={detail.strengths || ''}
                  onChange={(e) => updateChecklist.mutate({ id: detail.id, data: { strengths: e.target.value } })}
                  rows={3}
                  placeholder="List strengths..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 print:border-none print:bg-transparent print:p-0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Non-Conformities / Weaknesses</label>
                <textarea
                  value={detail.nonConformities || ''}
                  onChange={(e) => updateChecklist.mutate({ id: detail.id, data: { nonConformities: e.target.value } })}
                  rows={3}
                  placeholder="List non-conformities..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 print:border-none print:bg-transparent print:p-0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observations / Recommendations</label>
              <textarea
                value={detail.observations || ''}
                onChange={(e) => updateChecklist.mutate({ id: detail.id, data: { observations: e.target.value } })}
                rows={2}
                placeholder="Additional observations..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 print:border-none print:bg-transparent print:p-0"
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Final Decision</label>
                <select
                  value={detail.finalDecision || ''}
                  onChange={(e) => updateChecklist.mutate({ id: detail.id, data: { finalDecision: e.target.value } })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select decision...</option>
                  <option value="RECOMMENDED">Accreditation Recommended</option>
                  <option value="NOT_RECOMMENDED">Accreditation Not Recommended</option>
                  <option value="WITH_CONDITIONS">Accreditation with Conditions</option>
                </select>
              </div>
              {detail.finalDecision && (
                <Badge status={detail.finalDecision} size="sm" />
              )}
            </div>
            {detail.finalDecision === 'WITH_CONDITIONS' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Conditions to Fulfill</label>
                <textarea
                  value={detail.conditionDetails || ''}
                  onChange={(e) => updateChecklist.mutate({ id: detail.id, data: { conditionDetails: e.target.value } })}
                  rows={2}
                  placeholder="Specify conditions and timeframe..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signatures Section */}
      <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">Signatures</span>
        </div>
        <div className="bg-white p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Lead of the Committee', 'Chair Rapporteurs', 'Member', 'Member', 'Applicant Representative'].map((role, i) => (
              <div key={i} className="border-b border-slate-200 pb-8 mb-2">
                <div className="text-xs text-slate-400 mt-6">{role}</div>
                <div className="text-[10px] text-slate-300">Name / Signature / Date</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccreditationChecklistPage;
