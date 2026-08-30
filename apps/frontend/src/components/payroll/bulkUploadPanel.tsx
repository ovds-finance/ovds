import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../rbac/AuthContext';

// -- Bulk Upload Panel ---------------------------------------------------------
// Covers all bulk upload types from the Payroll Management System spec

interface UploadType {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  templateCols: string[];
  requiredRole: 'payroll:admin' | 'payroll:generate';
}

const UPLOAD_TYPES: UploadType[] = [
  {
    key: 'salary_config',
    label: 'Bulk Salary Configuration',
    description: 'Upload account numbers, IFS codes, basic salary, PFMS numbers for multiple employees',
    endpoint: '/payroll/bulk-upload/salary-config',
    templateCols: ['employeeId', 'accountNumber', 'ifsCode', 'basicSalary', 'pfmsNumber'],
    requiredRole: 'payroll:admin',
  },
  {
    key: 'salary_data',
    label: 'Bulk Salary Data',
    description: 'Upload earning heads, deduction heads, gross, net, and basic details',
    endpoint: '/payroll/bulk-upload/salary-data',
    templateCols: ['employeeId', 'month', 'year', 'basicSalary', 'grossSalary', 'netSalary', 'deductions'],
    requiredRole: 'payroll:generate',
  },
  {
    key: 'progression',
    label: 'Bulk Progression Data',
    description: 'Update basic salary in bulk by employee code and new basic salary',
    endpoint: '/payroll/bulk-upload/progression',
    templateCols: ['employeeId', 'newBasicSalary', 'effectiveDate'],
    requiredRole: 'payroll:admin',
  },
  {
    key: 'recurring',
    label: 'Bulk Recurring Data',
    description: 'Upload recurring salary heads with start/end dates (e.g. LIC, HRA)',
    endpoint: '/payroll/bulk-upload/recurring',
    templateCols: ['employeeId', 'headCode', 'amount', 'startDate', 'endDate'],
    requiredRole: 'payroll:generate',
  },
  {
    key: 'one_time',
    label: 'Bulk One-Time Data',
    description: 'Upload one-time payments (arrears, bonuses, recoveries) for a specific month',
    endpoint: '/payroll/bulk-upload/one-time',
    templateCols: ['employeeId', 'headCode', 'amount', 'month', 'year', 'remarks'],
    requiredRole: 'payroll:generate',
  },
  {
    key: 'arrear',
    label: 'Bulk Arrear Data',
    description: 'Upload NPS arrear data (employee and employer contributions)',
    endpoint: '/payroll/bulk-upload/arrear',
    templateCols: ['employeeId', 'arrearType', 'employeeContribution', 'employerContribution', 'period'],
    requiredRole: 'payroll:generate',
  },
  {
    key: 'paymatrix',
    label: 'Bulk Pay Matrix Cell Data',
    description: 'Upload employee pay matrix cell assignments',
    endpoint: '/payroll/bulk-upload/paymatrix',
    templateCols: ['employeeId', 'level', 'cellNo', 'basicPay'],
    requiredRole: 'payroll:admin',
  },
  {
    key: 'pf_contribution',
    label: 'Bulk PF Contribution Data',
    description: 'Upload NPS/CPF/EPF contributions after salary approval',
    endpoint: '/payroll/bulk-upload/pf-contribution',
    templateCols: ['employeeId', 'pfType', 'employeeContribution', 'employerContribution', 'month', 'year'],
    requiredRole: 'payroll:generate',
  },
];

interface UploadResult {
  success: number;
  errors: { row: number; message: string }[];
  total: number;
}

const UploadCard: React.FC<{ type: UploadType; canUpload: boolean }> = ({ type, canUpload }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const downloadTemplate = () => {
    const csv = type.templateCols.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${type.key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(type.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data ?? res.data;
      setResult({ success: data.success ?? 0, errors: data.errors ?? [], total: data.total ?? 0 });
      if ((data.errors?.length ?? 0) === 0) {
        toast.success(`${data.success} records uploaded successfully`);
      } else {
        toast.error(`${data.errors.length} errors — check results below`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{type.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{type.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={11} /> Template
          </button>
          {canUpload && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {uploading ? <RefreshCw size={11} className="animate-spin" /> : <Upload size={11} />}
              {uploading ? 'Uploading…' : 'Upload CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Column preview */}
      <div className="flex flex-wrap gap-1">
        {type.templateCols.map(col => (
          <span key={col} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono rounded">{col}</span>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-3 border text-xs ${result.errors.length === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
          <div className="flex items-center gap-2 font-bold">
            {result.errors.length === 0
              ? <><CheckCircle size={12} className="text-emerald-600" /> {result.success} of {result.total} records uploaded successfully</>
              : <><AlertTriangle size={12} className="text-amber-600" /> {result.success} succeeded, {result.errors.length} errors</>
            }
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
              {result.errors.slice(0, 10).map((e, i) => (
                <li key={i} className="text-amber-700 dark:text-amber-400">Row {e.row}: {e.message}</li>
              ))}
              {result.errors.length > 10 && <li className="text-amber-500">…and {result.errors.length - 10} more</li>}
            </ul>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFile} />
    </div>
  );
};

const BulkUploadPanel: React.FC = () => {
  const { can } = useAuth();
  const canAdmin = can('payroll:admin');
  const canGenerate = can('payroll:generate');

  const accessible = UPLOAD_TYPES.filter(t =>
    t.requiredRole === 'payroll:admin' ? canAdmin : canGenerate
  );

  if (!canGenerate && !canAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <AlertTriangle size={32} className="text-amber-400" />
        <p className="text-sm font-bold text-slate-500">You don't have permission to upload payroll data</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Bulk Upload Management</p>
        <p className="text-xs text-slate-400 mt-0.5">Upload payroll data in bulk using CSV templates. Download the template first to ensure correct column format.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {accessible.map(type => (
          <UploadCard key={type.key} type={type} canUpload={type.requiredRole === 'payroll:admin' ? canAdmin : canGenerate} />
        ))}
      </div>
    </div>
  );
};

export default BulkUploadPanel;





