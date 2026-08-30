/**
 * WHTCertificateModal — Withholding Tax Certificate Generator
 *
 * Generates ERCA-compliant WHT certificates (3% on services ≥ ETB 500,
 * 3% on goods ≥ ETB 10,000) per Proclamation No. 1395/2025.
 *
 * Fetches paid bills for the selected period, computes WHT per vendor,
 * and renders a printable certificate.
 */
import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Bill, ETH_TAX } from '@ovds/ui';
import { Icon } from './ui';
import { zIndex } from '@ovds/ui';
import api from '../services/api';
import { Can } from './can';
import { toast } from 'react-hot-toast';
import { fmtCurrencyDecimal } from '../utils/fmt';

interface VendorWHT {
  vendorName: string;
  vendorTin: string;
  totalPaid: number;
  whtRate: number;
  whtAmount: number;
  billCount: number;
  category: string;
}

interface Props {
  companyId?: string;
  companyName?: string;
  companyTin?: string;
  onClose: () => void;
}

const WHT_RATE = ETH_TAX.WHT_GOODS_RATE; // 3% — Proclamation No. 1395/2025
const SERVICE_THRESHOLD = ETH_TAX.WHT_SERVICE_THRESHOLD; // 500
const GOODS_THRESHOLD   = ETH_TAX.WHT_GOODS_THRESHOLD;   // 10,000

const fmt = (n: number) => fmtCurrencyDecimal(n, 'ETB');

