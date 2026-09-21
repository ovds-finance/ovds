import {
  useCyberAuditList,
  useCyberAudit,
  useCreateCyberAudit,
  useUpdateCyberAudit,
  useDeleteCyberAudit,
  useStartCyberAudit,
  useCompleteCyberAudit,
  useCyberAuditMetrics,
  useUpdateCyberAuditMetric,
  useCyberAuditFindings,
  useCreateCyberAuditFinding,
  useUpdateCyberAuditFinding,
  useDeleteCyberAuditFinding,
  useCyberAuditChecklist,
  useCyberAuditSummary,
} from '@ovds/features/eims';
import {
  Shield, Plus, Play, CheckCircle2, Trash2, Search, Filter,
  ChevronRight, ChevronLeft, AlertTriangle, FileText, ClipboardList,
  BarChart3, X, Save, RefreshCw,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'text-slate-600 bg-slate-100',
  IN_PROGRESS: 'text-amber-600 bg-amber-50',
  COMPLETED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  FAILED: 'text-rose-600 bg-rose-50',
  PENDING: 'text-slate-500 bg-slate-100',
  COMPLIANT: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  NON_COMPLIANT: 'text-rose-600 bg-rose-50',
  NOT_APPLICABLE: 'text-slate-400 bg-slate-50',
  PARTIAL: 'text-amber-600 bg-amber-50',
  OPEN: 'text-rose-600 bg-rose-50',
  RESOLVED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  ACCEPTED_RISK: 'text-purple-600 bg-purple-50',
  CRITICAL: 'text-rose-700 bg-rose-100',
  HIGH: 'text-orange-600 bg-orange-50',
  MEDIUM: 'text-amber-600 bg-amber-50',
  LOW: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  INFO: 'text-slate-500 bg-slate-100',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

const CyberAuditChecklistPage: React.FC = () => {
  const [tab, setTab] = useState<'audits' | 'checklist' | 'summary'>('audits');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [auditForm, setAuditForm] = useState({ title: '', description: '', conductedBy: '' });
  const [metricFilter, setMetricFilter] = useState<string>('');
  const [findingFilter, setFindingFilter] = useState({ severity: '', status: '' });

  const { data: auditsData, isLoading: loadingAudits, refetch: refetchAudits } = useCyberAuditList();
  const { data: auditDetail } = useCyberAudit(selectedAuditId || '');
  const { data: metricsData } = useCyberAuditMetrics(selectedAuditId || '');
  const { data: findingsData, refetch: refetchFindings } = useCyberAuditFindings({
    auditId: selectedAuditId || undefined,
    severity: findingFilter.severity || undefined,
    status: findingFilter.status || undefined,
  });
  const { data: checklistData } = useCyberAuditChecklist();
  const { data: summaryData } = useCyberAuditSummary();

  const createAudit = useCreateCyberAudit();
  const _updateAudit = useUpdateCyberAudit();
  const deleteAudit = useDeleteCyberAudit();
  const startAudit = useStartCyberAudit();
  const completeAudit = useCompleteCyberAudit();
  const updateMetric = useUpdateCyberAuditMetric();
  const createFinding = useCreateCyberAuditFinding();
  const updateFinding = useUpdateCyberAuditFinding();
  const deleteFinding = useDeleteCyberAuditFinding();

  const [newFinding, setNewFinding] = useState({ metricId: '', severity: 'MEDIUM', title: '', description: '', remediation: '' });

  const handleCreateAudit = async () => {
    if (!auditForm.title.trim()) return toast.error('Title is required');
    try {
      await createAudit.mutateAsync(auditForm);
      toast.success('Audit created with all checklist metrics');
      setAuditForm({ title: '', description: '', conductedBy: '' });
      setShowCreate(false);
      refetchAudits();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateMetric = async (metricId: string, status: string) => {
    try {
      await updateMetric.mutateAsync({ auditId: selectedAuditId ?? '', metricId, data: { status } });
      toast.success('Metric updated');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateFinding = async () => {
    if (!newFinding.title.trim() || !newFinding.description.trim()) return toast.error('Title and description required');
    try {
      await createFinding.mutateAsync({ ...newFinding, auditId: selectedAuditId! });
      toast.success('Finding created');
      setNewFinding({ metricId: '', severity: 'MEDIUM', title: '', description: '', remediation: '' });
      refetchFindings();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteAudit = async (id: string) => {
    if (!confirm('Delete this audit and all its metrics/findings?')) return;
    try {
      await deleteAudit.mutateAsync(id);
      toast.success('Audit deleted');
      if (selectedAuditId === id) setSelectedAuditId(null);
      refetchAudits();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredAudits = ((auditsData as any[]) ?? []).filter((a: any) => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredMetrics = (metricsData ?? []).filter((m: any) => {
    if (metricFilter && m.status !== metricFilter) return false;
    if (searchQuery && !m.metricName.toLowerCase().includes(searchQuery.toLowerCase()) && !m.areaName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const groupedMetrics = (filteredMetrics as any[]).reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.areaNumber]) acc[m.areaNumber] = [];
    acc[m.areaNumber].push(m);
    return acc;
  }, {});

  const areaOrder = Object.keys(groupedMetrics).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">INSA Cybersecurity Audit</h1>
          <p className="text-sm text-slate-500">OF/AEAD/001 — ERP, POS & Electronic Invoice Machine Security</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {[
          { key: 'audits', label: 'Audits', icon: <FileText size={14} /> },
          { key: 'checklist', label: 'Checklist Template', icon: <ClipboardList size={14} /> },
          { key: 'summary', label: 'Summary', icon: <BarChart3 size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
              tab === t.key ? 'text-rose-600 border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'audits' && (
        <div className="space-y-4">
          {!selectedAuditId ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search audits..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
                    />
                  </div>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border rounded-lg">
                    <option value="">All Status</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <button type="button" onClick={() => setShowCreate(true)} className="px-3 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-1">
                  <Plus size={14} /> New Audit
                </button>
              </div>

              {loadingAudits ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAudits.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-8">No audits found. Create one to get started.</p>
                  )}
                  {filteredAudits.map((audit: any) => (
                    <div key={audit.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{audit.title}</p>
                          <Badge status={audit.status} />
                        </div>
                        {audit.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{audit.description}</p>}
                        <p className="text-[10px] text-slate-400 mt-1">Conducted by: {audit.conductedBy || 'N/A'} · Created: {new Date(audit.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {audit.status === 'SCHEDULED' && (
                          <button type="button" onClick={() => startAudit.mutate(audit.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Start">
                            <Play size={14} />
                          </button>
                        )}
                        {audit.status === 'IN_PROGRESS' && (
                          <button type="button" onClick={() => completeAudit.mutate(audit.id)} className="p-1.5 text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] rounded-lg" title="Complete">
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button type="button" onClick={() => setSelectedAuditId(audit.id)} className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg" title="View">
                          <ChevronRight size={14} />
                        </button>
                        <button type="button" onClick={() => handleDeleteAudit(audit.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setSelectedAuditId(null)} className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{auditDetail?.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status={auditDetail?.status || ''} />
                    <span className="text-xs text-slate-500">Conducted by: {auditDetail?.conductedBy || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter metrics..."
                    value={metricFilter}
                    onChange={(e) => setMetricFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <select value={findingFilter.severity} onChange={(e) => setFindingFilter({ ...findingFilter, severity: e.target.value })} className="px-3 py-2 text-sm border rounded-lg">
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="INFO">Info</option>
                </select>
              </div>

              <div className="space-y-4">
                {areaOrder.map((areaNum) => {
                  const areaMetrics = groupedMetrics[areaNum];
                  const areaName = areaMetrics[0]?.areaName || '';
                  const areaStats = areaMetrics.filter((m: any) => m.status === 'COMPLIANT').length;
                  return (
                    <div key={areaNum} className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-mono text-slate-400">{areaNum}. {areaName}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">{areaStats}/{areaMetrics.length} compliant</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {areaMetrics.map((metric: any) => (
                          <div key={metric.id} className="p-3 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono text-slate-400">{metric.metricNumber} · {metric.metricName}</p>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{metric.requirement}</p>
                              {metric.evidence && <p className="text-[10px] text-slate-400 mt-1">Evidence: {metric.evidence}</p>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <select
                                value={metric.status}
                                onChange={(e) => handleUpdateMetric(metric.id, e.target.value)}
                                className={`text-[10px] px-2 py-1 rounded-lg border ${STATUS_COLORS[metric.status] ?? 'text-slate-600 bg-slate-100'}`}
                              >
                                <option value="PENDING">Pending</option>
                                <option value="COMPLIANT">Compliant</option>
                                <option value="NON_COMPLIANT">Non-Compliant</option>
                                <option value="NOT_APPLICABLE">N/A</option>
                                <option value="PARTIAL">Partial</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Findings
                </h3>
                <div className="space-y-2">
                  {((findingsData as any[]) ?? []).map((finding: any) => (
                    <div key={finding.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{finding.title}</p>
                          <Badge status={finding.severity} />
                          <Badge status={finding.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{finding.description}</p>
                        {finding.remediation && <p className="text-[10px] text-slate-400 mt-1">Fix: {finding.remediation}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={finding.status}
                          onChange={(e) => updateFinding.mutate({ auditId: selectedAuditId ?? '', findingId: finding.id, data: { status: e.target.value } })}
                          className="text-[10px] px-2 py-1 rounded-lg border"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="ACCEPTED_RISK">Accepted Risk</option>
                        </select>
                        <button type="button" onClick={() => deleteFinding.mutate(finding.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {((findingsData as any[]) ?? []).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No findings yet. Add findings from penetration tests or firmware analysis.</p>
                  )}
                </div>

                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border space-y-2">
                  <p className="text-xs font-semibold">Add Finding</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Title"
                      value={newFinding.title}
                      onChange={(e) => setNewFinding({ ...newFinding, title: e.target.value })}
                      className="px-3 py-1.5 text-xs border rounded-lg"
                    />
                    <select
                      value={newFinding.severity}
                      onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value })}
                      className="px-3 py-1.5 text-xs border rounded-lg"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                      <option value="INFO">Info</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Description"
                    value={newFinding.description}
                    onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Remediation (optional)"
                    value={newFinding.remediation}
                    onChange={(e) => setNewFinding({ ...newFinding, remediation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border rounded-lg"
                  />
                  <button type="button" onClick={handleCreateFinding} className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded-lg hover:bg-rose-700">
                    Add Finding
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'checklist' && (
        <div className="space-y-3">
          {!checklistData ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            (checklistData.data ?? []).map((item: any) => (
              <div key={item.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-rose-600">{item.id} · {item.area}</p>
                    <p className="text-sm font-medium">{item.metric}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.requirement}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{item.explanation}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'summary' && (
        <div className="space-y-4">
          {!summaryData ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                  <p className="text-xs text-slate-500">Total Audits</p>
                  <p className="text-2xl font-bold">{summaryData.totalAudits}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                  <p className="text-xs text-slate-500">Active Audits</p>
                  <p className="text-2xl font-bold text-amber-600">{summaryData.activeAudits}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                  <p className="text-xs text-slate-500">Compliance Score</p>
                  <p className="text-2xl font-bold text-[var(--pro-azure)]">{summaryData.complianceScore}%</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                  <p className="text-xs text-slate-500">Open Findings</p>
                  <p className="text-2xl font-bold text-rose-600">{summaryData.openFindings}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                  <p className="text-xs text-slate-500 mb-2">Metrics Status</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span>Total</span><span className="font-medium">{summaryData.totalMetrics}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[var(--pro-azure)]">Compliant</span><span className="font-medium">{summaryData.compliantMetrics}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-rose-600">Non-Compliant</span><span className="font-medium">{summaryData.nonCompliantMetrics}</span></div>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
                  <p className="text-xs text-slate-500 mb-2">Findings by Severity</p>
                  <div className="space-y-1">
                    {(summaryData.findingsBySeverity ?? []).map((s: any) => (
                      <div key={s.severity} className="flex justify-between text-xs">
                        <span className={STATUS_COLORS[s.severity]?.split(' ')[0] ?? 'text-slate-600'}>{s.severity}</span>
                        <span className="font-medium">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border shadow-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold">New Cybersecurity Audit</h3>
            <input
              type="text"
              placeholder="Audit Title *"
              value={auditForm.title}
              onChange={(e) => setAuditForm({ ...auditForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
            <textarea
              placeholder="Description"
              value={auditForm.description}
              onChange={(e) => setAuditForm({ ...auditForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
            <input
              type="text"
              placeholder="Conducted By"
              value={auditForm.conductedBy}
              onChange={(e) => setAuditForm({ ...auditForm, conductedBy: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleCreateAudit} disabled={createAudit.isPending}
                className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50">
                {createAudit.isPending ? 'Creating…' : 'Create Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyberAuditChecklistPage;
