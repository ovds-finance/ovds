import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';
import {
  PipelineJourney,
  PipelineBadge,
} from '../pipelineComponents';


export type PipelineStage = 'INGESTION' | 'COMPLIANCE' | 'RECONCILIATION' | 'AGGREGATION' | 'SIGNED';
export type TransactionStatus = 'PENDING' | 'VALIDATED' | 'BLOCKED' | 'RECONCILED' | 'SIGNED' | 'REJECTED';

interface PipelineResult {
  status: TransactionStatus;
  stage: PipelineStage;
  calculatedVatEtb: number;
  ledgerHash: string;
  issues: string[];
  metadata: Record<string, unknown>;
}

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'INGESTION', label: 'Ingestion & Token Verification' },
  { key: 'COMPLIANCE', label: 'Compliance Rules Engine' },
  { key: 'RECONCILIATION', label: 'Automated Reconciliation' },
  { key: 'AGGREGATION', label: 'Aggregation & Signing' },
  { key: 'SIGNED', label: 'ERM Submission Ready' },
];

const STATUS_META: Record<TransactionStatus, { variant: string; label: string }> = {
  PENDING: { variant: 'pending', label: 'Pending' },
  VALIDATED: { variant: 'success', label: 'Validated' },
  BLOCKED: { variant: 'danger', label: 'Blocked' },
  RECONCILED: { variant: 'info', label: 'Reconciled' },
  SIGNED: { variant: 'success', label: 'Signed' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
};

export function OvdsPipelineConsole() {
  const [form, setForm] = useState({
    companyCode: '',
    isolationToken: '',
    invoiceNumber: '',
    fiscalDeviceId: '',
    transactionType: 'SUPPLY_LOCAL_SALE',
    executionDate: new Date().toISOString().slice(0, 10),
    originalCurrency: 'ETB',
    exchangeRate: 1,
    taxableAmountEtb: 0,
    vatRatePercent: 15,
    whtAmountEtb: 0,
    isIntercompany: false,
    glAccountCodeString: '400100-VAT-OUTPUT',
  });

  const [result, setResult] = useState<PipelineResult | null>(null);
  const [dualResult, setDualResult] = useState<{ taxBookPosted: boolean; ifrsBookPosted: boolean } | null>(null);
  const queryClient = useQueryClient();

  const pipelineMutation = useMutation({
    mutationFn: (payload: any) =>
      api.post('/ovds/pipeline/execute', payload).then((r: any) => r.data),
    onSuccess: (data: any) => {
      setResult(data);
      setDualResult(null);
      queryClient.invalidateQueries({ queryKey: ['ovds'] });
      if (data.status === 'SIGNED') {
        toast.success('Transaction validated and signed successfully');
      } else if (data.status === 'BLOCKED') {
        toast.error(`Transaction blocked: ${data.issues.join(', ')}`);
      } else {
        toast.error(`Transaction rejected: ${data.issues.join(', ')}`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Pipeline execution failed');
    },
  });

  const dualLedgerMutation = useMutation({
    mutationFn: (payload: any) =>
      api.post('/ovds/pipeline/dual-ledger', payload).then((r: any) => r.data),
    onSuccess: (data: any) => {
      setDualResult(data);
      if (data.taxBookPosted && data.ifrsBookPosted) {
        toast.success('Posted to both Tax Management and IFRS Statutory ledgers');
      } else {
        toast.error(`Ledger posting incomplete: Tax=${data.taxBookPosted}, IFRS=${data.ifrsBookPosted}`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Dual ledger posting failed');
    },
  });

  const currentStageIndex = result
    ? STAGES.findIndex((s) => s.key === result.stage)
    : -1;

  const stageStatuses = STAGES.map((s, i) => {
    if (result) {
      if (i < currentStageIndex) return 'completed';
      if (i === currentStageIndex) return result.status === 'BLOCKED' || result.status === 'REJECTED' ? 'danger' : 'active';
      return 'pending';
    }
    return 'pending';
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyCode || !form.isolationToken || !form.invoiceNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    pipelineMutation.mutate(form);
  };

  const handleDualPost = () => {
    if (!result) return;
    dualLedgerMutation.mutate({
      ...form,
      description: `OVDS pipeline ${result.stage} for ${form.invoiceNumber}`,
    });
  };

  return (
    <div className="ovds-pipeline-console p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">OVDS Processing Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            5-stage AABE-compliant VAT declaration workflow
          </p>
        </div>
        {result && (
          <PipelineBadge status={result.status} label={STATUS_META[result.status].label} />
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <PipelineJourney
          stages={STAGES.map((s, i) => ({
            key: s.key,
            label: s.label,
            status: stageStatuses[i] as any,
            amount: result && i <= currentStageIndex ? `ETB ${result.calculatedVatEtb.toFixed(2)}` : undefined,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Transaction Entry</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Company Code *</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.companyCode}
                onChange={(e) => setForm({ ...form, companyCode: e.target.value })}
                required
                placeholder="e.g. SUB-ETH-001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Isolation Token *</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.isolationToken}
                onChange={(e) => setForm({ ...form, isolationToken: e.target.value })}
                required
                placeholder="Cryptographic token"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Number *</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                required
                placeholder="INV-2026-00001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Transaction Type</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.transactionType}
                onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
              >
                <option value="SUPPLY_LOCAL_SALE">Local Sale</option>
                <option value="SUPPLY_EXPORT">Export (Zero-Rated)</option>
                <option value="PURCHASE_LOCAL">Local Purchase</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Execution Date</label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.executionDate}
                onChange={(e) => setForm({ ...form, executionDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Taxable Amount (ETB)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.taxableAmountEtb}
                onChange={(e) => setForm({ ...form, taxableAmountEtb: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">VAT Rate (%)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.vatRatePercent}
                onChange={(e) => setForm({ ...form, vatRatePercent: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">WHT Amount (ETB)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.whtAmountEtb}
                onChange={(e) => setForm({ ...form, whtAmountEtb: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">GL Account Code</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={form.glAccountCodeString}
              onChange={(e) => setForm({ ...form, glAccountCodeString: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={pipelineMutation.isPending}
              className="px-4 py-2 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-medium hover:bg-[var(--pro-azure-dark)] disabled:opacity-50"
            >
              {pipelineMutation.isPending ? 'Processing...' : 'Run Pipeline'}
            </button>
            <button
              type="button"
              onClick={handleDualPost}
              disabled={!result || dualLedgerMutation.isPending}
              className="px-4 py-2 bg-[var(--pro-azure)] text-white rounded-lg text-sm font-medium hover:bg-[var(--pro-azure-dark)] disabled:opacity-50"
            >
              {dualLedgerMutation.isPending ? 'Posting...' : 'Post to Dual Ledger'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Pipeline Result</h2>
          {result ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Status:</span>
                  <span className="ml-2 font-medium">{result.status}</span>
                </div>
                <div>
                  <span className="text-slate-500">Stage:</span>
                  <span className="ml-2 font-medium">{result.stage}</span>
                </div>
                <div>
                  <span className="text-slate-500">Calculated VAT:</span>
                  <span className="ml-2 font-medium">ETB {result.calculatedVatEtb.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Ledger Hash:</span>
                  <span className="ml-2 font-mono text-xs text-slate-600 break-all">{result.ledgerHash}</span>
                </div>
              </div>

              {result.issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-1">Issues Detected:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {result.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {dualResult && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Dual Ledger Posting</p>
                  <div className="flex gap-4 text-sm">
                    <span className={dualResult.taxBookPosted ? 'text-green-600' : 'text-red-600'}>
                      Tax Book: {dualResult.taxBookPosted ? 'Posted' : 'Failed'}
                    </span>
                    <span className={dualResult.ifrsBookPosted ? 'text-green-600' : 'text-red-600'}>
                      IFRS Book: {dualResult.ifrsBookPosted ? 'Posted' : 'Failed'}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Metadata</p>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                  {JSON.stringify(result.metadata, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Submit a transaction to see pipeline results.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default OvdsPipelineConsole;
