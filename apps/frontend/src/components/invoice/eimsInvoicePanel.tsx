import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, QrCode, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink,
  Receipt, Banknote, Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useRegisterInvoiceEims,
  useEimsReceipts,
  eimsApi,
} from '@ovds/features/eims';

const STATUS_STYLE: Record<string, string> = {
  REGISTERED: 'aki-badge sm solid-success',
  PENDING: 'aki-badge sm solid-warning',
  FAILED: 'aki-badge sm solid-danger',
  CANCELLED: 'aki-badge sm solid-danger',
};

interface EimsInvoicePanelProps {
  invoice: {
    id: string;
    invoiceNumber?: string;
    status?: string;
    totalAmount?: number;
    subtotal?: number;
    whtAmount?: number;
    eimsIrn?: string | null;
    eimsStatus?: string | null;
    eimsSignedQr?: string | null;
    eimsRegisteredAt?: string | null;
  };
  onRefresh?: () => void;
}

const EimsInvoicePanel: React.FC<EimsInvoicePanelProps> = ({ invoice, onRefresh }) => {
  const registerEims = useRegisterInvoiceEims();
  const { data: receipts = [], refetch: refetchReceipts } = useEimsReceipts(
    invoice.eimsIrn ? invoice.id : undefined,
  );
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid?: boolean; message?: string } | null>(null);
  const [receiptMode, setReceiptMode] = useState<'sales' | 'wht' | null>(null);
  const preTaxDefault = Math.abs(Number(invoice.subtotal ?? invoice.totalAmount ?? 0));
  const whtDefault = Math.abs(Number(invoice.whtAmount ?? 0));
  const [receiptForm, setReceiptForm] = useState({
    receiptNumber: '',
    collectedAmount: String(Math.abs(Number(invoice.totalAmount ?? 0))),
    paymentMode: 'CASH',
    paymentCoverage: 'FULL' as 'FULL' | 'PARTIAL',
  });
  const [whtForm, setWhtForm] = useState({
    receiptNumber: '',
    withholdType: 'TWHT' as 'TWHT' | 'IWHT',
    preTaxAmount: String(preTaxDefault),
    withholdingAmount: String(whtDefault || Math.round(preTaxDefault * 0.02)),
  });
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const canRegister = invoice.status && !['DRAFT', 'CANCELLED'].includes(invoice.status);
  const eimsStatus = invoice.eimsStatus ?? (invoice.eimsIrn ? 'REGISTERED' : null);
  const isCreditNote = invoice.invoiceNumber?.startsWith('CN-');
  const isDebitNote = invoice.invoiceNumber?.startsWith('DN-');
  const hasWhtReceipt = receipts.some((r: any) => r.receiptType === 'WITHHOLDING');
  const hasSalesReceipt = receipts.some((r: any) => r.receiptType === 'SALES');

  const handleRegister = async () => {
    try {
      await registerEims.mutateAsync(invoice.id);
      toast.success('Invoice registered with EIMS');
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message ?? 'EIMS registration failed');
    }
  };

  const handleRetry = async () => {
    try {
      await eimsApi.invoices.retry(invoice.id);
      toast.success('EIMS registration retry submitted');
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message ?? 'Retry failed');
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await eimsApi.invoices.verify(invoice.id);
      setVerifyResult(result);
      toast.success(result?.valid ? 'Invoice verified with MoR' : 'Verification completed');
    } catch (e: any) {
      toast.error(e.message ?? 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleRegisterReceipt = async () => {
    setSubmittingReceipt(true);
    try {
      await eimsApi.receipts.registerSales({
        invoiceId: invoice.id,
        receiptNumber: receiptForm.receiptNumber,
        collectedAmount: Number(receiptForm.collectedAmount),
        paymentMode: receiptForm.paymentMode,
        paymentCoverage: receiptForm.paymentCoverage,
      });
      toast.success(
        receiptForm.paymentCoverage === 'PARTIAL'
          ? 'Partial sales receipt registered (IRC-P03)'
          : 'Sales receipt registered with EIMS (IRC-P03)',
      );
      setReceiptMode(null);
      refetchReceipts();
    } catch (e: any) {
      toast.error(e.message ?? 'Receipt registration failed');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const handleRegisterWhtReceipt = async () => {
    setSubmittingReceipt(true);
    try {
      await eimsApi.receipts.registerWithholding({
        invoiceId: invoice.id,
        receiptNumber: whtForm.receiptNumber,
        withholdType: whtForm.withholdType,
        preTaxAmount: Number(whtForm.preTaxAmount),
        withholdingAmount: Number(whtForm.withholdingAmount),
      });
      toast.success('Withholding receipt registered with EIMS (IRC-P04)');
      setReceiptMode(null);
      refetchReceipts();
    } catch (e: any) {
      toast.error(e.message ?? 'Withholding receipt failed');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="ovds-label flex items-center gap-1.5">
          <Shield size={12} /> EIMS / MoR
          {isCreditNote && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">CRN</span>}
          {isDebitNote && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">DBN</span>}
        </p>
        <Link to="/settings/eims" className="text-[10px] text-teal-600 hover:underline flex items-center gap-0.5">
          Setup <ExternalLink size={10} />
        </Link>
      </div>

      <div className="p-3 rounded-lg space-y-2.5" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-alt)' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-2)' }}>Registration Status</span>
          {eimsStatus ? (
            <span className={STATUS_STYLE[eimsStatus] ?? 'aki-badge sm'}>{eimsStatus}</span>
          ) : (
            <span className="aki-badge sm" style={{ background: 'var(--surface)', color: 'var(--text-4)' }}>Not registered</span>
          )}
        </div>

        {invoice.eimsIrn && (
          <div>
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-4)' }}>IRN</p>
            <p className="text-[11px] font-mono break-all" style={{ color: 'var(--text)' }}>{invoice.eimsIrn}</p>
          </div>
        )}

        {invoice.eimsRegisteredAt && (
          <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>
            Registered {new Date(invoice.eimsRegisteredAt).toLocaleString('en-ET')}
          </p>
        )}

        {invoice.eimsSignedQr && (
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-3)' }}>
            <QrCode size={14} className="shrink-0 text-teal-600" />
            <span className="truncate font-mono text-[10px]">{invoice.eimsSignedQr.slice(0, 48)}…</span>
          </div>
        )}

        {verifyResult && (
          <div className={`flex items-start gap-1.5 text-[11px] ${verifyResult.valid ? 'text-emerald-700' : 'text-amber-700'}`}>
            {verifyResult.valid ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" /> : <AlertTriangle size={13} className="shrink-0 mt-0.5" />}
            <span>{verifyResult.message ?? (verifyResult.valid ? 'Valid on MoR registry' : 'Verification returned issues')}</span>
          </div>
        )}

        {/* Registered receipts */}
        {receipts.length > 0 && (
          <div className="pt-1 space-y-1">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>EIMS Receipts</p>
            {receipts.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1"><Receipt size={10} /> {r.receiptNumber}</span>
                <span className={STATUS_STYLE[r.status] ?? 'aki-badge sm'}>{r.receiptType}</span>
              </div>
            ))}
          </div>
        )}

        {receiptMode === 'sales' && (
          <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--border-alt)' }}>
            <input
              placeholder="Receipt number"
              value={receiptForm.receiptNumber}
              onChange={(e) => setReceiptForm({ ...receiptForm, receiptNumber: e.target.value })}
              className="aki-input text-[11px]"
            />
            <input
              type="number"
              placeholder="Collected amount"
              value={receiptForm.collectedAmount}
              onChange={(e) => setReceiptForm({ ...receiptForm, collectedAmount: e.target.value })}
              className="aki-input text-[11px]"
            />
            <select
              value={receiptForm.paymentMode}
              onChange={(e) => setReceiptForm({ ...receiptForm, paymentMode: e.target.value })}
              className="aki-input text-[11px]"
            >
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
              <option value="ADVANCE">Advance</option>
            </select>
            <select
              value={receiptForm.paymentCoverage}
              onChange={(e) => setReceiptForm({
                ...receiptForm,
                paymentCoverage: e.target.value as 'FULL' | 'PARTIAL',
              })}
              className="aki-input text-[11px]"
            >
              <option value="FULL">Full payment coverage</option>
              <option value="PARTIAL">Partial payment coverage</option>
            </select>
            <button
              type="button"
              onClick={handleRegisterReceipt}
              disabled={submittingReceipt || !receiptForm.receiptNumber}
              className="aki-btn aki-btn-primary xs w-full"
            >
              {submittingReceipt ? <RefreshCw size={11} className="animate-spin" /> : <Banknote size={11} />}
              Submit Sales Receipt
            </button>
          </div>
        )}

        {receiptMode === 'wht' && (
          <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--border-alt)' }}>
            <input
              placeholder="WHT receipt number"
              value={whtForm.receiptNumber}
              onChange={(e) => setWhtForm({ ...whtForm, receiptNumber: e.target.value })}
              className="aki-input text-[11px]"
            />
            <select
              value={whtForm.withholdType}
              onChange={(e) => setWhtForm({ ...whtForm, withholdType: e.target.value as 'TWHT' | 'IWHT' })}
              className="aki-input text-[11px]"
            >
              <option value="TWHT">Transaction WHT (TWHT)</option>
              <option value="IWHT">Income WHT (IWHT)</option>
            </select>
            <input
              type="number"
              placeholder="Pre-tax amount"
              value={whtForm.preTaxAmount}
              onChange={(e) => setWhtForm({ ...whtForm, preTaxAmount: e.target.value })}
              className="aki-input text-[11px]"
            />
            <input
              type="number"
              placeholder="Withholding amount"
              value={whtForm.withholdingAmount}
              onChange={(e) => setWhtForm({ ...whtForm, withholdingAmount: e.target.value })}
              className="aki-input text-[11px]"
            />
            <button
              type="button"
              onClick={handleRegisterWhtReceipt}
              disabled={submittingReceipt || !whtForm.receiptNumber}
              className="aki-btn aki-btn-primary xs w-full"
            >
              {submittingReceipt ? <RefreshCw size={11} className="animate-spin" /> : <Percent size={11} />}
              Submit WHT Receipt (IRC-P04)
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {canRegister && !invoice.eimsIrn && (
            <button
              type="button"
              onClick={handleRegister}
              disabled={registerEims.isPending}
              className="aki-btn aki-btn-primary xs"
            >
              {registerEims.isPending ? <RefreshCw size={11} className="animate-spin" /> : <Shield size={11} />}
              Register with EIMS
            </button>
          )}
          {eimsStatus === 'FAILED' && (
            <button type="button" onClick={handleRetry} className="aki-btn aki-btn-secondary xs">
              <RefreshCw size={11} /> Retry
            </button>
          )}
          {invoice.eimsIrn && eimsStatus === 'REGISTERED' && !isCreditNote && !isDebitNote && (
            <>
              {!hasSalesReceipt && (
                <button
                  type="button"
                  onClick={() => setReceiptMode(receiptMode === 'sales' ? null : 'sales')}
                  className="aki-btn aki-btn-secondary xs"
                >
                  <Receipt size={11} /> {receiptMode === 'sales' ? 'Hide Sales' : 'Sales Receipt'}
                </button>
              )}
              {!hasWhtReceipt && (
                <button
                  type="button"
                  onClick={() => setReceiptMode(receiptMode === 'wht' ? null : 'wht')}
                  className="aki-btn aki-btn-secondary xs"
                >
                  <Percent size={11} /> {receiptMode === 'wht' ? 'Hide WHT' : 'WHT Receipt'}
                </button>
              )}
            </>
          )}
          {invoice.eimsIrn && (
            <>
              <button type="button" onClick={handleVerify} disabled={verifying} className="aki-btn aki-btn-secondary xs">
                {verifying ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                Verify
              </button>
              {eimsStatus === 'REGISTERED' && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await eimsApi.invoices.cancel(invoice.id, '01', 'Cancelled via OVDS');
                      toast.success('Invoice cancelled with EIMS');
                      onRefresh?.();
                    } catch (e: any) {
                      toast.error(e.message ?? 'Cancellation failed');
                    }
                  }}
                  className="aki-btn aki-btn-secondary xs"
                >
                  Cancel IRN
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EimsInvoicePanel;
