import DOMPurify from 'dompurify';
import { X, Send, QrCode, BookOpen, Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import React, { useRef } from 'react';
import { createPortal } from 'react-dom';

import { QR_CODE_SERVICE_URL } from '../../utils/constants';
import { fmtDecimal } from '../../utils/fmt';
// Route all QR generation through the first-party backend proxy so TINs,
// invoice amounts, and reference numbers never leave the OVDS infrastructure.
// MoR data-privacy obligation: invoice data must not be sent to third parties.

interface PreviewModalProps {
  showPreview: boolean;
  newInvoice: any;
  itemsList: any[];
  currency: string;
  settings?: any;
  merchantId?: string;
  onClose: () => void;
  onBackToEdit: () => void;
  onSend: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve a settings boolean toggle — stored as the string 'false' to disable, anything else = enabled. Defaults to true so opt-out beats opt-in. */
function settingOn(settings: any, key: string): boolean {
  const v = settings?.[key];
  if (v === undefined || v === null) return true; // default on
  return String(v) !== 'false';
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const PreviewModal: React.FC<PreviewModalProps> = ({
  showPreview, newInvoice, itemsList, currency, settings, merchantId,
  onClose, onBackToEdit, onSend,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  if (!showPreview) return null;

  // ── Resolve per-invoice color theme ──────────────────────────────────────
  // Priority: per-invoice pick → global settings → OVDS brand default
  const themeColor: string =
    (newInvoice as any).invoiceColor ||
    settings?.invoice_theme_color ||
    '#10B981';

  // ── Resolve background image ──────────────────────────────────────────────
  const bgImageUrl: string =
    (newInvoice as any).backgroundImageUrl ||
    settings?.invoice_background_image_url ||
    '';

  // ── Content visibility (read from settings; default: all visible) ─────────
  const showLogo        = settingOn(settings, 'invoice_show_logo');
  const showQr          = settingOn(settings, 'invoice_show_qr');
  const showItemDesc    = settingOn(settings, 'invoice_show_item_desc');
  const showAmounts     = settingOn(settings, 'invoice_show_amounts');
  const showDiscountCol = settingOn(settings, 'invoice_show_discount_col');
  const showTaxCol      = settingOn(settings, 'invoice_show_tax_col');
  const showNotes       = settingOn(settings, 'invoice_show_notes');
  const showFooter      = settingOn(settings, 'invoice_show_footer');
  const showBankDetails = settingOn(settings, 'invoice_show_bank_details');

  // ── Totals ────────────────────────────────────────────────────────────────
  let subtotal = 0;
  let vatAmount = 0;
  let discountAmount = 0;

  const filledItems = (newInvoice.items || []).filter(
    (li: any) => (li.itemId || li.description) && li.price > 0,
  );

  filledItems.forEach((li: any) => {
    const item = itemsList.find((it: any) => it.id === li.itemId);
    const gross = li.price * li.quantity;
    let lineDisc = 0;
    if (li.showDiscount) {
      lineDisc =
        li.discountType === 'PERCENT'
          ? gross * ((Number(li.discountValue) || 0) / 100)
          : Number(li.discountValue) || 0;
    } else if (li.discount) {
      lineDisc = gross * ((li.discount || 0) / 100);
    }
    const net = gross - lineDisc;
    subtotal += net;
    discountAmount += lineDisc;
    const vatRate =
      li.taxRate != null
        ? Number(li.taxRate)
        : item
        ? Number(item.vatRate)
        : Number(settings?.ovds_default_vat_rate || 15);
    if (li.showTax !== false) vatAmount += net * (vatRate / 100);
  });

  const cur = newInvoice.invoiceCurrency || currency;
  const invoiceDiscVal  = Number(newInvoice.discountValue || 0);
  const invoiceDiscType = (newInvoice.discountType || 'FIXED') as 'PERCENT' | 'FIXED';
  const invoiceDiscAmt  =
    invoiceDiscType === 'PERCENT'
      ? subtotal * (invoiceDiscVal / 100)
      : invoiceDiscVal;
  const subtotalAfterDisc = Math.max(0, subtotal - invoiceDiscAmt);
  const drrf  = Math.round(subtotalAfterDisc * 0.01 * 100) / 100;
  const total = subtotalAfterDisc + vatAmount + drrf;
  // WHT rate read from settings (wht_rate key, fallback ovds_default_wht_rate, fallback 2%)
  // Statutory rates: 2% goods, 3% services (Proclamation 1395/2025 Art. 52)
  const whtRatePct = parseFloat(
    settings?.wht_rate ?? settings?.ovds_default_wht_rate ?? '2'
  ) || 2;
  const whtEnabled = settings?.wht_enabled !== 'false' && settings?.wht_enabled !== false;
  const wht = whtEnabled ? Math.round(subtotalAfterDisc * (whtRatePct / 100) * 100) / 100 : 0;
  const effectiveVatPct = subtotal > 0 ? Math.round((vatAmount / subtotal) * 100) : 0;

  const qrData = `NBE-IQR|${merchantId || settings?.ovds_merchant_id || 'Ovds-01'}|${total.toFixed(2)}|${newInvoice.invoiceNumber}|${cur}|${vatAmount.toFixed(2)}${newInvoice.id ? `|${newInvoice.id}` : ''}`;
  const isDraft = newInvoice.status === 'DRAFT';
  const fmt = (n: number) => `${cur} ${fmtDecimal(n)}`;

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrint = () => {
    const rawContent = printRef.current?.innerHTML;
    if (!rawContent) return;
    const printContent = DOMPurify.sanitize(rawContent, { FORCE_BODY: true });
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;

    // Background image CSS — only injected when a URL is present
    const bgCss = bgImageUrl
      ? `body::before {
           content: '';
           position: fixed;
           inset: 0;
           background: url('${bgImageUrl}') center/cover no-repeat;
           opacity: 0.08;
           pointer-events: none;
           z-index: 0;
         }
         .invoice-wrap { position: relative; z-index: 1; }`
      : '';

    w.document.write(`<!DOCTYPE html><html><head>
<title>Invoice ${newInvoice.invoiceNumber}</title>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: white; font-size: 11px; }
  @page { size: A4; margin: 18mm 15mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
  ${bgCss}
  .invoice-wrap { max-width: 780px; margin: 0 auto; padding: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid ${themeColor}; }
  .company-name { font-size: 22px; font-weight: 900; color: ${themeColor}; }
  .invoice-title { font-size: 13px; color: #64748b; margin-top: 2px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .meta-label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .meta-value { font-size: 11px; color: #334155; line-height: 1.6; }
  .meta-value strong { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #1e293b; color: white; }
  thead th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; }
  thead th:not(:first-child) { text-align: right; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 7px 10px; font-size: 11px; vertical-align: top; }
  tbody td:not(:first-child) { text-align: right; }
  .item-name { font-weight: 700; color: #1e293b; }
  .item-desc { font-size: 9px; color: #94a3b8; font-style: italic; margin-top: 2px; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .totals-box { width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
  .totals-row.total { border-top: 2px solid #1e293b; margin-top: 6px; padding-top: 8px; font-size: 14px; font-weight: 900; color: ${themeColor}; }
  .totals-row.sub  { color: #64748b; }
  .totals-row.vat  { color: #7c3aed; font-weight: 700; }
  .totals-row.wht  { color: #d97706; font-weight: 700; }
  .totals-row.disc { color: #ef4444; font-weight: 700; }
  .totals-row.drrf { color: #ea580c; font-size: 10px; }
  .notes-box { padding: 10px 14px; background: ${themeColor}18; border-left: 3px solid ${themeColor}; border-radius: 4px; font-size: 11px; color: #444444; margin-bottom: 16px; }
  .footer-box { padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 10px; color: #64748b; margin-bottom: 16px; }
  .ifrs-box { padding: 10px 14px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 6px; margin-bottom: 16px; }
  .ifrs-title { font-size: 9px; font-weight: 900; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  .ifrs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 10px; }
  .ifrs-key { color: #8b5cf6; font-weight: 700; }
  .ifrs-val { color: #4c1d95; font-weight: 900; }
  .erca-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; margin-bottom: 16px; font-size: 10px; }
  .erca-left { font-weight: 900; color: #be123c; }
  .erca-right { color: #e11d48; font-weight: 700; display: flex; gap: 12px; }
  .qr-section { display: flex; align-items: flex-start; gap: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .qr-label { font-size: 9px; color: #7c3aed; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
  .page-footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 80px; font-weight: 900; color: rgba(148,163,184,0.12); pointer-events: none; z-index: 0; letter-spacing: 8px; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; }
  .status-DRAFT   { background: #f1f5f9; color: #64748b; }
  .status-PENDING { background: #fef3c7; color: #d97706; }
  .status-PAID    { background: ${themeColor}22; color: ${themeColor}; }
  .status-OVERDUE { background: #fee2e2; color: #dc2626; }
  /* Visibility helpers — generated per-invoice from settings toggles */
  ${!showItemDesc    ? '.item-desc    { display: none !important; }' : ''}
  ${!showAmounts     ? '.col-price, .col-qty, .col-total, .col-unit-price { display: none !important; }' : ''}
  ${!showDiscountCol ? '.col-disc { display: none !important; }' : ''}
  ${!showTaxCol      ? '.col-vat  { display: none !important; }' : ''}
  ${!showQr          ? '.qr-section { display: none !important; }' : ''}
  ${!showBankDetails ? '.bank-details { display: none !important; }' : ''}
  ${!showNotes       ? '.notes-box { display: none !important; }' : ''}
  ${!showFooter      ? '.footer-box { display: none !important; }' : ''}
</style>
</head><body>
<div class="invoice-wrap">
${isDraft ? '<div class="watermark">DRAFT</div>' : ''}
${printContent}
</div>
</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  // ── Shared heading style tokens ───────────────────────────────────────────
  const themeText  = { color: themeColor };
  const themeBorder = `3px solid ${themeColor}`;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return createPortal(
    <div
      className="fixed inset-0 z-[310] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="aki-card w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ borderRadius: '16px', boxShadow: 'var(--shadow)' }}
      >
        {/* ── Modal header ── */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: themeColor }}
            >
              <QrCode size={13} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-none" style={{ color: 'var(--text)' }}>
                Invoice Preview
              </p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-4)' }}>
                {newInvoice.invoiceNumber} · {newInvoice.customer || 'No customer'}
              </p>
            </div>
            {isDraft && (
              <span className="aki-badge xs" style={{ background: 'var(--surface-alt)', color: 'var(--text-2)' }}>
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="aki-btn aki-btn-secondary xs">
              <Printer size={13} /> Print / PDF
            </button>
            <button onClick={onBackToEdit} className="aki-btn aki-btn-secondary xs">
              <ArrowLeft size={13} /> Edit
            </button>
            <button onClick={onClose} className="aki-btn aki-btn-ghost xs icon-only">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Scrollable preview body ── */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ background: 'var(--surface-alt)' }}
        >
          {/* Invoice document — this node is captured by printRef for printing */}
          <div
            ref={printRef}
            className="aki-card mx-auto p-10 space-y-5 relative overflow-hidden"
            style={{
              maxWidth: '780px',
              ...(bgImageUrl
                ? {
                    backgroundImage: `url('${bgImageUrl}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'overlay',
                  }
                : {}),
            }}
          >
            {/* DRAFT watermark */}
            {isDraft && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ zIndex: 0 }}
              >
                <span
                  className="text-[100px] font-semibold rotate-[-35deg] tracking-wider"
                  style={{ color: 'var(--border-alt)', opacity: 0.6 }}
                >
                  DRAFT
                </span>
              </div>
            )}

            {/* ── Header: logo / title / QR ── */}
            <div
              className="flex justify-between items-start pb-5"
              style={{ position: 'relative', zIndex: 1, borderBottom: themeBorder }}
            >
              <div>
                {/* Company logo */}
                {showLogo && newInvoice.companyLogo && (
                  <img
                    src={newInvoice.companyLogo}
                    alt="Logo"
                    className="h-12 object-contain mb-2 rounded"
                  />
                )}
                <p className="text-2xl font-semibold" style={themeText}>
                  {newInvoice.companyTitle || 'TAX INVOICE'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {newInvoice.companySubheading || settings?.company_name || 'OVDS'}
                </p>
                {settings?.company_address && (
                  <p className="ovds-caption mt-0.5">{settings.company_address}</p>
                )}
                {settings?.company_tin && (
                  <p className="ovds-caption">TIN: {settings.company_tin}</p>
                )}
              </div>
              {/* QR code — rendered via first-party proxy */}
              {showQr && (
                <div className="flex flex-col items-end gap-2">
                  <img
                    src={`${QR_CODE_SERVICE_URL}?size=90x90&data=${encodeURIComponent(qrData)}`}
                    alt="NBE-IQR QR code"
                    className="w-[90px] h-[90px] mix-blend-multiply"
                  />
                  <span className="text-[9px] text-violet-600 font-semibold flex items-center gap-1">
                    <QrCode size={9} /> NBE-IQR
                  </span>
                </div>
              )}
            </div>

            {/* ── Meta grid: invoice details + bill-to ── */}
            <div
              className="ovds-grid-layout cols-2 p-4 bg-white rounded-xl border border-slate-100 text-xs"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Invoice Details
                </p>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <span className="text-slate-500 font-bold">Invoice #</span>
                  <span className="font-semibold text-slate-800">{newInvoice.invoiceNumber}</span>
                  <span className="text-slate-500 font-bold">Date</span>
                  <span className="text-slate-700">{newInvoice.date}</span>
                  <span className="text-slate-500 font-bold">Due</span>
                  <span className="text-slate-700">{newInvoice.dueDate || '—'}</span>
                  {newInvoice.paymentTerms && (
                    <>
                      <span className="text-slate-500 font-bold">Terms</span>
                      <span className="text-slate-700">{newInvoice.paymentTerms}</span>
                    </>
                  )}
                  {newInvoice.orderNumber && (
                    <>
                      <span className="text-slate-500 font-bold">Order #</span>
                      <span className="text-slate-700">{newInvoice.orderNumber}</span>
                    </>
                  )}
                </div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium uppercase mt-1 ${
                    newInvoice.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-700'
                      : newInvoice.status === 'OVERDUE'
                      ? 'bg-rose-100 text-rose-700'
                      : newInvoice.status === 'DRAFT'
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {newInvoice.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Bill To
                </p>
                <p className="font-semibold text-slate-800 text-sm">{newInvoice.customer || '—'}</p>
                {newInvoice.customerEmail && (
                  <p className="text-slate-500">{newInvoice.customerEmail}</p>
                )}
                {newInvoice.customerPhone && (
                  <p className="text-slate-500">{newInvoice.customerPhone}</p>
                )}
                {newInvoice.customerTin && (
                  <p className="text-slate-500 font-mono">TIN: {newInvoice.customerTin}</p>
                )}
                {newInvoice.customerAddress && (
                  <p className="text-slate-500">{newInvoice.customerAddress}</p>
                )}
              </div>
            </div>

            {/* ── Line items table ── */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide rounded-tl-lg">
                      Item / Description
                    </th>
                    {showAmounts && (
                      <th className="col-qty text-center px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-12">
                        Qty
                      </th>
                    )}
                    {showAmounts && (
                      <th className="col-unit-price text-right px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-24">
                        Unit Price
                      </th>
                    )}
                    {showDiscountCol && (
                      <th className="col-disc text-right px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-16">
                        Disc
                      </th>
                    )}
                    {showTaxCol && (
                      <th className="col-vat text-right px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-16">
                        VAT%
                      </th>
                    )}
                    {showAmounts && (
                      <th className="col-total text-right px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-28 rounded-tr-lg">
                        Net Amount
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filledItems.map((li: any, i: number) => {
                    const item = itemsList.find((it: any) => it.id === li.itemId);
                    const gross = li.price * li.quantity;
                    const disc = li.showDiscount
                      ? li.discountType === 'PERCENT'
                        ? gross * ((Number(li.discountValue) || 0) / 100)
                        : Number(li.discountValue) || 0
                      : li.discount
                      ? gross * ((li.discount || 0) / 100)
                      : 0;
                    const net = gross - disc;
                    const vatRate = item
                      ? Number(item.vatRate)
                      : Number(settings?.ovds_default_vat_rate || 15);
                    return (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/60' : ''}`}
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-800">
                            {item?.name || li.description || li.itemId}
                          </p>
                          {showItemDesc && li.description && item && (
                            <p className="item-desc text-[10px] text-slate-400 italic mt-0.5">
                              {li.description}
                            </p>
                          )}
                        </td>
                        {showAmounts && (
                          <td className="col-qty px-3 py-2.5 text-center text-slate-600">
                            {li.quantity}
                          </td>
                        )}
                        {showAmounts && (
                          <td className="col-unit-price px-3 py-2.5 text-right text-slate-600">
                            {fmt(li.price)}
                          </td>
                        )}
                        {showDiscountCol && (
                          <td className="col-disc px-3 py-2.5 text-right text-rose-500 font-bold">
                            {li.showDiscount && (Number(li.discountValue) || 0) > 0
                              ? li.discountType === 'PERCENT'
                                ? `-${li.discountValue}%`
                                : `-${cur} ${Number(li.discountValue).toFixed(2)}`
                              : (li.discount || 0) > 0
                              ? `-${li.discount}%`
                              : '—'}
                          </td>
                        )}
                        {showTaxCol && (
                          <td className="col-vat px-3 py-2.5 text-right text-violet-600 font-bold">
                            {vatRate}%
                          </td>
                        )}
                        {showAmounts && (
                          <td className="col-total px-3 py-2.5 text-right font-semibold text-slate-800">
                            {fmt(net)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filledItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-slate-400 italic text-xs"
                      >
                        No items added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Totals ── */}
            <div className="flex justify-end" style={{ position: 'relative', zIndex: 1 }}>
              <div className="w-72 space-y-1.5 text-xs">
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-rose-500 font-bold">Discount</span>
                    <span className="font-semibold text-rose-500">-{fmt(discountAmount)}</span>
                  </div>
                )}
                {showAmounts && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Subtotal (excl. VAT)</span>
                    <span className="font-semibold text-slate-700">{fmt(subtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    VAT{' '}
                    {effectiveVatPct > 0 && (
                      <span className="px-1 py-0.5 bg-violet-100 text-violet-600 rounded text-[10px] font-medium">
                        {effectiveVatPct}%
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-violet-700">{fmt(vatAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    DRRF{' '}
                    <span
                      className="px-1 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: `${themeColor}18`, color: themeColor }}
                    >
                      1%
                    </span>
                  </span>
                  <span className="font-semibold" style={themeText}>
                    {fmt(drrf)}
                  </span>
                </div>
                {wht > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      WHT{' '}
                      <span className="px-1 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                        {whtRatePct}%
                      </span>
                    </span>
                    <span className="font-semibold text-amber-700">-{fmt(wht)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between border-t-2 border-slate-800 pt-2 mt-1"
                >
                  <span className="font-semibold text-slate-800 text-sm">Total</span>
                  <span className="font-semibold text-lg" style={themeText}>
                    {fmt(total)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>DRRF (1% · Reg. 570/2025)</span>
                  <span className="text-orange-500 font-bold">{fmt(drrf)}</span>
                </div>
              </div>
            </div>

            {/* ── Customer notes ── */}
            {showNotes && newInvoice.customerNotes && (
              <div
                className="p-3 rounded-r-xl text-xs"
                style={{
                  position: 'relative', zIndex: 1,
                  background: `${themeColor}10`,
                  borderLeft: `4px solid ${themeColor}`,
                  color: '#1e293b',
                }}
              >
                <p
                  className="font-semibold text-[10px] uppercase tracking-wider mb-1"
                  style={themeText}
                >
                  Notes to Customer
                </p>
                <p className="leading-relaxed">{newInvoice.customerNotes}</p>
              </div>
            )}

            {/* ── Footer / terms ── */}
            {showFooter && (newInvoice.footer || newInvoice.terms || settings?.invoice_footer) && (
              <div
                className="p-3 rounded-lg text-xs text-slate-500"
                style={{
                  position: 'relative', zIndex: 1,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <p className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Terms & Conditions
                </p>
                <p className="leading-relaxed whitespace-pre-line">
                  {newInvoice.footer || newInvoice.terms || settings?.invoice_footer}
                </p>
              </div>
            )}

            {/* ── Bank details ── */}
            {showBankDetails && settings?.company_bank_account && (
              <div
                className="p-3 rounded-lg text-xs text-slate-500"
                style={{
                  position: 'relative', zIndex: 1,
                  background: '#f8fafc',
                  border: `1px solid ${themeColor}30`,
                }}
              >
                <p
                  className="font-semibold text-[10px] uppercase tracking-wider mb-1"
                  style={themeText}
                >
                  Bank Details
                </p>
                <p>{settings.company_bank_account}</p>
              </div>
            )}

            {/* ── IFRS disclosures ── */}
            {(newInvoice.ifrsPerformanceObligation ||
              newInvoice.ifrsContractRef ||
              newInvoice.ifrsCreditRisk) && (
              <div
                className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-2"
                style={{ position: 'relative', zIndex: 1 }}
              >
                <p className="font-semibold text-[10px] uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
                  <BookOpen size={10} /> IFRS / IASB Compliance Disclosures
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
                  {newInvoice.ifrsPerformanceObligation && (
                    <>
                      <span className="text-violet-500 font-bold">Performance Obligation (IFRS 15.22)</span>
                      <span className="font-semibold text-violet-800">
                        {newInvoice.ifrsPerformanceObligation.replace(/_/g, ' ')}
                      </span>
                    </>
                  )}
                  {newInvoice.ifrsContractRef && (
                    <>
                      <span className="text-violet-500 font-bold">Contract Reference (IFRS 15.9)</span>
                      <span className="font-semibold text-violet-800 font-mono">
                        {newInvoice.ifrsContractRef}
                      </span>
                    </>
                  )}
                  {newInvoice.ifrsCreditRisk && (
                    <>
                      <span className="text-violet-500 font-bold">ECL Stage (IFRS 9.5.5)</span>
                      <span
                        className={`font-semibold ${
                          newInvoice.ifrsCreditRisk === 'HIGH'
                            ? 'text-rose-700'
                            : newInvoice.ifrsCreditRisk === 'MEDIUM'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {newInvoice.ifrsCreditRisk === 'HIGH'
                          ? 'Stage 3 — Credit-impaired'
                          : newInvoice.ifrsCreditRisk === 'MEDIUM'
                          ? 'Stage 2 — Underperforming'
                          : 'Stage 1 — Performing'}
                      </span>
                    </>
                  )}
                  {newInvoice.ifrsReceivableClass && (
                    <>
                      <span className="text-violet-500 font-bold">Receivable Class (IAS 1.60)</span>
                      <span className="font-semibold text-violet-800">
                        {newInvoice.ifrsReceivableClass === 'NON_CURRENT'
                          ? 'Non-Current Asset'
                          : 'Current Asset'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── ERCA compliance footer ── */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-[10px]"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <span className="font-semibold text-rose-700">
                🛡️ ERCA VAT Proclamation No. 1341/2024
              </span>
              <div className="flex items-center gap-4 text-rose-600 font-bold">
                <span>Taxable: {fmt(subtotal)}</span>
                <span>·</span>
                <span>VAT: {fmt(vatAmount)}</span>
                <span>·</span>
                <span>WHT {whtRatePct}%: {fmt(wht)}</span>
              </div>
            </div>

            {/* ── Page footer ── */}
            <div
              className="flex justify-between text-[9px] text-slate-400 pt-3 border-t border-slate-100"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <span>Generated: {new Date().toLocaleString()} · OVDS</span>
              <span>Tax Invoice — retain for your records</span>
            </div>
          </div>
        </div>

        {/* ── Modal footer: actions ── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {filledItems.length > 0 && (
              <span className="flex items-center gap-1 font-bold">
                <CheckCircle2 size={12} style={themeText} />
                {filledItems.length} item{filledItems.length !== 1 ? 's' : ''} · Total:{' '}
                <span className="font-semibold" style={themeText}>{fmt(total)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Printer size={14} /> Print / PDF
            </button>
            <button
              onClick={onBackToEdit}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              onClick={onSend}
              className="px-5 py-2.5 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              style={{ background: themeColor }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.filter = 'brightness(0.9)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.filter = '')}
            >
              <Send size={14} /> Send Invoice
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PreviewModal;