const WHTCertificateModal: React.FC<Props> = ({
  companyId, companyName = 'Your Company', companyTin = '—', onClose,
}) => {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorWHT[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorWHT | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const period = `${year}-${String(month).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { status: 'PAID' };
    if (companyId) params.companyId = companyId;
    api.get('/ovds/bills', { params })
      .then((r: { data: any }) => {
        const raw: Bill[] = r.data?.data ?? r.data ?? [];
        const arr = Array.isArray(raw) ? raw : [];
        // Filter to selected period
        const filtered = arr.filter(b => {
          const d = new Date(b.createdAt || b.dueDate);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
        // Aggregate by vendor
        const map = new Map<string, VendorWHT>();
        filtered.forEach((b: Bill) => {
          const amount = Number(b.total || b.amount || 0);
          const isService = (b.category || '').toLowerCase().includes('service') ||
                            amount < GOODS_THRESHOLD;
          const threshold = isService ? SERVICE_THRESHOLD : GOODS_THRESHOLD;
          if (amount < threshold) return; // below WHT threshold
          if (!b.vendorName) return; // skip bills with no vendor

          const key = b.vendorName;
          const existing = map.get(key);
          if (existing) {
            existing.totalPaid += amount;
            existing.whtAmount += amount * WHT_RATE;
            existing.billCount += 1;
          } else {
            map.set(key, {
              vendorName: b.vendorName,
              vendorTin: b.vendorTin || '—',
              totalPaid: amount,
              whtRate: WHT_RATE * 100,
              whtAmount: amount * WHT_RATE,
              billCount: 1,
              category: isService ? 'Service' : 'Goods',
            });
          }
        });
        setVendors(Array.from(map.values()).sort((a, b) => b.whtAmount - a.whtAmount));
      })
      .catch(() => toast.error('Failed to load bills'))
      .finally(() => setLoading(false));
  }, [year, month, companyId]);

  const totalWHT = vendors.reduce((s, v) => s + v.whtAmount, 0);
  const totalPaid = vendors.reduce((s, v) => s + v.totalPaid, 0);

  const handlePrint = () => {
    if (!selectedVendor) return;
    const rawContent = printRef.current?.innerHTML;
    if (!rawContent) return;
    const content = DOMPurify.sanitize(rawContent, { FORCE_BODY: true });
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>WHT Certificate — ${selectedVendor.vendorName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        h1 { font-size: 18px; font-weight: 900; margin-bottom: 4px; }
        h2 { font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
        .amount { text-align: right; font-weight: 700; }
        .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background: #99ffd4; color: #00C96E; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const certNumber = `WHT-${year}-${String(month).padStart(2,'0')}-${String(vendors.indexOf(selectedVendor!) + 1).padStart(3,'0')}`;

  return (
    <Can permission="vat:withholding">
      <div 
        style={{ zIndex: zIndex.modal }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
      <div className="bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl shadow-2xl w-full max-w-4xl border border-ovds-border dark:border-ovds-muted-dark max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ovds-border dark:border-ovds-muted-dark">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Icon name="INVOICE" size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-ovds-text-main dark:text-ovds-surface">WHT Certificate Generator</p>
              <p className="text-xs text-ovds-text-subtle">
                Withholding Tax · 2% · Proclamation No. 1395/2025
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ovds-text-subtle hover:bg-ovds-muted dark:hover:bg-ovds-muted-dark">
            <Icon name="CLOSE" size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: vendor list */}
          <div className="w-72 shrink-0 border-r border-ovds-border dark:border-ovds-muted-dark flex flex-col">
            {/* Period selector */}
            <div className="px-4 py-3 border-b border-ovds-border dark:border-ovds-muted-dark flex gap-2">
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="flex-1 px-2 py-1.5 bg-ovds-muted dark:bg-ovds-muted-dark border border-ovds-border dark:border-ovds-muted-dark rounded-lg text-xs font-bold dark:text-ovds-surface outline-none">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="w-20 px-2 py-1.5 bg-ovds-muted dark:bg-ovds-muted-dark border border-ovds-border dark:border-ovds-muted-dark rounded-lg text-xs font-bold dark:text-ovds-surface outline-none">
                {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Summary */}
            <div className="px-4 py-3 bg-emerald-50 border-b border-ovds-border dark:border-ovds-muted-dark">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ovds-text-muted">Total Paid</span>
                <span className="font-semibold text-ovds-text-main dark:text-ovds-surface">{fmt(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ovds-text-muted">Total WHT (2%)</span>
                <span className="font-semibold text-emerald-600">{fmt(totalWHT)}</span>  // WHT @ 2%
              </div>
            </div>

            {/* Vendor list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon name="REFRESH" size={20} className="animate-spin text-ovds-text-subtle" />
                </div>
              ) : vendors.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Icon name="WARNING" size={24} className="text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-ovds-text-muted">No WHT-eligible bills found for {period}</p>
                  <p className="text-[10px] text-ovds-text-subtle mt-1">Bills must be PAID and above threshold</p>
                </div>
              ) : (
                vendors.map(v => (
                  <button
                    key={v.vendorName}
                    onClick={() => setSelectedVendor(v)}
                    className={`w-full text-left px-4 py-3 border-b border-ovds-border-subtle dark:border-ovds-muted-dark hover:bg-ovds-muted dark:hover:bg-ovds-muted-dark/50 transition-colors ${
                      selectedVendor?.vendorName === v.vendorName ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-ovds-text-main dark:text-ovds-surface truncate">{v.vendorName}</p>
                      <span className="text-[10px] font-semibold text-emerald-600">{fmt(v.whtAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-ovds-text-muted">{v.billCount} bill{v.billCount > 1 ? 's' : ''}</span>
                      <span className="text-[10px] text-ovds-text-subtle">·</span>
                      <span className="text-[10px] text-ovds-text-muted">{v.category}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: certificate preview */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedVendor ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="INVOICE" size={40} className="text-ovds-border dark:text-ovds-muted-dark mb-3" />
                <p className="text-sm font-bold text-ovds-text-muted">Select a vendor to preview certificate</p>
                <p className="text-xs text-ovds-text-subtle mt-1">
                  {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} with WHT obligations for {period}
                </p>
              </div>
            ) : (
              <>
                {/* Action bar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="SUCCESS" size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold text-ovds-text-muted dark:text-ovds-text-subtle">
                      Certificate ready — {certNumber}
                    </span>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
                  >
                    <Icon name="PRINTER" size={12} /> Print / Save PDF
                  </button>
                </div>

                {/* Certificate */}
                <div ref={printRef} className="bg-ovds-surface border-2 border-ovds-border rounded-xl p-8 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-lg font-semibold text-ovds-text-main">
                        WITHHOLDING TAX CERTIFICATE
                      </h1>
                      <h2 className="text-sm font-bold text-ovds-text-muted mt-0.5">
                        ምዝገባ ቁጥር / Certificate No: {certNumber}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-ovds-text-muted">Period</p>
                      <p className="text-sm font-semibold text-ovds-text-main">
                        {new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="ovds-grid-layout cols-2 mb-6">
                    <div className="bg-ovds-muted rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="COMPANY" size={12} className="text-ovds-text-subtle" />
                        <p className="text-[10px] font-semibold text-ovds-text-muted uppercase tracking-wider">Withholder (Payer)</p>
                      </div>
                      <p className="text-sm font-semibold text-ovds-text-main">{companyName}</p>
                      <p className="text-xs text-ovds-text-muted mt-0.5">TIN: {companyTin}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="COMPANY" size={12} className="text-emerald-600" />
                        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Withholdee (Payee)</p>
                      </div>
                      <p className="text-sm font-semibold text-ovds-text-main">{selectedVendor.vendorName}</p>
                      <p className="text-xs text-ovds-text-muted mt-0.5">TIN: {selectedVendor.vendorTin}</p>
                    </div>
                  </div>

                  {/* Details table */}
                  <table className="w-full text-sm mb-6">
                    <thead>
                      <tr className="bg-ovds-muted">
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-ovds-text-muted uppercase tracking-wider">Description</th>
                        <th className="px-4 py-2 text-right text-[10px] font-semibold text-ovds-text-muted uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-ovds-border-subtle">
                        <td className="px-4 py-3 text-ovds-text-main">
                          Total {selectedVendor.category} Payments ({selectedVendor.billCount} transaction{selectedVendor.billCount > 1 ? 's' : ''})
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-ovds-text-main">{fmt(selectedVendor.totalPaid)}</td>
                      </tr>
                      <tr className="border-b border-ovds-border-subtle">
                        <td className="px-4 py-3 text-ovds-text-main">
                          WHT Rate ({selectedVendor.category === 'Service' ? 'Services ≥ ETB 500' : 'Goods ≥ ETB 10,000'})
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-ovds-text-main">{selectedVendor.whtRate}%</td>
                      </tr>
                      <tr className="bg-emerald-50">
                        <td className="px-4 py-3 font-semibold text-ovds-text-main">
                          Withholding Tax Withheld
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 text-base">{fmt(selectedVendor.whtAmount)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-ovds-text-main">Net Amount Paid to Vendor</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {fmt(selectedVendor.totalPaid - selectedVendor.whtAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Legal basis */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-2">
                      <Icon name="WARNING" size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-600">Legal Basis</p>
                         <p className="text-[11px] text-amber-600 mt-0.5">
                           Withholding Tax at 2% per <strong>Proclamation No. 1395/2025</strong> (effective July 7, 2025).
                           Applies to service payments ≥ ETB 500 and goods payments ≥ ETB 10,000.
                           This certificate must be submitted to ERCA via the eTax portal.
                         </p>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 mt-8">
                    <div>
                      <div className="border-b-2 border-ovds-border mb-2 h-8" />
                      <p className="text-xs font-bold text-ovds-text-muted">Authorized Signatory</p>
                      <p className="text-[10px] text-ovds-text-subtle">{companyName}</p>
                    </div>
                    <div>
                      <div className="border-b-2 border-ovds-border mb-2 h-8" />
                      <p className="text-xs font-bold text-ovds-text-muted">Date Issued</p>
                      <p className="text-[10px] text-ovds-text-subtle">{new Date().toLocaleDateString('en-ET')}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-ovds-border">
                    <p className="text-[10px] text-ovds-text-subtle text-center">
                      Generated by OVDS · Ethiopian Revenue and Customs Authority (ERCA) Compliant ·
                      Proclamation No. 1395/2025 · {new Date().toISOString()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-ovds-border dark:border-ovds-muted-dark flex items-center justify-between">
          <p className="text-[10px] text-ovds-text-subtle">
            {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} · Total WHT: <strong>{fmt(totalWHT)}</strong> · Period: {period}
          </p>
          <button onClick={onClose}
            className="px-4 py-2 bg-ovds-muted dark:bg-ovds-muted-dark text-ovds-text-main dark:text-ovds-surface rounded-xl text-sm font-bold hover:bg-ovds-border-subtle transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
    </Can>
  );
};

export default WHTCertificateModal;







