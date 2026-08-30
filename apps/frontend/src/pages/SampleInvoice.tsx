/**
 * SampleInvoice
 * ─────────────────────────────────────────────────────────────────────────────
 * A fully rendered demo invoice that shows what a Starter (free trial) plan
 * invoice looks like — ERCA-compliant layout, VAT breakdown, QR placeholder,
 * printable / downloadable as PDF via the browser print dialog.
 *
 * Route: /sample-invoice  (public — no auth required)
 */
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import DOMPurify from 'dompurify';
import {
  Download, Printer, ArrowLeft, ArrowRight,
  CheckCircle2, Crown, Zap, Copy, Check,
  FileText, Shield, Globe,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Sample data — mirrors a real Starter plan invoice
// ─────────────────────────────────────────────────────────────────────────────

const INVOICE = {
  number:       'INV-2026-00142',
  date:         '2026-07-03',
  dueDate:      '2026-08-02',
  status:       'SENT',

  seller: {
    name:     'Habesha Trading PLC',
    tin:      '000123456789012',
    address:  'Bole Sub-City, Woreda 03, Addis Ababa',
    phone:    '+251 91 234 5678',
    email:    'accounts@habesha-trading.et',
  },

  customer: {
    name:     'Selam Logistics Ltd.',
    tin:      '000987654321098',
    address:  'Kirkos Sub-City, Woreda 08, Addis Ababa',
    phone:    '+251 91 876 5432',
    email:    'ovds@selamlogistics.et',
  },

  items: [
    { description: 'Office Furniture — Executive Desk (Oak)',     qty: 2,  unit: 'pcs', unitPrice: 18_500,  vatRate: 15 },
    { description: 'Ergonomic Chair (Adjustable)',                qty: 6,  unit: 'pcs', unitPrice:  4_750,  vatRate: 15 },
    { description: 'Delivery & Installation Service',            qty: 1,  unit: 'svc', unitPrice:  3_200,  vatRate: 15 },
    { description: 'Cable Management Kit',                        qty: 8,  unit: 'pcs', unitPrice:    420,  vatRate: 15 },
  ],

  currency:     'ETB',
  bankName:     'Commercial Bank of Ethiopia',
  accountNo:    '1000 3487 2901 6',
  paymentTerms: 'Net 30',
  notes:        'Payment can be made via CBE branch or Telebirr transfer. Reference invoice number on all remittances.',

  // ERCA QR data string (NBE-IQR format — simplified sample)
  ercaQrData:   'OVDS|INV-2026-00142|000123456789012|119830.00|2026-07-03|VAT:15631.30',
};

// ─────────────────────────────────────────────────────────────────────────────
// Calculations
// ─────────────────────────────────────────────────────────────────────────────

function calcItem(it: typeof INVOICE.items[0]) {
  const subtotal  = it.qty * it.unitPrice;
  const vatAmount = Math.round(subtotal * (it.vatRate / 100) * 100) / 100;
  return { subtotal, vatAmount, total: subtotal + vatAmount };
}

const itemsCalc = INVOICE.items.map(it => ({ ...it, ...calcItem(it) }));
const grandSubtotal = itemsCalc.reduce((s, it) => s + it.subtotal, 0);
const grandVat      = itemsCalc.reduce((s, it) => s + it.vatAmount, 0);
const grandTotal    = grandSubtotal + grandVat;
const drrf          = Math.round(grandSubtotal * 0.01 * 100) / 100; // 1% DRRF

const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// QR placeholder — renders as a patterned square in the demo
// ─────────────────────────────────────────────────────────────────────────────

const QRPlaceholder: React.FC<{ size?: number }> = ({ size = 88 }) => (
  <svg width={size} height={size} viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ERCA QR code placeholder">
    {/* Finder patterns */}
    {[[2,2],[58,2],[2,58]].map(([x,y],i) => (
      <g key={i}>
        <rect x={x} y={y} width={28} height={28} rx="3" fill="#1e293b"/>
        <rect x={x+4} y={y+4} width={20} height={20} rx="2" fill="white"/>
        <rect x={x+8} y={y+8} width={12} height={12} rx="1" fill="#1e293b"/>
      </g>
    ))}
    {/* Data modules */}
    {Array.from({length:64}).map((_,i) => {
      const col = (i % 8);
      const row = Math.floor(i / 8);
      if ((col < 4 && row < 4) || (col > 3 && row < 4 && col < 8 && row < 4)) return null;
      const on = (i * 37 + 13) % 3 !== 0;
      return on ? <rect key={i} x={36 + col*6} y={8  + row*6} width={5} height={5} rx="0.5" fill="#1e293b" /> : null;
    })}
    {Array.from({length:40}).map((_,i) => {
      const col = i % 8; const row = Math.floor(i / 8);
      const on = (i * 19 + 7) % 3 !== 0;
      return on ? <rect key={i} x={8  + col*6} y={36 + row*6} width={5} height={5} rx="0.5" fill="#1e293b" /> : null;
    })}
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// The invoice document itself
// ─────────────────────────────────────────────────────────────────────────────

const InvoiceDocument: React.FC<{ printMode?: boolean }> = ({ printMode = false }) => {
  const base = printMode
    ? 'bg-white text-slate-900 font-sans text-[11px] leading-relaxed'
    : 'bg-white text-slate-900 font-sans text-[11px] leading-relaxed shadow-2xl shadow-slate-300/50 rounded-2xl overflow-hidden border border-slate-200';

  return (
    <div className={base} style={{ maxWidth: 794, margin: '0 auto' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-10 pt-10 pb-6 border-b border-slate-100">
        {/* Seller */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-black">HT</span>
            </div>
            <div>
              <p className="font-black text-base text-slate-900 leading-none">{INVOICE.seller.name}</p>
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">VAT Registered</p>
            </div>
          </div>
          <p className="text-slate-500">{INVOICE.seller.address}</p>
          <p className="text-slate-500">{INVOICE.seller.phone} · {INVOICE.seller.email}</p>
          <p className="text-slate-500">TIN: <span className="font-semibold text-slate-700">{INVOICE.seller.tin}</span></p>
        </div>

        {/* Invoice metadata + ERCA badge */}
        <div className="text-right space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full mb-2">
            <Shield size={10} className="text-emerald-600" />
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">ERCA Compliant</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">INVOICE</h1>
          <p className="font-bold text-slate-600">{INVOICE.number}</p>
          <div className="space-y-0.5 mt-2">
            <p className="text-slate-500">Issue Date: <span className="font-semibold text-slate-700">{INVOICE.date}</span></p>
            <p className="text-slate-500">Due Date:   <span className="font-semibold text-slate-700">{INVOICE.dueDate}</span></p>
            <p className="text-slate-500">Terms: <span className="font-semibold text-slate-700">{INVOICE.paymentTerms}</span></p>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[9px] font-black text-blue-700 uppercase tracking-widest">
              {INVOICE.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bill To ──────────────────────────────────────────────────────── */}
      <div className="flex gap-8 px-10 py-5 bg-white border-b border-slate-100">
        <div className="flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill To</p>
          <p className="font-bold text-slate-900">{INVOICE.customer.name}</p>
          <p className="text-slate-500">{INVOICE.customer.address}</p>
          <p className="text-slate-500">{INVOICE.customer.phone} · {INVOICE.customer.email}</p>
          <p className="text-slate-500">TIN: <span className="font-semibold text-slate-700">{INVOICE.customer.tin}</span></p>
        </div>
        <div className="flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Details</p>
          <p className="text-slate-500">Bank: <span className="font-semibold text-slate-700">{INVOICE.bankName}</span></p>
          <p className="text-slate-500">Account: <span className="font-mono font-semibold text-slate-700">{INVOICE.accountNo}</span></p>
          <p className="text-slate-500">Currency: <span className="font-semibold text-slate-700">{INVOICE.currency}</span></p>
        </div>
      </div>

      {/* ── Line Items ───────────────────────────────────────────────────── */}
      <div className="px-10 py-5">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wider rounded-tl-lg" style={{width:'40%'}}>Description</th>
              <th className="px-3 py-2.5 text-center font-bold uppercase tracking-wider" style={{width:'8%'}}>Qty</th>
              <th className="px-3 py-2.5 text-center font-bold uppercase tracking-wider" style={{width:'8%'}}>Unit</th>
              <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider" style={{width:'14%'}}>Unit Price</th>
              <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider" style={{width:'10%'}}>VAT %</th>
              <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider" style={{width:'12%'}}>VAT Amt</th>
              <th className="px-3 py-2.5 text-right font-bold uppercase tracking-wider rounded-tr-lg" style={{width:'14%'}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {itemsCalc.map((it, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                <td className="px-3 py-2.5 text-slate-700 font-medium border-b border-slate-100">{it.description}</td>
                <td className="px-3 py-2.5 text-center text-slate-600 border-b border-slate-100">{it.qty}</td>
                <td className="px-3 py-2.5 text-center text-slate-500 border-b border-slate-100">{it.unit}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-700 border-b border-slate-100">{fmt(it.unitPrice)}</td>
                <td className="px-3 py-2.5 text-center text-slate-600 border-b border-slate-100">{it.vatRate}%</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-600 border-b border-slate-100">{fmt(it.vatAmount)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900 border-b border-slate-100">{fmt(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals + QR ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-6 px-10 pb-8">
        {/* QR + notes */}
        <div className="space-y-3 max-w-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 border border-slate-200 rounded-xl bg-white">
              <QRPlaceholder size={88} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ERCA QR Code</p>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Scan to verify this invoice on the ERCA e-Tax portal.
                Encodes TIN, invoice no., total &amp; VAT per NBE-IQR standard.
              </p>
            </div>
          </div>
          {INVOICE.notes && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-[9px] text-slate-500 leading-relaxed">{INVOICE.notes}</p>
            </div>
          )}
        </div>

        {/* Totals table */}
        <div className="min-w-[260px]">
          <table className="w-full text-[11px]">
            <tbody>
              {[
                { label: 'Subtotal',           value: fmt(grandSubtotal), muted: true },
                { label: `VAT (15%)`,          value: fmt(grandVat),      muted: true },
                { label: 'DRRF (1%)',          value: fmt(drrf),          muted: true },
              ].map(r => (
                <tr key={r.label}>
                  <td className="py-1 pr-4 text-slate-500 text-right">{r.label}</td>
                  <td className="py-1 font-mono text-right text-slate-600">{INVOICE.currency} {r.value}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-900">
                <td className="pt-2 pr-4 font-black text-slate-900 text-right text-sm">Grand Total</td>
                <td className="pt-2 font-black font-mono text-right text-slate-900 text-sm">{INVOICE.currency} {fmt(grandTotal + drrf)}</td>
              </tr>
            </tbody>
          </table>

          {/* Paid stamp area */}
          <div className="mt-4 flex justify-end">
            <div className="px-4 py-2 border-2 border-slate-300 rounded-xl text-center opacity-30 rotate-[-6deg]">
              <p className="text-base font-black text-slate-500 uppercase tracking-widest leading-none">Unpaid</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-10 py-4 bg-slate-900 flex items-center justify-between rounded-b-2xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-[8px] font-black">O</span>
          </div>
          <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Generated by OVDS · ovds.com.et</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-white/40">{INVOICE.number}</span>
          <span className="text-[9px] text-white/40">·</span>
          <span className="text-[9px] text-white/40">Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Page wrapper
// ─────────────────────────────────────────────────────────────────────────────

const SampleInvoice: React.FC = () => {
  usePageTitle('Sample Invoice — OVDS Starter Plan');
  const printRef  = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const sanitized = DOMPurify.sanitize(content, { FORCE_BODY: true });
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${INVOICE.number}</title>
  <meta charset="utf-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;background:white;padding:24px;color:#1e293b;font-size:11px}
    @media print{body{padding:0}@page{margin:12mm}}
  </style>
</head>
<body>${sanitized}</body>
</html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 350);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(INVOICE.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Link to="/plans" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5">
          <ArrowLeft size={12} /> Plans
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 dark:text-slate-300">Sample Invoice</span>
      </nav>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-emerald-600" />
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Free Plan Sample Invoice
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ERCA-compliant · VAT 15% · DRRF 1% · QR code · CBE bank details
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy invoice number */}
          <button
            onClick={copyNumber}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? 'Copied!' : INVOICE.number}
          </button>
          {/* Print / Save PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/10"
          >
            <Printer size={13} /> Print / Save PDF
          </button>
          {/* Get started */}
          <Link
            to="/start"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Zap size={13} /> Create yours free
          </Link>
        </div>
      </div>

      {/* Plan context banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <CheckCircle2 size={14} className="text-emerald-500" />, title: 'Starter Plan',    desc: 'Professional invoice with custom branding, VAT & DRRF auto-calculated' },
          { icon: <Shield      size={14} className="text-emerald-500" />, title: 'ERCA Compliant',  desc: 'NBE-IQR QR code on every invoice — scannable on the ERCA e-Tax portal' },
          { icon: <Globe       size={14} className="text-emerald-500" />, title: 'MoR Auto-Submit', desc: 'VAT & TOT filed directly to MoR/ERCA when you hit Send — no extra steps' },
        ].map(f => (
          <div key={f.title} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <div className="shrink-0 mt-0.5">{f.icon}</div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{f.title}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice document */}
      <div ref={printRef}>
        <InvoiceDocument />
      </div>

      {/* What's included breakdown */}
      <div className="ovds-widget-card p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">What this invoice includes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {[
            'Seller + buyer TIN on every invoice',
            'Line-item VAT 15% (Proc. 1341/2024)',
            'DRRF 1% levy (Reg. 570/2025)',
            'Grand total with all taxes consolidated',
            'ERCA-compliant NBE-IQR QR code',
            'CBE / Telebirr bank payment details',
            'Net 30 payment terms',
            'Invoice number auto-generated (INV-YYYY-XXXXX)',
            'Status badge (DRAFT / SENT / PAID / OVERDUE)',
            'Print-ready A4 layout — browser PDF or print',
          ].map(f => (
            <div key={f} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Plan upgrade callout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900 rounded-2xl shadow-2xl">
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <Crown size={15} className="text-amber-400" />
            <p className="text-sm font-black text-white">Upgrade to Business or Enterprise</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlock recurring invoices, multi-currency, full GL, all 15 MoR tax types,
            client portal, and on-premise / hybrid deployment.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/plans"
            className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all"
          >
            Compare plans
          </Link>
          <Link
            to="/getting-started/invoice-module"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all"
          >
            <Download size={13} /> Invoice Module ↓
          </Link>
          <Link
            to="/plans"
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20"
          >
            Upgrade <ArrowRight size={13} />
          </Link>
        </div>
      </div>

    </div>
  );
};

export default SampleInvoice;
