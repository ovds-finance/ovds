import React, { useState } from 'react';
import {
  useEimsReadiness,
  useEimsBspChecklist,
  useEimsBspReport,
  useEimsChecklist,
  useEimsOnboardingChecklist,
  useEimsDashboard,
  useEimsSourceSystems,
  useEimsEnterprises,
  useEimsEstablishments,
  useUpdateSourceSystemStep,
  useEimsCertificates,
  useEimsRegistrations,
  useEimsBulkJobs,
  useEimsCertificateExpiry,
  useRegisterSourceSystem,
  useGenerateCsr,
  useInstallCertificate,
  useRecordBspResult,
  eimsApi,
} from '@ovds/features/eims';
import toast from 'react-hot-toast';
import { downloadCSV } from '../../utils/download';
import { useBusiness } from '../../context/businessContext';
import { useSetupComplianceSync } from '../../hooks/useSetupComplianceSync';
import {
  Shield, CheckCircle2, Circle, AlertTriangle, Key, Server,
  FileText, RefreshCw, Upload, Plus, Layers, ClipboardList, BookOpen, Download,
  Building2, MapPin, ArrowRight, ChevronRight, ChevronLeft,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'text-emerald-600 bg-emerald-50',
  PENDING: 'text-amber-600 bg-amber-50',
  ISSUED: 'text-emerald-600 bg-emerald-50',
  EXPIRING: 'text-orange-600 bg-orange-50',
  FAILED: 'text-rose-600 bg-rose-50',
  REGISTERED: 'text-emerald-600 bg-emerald-50',
  COMPLETED: 'text-emerald-600 bg-emerald-50',
  EXPIRED: 'text-rose-600 bg-rose-50',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

const EimsSettings: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const { data: readiness, isLoading: loadingReadiness } = useEimsReadiness();
  const { data: dashboard } = useEimsDashboard();
  const { data: bspData } = useEimsBspChecklist();
  const { data: bspReport } = useEimsBspReport();
  const { data: insaData } = useEimsChecklist();
  const { data: onboardingData } = useEimsOnboardingChecklist();
  const { data: sources = [], refetch: refetchSources } = useEimsSourceSystems();
  const { data: expiringCerts = [] } = useEimsCertificateExpiry();
  const registerSource = useRegisterSourceSystem();
  const generateCsr = useGenerateCsr();
  const installCert = useInstallCertificate();
  const recordBsp = useRecordBspResult();

  useSetupComplianceSync(selectedCompanyId, { eimsReady: readiness?.ready === true });

  const [tab, setTab] = useState<'setup' | 'onboarding' | 'insa' | 'bsp' | 'sources' | 'certificates' | 'registrations' | 'bulk'>('setup');
  const [sourceWizardStep, setSourceWizardStep] = useState(0);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState('');
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState('');
  const [sourceForm, setSourceForm] = useState({
    systemNumber: '', systemType: 'ERP' as const,
    clientId: '', clientSecret: '', apiKey: '',
  });
  const [bspRecordForm, setBspRecordForm] = useState<{
    testCaseId: string;
    title: string;
    documentNumber: string;
    irn: string;
    result: 'PASS' | 'FAIL';
    notes: string;
  } | null>(null);
  const [csrForm, setCsrForm] = useState({
    tin: '', systemNumber: '', organizationName: '', email: '',
  });
  const [certPem, setCertPem] = useState('');
  const [selectedCertId, setSelectedCertId] = useState('');

  const { data: enterprises = [] } = useEimsEnterprises();
  const { data: establishments = [] } = useEimsEstablishments(selectedEnterpriseId);
  const updateSourceStep = useUpdateSourceSystemStep();
  const { data: certificates = [], refetch: refetchCerts } = useEimsCertificates();
  const { data: registrations = [] } = useEimsRegistrations();
  const { data: bulkJobs = [] } = useEimsBulkJobs();

  const exportBspReport = () => {
    const rows = (bspReport?.testExecutions ?? bspData?.checklist ?? []) as any[];
    if (!rows.length) {
      toast.error('No BSP test data to export');
      return;
    }
    const header = 'Test ID,Title,Status,Automated,Executions,Evidence IRN\n';
    const body = rows.map((tc) => [
      tc.id,
      `"${String(tc.title ?? '').replace(/"/g, '""')}"`,
      tc.passed || tc.executionCount > 0 ? 'PASS' : tc.automated ? 'PENDING' : 'MANUAL',
      tc.automated ? 'Yes' : 'No',
      tc.executionCount ?? 0,
      tc.evidence?.[0]?.irn ?? '',
    ].join(',')).join('\n');
    downloadCSV(header + body, `eims_bsp_report_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('BSP report exported');
  };

  const exportBspReportPdf = () => {
    const rows = (bspReport?.testExecutions ?? bspData?.checklist ?? []) as any[];
    if (!rows.length) {
      toast.error('No BSP test data to export');
      return;
    }
    const summary = bspReport?.summary;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>MoR BSP Test Report</title>
<style>
  body{font-family:system-ui,sans-serif;margin:32px;color:#0f172a}
  h1{margin:0 0 4px;font-size:20px}
  .meta{color:#64748b;font-size:12px;margin-bottom:20px}
  .summary{display:flex;gap:16px;margin-bottom:24px}
  .card{flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}
  .card strong{font-size:22px;display:block}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;vertical-align:top}
  th{background:#f8fafc}
  .pass{color:#047857;font-weight:600}
  .fail{color:#b91c1c;font-weight:600}
  .pending{color:#b45309}
</style></head><body>
<h1>MoR BSP Test Execution Report</h1>
<p class="meta">Generated ${new Date().toLocaleString()} · OVDS EIMS Compliance</p>
<div class="summary">
  <div class="card"><strong>${summary?.passed ?? rows.filter((r: any) => r.passed).length}</strong>Passed</div>
  <div class="card"><strong>${summary?.pending ?? rows.filter((r: any) => !r.passed).length}</strong>Pending</div>
  <div class="card"><strong>${summary?.readinessScore ?? 0}%</strong>Readiness</div>
</div>
<table><thead><tr><th>Test ID</th><th>Title</th><th>Status</th><th>Executions</th><th>Evidence</th></tr></thead>
<tbody>${rows.map((tc: any) => `<tr>
  <td>${tc.id}</td>
  <td><strong>${tc.title ?? ''}</strong><br/><span style="color:#64748b">${tc.description ?? ''}</span></td>
  <td class="${tc.passed ? 'pass' : tc.automated === false ? 'pending' : 'fail'}">${tc.passed ? 'PASS' : tc.automated === false ? 'Manual' : 'Pending'}</td>
  <td>${tc.executionCount ?? 0}</td>
  <td style="font-family:monospace;font-size:10px">${(tc.evidence ?? []).map((e: any) => e.irn ?? e.documentNumber ?? e.receiptIrn ?? '').filter(Boolean).join('<br/>') || '—'}</td>
</tr>`).join('')}</tbody></table>
<script>window.onload=()=>window.print()</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast.error('Pop-up blocked — allow pop-ups to export PDF'); return; }
    w.document.write(html);
    w.document.close();
  };

  const handleRecordBsp = async () => {
    if (!bspRecordForm) return;
    try {
      await recordBsp.mutateAsync({
        testCaseId: bspRecordForm.testCaseId,
        documentNumber: bspRecordForm.documentNumber || undefined,
        irn: bspRecordForm.irn || undefined,
        result: bspRecordForm.result,
        notes: bspRecordForm.notes || undefined,
      });
      toast.success(`BSP result recorded for ${bspRecordForm.testCaseId}`);
      setBspRecordForm(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to record BSP result');
    }
  };

  const handleGenerateCsr = async () => {
    try {
      const result = await generateCsr.mutateAsync(csrForm);
      toast.success(`CSR generated — ID: ${result.certificateId}`);
      setSelectedCertId(result.certificateId);
      refetchCerts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleInstallCert = async () => {
    if (!selectedCertId || !certPem.trim()) {
      toast.error('Select a certificate and paste the PEM content');
      return;
    }
    try {
      await installCert.mutateAsync({ id: selectedCertId, certificatePem: certPem });
      toast.success('INSA certificate installed');
      setCertPem('');
      refetchCerts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleApproveSource = async (id: string) => {
    try {
      await eimsApi.sourceSystems.approve(id);
      toast.success('Source marked as MoR-approved');
      refetchSources();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">EIMS Integration</h1>
          <p className="text-sm text-slate-500">MoR Electronic Invoice Management System — INSA compliance</p>
        </div>
      </div>

      {expiringCerts.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Certificate renewal required</p>
            <p className="text-xs mt-1">
              {expiringCerts.length} INSA certificate(s) expiring within 30 days.
              Renew via INSA (ica@insa.gov.et) to avoid EIMS registration failures.
            </p>
          </div>
        </div>
      )}

      {dashboard?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Registered', value: dashboard.summary.registered, color: 'text-emerald-600' },
            { label: 'Pending', value: dashboard.summary.pending, color: 'text-amber-600' },
            { label: 'Failed', value: dashboard.summary.failed, color: 'text-rose-600' },
            { label: 'Receipts', value: dashboard.summary.receipts, color: 'text-teal-600' },
          ].map((s) => (
            <div key={s.label} className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {(['setup', 'onboarding', 'insa', 'bsp', 'sources', 'certificates', 'registrations', 'bulk'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'text-teal-600 border-b-2 border-teal-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Setup / Readiness */}
      {tab === 'setup' && (
        <div className="space-y-4">
          {loadingReadiness ? (
            <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />
          ) : readiness && (
            <>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium">Integration Readiness</p>
                  <p className="text-xs text-slate-500">{readiness.progress}% complete</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${readiness.ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {readiness.ready ? 'Ready' : 'Not Ready'}
                </div>
              </div>
              <div className="space-y-2">
                {readiness.steps?.map((step: any) => (
                  <div key={step.step} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    {step.complete
                      ? <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                      : <Circle size={18} className="text-slate-300 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {dashboard && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  {[
                    { label: 'Sandbox Mode', on: dashboard.sandbox, hint: 'EIMS_SANDBOX' },
                    { label: 'Auto-Register', on: dashboard.autoRegister, hint: 'EIMS_AUTO_REGISTER' },
                    { label: 'Auto-Receipt', on: dashboard.autoReceipt, hint: 'EIMS_AUTO_RECEIPT' },
                    { label: 'Verify MoR Responses', on: dashboard.verifyResponses, hint: 'EIMS_VERIFY_RESPONSES' },
                    { label: 'Payload Encryption', on: dashboard.payloadEncryption, hint: 'EIMS_PAYLOAD_ENCRYPTION' },
                  ].map((flag) => (
                    <div key={flag.label} className={`p-2.5 rounded-lg border text-center ${flag.on ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="text-[10px] font-semibold">{flag.label}</p>
                      <p className={`text-xs font-bold mt-0.5 ${flag.on ? 'text-emerald-600' : 'text-slate-400'}`}>{flag.on ? 'ON' : 'OFF'}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{flag.hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MoR Onboarding Checklist */}
      {tab === 'onboarding' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><BookOpen size={16} /> MoR Self-Onboarding</h2>
          {onboardingData?.steps?.map((step: any) => (
            <div key={step.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{step.title}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{step.phase}</span>
              </div>
              <p className="text-xs text-slate-500">{step.description}</p>
              <p className="text-[10px] text-teal-600">{step.ovdsSupport}</p>
              {step.templateFile && (
                <p className="text-[10px] text-slate-400">Template: ovds insa/{step.templateFile}</p>
              )}
              {step.externalUrl && (
                <a href={step.externalUrl} target="_blank" rel="noreferrer"
                  className="text-[10px] text-teal-600 hover:underline">{step.externalUrl}</a>
              )}
            </div>
          ))}
          {onboardingData?.csrRequirements && (
            <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-semibold">INSA CSR Requirements (certificate_guideline.pdf)</p>
              <p>Algorithm: {onboardingData.csrRequirements.keyAlgorithm} {onboardingData.csrRequirements.keySize}-bit · {onboardingData.csrRequirements.signatureAlgorithm}</p>
              <p className="font-mono text-[10px]">{onboardingData.csrRequirements.opensslCommand}</p>
            </div>
          )}
        </div>
      )}

      {/* INSA Cybersecurity Checklist */}
      {tab === 'insa' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Shield size={16} /> INSA Cybersecurity Audit</h2>
            {insaData?.summary && (
              <span className="text-xs font-semibold text-emerald-600">{insaData.summary.score}% compliant</span>
            )}
          </div>
          {insaData?.checklist?.map((item: any) => (
            <div key={item.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border flex items-start gap-3">
              {item.implemented
                ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                : <Circle size={16} className="text-slate-300 shrink-0 mt-0.5" />}
              <div>
                <p className="text-xs font-mono text-slate-400">{item.id} · {item.area}</p>
                <p className="text-sm font-medium">{item.metric}</p>
                <p className="text-xs text-slate-500">{item.requirement}</p>
                {item.evidence && (
                  <p className="text-[10px] text-teal-600 mt-1">{item.evidence}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MoR BSP Test Cases */}
      {tab === 'bsp' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><ClipboardList size={16} /> MoR BSP Test Cases</h2>
            <div className="flex items-center gap-2">
              {bspReport?.summary && (
                <span className="text-xs font-semibold text-teal-600">
                  {bspReport.summary.passed}/{bspReport.summary.totalTests} passed ({bspReport.summary.readinessScore}%)
                </span>
              )}
              <button
                type="button"
                onClick={exportBspReportPdf}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium border rounded-lg hover:bg-slate-50"
              >
                <FileText size={12} /> Export PDF
              </button>
              <button
                type="button"
                onClick={exportBspReport}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium border rounded-lg hover:bg-slate-50"
              >
                <Download size={12} /> Export CSV
              </button>
            </div>
          </div>
          {(bspReport?.testExecutions ?? bspData?.checklist ?? []).map((tc: any) => (
            <div key={tc.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-mono text-teal-600">{tc.id}</p>
                  <p className="text-sm font-medium">{tc.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{tc.description}</p>
                  {tc.executionCount !== undefined && (
                    <p className="text-[10px] mt-1">
                      Executions: {tc.executionCount}
                      {tc.passed && tc.evidence?.[0]?.irn && (
                        <span className="font-mono text-slate-400 ml-2">IRN: {String(tc.evidence[0].irn).slice(0, 20)}…</span>
                      )}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                  tc.passed ? 'bg-emerald-50 text-emerald-700'
                  : tc.automated === false ? 'bg-amber-50 text-amber-700'
                  : tc.executionCount > 0 ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {tc.passed || tc.executionCount > 0 ? 'PASS' : tc.automated ? 'Pending' : 'Manual'}
                </span>
              </div>
              {(tc.automated === false || !tc.passed) && (
                <button
                  type="button"
                  onClick={() => setBspRecordForm({
                    testCaseId: tc.id,
                    title: tc.title ?? tc.id,
                    documentNumber: '',
                    irn: '',
                    result: 'PASS',
                    notes: '',
                  })}
                  className="mt-3 text-[10px] px-2 py-1 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  Record sandbox result
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Source Systems */}
      {tab === 'sources' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Server size={16} /> Source Systems</h2>
            {sourceWizardStep === 0 && sources.length === 0 && (
              <button
                onClick={() => setSourceWizardStep(1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus size={14} /> Start Source Registration
              </button>
            )}
          </div>

          {sourceWizardStep > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {['Enterprise', 'Establishment', 'Source Details', 'Approval'].map((label, i) => (
                  <React.Fragment key={label}>
                    <span className={`px-2 py-1 rounded-lg ${i < sourceWizardStep ? 'bg-emerald-100 text-emerald-700' : i === sourceWizardStep ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}. {label}
                    </span>
                    {i < 3 && <ArrowRight size={12} className="text-slate-300" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Choose Enterprise */}
              {sourceWizardStep === 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Step 1: Go to the source management section and choose enterprise.</p>
                  <div className="grid grid-cols-1 gap-2">
                    {enterprises.map((ent: any) => (
                      <button
                        key={ent.id}
                        onClick={() => { setSelectedEnterpriseId(ent.id); setSourceWizardStep(2); }}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-left hover:border-teal-300 transition-colors"
                      >
                        <p className="text-sm font-medium">{ent.name}</p>
                        <p className="text-xs text-slate-500">TIN: {ent.tin}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Choose Establishment */}
              {sourceWizardStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Step 2: Then choose establishment from establishments list.</p>
                  <div className="grid grid-cols-1 gap-2">
                    {establishments.map((est: any) => (
                      <button
                        key={est.id}
                        onClick={() => { setSelectedEstablishmentId(est.id); setSourceWizardStep(3); }}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-left hover:border-teal-300 transition-colors"
                      >
                        <p className="text-sm font-medium">{est.name}</p>
                        <p className="text-xs text-slate-500">{est.address}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSourceWizardStep(1)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    <ChevronLeft size={12} /> Back to enterprise selection
                  </button>
                </div>
              )}

              {/* Step 3: Source Details */}
              {sourceWizardStep === 3 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Step 3: Click the add source button and select source system numbers from the drop-down and click search.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="System Number (from MoR portal)" value={sourceForm.systemNumber}
                      onChange={(e) => setSourceForm({ ...sourceForm, systemNumber: e.target.value })}
                      className="px-3 py-2 text-sm border rounded-lg" />
                    <select value={sourceForm.systemType}
                      onChange={(e) => setSourceForm({ ...sourceForm, systemType: e.target.value as any })}
                      className="px-3 py-2 text-sm border rounded-lg">
                      <option value="ERP">ERP</option>
                      <option value="POS">POS</option>
                      <option value="MANUAL">MANUAL</option>
                    </select>
                    <input placeholder="Client ID" value={sourceForm.clientId}
                      onChange={(e) => setSourceForm({ ...sourceForm, clientId: e.target.value })}
                      className="px-3 py-2 text-sm border rounded-lg" />
                    <input placeholder="Client Secret" type="password" value={sourceForm.clientSecret}
                      onChange={(e) => setSourceForm({ ...sourceForm, clientSecret: e.target.value })}
                      className="px-3 py-2 text-sm border rounded-lg" />
                    <input placeholder="API Key" value={sourceForm.apiKey}
                      onChange={(e) => setSourceForm({ ...sourceForm, apiKey: e.target.value })}
                      className="px-3 py-2 text-sm border rounded-lg col-span-2" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSourceWizardStep(2)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 flex items-center gap-1">
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button onClick={async () => {
                      if (!sourceForm.systemNumber) { toast.error('System number is required'); return; }
                      await registerSource.mutateAsync({
                        systemNumber: sourceForm.systemNumber,
                        systemType: sourceForm.systemType,
                        enterpriseId: selectedEnterpriseId,
                        establishmentId: selectedEstablishmentId,
                        clientId: sourceForm.clientId,
                        clientSecret: sourceForm.clientSecret,
                        apiKey: sourceForm.apiKey,
                      });
                      setSourceWizardStep(4);
                      refetchSources();
                    }} disabled={registerSource.isPending}
                      className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                      {registerSource.isPending ? 'Registering…' : 'Register Source'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Approval */}
              {sourceWizardStep === 4 && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Pending MoR Officer Approval</p>
                      <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                        The source system will show the status as pending and will go to back office for approval which will then be approved by MoR officer.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setSourceWizardStep(0); setSourceForm({ systemNumber: '', systemType: 'ERP', clientId: '', clientSecret: '', apiKey: '' }); setSelectedEnterpriseId(''); setSelectedEstablishmentId(''); }} className="text-xs text-slate-500 hover:text-slate-700">
                    Register another source
                  </button>
                </div>
              )}
            </div>
          )}

          {sources.length === 0 && sourceWizardStep === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No source systems registered yet. Click "Start Source Registration" to begin the 4-step process.</p>
          ) : sources.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border">
              <div>
                <p className="font-medium text-sm">{s.systemNumber}</p>
                <p className="text-xs text-slate-500">{s.systemType} · {s.enterpriseId ? `Enterprise: ${s.enterpriseId}` : ''} {s.establishmentId ? `· Est: ${s.establishmentId}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={s.status} />
                {s.status === 'PENDING' && (
                  <button onClick={() => handleApproveSource(s.id)}
                    className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100">
                    Mark Approved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificates */}
      {tab === 'certificates' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Key size={16} /> INSA Digital Certificates</h2>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">Generate CSR (Step 1)</p>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="TIN" value={csrForm.tin}
                onChange={(e) => setCsrForm({ ...csrForm, tin: e.target.value })}
                className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="System Number" value={csrForm.systemNumber}
                onChange={(e) => setCsrForm({ ...csrForm, systemNumber: e.target.value })}
                className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Organization Name" value={csrForm.organizationName}
                onChange={(e) => setCsrForm({ ...csrForm, organizationName: e.target.value })}
                className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Email" value={csrForm.email}
                onChange={(e) => setCsrForm({ ...csrForm, email: e.target.value })}
                className="px-3 py-2 text-sm border rounded-lg" />
            </div>
            <button onClick={handleGenerateCsr} disabled={generateCsr.isPending}
              className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
              Generate Key Pair & CSR Config
            </button>
            <p className="text-[10px] text-slate-400">Submit CSR to INSA: ica@insa.gov.et</p>
          </div>

          {selectedCertId && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">Install Certificate (Step 2)</p>
              <textarea
                placeholder="Paste INSA-issued certificate PEM here…"
                value={certPem}
                onChange={(e) => setCertPem(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-xs font-mono border rounded-lg"
              />
              <button onClick={handleInstallCert} disabled={installCert.isPending}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                <Upload size={14} /> Install Certificate
              </button>
            </div>
          )}

          {certificates.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border">
              <div>
                <p className="text-sm font-medium">TIN: {c.subjectTin ?? '—'}</p>
                <p className="text-xs text-slate-500">
                  System: {c.serialNumber ?? '—'}
                  {c.expiresAt && ` · Expires: ${new Date(c.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <Badge status={c.status} />
            </div>
          ))}
        </div>
      )}

      {/* Registrations */}
      {tab === 'registrations' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><FileText size={16} /> Invoice Registrations</h2>
          {registrations.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No EIMS registrations yet.</p>
          ) : registrations.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border">
              <div>
                <p className="text-sm font-medium font-mono">{r.irn ? r.irn.slice(0, 16) + '…' : 'Pending'}</p>
                <p className="text-xs text-slate-500">
                  Doc: {r.documentNumber ?? '—'} · {r.submissionMode} · {r.attemptCount} attempt(s)
                </p>
                {r.errorMessage && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> {r.errorMessage}
                  </p>
                )}
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
      )}

      {/* Bulk Jobs */}
      {tab === 'bulk' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Layers size={16} /> Bulk Jobs</h2>
          {bulkJobs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No bulk EIMS jobs yet.</p>
          ) : bulkJobs.map((job: any) => (
            <div key={job.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border">
              <div>
                <p className="text-sm font-medium">{job.jobType?.replace('_', ' ') ?? 'Bulk Job'}</p>
                <p className="text-xs text-slate-500">
                  {job.requestCount} invoice(s) · {job.successCount ?? 0} ok · {job.failureCount ?? 0} failed
                  {job.conversationId && ` · ${job.conversationId.slice(0, 12)}…`}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(job.createdAt).toLocaleString('en-ET')}
                  {job.completedAt && ` → ${new Date(job.completedAt).toLocaleString('en-ET')}`}
                </p>
              </div>
              <Badge status={job.status} />
            </div>
          ))}
        </div>
      )}

      {/* BSP manual result modal */}
      {bspRecordForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border shadow-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold">Record BSP Test Result</h3>
            <p className="text-xs text-slate-500">{bspRecordForm.testCaseId} — {bspRecordForm.title}</p>
            <input placeholder="Document number (optional)" value={bspRecordForm.documentNumber}
              onChange={(e) => setBspRecordForm({ ...bspRecordForm, documentNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg" />
            <input placeholder="IRN (optional)" value={bspRecordForm.irn}
              onChange={(e) => setBspRecordForm({ ...bspRecordForm, irn: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg font-mono" />
            <select value={bspRecordForm.result}
              onChange={(e) => setBspRecordForm({ ...bspRecordForm, result: e.target.value as 'PASS' | 'FAIL' })}
              className="w-full px-3 py-2 text-sm border rounded-lg">
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
            <textarea placeholder="Notes (optional)" value={bspRecordForm.notes}
              onChange={(e) => setBspRecordForm({ ...bspRecordForm, notes: e.target.value })}
              rows={3} className="w-full px-3 py-2 text-sm border rounded-lg" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setBspRecordForm(null)}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleRecordBsp} disabled={recordBsp.isPending}
                className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {recordBsp.isPending ? 'Saving…' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EimsSettings;
