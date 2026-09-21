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
  useEimsCertificates,
  useEimsRegistrations,
  useEimsBulkJobs,
  useEimsCertificateExpiry,
  useRegisterSourceSystem,
  useGenerateCsr,
  useInstallCertificate,
  useRecordBspResult,
  useEimsInvoiceRetry,
  useEimsBulkRegister,
  // Cyber Audit
  useCyberAuditList,
  useCreateCyberAudit,
  useDeleteCyberAudit,
  useStartCyberAudit,
  useCompleteCyberAudit,
  useCyberAuditMetrics,
  useUpdateCyberAuditMetric,
  useCyberAuditFindings,
  useCreateCyberAuditFinding,
  useDeleteCyberAuditFinding,
  // Master Compliance
  useMasterComplianceList,
  useMasterComplianceItems,
  useCreateMasterCompliance,
  useDeleteMasterCompliance,
  useUpdateMasterComplianceItem,
  useMasterComplianceSummary,
  // Accreditation
  useAccreditationList,
  useAccreditationItems,
  useCreateAccreditation,
  useDeleteAccreditation,
  useUpdateAccreditationItem,
  useAccreditationSummary,
  eimsApi,
} from '@ovds/features/eims';
import {
  Shield, CheckCircle2, Circle, AlertTriangle, Key, Server,
  FileText, RefreshCw, Upload, Plus, Layers, ClipboardList, BookOpen, Download,
  ArrowRight, ChevronLeft,
  Bug, Trash2, Play, CheckSquare, BarChart2, ClipboardCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';
import { useSetupComplianceSync } from '../../hooks/useSetupComplianceSync';
import { downloadCSV } from '../../utils/download';


const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  PENDING: 'text-amber-600 bg-amber-50',
  ISSUED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  EXPIRING: 'text-orange-600 bg-orange-50',
  FAILED: 'text-rose-600 bg-rose-50',
  REGISTERED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  COMPLETED: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)]',
  EXPIRED: 'text-rose-600 bg-rose-50',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

