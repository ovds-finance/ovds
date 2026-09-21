import {
  useMasterComplianceList,
  useMasterCompliance,
  useCreateMasterCompliance,
  useUpdateMasterCompliance,
  useDeleteMasterCompliance,
  useMasterComplianceItems,
  useUpdateMasterComplianceItem,
  useMasterComplianceTemplate,
  useMasterComplianceSummary,
} from '@ovds/features/eims';
import {
  Shield, Plus, ChevronRight, ChevronLeft, Trash2, Search, Filter,
  ClipboardList, BarChart3, FileText, CheckCircle2, X, Save,
  RefreshCw,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-slate-600 bg-slate-100',
  IN_PROGRESS: 'text-amber-600 bg-amber-50',
  COMPLETED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  PENDING: 'text-slate-500 bg-slate-100',
  PASS: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  FAIL: 'text-rose-600 bg-rose-50',
  NOT_APPLICABLE: 'text-slate-400 bg-slate-50',
};

const SECTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  general: { label: 'General Information', icon: <FileText size={14} />, color: 'bg-slate-50 border-slate-200' },
  invoice_registration: { label: 'Invoice Registration', icon: <ClipboardList size={14} />, color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' },
  receipt_registration: { label: 'Receipt Registration', icon: <ClipboardList size={14} />, color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' },
  credit_memo: { label: 'Credit Memo', icon: <FileText size={14} />, color: 'bg-purple-50 border-purple-200' },
  cancel_invoice: { label: 'Cancel Invoice', icon: <FileText size={14} />, color: 'bg-orange-50 border-orange-200' },
  debit_memo: { label: 'Debit Memo', icon: <FileText size={14} />, color: 'bg-pink-50 border-pink-200' },
  negative_tests: { label: 'Negative Tests', icon: <Shield size={14} />, color: 'bg-rose-50 border-rose-200' },
  notification_service: { label: 'Notification Service', icon: <FileText size={14} />, color: 'bg-teal-50 border-teal-200' },
  setup_configuration: { label: 'Setup and Configuration', icon: <FileText size={14} />, color: 'bg-cyan-50 border-cyan-200' },
  printing_layout: { label: 'Printing Layout and Content', icon: <FileText size={14} />, color: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' },
  system_saas: { label: 'A. SaaS SP (Cloud-Based)', icon: <FileText size={14} />, color: 'bg-sky-50 border-sky-200' },
  system_onprem: { label: 'B. On-Premises S-POS', icon: <FileText size={14} />, color: 'bg-violet-50 border-violet-200' },
  system_aggregator: { label: 'C. Aggregator', icon: <FileText size={14} />, color: 'bg-fuchsia-50 border-fuchsia-200' },
  system_hardware_pos: { label: 'D. Hardware POS', icon: <FileText size={14} />, color: 'bg-amber-50 border-amber-200' },
  additional_tests: { label: 'E. Additional Applicable Tests', icon: <FileText size={14} />, color: 'bg-lime-50 border-lime-200' },
  rental_evidence: { label: 'F. Rental Evidence Table', icon: <FileText size={14} />, color: 'bg-orange-50 border-orange-200' },
  arch_model: { label: 'G. Architectural Model', icon: <FileText size={14} />, color: 'bg-slate-50 border-slate-200' },
  component_tables: { label: 'H. Component Tables', icon: <FileText size={14} />, color: 'bg-zinc-50 border-zinc-200' },
  legal_compliance: { label: 'I. Legal, Compliance & Agreement', icon: <FileText size={14} />, color: 'bg-red-50 border-red-200' },
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

const MasterComplianceChecklistPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', bspName: '', bspTin: '', testingLocation: '', systemType: '', systemName: '', hostingType: '', versionBuild: '', testedEnv: '', testerName: '' });
  const [itemFilter, setItemFilter] = useState<string>('');

  const { data: listData, isLoading: loadingList, refetch: refetchList } = useMasterComplianceList();
  const { data: detail } = useMasterCompliance(selectedId || '');
  const { data: itemsData, refetch: _refetchItems } = useMasterComplianceItems(selectedId || '');
  const { data: summaryData } = useMasterComplianceSummary();
  const { data: _templateData } = useMasterComplianceTemplate();

  const createChecklist = useCreateMasterCompliance();
  const updateChecklist = useUpdateMasterCompliance();
  const deleteChecklist = useDeleteMasterCompliance();
  const updateItem = useUpdateMasterComplianceItem();

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    try {
      await createChecklist.mutateAsync(form);
      toast.success('Master compliance checklist created');
      setForm({ title: '', bspName: '', bspTin: '', testingLocation: '', systemType: '', systemName: '', hostingType: '', versionBuild: '', testedEnv: '', testerName: '' });
      setShowCreate(false);
      refetchList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this checklist and all its items?')) return;
    try {
      await deleteChecklist.mutateAsync(id);
      toast.success('Checklist deleted');
      if (selectedId === id) setSelectedId(null);
      refetchList();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateItem = async (itemId: string, patch: Record<string, unknown>) => {
    try {
      await updateItem.mutateAsync({ checklistId: selectedId ?? '', itemId, data: patch });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredChecklists = (listData ?? []).filter((c: any) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredItems = (itemsData ?? []).filter((item: any) => {
    if (itemFilter && item.status !== itemFilter) return false;
    if (searchQuery && !item.itemText.toLowerCase().includes(searchQuery.toLowerCase()) && !item.itemKey.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const groupedItems = filteredItems.reduce<Record<string, any[]>>((acc, item) => {
    if (!acc[item.sectionKey]) acc[item.sectionKey] = [];
    acc[item.sectionKey].push(item);
    return acc;
  }, {});

  const sectionOrder = Object.keys(groupedItems).sort((a, b) => {
    const order = ['general', 'invoice_registration', 'receipt_registration', 'credit_memo', 'cancel_invoice', 'debit_memo', 'negative_tests', 'notification_service', 'setup_configuration', 'printing_layout', 'system_saas', 'system_onprem', 'system_aggregator', 'system_hardware_pos', 'additional_tests', 'rental_evidence', 'arch_model', 'component_tables', 'legal_compliance'];
    return order.indexOf(a) - order.indexOf(b);
  });

  const renderSummary = () => {
    if (!summaryData) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-white rounded-xl border">
          <p className="text-xs text-slate-500">Total Checklists</p>
          <p className="text-lg font-bold">{summaryData.totalChecklists}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border">
          <p className="text-xs text-slate-500">Total Items</p>
          <p className="text-lg font-bold">{summaryData.totalItems}</p>
        </div>
        <div className="p-3 bg-[var(--pro-azure-50)] rounded-xl border border-[var(--pro-azure-100)]">
          <p className="text-xs text-[var(--pro-azure)]">Passed</p>
          <p className="text-lg font-bold text-[var(--pro-azure-dark)]">{summaryData.passItems}</p>
        </div>
        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
          <p className="text-xs text-rose-600">Failed</p>
          <p className="text-lg font-bold text-rose-700">{summaryData.failItems}</p>
        </div>
        <div className="p-3 bg-[var(--pro-azure-50)] rounded-xl border border-[var(--pro-azure-100)] col-span-2 md:col-span-4">
          <p className="text-xs text-[var(--pro-azure)]">Compliance Score</p>
          <p className="text-2xl font-bold text-[var(--pro-azure-dark)]">{summaryData.complianceScore}%</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[var(--pro-azure-50)] text-[var(--pro-azure)]">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Master Compliance Checklist</h1>
          <p className="text-sm text-slate-500">EIRMS Pre-Rollout Compliance Verification</p>
        </div>
      </div>

      {!selectedId ? (
        <div className="space-y-4">
          {renderSummary()}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search checklists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border rounded-lg">
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <button type="button" onClick={() => setShowCreate(true)} className="px-3 py-2 text-sm bg-[var(--pro-azure)] text-white rounded-lg hover:bg-[var(--pro-azure-dark)] flex items-center gap-1">
              <Plus size={14} /> New Checklist
            </button>
          </div>

          {loadingList ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChecklists.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No checklists found. Create one to get started.</p>
              )}
              {filteredChecklists.map((cl: any) => (
                <div key={cl.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{cl.title}</p>
                      <Badge status={cl.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{cl.bspName || 'N/A'} · TIN: {cl.bspTin || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{cl.systemType || 'N/A'} · {cl.systemName || 'N/A'} · Created: {new Date(cl.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => setSelectedId(cl.id)} className="p-1.5 text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] rounded-lg" title="View">
                      <ChevronRight size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(cl.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setSelectedId(null); refetchList(); }} className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg">
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{detail?.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge status={detail?.status || ''} />
                <span className="text-xs text-slate-500">{detail?.bspName || 'N/A'} · TIN: {detail?.bspTin || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={detail?.status || ''}
                onChange={(e) => updateChecklist.mutate({ id: detail!.id, data: { status: e.target.value } })}
                className="px-3 py-1.5 text-sm border rounded-lg"
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter items..."
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border rounded-lg">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
              <option value="NOT_APPLICABLE">N/A</option>
            </select>
          </div>

          <div className="space-y-4">
            {sectionOrder.map((sectionKey) => {
              const sectionItems = groupedItems[sectionKey] || [];
              const meta = SECTION_META[sectionKey] || { label: sectionKey, icon: <FileText size={14} />, color: 'bg-slate-50 border-slate-200' };
              return (
                <div key={sectionKey} className={`rounded-xl border overflow-hidden ${meta.color}`}>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {meta.icon}
                      <p className="text-sm font-semibold">{meta.label}</p>
                    </div>
                    <span className="text-xs text-slate-500">{sectionItems.length} items</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100">
                    {sectionItems.map((item: any) => (
                      <div key={item.id} className="p-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.itemKey}</span>
                            <span className="text-xs text-slate-700 leading-snug">{item.itemText}</span>
                          </div>
                          {item.remarks && <p className="text-xs text-slate-500 mt-1 ml-16">{item.remarks}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateItem(item.id, { status: e.target.value })}
                            className="px-2 py-1 text-xs border rounded-lg"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PASS">Pass</option>
                            <option value="FAIL">Fail</option>
                            <option value="NOT_APPLICABLE">N/A</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {sectionItems.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No items in this section</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold">New Master Compliance Checklist</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="e.g., EIRMS Pre-Rollout Compliance" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">BSP Name</label>
                <input type="text" value={form.bspName} onChange={(e) => setForm({ ...form, bspName: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">BSP TIN</label>
                <input type="text" value={form.bspTin} onChange={(e) => setForm({ ...form, bspTin: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Testing Location</label>
                <input type="text" value={form.testingLocation} onChange={(e) => setForm({ ...form, testingLocation: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">System Type</label>
                <select value={form.systemType} onChange={(e) => setForm({ ...form, systemType: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg">
                  <option value="">Select type...</option>
                  <option value="SaaS">SaaS</option>
                  <option value="On-Premises S-POS">On-Premises S-POS</option>
                  <option value="Aggregator">Aggregator</option>
                  <option value="Hardware POS">Hardware POS</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">System Name</label>
                <input type="text" value={form.systemName} onChange={(e) => setForm({ ...form, systemName: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Hosting Type</label>
                <input type="text" value={form.hostingType} onChange={(e) => setForm({ ...form, hostingType: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Version / Build</label>
                <input type="text" value={form.versionBuild} onChange={(e) => setForm({ ...form, versionBuild: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Tested Environment</label>
                <input type="text" value={form.testedEnv} onChange={(e) => setForm({ ...form, testedEnv: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Tester Name</label>
                <input type="text" value={form.testerName} onChange={(e) => setForm({ ...form, testerName: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleCreate} className="px-3 py-2 text-sm bg-[var(--pro-azure)] text-white rounded-lg hover:bg-[var(--pro-azure-dark)]">Create Checklist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterComplianceChecklistPage;
