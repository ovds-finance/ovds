import React, { useState } from 'react';
import {
  useEimsCertificates,
  useEimsCertificateExpiry,
  useGenerateCsr,
  useInstallCertificate,
} from '@ovds/features/eims';
import toast from 'react-hot-toast';
import { useBusiness } from '../../context/businessContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  Key, Upload, AlertTriangle, Plus, Trash2, Download, Mail, FileText, Shield,
} from 'lucide-react';
import { downloadBlob } from '@ovds/ui';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  ISSUED: 'text-emerald-600 bg-emerald-50',
  ACTIVE: 'text-emerald-600 bg-emerald-50',
  EXPIRED: 'text-rose-600 bg-rose-50',
  REVOKED: 'text-rose-600 bg-rose-50',
  INSTALLED: 'text-emerald-600 bg-emerald-50',
};

const Badge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'text-slate-600 bg-slate-100'}`}>
    {status}
  </span>
);

interface SystemRow {
  id: string;
  branchName: string;
  systemId: string;
}

const INITIAL_SYSTEM: SystemRow = { id: crypto.randomUUID(), branchName: '', systemId: '' };

const CertificatesPage: React.FC = () => {
  usePageTitle('E-Invoice Digital Certificate');
  const { selectedCompanyId } = useBusiness();

  const [contactName, setContactName] = useState('');
  const [address, setAddress] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [tin, setTin] = useState('');
  const [systems, setSystems] = useState<SystemRow[]>([INITIAL_SYSTEM]);
  const [generatedCsr, setGeneratedCsr] = useState('');
  const [generatedCnf, setGeneratedCnf] = useState('');
  const [generatedCertId, setGeneratedCertId] = useState('');
  const [certPem, setCertPem] = useState('');
  const [selectedCertId, setSelectedCertId] = useState('');

  const { data: certificates = [], isLoading: loadingCerts, refetch: refetchCerts } = useEimsCertificates();
  const { data: expiringCerts = [] } = useEimsCertificateExpiry();
  const generateCsr = useGenerateCsr();
  const installCert = useInstallCertificate();

  const addSystemRow = () => {
    setSystems([...systems, { id: crypto.randomUUID(), branchName: '', systemId: '' }]);
  };

  const removeSystemRow = (id: string) => {
    if (systems.length <= 1) return;
    setSystems(systems.filter(s => s.id !== id));
  };

  const updateSystemRow = (id: string, field: keyof SystemRow, value: string) => {
    setSystems(systems.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const primarySystemId = systems[0]?.systemId || '';

  const handleGenerateCsr = async () => {
    if (!tin.trim()) { toast.error('TIN is required'); return; }
    if (!organizationName.trim()) { toast.error('Organization Name is required'); return; }
    if (!email.trim()) { toast.error('Email is required'); return; }
    if (!primarySystemId) { toast.error('At least one System ID is required'); return; }

    try {
      const result = await generateCsr.mutateAsync({
        tin: tin.trim(),
        systemNumber: primarySystemId,
        organizationName: organizationName.trim(),
        email: email.trim(),
        organizationalUnitName: organizationName.trim(),
        sourceSystemId: primarySystemId,
      });
      toast.success(`CSR generated — ID: ${result.certificateId}`);
      setGeneratedCsr(result.csrPem);
      setGeneratedCnf(result.cnfContent);
      setGeneratedCertId(result.certificateId);
      setSelectedCertId(result.certificateId);
      refetchCerts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDownloadCsr = () => {
    if (!generatedCsr) { toast.error('Generate a CSR first'); return; }
    const blob = new Blob([generatedCsr], { type: 'application/pkix-cert' });
    const filename = `CSR-${tin || 'certificate'}-${primarySystemId || 'request'}.csr`;
    downloadBlob(blob, filename);
    toast.success('CSR downloaded');
  };

  const handleDownloadCnf = () => {
    if (!generatedCnf) { toast.error('Generate a CSR first'); return; }
    const blob = new Blob([generatedCnf], { type: 'text/plain' });
    const filename = `einvoice-${tin || 'certificate'}-${primarySystemId || 'request'}.cnf`;
    downloadBlob(blob, filename);
    toast.success('CNF downloaded');
  };

  const handleDownloadFormSummary = () => {
    const lines = [
      'E-INVOICE DIGITAL CERTIFICATE REQUEST FORM',
      '============================================',
      '',
      '1. CONTACT PERSON INFORMATION',
      `   Full Name:        ${contactName || '-'}`,
      `   Address:          ${address || '-'}`,
      `   Telephone No.:    ${telephone || '-'}`,
      `   E-mail Address:   ${email || '-'}`,
      '',
      '2. TAX PAYER / ORGANIZATION INFORMATION',
      `   Organization Name: ${organizationName || '-'}`,
      `   TIN:               ${tin || '-'}`,
      '',
      '3. INVOICE SYSTEM INFORMATION',
    ];
    systems.forEach((s, i) => {
      lines.push(`   Row ${i + 1}: ${s.branchName || '-'} | System ID: ${s.systemId || '-'}`);
    });
    lines.push('');
    lines.push('NOTE:');
    lines.push('- Fields marked with ** are required.');
    lines.push('- At least ONE (01) System ID is required in section 3.');
    lines.push('- This form with the CSR and CNF files shall be sent to ica@insa.gov.et as attachment.');
    lines.push('');
    lines.push('Generated CSR:');
    lines.push(generatedCsr || '(not generated yet)');
    lines.push('');
    lines.push('Generated CNF:');
    lines.push(generatedCnf || '(not generated yet)');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const filename = `Certificate-Request-${tin || 'form'}.txt`;
    downloadBlob(blob, filename);
    toast.success('Form summary downloaded');
  };

  const handleSendEmail = () => {
    if (!email.trim()) { toast.error('Email is required'); return; }

    const subject = encodeURIComponent(`E-Invoice Digital Certificate Request Form - ${organizationName || 'Test Taxpayer'}`);
    const bodyLines = [
      'To: ica@insa.gov.et',
      'Subject: E-Invoice Digital Certificate Request Form',
      '',
      'Dear INSA Team,',
      '',
      'Please find attached the E-Invoice Digital Certificate Request Form, CSR file, and CNF config.',
      '',
      '--- Form Details ---',
      '',
      '1. CONTACT PERSON INFORMATION',
      `Full Name:        ${contactName || '-'}`,
      `Address:          ${address || '-'}`,
      `Telephone No.:    ${telephone || '-'}`,
      `E-mail Address:   ${email || '-'}`,
      '',
      '2. TAX PAYER / ORGANIZATION INFORMATION',
      `Organization Name: ${organizationName || '-'}`,
      `TIN:               ${tin || '-'}`,
      '',
      '3. INVOICE SYSTEM INFORMATION',
    ];
    systems.forEach((s, i) => {
      bodyLines.push(`   Row ${i + 1}: ${s.branchName || '-'} | System ID: ${s.systemId || '-'}`);
    });
    bodyLines.push('');
    bodyLines.push('Please process the attached CSR and CNF files.');
    bodyLines.push('');
    bodyLines.push('Regards,');
    bodyLines.push(contactName || 'Test Taxpayer');

    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:ica@insa.gov.et?subject=${subject}&body=${body}`;
    toast.success('Opening email client...');
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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">E-Invoice Digital Certificate Request Form</h1>
          <p className="text-sm text-slate-500">INSA digital certificate management and CSR generation</p>
        </div>
      </div>

      {expiringCerts.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Certificate renewal required</p>
            <p className="text-xs mt-1">
              {expiringCerts.length} certificate(s) expiring within 30 days. Renew via INSA to avoid registration failures.
            </p>
          </div>
        </div>
      )}

      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase">1. Contact Person Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">** Full Name</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Full Name" className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">** Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">** Telephone No.</label>
            <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="0911111111" className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">** e-mail address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="testtaxpayer@gmail.com" type="email" className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase">2. Tax Payer / Organization Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">** Organization Name</label>
            <input value={organizationName} onChange={e => setOrganizationName(e.target.value)} placeholder="Organization Name" className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">** TIN</label>
            <input value={tin} onChange={e => setTin(e.target.value)} placeholder="1234567890" className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase">3. Invoice System Information</p>
          <button onClick={addSystemRow} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 hover:text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50">
            <Plus size={12} /> Add Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-3 py-2 font-medium">No.</th>
                <th className="text-left px-3 py-2 font-medium">Organization/Business/Branch Name</th>
                <th className="text-left px-3 py-2 font-medium">System ID</th>
                <th className="text-center px-3 py-2 font-medium w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {systems.map((s, i) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input value={s.branchName} onChange={e => updateSystemRow(s.id, 'branchName', e.target.value)} placeholder="MAIN" className="w-full px-2 py-1.5 text-sm border rounded-lg" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={s.systemId} onChange={e => updateSystemRow(s.id, 'systemId', e.target.value)} placeholder="B0360155CA" className="w-full px-2 py-1.5 text-sm border rounded-lg font-mono" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {systems.length > 1 && (
                      <button onClick={() => removeSystemRow(s.id)} className="text-rose-500 hover:text-rose-700 p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400">At least ONE (01) System ID is required. Add more rows if you have additional System IDs.</p>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase">Generate CSR (Step 1)</p>
        <button onClick={handleGenerateCsr} disabled={generateCsr.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
          <Key size={14} /> {generateCsr.isPending ? 'Generating…' : 'Generate Key Pair & CSR Config'}
        </button>
        <p className="text-[10px] text-slate-400">Submit CSR to INSA: ica@insa.gov.et</p>
      </div>

      {generatedCsr && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase">Generated CSR</p>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadCsr} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50">
                <Download size={12} /> Download CSR
              </button>
              <button onClick={handleDownloadCnf} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                <FileText size={12} /> Download CNF
              </button>
              <button onClick={handleDownloadFormSummary} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                <FileText size={12} /> Download Form Summary
              </button>
              <button onClick={handleSendEmail} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900">
                <Mail size={12} /> Send Email
              </button>
            </div>
          </div>
          <textarea readOnly value={generatedCsr} rows={8} className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-slate-50" />
          {generatedCnf && (
            <textarea readOnly value={generatedCnf} rows={8} className="w-full px-3 py-2 text-xs font-mono border rounded-lg bg-slate-50" />
          )}
          <p className="text-[10px] text-slate-400">CSR generated successfully. Download the CSR and CNF files, then attach both when sending to ica@insa.gov.et.</p>
        </div>
      )}

      {generatedCertId && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
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

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold">Certificate Inventory</h3>
        </div>
        {loadingCerts ? (
          <div className="animate-pulse space-y-3 p-4">
            {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
          </div>
        ) : certificates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No certificates found.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                <th className="text-left px-4 py-2 font-medium">TIN</th>
                <th className="text-left px-4 py-2 font-medium">Serial</th>
                <th className="text-left px-4 py-2 font-medium">Expires</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {certificates.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">{c.subjectTin ?? '—'}</td>
                  <td className="px-4 py-3 font-mono">{c.serialNumber ?? '—'}</td>
                  <td className="px-4 py-3">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3"><Badge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Note:</p>
        <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
          <li>Fields marked with ** are required.</li>
          <li>At least ONE (01) System ID is required in section 3 (Invoice System Information). If you have more System IDs, please add more rows in the table.</li>
          <li>This form with the Certificate Signing Request (CSR) and CNF config files shall be sent to ica@insa.gov.et as attachment.</li>
        </ul>
      </div>
    </div>
  );
};

export default CertificatesPage;