// ── OpenSSL CNF builder ───────────────────────────────────────────────────────
// Produces an openssl.cnf string that satisfies the INSA certificate_guideline:
//   RSA 2048-bit, SHA-256, req_ext with subjectAltName email SAN.
// Operators copy-paste this file when running:
//   openssl req -new -newkey rsa:2048 -nodes -keyout privkey.pem \
//               -out csr.pem -config openssl.cnf
function buildOpensslCnf(f: {
  countryName: string; stateOrProvinceName: string; localityName: string;
  organizationName: string; organizationalUnitName: string;
  systemNumber: string; tin: string; email: string;
}): string {
  return `[ req ]
default_bits        = 2048
prompt              = no
string_mask         = utf8only
default_md          = sha256
distinguished_name  = req_distinguished_name
req_extensions      = req_ext

[ req_distinguished_name ]
countryName                     = ${f.countryName || 'ET'}
stateOrProvinceName             = ${f.stateOrProvinceName || 'Addis Ababa'}
localityName                    = ${f.localityName || 'Addis Ababa'}
organizationName                = ${f.organizationName || 'Your Company'}
organizationalUnitName          = ${f.organizationalUnitName || f.organizationName || 'Your Company Main Enterprise'}
serialNumber                    = ${f.systemNumber || 'SYSTEM-SERIAL'}
commonName                      = ${f.tin || '0000000000'}

[ req_ext ]
subjectAltName         = @sans

[ sans ]
email.1 = ${f.email || 'taxpayer@example.com'}`.trimStart();
}

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
  const retryRegistration = useEimsInvoiceRetry();
  const bulkRegister = useEimsBulkRegister();

  useSetupComplianceSync(selectedCompanyId, { eimsReady: readiness?.ready === true });

  const [tab, setTab] = useState<'setup' | 'onboarding' | 'insa' | 'bsp' | 'sources' | 'certificates' | 'registrations' | 'bulk' | 'cyber-audit' | 'compliance' | 'accreditation'>('setup');
  /** Tracks which onboarding step IDs the operator has locally ticked off */
  const [onboardingDone, setOnboardingDone] = useState<Set<string>>(new Set());
  const toggleOnboardingStep = (id: string) =>
    setOnboardingDone(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
    // Core fields sent to the OVDS backend → INSA CSR generation API
    tin:                    '',   // commonName (CN) — 10-digit TIN
    systemNumber:           '',   // serialNumber — device/system serial from MoR EIMS portal
    organizationName:       '',   // O — legal company name as registered with ERCA
    organizationalUnitName: '',   // OU — department / unit (e.g. "Finance Department")
    email:                  '',   // subjectAltName email.1
    // Distinguished Name fields required by INSA certificate_guideline
    countryName:            'ET',
    stateOrProvinceName:    'Addis Ababa',
    localityName:           'Addis Ababa',
  });
  const [certPem, setCertPem] = useState('');
  const [selectedCertId, setSelectedCertId] = useState('');
  /** Stores the authoritative openssl.cnf returned by the backend after CSR generation */
  const [generatedCnf, setGeneratedCnf] = useState<string | null>(null);
  const [generatedCsrPem, setGeneratedCsrPem] = useState<string | null>(null);
  /** Comma/newline-separated invoice IDs for the bulk registration trigger */
  const [bulkInvoiceIds, setBulkInvoiceIds] = useState('');
  /** Filter for the registrations tab: 'all' | 'failed' | 'registered' */
  const [regFilter, setRegFilter] = useState<'all' | 'failed' | 'registered'>('all');

  const { data: enterprises = [] } = useEimsEnterprises();
  const { data: establishments = [] } = useEimsEstablishments(selectedEnterpriseId);
  const { data: certificates = [], refetch: refetchCerts } = useEimsCertificates();
  const { data: registrations = [] } = useEimsRegistrations();
  const { data: bulkJobs = [] } = useEimsBulkJobs();

  // ── Cyber Audit ──────────────────────────────────────────────────────────────
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [newAuditTitle, setNewAuditTitle] = useState('');
  const [findingSeverity, setFindingSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [findingTitle, setFindingTitle] = useState('');
  const [findingDesc, setFindingDesc] = useState('');
  const { data: cyberAudits = [], refetch: refetchAudits } = useCyberAuditList();
  const { data: auditMetrics = [] } = useCyberAuditMetrics(selectedAuditId ?? undefined);
  const { data: auditFindings = [] } = useCyberAuditFindings({ auditId: selectedAuditId ?? undefined });
  const createAudit = useCreateCyberAudit();
  const deleteAudit = useDeleteCyberAudit();
  const startAudit = useStartCyberAudit();
  const completeAudit = useCompleteCyberAudit();
  const updateMetric = useUpdateCyberAuditMetric();
  const createFinding = useCreateCyberAuditFinding();
  const deleteFinding = useDeleteCyberAuditFinding();

  // ── Master Compliance ────────────────────────────────────────────────────────
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const { data: complianceSummary } = useMasterComplianceSummary();
  const { data: masterChecklists = [], refetch: refetchChecklists } = useMasterComplianceList();
  const { data: checklistItems = [] } = useMasterComplianceItems(selectedChecklistId ?? undefined);
  const createChecklist = useCreateMasterCompliance();
  const deleteChecklist = useDeleteMasterCompliance();
  const updateChecklistItem = useUpdateMasterComplianceItem();

  // ── Accreditation ────────────────────────────────────────────────────────────
  const [selectedAccreditationId, setSelectedAccreditationId] = useState<string | null>(null);
  const [newAccreditationTitle, setNewAccreditationTitle] = useState('');
  const { data: accreditationSummary } = useAccreditationSummary();
  const { data: accreditations = [], refetch: refetchAccreditations } = useAccreditationList();
  const { data: accreditationItems = [] } = useAccreditationItems(selectedAccreditationId ?? undefined);
  const createAccreditation = useCreateAccreditation();
  const deleteAccreditationMutation = useDeleteAccreditation();
  const updateAccreditationItem = useUpdateAccreditationItem();

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
      const result = await generateCsr.mutateAsync({
        // Core identity fields
        tin:                    csrForm.tin,
        systemNumber:           csrForm.systemNumber,
        organizationName:       csrForm.organizationName,
        organizationalUnitName: csrForm.organizationalUnitName || csrForm.organizationName,
        email:                  csrForm.email,
        // Extended DN fields — override backend env-var defaults
        countryName:            csrForm.countryName,
        stateOrProvinceName:    csrForm.stateOrProvinceName,
        localityName:           csrForm.localityName,
      });
      toast.success(`CSR generated — ID: ${result.certificateId}`);
      setSelectedCertId(result.certificateId);
      // Store the authoritative backend-generated artifacts for display
      if (result.cnfContent) setGeneratedCnf(result.cnfContent);
      if (result.csrPem)     setGeneratedCsrPem(result.csrPem);
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
            { label: 'Registered', value: dashboard.summary.registered, color: 'text-[var(--pro-azure)]' },
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
        {(['setup', 'onboarding', 'insa', 'bsp', 'sources', 'certificates', 'registrations', 'bulk', 'cyber-audit', 'compliance', 'accreditation'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t
                ? 'text-teal-600 border-b-2 border-teal-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {{ 'setup': 'Setup', 'onboarding': 'Onboarding', 'insa': 'INSA', 'bsp': 'BSP', 'sources': 'Sources', 'certificates': 'Certificates', 'registrations': 'Registrations', 'bulk': 'Bulk', 'cyber-audit': 'Cyber Audit', 'compliance': 'Compliance', 'accreditation': 'Accreditation' }[t] ?? t.charAt(0).toUpperCase() + t.slice(1)}
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
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${readiness.ready ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-amber-100 text-amber-700'}`}>
                  {readiness.ready ? 'Ready' : 'Not Ready'}
                </div>
              </div>
              <div className="space-y-2">
                {readiness.steps?.map((step: any) => (
                  <div key={step.step} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    {step.complete
                      ? <CheckCircle2 size={18} className="text-[var(--pro-azure)] mt-0.5 shrink-0" />
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
                    <div key={flag.label} className={`p-2.5 rounded-lg border text-center ${flag.on ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]' : 'bg-slate-50 border-slate-200'}`}>
                      <p className="text-[10px] font-semibold">{flag.label}</p>
                      <p className={`text-xs font-bold mt-0.5 ${flag.on ? 'text-[var(--pro-azure)]' : 'text-slate-400'}`}>{flag.on ? 'ON' : 'OFF'}</p>
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
          {/* Header + progress */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen size={16} /> MoR Self-Onboarding
            </h2>
            {onboardingData?.steps && onboardingData.steps.length > 0 && (
              <span className="text-[10px] font-bold text-teal-600">
                {onboardingDone.size}/{onboardingData.steps.length} steps completed
              </span>
            )}
          </div>

          {/* Progress bar */}
          {onboardingData?.steps && onboardingData.steps.length > 0 && (
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-500 bg-teal-500"
                style={{ width: `${Math.round((onboardingDone.size / onboardingData.steps.length) * 100)}%` }}
              />
            </div>
          )}

          {/* Steps */}
          {onboardingData?.steps?.map((step: any, idx: number) => {
            const done = onboardingDone.has(step.id);
            // A step is "action-required" when it involves CSR/certificates and no certs exist
            const isCsrStep = /csr|certificate|insa|key/i.test(step.title + ' ' + step.description);
            const needsAction = isCsrStep && ([] as any[]).length === 0 && !done;
            return (
              <div
                key={step.id}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  done
                    ? 'border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20'
                    : needsAction
                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Step header row — clickable to toggle */}
                <button
                  type="button"
                  onClick={() => toggleOnboardingStep(step.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left"
                >
                  {/* Step number / check */}
                  <div
                    className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                      done
                        ? 'bg-teal-500 text-white'
                        : needsAction
                        ? 'bg-amber-400 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {done ? <CheckCircle2 size={13} /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {step.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {step.phase && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wide font-bold">
                            {step.phase}
                          </span>
                        )}
                        {needsAction && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold uppercase tracking-wide">
                            Action Required
                          </span>
                        )}
                        {done && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 font-bold uppercase tracking-wide">
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                    {step.description && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
                    )}
                  </div>
                </button>

                {/* Step details — always visible */}
                <div className="px-4 pb-3 pl-13 space-y-1.5" style={{ paddingLeft: '3.25rem' }}>
                  {step.ovdsSupport && (
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <Shield size={9} className="shrink-0" /> {step.ovdsSupport}
                    </p>
                  )}
                  {step.templateFile && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      Template: <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded">ovds insa/{step.templateFile}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {step.externalUrl && (
                      <a
                        href={step.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-teal-600 hover:underline flex items-center gap-1"
                      >
                        <ArrowRight size={9} /> {step.externalUrl}
                      </a>
                    )}
                    {/* For CSR/certificate steps: shortcut to the certificates tab */}
                    {isCsrStep && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setTab('certificates'); }}
                        className="text-[10px] font-semibold text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 hover:bg-teal-200 dark:hover:bg-teal-900/60 transition-colors flex items-center gap-1"
                      >
                        <Key size={9} /> Go to Certificates →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {!onboardingData?.steps?.length && (
            <p className="text-sm text-slate-500 text-center py-8">
              Onboarding checklist not available — ensure the EIMS service is reachable.
            </p>
          )}

          {/* CSR Requirements panel */}
          {onboardingData?.csrRequirements && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Key size={12} /> INSA CSR Requirements
                  <span className="text-[9px] font-medium text-slate-400 ml-1">(certificate_guideline.pdf)</span>
                </p>
                <button
                  type="button"
                  onClick={() => setTab('certificates')}
                  className="text-[10px] font-semibold text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 hover:bg-teal-200 dark:hover:bg-teal-900/60 transition-colors flex items-center gap-1"
                >
                  <Key size={9} /> Generate CSR →
                </button>
              </div>
              <div className="px-4 py-3 space-y-2 text-xs">
                <div className="flex flex-wrap gap-3">
                  <span className="text-slate-500">
                    Algorithm: <strong className="text-slate-700 dark:text-slate-200">
                      {onboardingData.csrRequirements.keyAlgorithm} {onboardingData.csrRequirements.keySize}-bit
                    </strong>
                  </span>
                  <span className="text-slate-500">
                    Signature: <strong className="text-slate-700 dark:text-slate-200">
                      {onboardingData.csrRequirements.signatureAlgorithm}
                    </strong>
                  </span>
                </div>
                {onboardingData.csrRequirements.opensslCommand && (
                  <pre className="px-3 py-2 text-[10px] font-mono bg-slate-900 text-emerald-300 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {onboardingData.csrRequirements.opensslCommand}
                  </pre>
                )}
              </div>
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
              <span className="text-xs font-semibold text-[var(--pro-azure)]">{insaData.summary.score}% compliant</span>
            )}
          </div>
          {insaData?.checklist?.map((item: any) => (
            <div key={item.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border flex items-start gap-3">
              {item.implemented
                ? <CheckCircle2 size={16} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
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
                  tc.passed ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]'
                  : tc.automated === false ? 'bg-amber-50 text-amber-700'
                  : tc.executionCount > 0 ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]'
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
            {sourceWizardStep === 0 && (
              <button
                onClick={() => setSourceWizardStep(1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus size={14} /> {sources.length === 0 ? 'Start Source Registration' : 'Add Another Source'}
              </button>
            )}
          </div>

          {sourceWizardStep > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {['Enterprise', 'Establishment', 'Source Details', 'Approval'].map((label, i) => (
                  <React.Fragment key={label}>
                    <span className={`px-2 py-1 rounded-lg ${i < sourceWizardStep ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : i === sourceWizardStep ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
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
            <p className="text-sm text-slate-500 text-center py-8">No source systems registered yet. Click "Start Source Registration" to begin the 4-step MoR approval process.</p>
          ) : sources.length > 0 && sourceWizardStep === 0 ? (
            <div className="space-y-2">
              {sources.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border">
                  <div>
                    <p className="font-medium text-sm">{s.systemNumber}</p>
                    <p className="text-xs text-slate-500">{s.systemType}{s.enterpriseId ? ` · Enterprise: ${s.enterpriseId}` : ''}{s.establishmentId ? ` · Est: ${s.establishmentId}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={s.status} />
                    {s.status === 'PENDING' && (
                      <button onClick={() => handleApproveSource(s.id)}
                        className="text-xs px-2 py-1 bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] rounded-lg hover:bg-[var(--pro-azure-100)]">
                        Mark Approved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Certificates */}
      {tab === 'certificates' && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Key size={16} /> INSA Digital Certificates</h2>

          {/* ── Step 1: Generate CSR ───────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-800">
              <Key size={13} className="text-teal-600 shrink-0" />
              <p className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                Step 1 — Generate CSR
              </p>
              <span className="ml-auto text-[10px] text-teal-500">
                RSA 2048-bit · SHA-256 · INSA certificate_guideline
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>
                  Fill all fields exactly as they appear in your MoR EIMS registration. The generated
                  <code className="mx-1 px-1 bg-amber-100 dark:bg-amber-900/40 rounded font-mono text-[10px]">openssl.cnf</code>
                  must be submitted to INSA at <strong>ica@insa.gov.et</strong> to obtain your signing certificate.
                </span>
              </div>

              {/* Distinguished Name fields */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Distinguished Name (DN)</p>
                <div className="grid grid-cols-2 gap-3">

                  {/* Country — locked to ET */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Country <code className="ml-1 text-[9px] text-slate-400">C</code>
                    </label>
                    <input
                      value={csrForm.countryName}
                      readOnly
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed font-mono"
                      title="ISO 3166-1 alpha-2 — fixed to ET (Ethiopia)"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      State / Province <code className="ml-1 text-[9px] text-slate-400">ST</code>
                    </label>
                    <input
                      placeholder="e.g. Addis Ababa"
                      value={csrForm.stateOrProvinceName}
                      onChange={e => setCsrForm({ ...csrForm, stateOrProvinceName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900"
                    />
                  </div>

                  {/* Locality */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      City / Locality <code className="ml-1 text-[9px] text-slate-400">L</code>
                    </label>
                    <input
                      placeholder="e.g. Addis Ababa"
                      value={csrForm.localityName}
                      onChange={e => setCsrForm({ ...csrForm, localityName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900"
                    />
                  </div>

                  {/* Organization Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Organization Name <code className="ml-1 text-[9px] text-slate-400">O</code>
                    </label>
                    <input
                      placeholder="e.g. Test Company"
                      value={csrForm.organizationName}
                      onChange={e => setCsrForm({ ...csrForm, organizationName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900"
                    />
                    <p className="text-[9px] text-slate-400">Legal name as registered with ERCA</p>
                  </div>

                  {/* Organizational Unit */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Organizational Unit <code className="ml-1 text-[9px] text-slate-400">OU</code>
                    </label>
                    <input
                      placeholder="e.g. Test Company Main Enterprise"
                      value={csrForm.organizationalUnitName}
                      onChange={e => setCsrForm({ ...csrForm, organizationalUnitName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900"
                    />
                    <p className="text-[9px] text-slate-400">Department or trading unit within the organisation</p>
                  </div>

                  {/* Serial Number — device serial from MoR */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Serial Number <code className="ml-1 text-[9px] text-slate-400">serialNumber</code>
                    </label>
                    <input
                      placeholder="e.g. B0360155CA"
                      value={csrForm.systemNumber}
                      onChange={e => setCsrForm({ ...csrForm, systemNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-sm border rounded-lg font-mono dark:bg-slate-900"
                    />
                    <p className="text-[9px] text-slate-400">Device / system serial assigned by MoR EIMS portal</p>
                  </div>

                  {/* Common Name — TIN */}
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Common Name (TIN) <code className="ml-1 text-[9px] text-slate-400">CN</code>
                    </label>
                    <input
                      placeholder="1234567890"
                      maxLength={10}
                      value={csrForm.tin}
                      onChange={e => setCsrForm({ ...csrForm, tin: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg font-mono dark:bg-slate-900"
                    />
                    <p className="text-[9px] text-slate-400">10-digit Ethiopian Taxpayer Identification Number — used as CN in the certificate</p>
                  </div>
                </div>
              </div>

              {/* Subject Alternative Name */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Subject Alternative Name (SAN)
                </p>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">
                    Email <code className="ml-1 text-[9px] text-slate-400">email.1</code>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. testtaxpayer@gmail.com"
                    value={csrForm.email}
                    onChange={e => setCsrForm({ ...csrForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900"
                  />
                  <p className="text-[9px] text-slate-400">Registered taxpayer e-mail address for MoR correspondence</p>
                </div>
              </div>

              {/* Generated openssl.cnf preview */}
              {(csrForm.tin || csrForm.organizationName || csrForm.systemNumber) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Generated openssl.cnf — copy to clipboard before submitting to INSA
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const cnf = buildOpensslCnf(csrForm);
                        navigator.clipboard.writeText(cnf).then(
                          () => toast.success('openssl.cnf copied to clipboard'),
                          () => toast.error('Clipboard write failed — select and copy manually'),
                        );
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FileText size={11} /> Copy
                    </button>
                  </div>
                  <pre className="w-full p-3 text-[10px] font-mono leading-relaxed bg-slate-900 text-emerald-300 rounded-lg overflow-x-auto select-all whitespace-pre">
                    {buildOpensslCnf(csrForm)}
                  </pre>
                </div>
              )}

              <button
                onClick={handleGenerateCsr}
                disabled={generateCsr.isPending || !csrForm.tin || !csrForm.organizationName || !csrForm.systemNumber}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generateCsr.isPending
                  ? <><RefreshCw size={14} className="animate-spin" /> Generating…</>
                  : <><Key size={14} /> Generate Key Pair &amp; CSR</>}
              </button>
              <p className="text-[10px] text-slate-400">
                Submit the generated CSR to INSA at <strong>ica@insa.gov.et</strong> —
                include your MoR-issued system serial and EIMS registration reference.
              </p>
            </div>
          </div>

          {/* ── CSR Generation Result ───────────────────────────────────────── */}
          {selectedCertId && (generatedCnf || generatedCsrPem) && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  CSR Generated Successfully
                </p>
                <span className="ml-auto text-[10px] text-emerald-500 font-mono">
                  ID: {selectedCertId}
                </span>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your key pair has been generated server-side and the CSR is ready.
                  Submit the <strong>openssl.cnf</strong> to INSA at{' '}
                  <a href="mailto:ica@insa.gov.et" className="font-semibold text-teal-600 hover:underline">
                    ica@insa.gov.et
                  </a>{' '}
                  along with your MoR EIMS registration reference. Once INSA issues the signed
                  certificate, paste it in Step 2 below.
                </p>

                {/* openssl.cnf — definitive backend-generated version */}
                {generatedCnf && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        openssl.cnf — authoritative INSA submission file
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCnf).then(
                              () => toast.success('openssl.cnf copied to clipboard'),
                              () => toast.error('Clipboard write failed'),
                            );
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <FileText size={11} /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([generatedCnf], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `openssl-${csrForm.tin || 'csr'}.cnf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Download size={11} /> Download
                        </button>
                      </div>
                    </div>
                    <pre className="w-full p-3 text-[10px] font-mono leading-relaxed bg-slate-900 text-emerald-300 rounded-lg overflow-x-auto select-all whitespace-pre">
                      {generatedCnf}
                    </pre>
                  </div>
                )}

                {/* CSR PEM — for manual submission */}
                {generatedCsrPem && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Certificate Signing Request (CSR PEM)
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCsrPem).then(
                              () => toast.success('CSR PEM copied to clipboard'),
                              () => toast.error('Clipboard write failed'),
                            );
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <FileText size={11} /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([generatedCsrPem], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `csr-${csrForm.tin || 'request'}.pem`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Download size={11} /> Download
                        </button>
                      </div>
                    </div>
                    <textarea
                      readOnly
                      value={generatedCsrPem}
                      rows={5}
                      className="w-full px-3 py-2 text-[10px] font-mono border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 select-all resize-none"
                      spellCheck={false}
                      onClick={e => (e.target as HTMLTextAreaElement).select()}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Install Certificate ─────────────────────────────────── */}
          {selectedCertId && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-800">
                <Upload size={13} className="text-teal-600 shrink-0" />
                <p className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Step 2 — Install INSA-issued Certificate
                </p>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Once INSA issues the signed certificate, paste the full PEM content below
                  (including <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">-----BEGIN CERTIFICATE-----</code> and
                  <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded"> -----END CERTIFICATE-----</code>).
                </p>
                <textarea
                  placeholder="-----BEGIN CERTIFICATE-----&#10;MIIFazCCA1Og...&#10;-----END CERTIFICATE-----"
                  value={certPem}
                  onChange={e => setCertPem(e.target.value)}
                  rows={7}
                  className="w-full px-3 py-2 text-xs font-mono border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                  spellCheck={false}
                />
                <button
                  onClick={handleInstallCert}
                  disabled={installCert.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  <Upload size={14} /> Install Certificate
                </button>
              </div>
            </div>
          )}

          {/* ── Installed certificates list ─────────────────────────────────── */}
          {certificates.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Installed Certificates</p>
              {certificates.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                  <div>
                    <p className="text-sm font-medium">TIN: {c.subjectTin ?? '—'}</p>
                    <p className="text-xs text-slate-500">
                      Serial: {c.serialNumber ?? '—'}
                      {c.expiresAt && ` · Expires: ${new Date(c.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Registrations */}
      {tab === 'registrations' && (
        <div className="space-y-4">
          {/* Header + filter strip */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold flex items-center gap-2"><FileText size={16} /> Invoice Registrations</h2>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['all', 'registered', 'failed'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRegFilter(f)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors capitalize ${
                    regFilter === f
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {f === 'all'
                    ? `All (${registrations.length})`
                    : f === 'failed'
                    ? `Failed (${(registrations as any[]).filter(r => r.status === 'FAILED').length})`
                    : `Registered (${(registrations as any[]).filter(r => r.status === 'REGISTERED' || r.status === 'COMPLETED').length})`}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {(() => {
            const filtered = (registrations as any[]).filter(r => {
              if (regFilter === 'failed') return r.status === 'FAILED';
              if (regFilter === 'registered') return r.status === 'REGISTERED' || r.status === 'COMPLETED';
              return true;
            });
            if (filtered.length === 0) {
              return (
                <p className="text-sm text-slate-500 text-center py-8">
                  {registrations.length === 0 ? 'No EIMS registrations yet.' : `No ${regFilter} registrations.`}
                </p>
              );
            }
            return (
              <div className="space-y-2">
                {filtered.map((r: any) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium font-mono truncate">
                        {r.irn ? r.irn.slice(0, 20) + '…' : 'IRN pending'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Doc: {r.documentNumber ?? '—'}
                        {r.submissionMode && ` · ${r.submissionMode}`}
                        {r.attemptCount != null && ` · ${r.attemptCount} attempt${r.attemptCount !== 1 ? 's' : ''}`}
                      </p>
                      {r.errorMessage && (
                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                          <AlertTriangle size={11} className="shrink-0" />
                          <span className="truncate">{r.errorMessage}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={r.status} />
                      {r.status === 'FAILED' && r.invoiceId && (
                        <button
                          type="button"
                          disabled={retryRegistration.isPending}
                          onClick={async () => {
                            try {
                              await retryRegistration.mutateAsync(r.invoiceId);
                              toast.success('Registration retry queued');
                            } catch (e: any) {
                              toast.error(e?.message ?? 'Retry failed');
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50 disabled:opacity-50 transition-colors"
                          title="Retry MoR registration for this invoice"
                        >
                          <RefreshCw size={11} className={retryRegistration.isPending ? 'animate-spin' : ''} />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Bulk Jobs */}
      {tab === 'bulk' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Layers size={16} /> Bulk EIMS Registration</h2>
            {bulkJobs.length > 0 && (
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                {[
                  { label: 'Total', value: bulkJobs.length, color: 'text-slate-600' },
                  { label: 'OK', value: (bulkJobs as any[]).filter(j => j.status === 'COMPLETED').length, color: 'text-teal-600' },
                  { label: 'Failed', value: (bulkJobs as any[]).filter(j => j.status === 'FAILED').length, color: 'text-rose-600' },
                  { label: 'Pending', value: (bulkJobs as any[]).filter(j => j.status === 'PENDING' || j.status === 'PROCESSING').length, color: 'text-amber-600' },
                ].map(s => (
                  <span key={s.label} className={s.color}>
                    {s.value} {s.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Trigger panel */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <Layers size={13} className="text-slate-500 shrink-0" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Trigger Bulk Registration
              </p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste invoice IDs (comma-separated or one per line) to register them with MoR EIMS in a single batch call.
                Already-registered invoices are skipped automatically by the backend.
              </p>
              <textarea
                rows={4}
                placeholder={`invoice-id-1\ninvoice-id-2\ninvoice-id-3`}
                value={bulkInvoiceIds}
                onChange={e => setBulkInvoiceIds(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border rounded-lg dark:bg-slate-900 dark:border-slate-700 resize-none"
                spellCheck={false}
              />
              {/* Parsed ID count hint */}
              {bulkInvoiceIds.trim() && (() => {
                const ids = bulkInvoiceIds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                return (
                  <p className="text-[10px] text-slate-400">
                    {ids.length} invoice ID{ids.length !== 1 ? 's' : ''} detected
                  </p>
                );
              })()}
              <button
                type="button"
                disabled={bulkRegister.isPending || !bulkInvoiceIds.trim()}
                onClick={async () => {
                  const ids = bulkInvoiceIds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                  if (!ids.length) { toast.error('Paste at least one invoice ID'); return; }
                  try {
                    const result = await bulkRegister.mutateAsync(ids);
                    toast.success(`Bulk job queued — ${result?.requestCount ?? ids.length} invoice(s) submitted`);
                    setBulkInvoiceIds('');
                  } catch (e: any) {
                    toast.error(e?.message ?? 'Bulk registration failed');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bulkRegister.isPending
                  ? <><RefreshCw size={14} className="animate-spin" /> Submitting…</>
                  : <><Layers size={14} /> Trigger Bulk Registration</>}
              </button>
            </div>
          </div>

          {/* Job history */}
          {bulkJobs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No bulk jobs yet — trigger one above.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job History</p>
              {(bulkJobs as any[]).map((job: any) => (
                <div key={job.id} className="flex items-start justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {job.jobType?.replace(/_/g, ' ') ?? 'Bulk Job'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {job.requestCount ?? '?'} requested
                      {job.successCount != null && ` · ${job.successCount} ok`}
                      {job.failureCount != null && job.failureCount > 0 && (
                        <span className="text-rose-500"> · {job.failureCount} failed</span>
                      )}
                      {job.conversationId && (
                        <span className="font-mono text-slate-400"> · {job.conversationId.slice(0, 14)}…</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(job.createdAt).toLocaleString('en-ET')}
                      {job.completedAt && ` → ${new Date(job.completedAt).toLocaleString('en-ET')}`}
                    </p>
                  </div>
                  <Badge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Cyber Audit tab ──────────────────────────────────────────────────── */}
      {tab === 'cyber-audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Bug size={16} /> INSA Cyber Security Audits</h2>
            <button
              type="button"
              onClick={async () => {
                const title = newAuditTitle.trim() || `Cyber Audit ${new Date().toLocaleDateString('en-ET')}`;
                try {
                  const r = await createAudit.mutateAsync({ title });
                  setSelectedAuditId(r?.id ?? null);
                  setNewAuditTitle('');
                  refetchAudits();
                  toast.success('Cyber audit created');
                } catch (e: any) { toast.error(e.message ?? 'Failed'); }
              }}
              disabled={createAudit.isPending}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              <Plus size={13} /> New Audit
            </button>
          </div>

          {/* Audit list */}
          {(cyberAudits as any[]).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No cyber audits yet. Create one to start tracking INSA compliance.</p>
          ) : (
            <div className="space-y-2">
              {(cyberAudits as any[]).map((audit) => (
                <div
                  key={audit.id}
                  className={`p-4 bg-white dark:bg-slate-900 rounded-xl border cursor-pointer transition-colors ${selectedAuditId === audit.id ? 'border-teal-400 ring-1 ring-teal-400' : 'hover:border-slate-300'}`}
                  onClick={() => setSelectedAuditId(audit.id === selectedAuditId ? null : audit.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{audit.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {audit.conductedBy ? `By: ${audit.conductedBy} · ` : ''}
                        {new Date(audit.createdAt).toLocaleDateString('en-ET')}
                        {audit.completedAt && ` → ${new Date(audit.completedAt).toLocaleDateString('en-ET')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={audit.status} />
                      {audit.status === 'DRAFT' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); startAudit.mutate(audit.id, { onSuccess: () => { toast.success('Audit started'); refetchAudits(); } }); }}
                          className="p-1.5 rounded-lg text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] transition-colors" title="Start audit">
                          <Play size={13} />
                        </button>
                      )}
                      {audit.status === 'IN_PROGRESS' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); completeAudit.mutate(audit.id, { onSuccess: () => { toast.success('Audit completed'); refetchAudits(); } }); }}
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors" title="Complete audit">
                          <CheckSquare size={13} />
                        </button>
                      )}
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteAudit.mutate(audit.id, { onSuccess: () => { toast.success('Deleted'); if (selectedAuditId === audit.id) setSelectedAuditId(null); refetchAudits(); } }); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: metrics + findings */}
                  {selectedAuditId === audit.id && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      {/* Metrics */}
                      {(auditMetrics as any[]).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><BarChart2 size={12} /> Metrics</p>
                          <div className="space-y-1.5">
                            {(auditMetrics as any[]).map((m) => (
                              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{m.name ?? m.metricId}</p>
                                  {m.evidence && <p className="text-[10px] text-slate-400 truncate">{m.evidence}</p>}
                                </div>
                                <select
                                  value={m.status ?? 'PENDING'}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateMetric.mutate({ auditId: audit.id, metricId: m.id, data: { status: e.target.value } }, {
                                    onSuccess: () => toast.success('Metric updated'),
                                  })}
                                  className="text-[10px] border rounded-md px-1.5 py-1 bg-white dark:bg-slate-900"
                                >
                                  {['PENDING', 'PASS', 'FAIL', 'N/A'].map(s => <option key={s}>{s}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Findings */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><AlertTriangle size={12} /> Findings ({(auditFindings as any[]).length})</p>
                        <div className="space-y-1.5">
                          {(auditFindings as any[]).map((f) => (
                            <div key={f.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                f.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                f.severity === 'HIGH'     ? 'bg-orange-100 text-orange-700' :
                                f.severity === 'MEDIUM'   ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-600'}`}>
                                {f.severity}
                              </span>
                              <p className="text-xs flex-1">{f.title}</p>
                              <button type="button" onClick={(e) => { e.stopPropagation(); deleteFinding.mutate({ auditId: audit.id, findingId: f.id }, { onSuccess: () => toast.success('Finding removed') }); }}
                                className="p-1 text-slate-300 hover:text-rose-500 shrink-0"><Trash2 size={11} /></button>
                            </div>
                          ))}
                        </div>

                        {/* Add finding */}
                        <div className="mt-2 flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <select value={findingSeverity} onChange={(e) => setFindingSeverity(e.target.value as any)}
                            className="text-[10px] border rounded-md px-1.5 py-1 bg-white dark:bg-slate-900">
                            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => <option key={s}>{s}</option>)}
                          </select>
                          <input value={findingTitle} onChange={(e) => setFindingTitle(e.target.value)} placeholder="Finding title"
                            className="flex-1 min-w-[140px] text-xs border rounded-md px-2 py-1" />
                          <input value={findingDesc} onChange={(e) => setFindingDesc(e.target.value)} placeholder="Description (optional)"
                            className="flex-1 min-w-[140px] text-xs border rounded-md px-2 py-1" />
                          <button type="button"
                            onClick={() => {
                              if (!findingTitle.trim()) return;
                              createFinding.mutate({ auditId: audit.id, severity: findingSeverity, title: findingTitle.trim(), description: findingDesc.trim() || findingTitle.trim() }, {
                                onSuccess: () => { toast.success('Finding added'); setFindingTitle(''); setFindingDesc(''); },
                              });
                            }}
                            className="px-2 py-1 text-[10px] font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700">
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New audit inline form */}
          <div className="flex gap-2 mt-2">
            <input value={newAuditTitle} onChange={(e) => setNewAuditTitle(e.target.value)}
              placeholder="Audit title (optional — defaults to today's date)"
              className="flex-1 text-sm border rounded-lg px-3 py-2" />
          </div>
        </div>
      )}

      {/* ── Master Compliance tab ─────────────────────────────────────────────── */}
      {tab === 'compliance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><ClipboardCheck size={16} /> BSP Master Compliance</h2>
            <button
              type="button"
              onClick={async () => {
                const title = newChecklistTitle.trim() || `BSP Checklist ${new Date().toLocaleDateString('en-ET')}`;
                try {
                  const r = await createChecklist.mutateAsync({ title });
                  setSelectedChecklistId(r?.id ?? null);
                  setNewChecklistTitle('');
                  refetchChecklists();
                  toast.success('Checklist created');
                } catch (e: any) { toast.error(e.message ?? 'Failed'); }
              }}
              disabled={createChecklist.isPending}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              <Plus size={13} /> New Checklist
            </button>
          </div>

          {/* Summary strip */}
          {complianceSummary && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: (complianceSummary as any).total ?? 0 },
                { label: 'In Progress', value: (complianceSummary as any).inProgress ?? 0 },
                { label: 'Completed', value: (complianceSummary as any).completed ?? 0 },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-center">
                  <p className="text-lg font-bold text-teal-600">{s.value}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {(masterChecklists as any[]).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No compliance checklists yet.</p>
          ) : (
            <div className="space-y-2">
              {(masterChecklists as any[]).map((cl) => (
                <div
                  key={cl.id}
                  className={`p-4 bg-white dark:bg-slate-900 rounded-xl border cursor-pointer transition-colors ${selectedChecklistId === cl.id ? 'border-teal-400 ring-1 ring-teal-400' : 'hover:border-slate-300'}`}
                  onClick={() => setSelectedChecklistId(cl.id === selectedChecklistId ? null : cl.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{cl.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cl.bspName ? `BSP: ${cl.bspName} · ` : ''}
                        {new Date(cl.createdAt).toLocaleDateString('en-ET')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={cl.status ?? 'DRAFT'} />
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteChecklist.mutate(cl.id, { onSuccess: () => { toast.success('Deleted'); if (selectedChecklistId === cl.id) setSelectedChecklistId(null); refetchChecklists(); } }); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Items expanded */}
                  {selectedChecklistId === cl.id && (
                    <div className="mt-4 border-t pt-4 space-y-1.5">
                      {(checklistItems as any[]).length === 0 ? (
                        <p className="text-xs text-slate-400">No items — items are auto-populated from the BSP template.</p>
                      ) : (checklistItems as any[]).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.title ?? item.id}</p>
                            {item.description && <p className="text-[10px] text-slate-400 truncate">{item.description}</p>}
                          </div>
                          <select
                            value={item.status ?? 'PENDING'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateChecklistItem.mutate({ checklistId: cl.id, itemId: item.id, data: { status: e.target.value } }, {
                              onSuccess: () => toast.success('Item updated'),
                            })}
                            className="text-[10px] border rounded-md px-1.5 py-1 bg-white dark:bg-slate-900"
                          >
                            {['PENDING', 'PASS', 'FAIL', 'NOT_APPLICABLE'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <input value={newChecklistTitle} onChange={(e) => setNewChecklistTitle(e.target.value)}
              placeholder="Checklist title (optional)"
              className="flex-1 text-sm border rounded-lg px-3 py-2" />
          </div>
        </div>
      )}

      {/* ── Accreditation tab ─────────────────────────────────────────────────── */}
      {tab === 'accreditation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><ClipboardList size={16} /> MoR Accreditation (Directive No. 1142/2026)</h2>
            <button
              type="button"
              onClick={async () => {
                const title = newAccreditationTitle.trim() || `Accreditation ${new Date().toLocaleDateString('en-ET')}`;
                try {
                  const r = await createAccreditation.mutateAsync({ title });
                  setSelectedAccreditationId(r?.id ?? null);
                  setNewAccreditationTitle('');
                  refetchAccreditations();
                  toast.success('Accreditation checklist created');
                } catch (e: any) { toast.error(e.message ?? 'Failed'); }
              }}
              disabled={createAccreditation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              <Plus size={13} /> New Checklist
            </button>
          </div>

          {/* Summary strip */}
          {accreditationSummary && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: (accreditationSummary as any).total ?? 0 },
                { label: 'In Progress', value: (accreditationSummary as any).inProgress ?? 0 },
                { label: 'Completed', value: (accreditationSummary as any).completed ?? 0 },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-white dark:bg-slate-900 rounded-xl border text-center">
                  <p className="text-lg font-bold text-teal-600">{s.value}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {(accreditations as any[]).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No accreditation checklists yet.</p>
          ) : (
            <div className="space-y-2">
              {(accreditations as any[]).map((acc) => (
                <div
                  key={acc.id}
                  className={`p-4 bg-white dark:bg-slate-900 rounded-xl border cursor-pointer transition-colors ${selectedAccreditationId === acc.id ? 'border-teal-400 ring-1 ring-teal-400' : 'hover:border-slate-300'}`}
                  onClick={() => setSelectedAccreditationId(acc.id === selectedAccreditationId ? null : acc.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{acc.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {acc.softwareName ? `${acc.softwareName}${acc.softwareVersion ? ` v${acc.softwareVersion}` : ''} · ` : ''}
                        {acc.providerCompanyName ? `${acc.providerCompanyName} · ` : ''}
                        {new Date(acc.createdAt).toLocaleDateString('en-ET')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={acc.status ?? 'DRAFT'} />
                      <button type="button" onClick={(e) => { e.stopPropagation(); deleteAccreditationMutation.mutate(acc.id, { onSuccess: () => { toast.success('Deleted'); if (selectedAccreditationId === acc.id) setSelectedAccreditationId(null); refetchAccreditations(); } }); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Items expanded */}
                  {selectedAccreditationId === acc.id && (
                    <div className="mt-4 border-t pt-4 space-y-1.5">
                      {(accreditationItems as any[]).length === 0 ? (
                        <p className="text-xs text-slate-400">No items — items are auto-populated from the accreditation template.</p>
                      ) : (accreditationItems as any[]).map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{item.title ?? item.requirementId ?? item.id}</p>
                            {item.description && <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>}
                            {item.comment && <p className="text-[10px] text-teal-600 mt-0.5 italic">{item.comment}</p>}
                          </div>
                          <select
                            value={item.status ?? 'PENDING'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateAccreditationItem.mutate({ checklistId: acc.id, itemId: item.id, data: { status: e.target.value } }, {
                              onSuccess: () => toast.success('Item updated'),
                            })}
                            className="text-[10px] border rounded-md px-1.5 py-1 bg-white dark:bg-slate-900 shrink-0"
                          >
                            {['PENDING', 'COMPLIANT', 'NON_COMPLIANT', 'OBSERVATION', 'NOT_APPLICABLE'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <input value={newAccreditationTitle} onChange={(e) => setNewAccreditationTitle(e.target.value)}
              placeholder="Accreditation title (optional)"
              className="flex-1 text-sm border rounded-lg px-3 py-2" />
          </div>
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
