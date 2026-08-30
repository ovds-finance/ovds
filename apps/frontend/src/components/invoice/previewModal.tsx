import React, { useRef } from 'react';
import DOMPurify from 'dompurify';
import { X, Send, QrCode, BookOpen, Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { fmtDecimal } from '../../utils/fmt';

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

export const PreviewModal: React.FC<PreviewModalProps> = ({
  showPreview, newInvoice, itemsList, currency, settings, merchantId,
  onClose, onBackToEdit, onSend,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  if (!showPreview) return null;

  // -- totals ----------------------------------------------------------------
  let subtotal = 0, vatAmount = 0, discountAmount = 0;
  const filledItems = newInvoice.items.filter((li: any) => (li.itemId || li.description) && li.price > 0);
  filledItems.forEach((li: any) => {
    const item = itemsList.find((it: any) => it.id === li.itemId);
    const gross = li.price * li.quantity;
    // Support both old `discount` field and new `showDiscount + discountValue` system
    let lineDisc = 0;
    if (li.showDiscount) {
      lineDisc = li.discountType === 'PERCENT'
        ? gross * ((Number(li.discountValue) || 0) / 100)
        : Number(li.discountValue) || 0;
    } else if (li.discount) {
      lineDisc = gross * ((li.discount || 0) / 100);
    }
    const net = gross - lineDisc;
    subtotal += net;
    discountAmount += lineDisc;
    const vatRate = li.taxRate != null
      ? Number(li.taxRate)
      : (item ? Number(item.vatRate) : Number(settings?.ovds_default_vat_rate || 15));
    if (li.showTax !== false) vatAmount += net * (vatRate / 100);
  });
  const cur = newInvoice.invoiceCurrency || currency;
  const drrf = Math.round(subtotal * 0.01 * 100) / 100;
  const total = subtotal + vatAmount + drrf;
  const wht = subtotal * 0.02;
  const effectiveVatPct = subtotal > 0 ? Math.round((vatAmount / subtotal) * 100) : 0;
  const qrData = `NBE-IQR|${merchantId || settings?.ovds_merchant_id || 'Ovds-01'}|${total.toFixed(2)}|${newInvoice.invoiceNumber}|${cur}|${vatAmount.toFixed(2)}${newInvoice.id ? `|${newInvoice.id}` : ''}`;
  const isDraft = newInvoice.status === 'DRAFT';
  const fmt = (n: number) => `${cur} ${fmtDecimal(n)}`;

  const handlePrint = () => {
    const rawContent = printRef.current?.innerHTML;
    if (!rawContent) return;
    const printContent = DOMPurify.sanitize(rawContent, { FORCE_BODY: true });
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
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
  .invoice-wrap { max-width: 780px; margin: 0 auto; padding: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #00E784; }
  .company-name { font-size: 22px; font-weight: 900; color: #00E784; }
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
  .totals-row.total { border-top: 2px solid #1e293b; margin-top: 6px; padding-top: 8px; font-size: 14px; font-weight: 900; color: #00E784; }
  .totals-row.sub { color: #64748b; }
  .totals-row.vat { color: #7c3aed; font-weight: 700; }
  .totals-row.wht { color: #d97706; font-weight: 700; }
  .totals-row.disc { color: #ef4444; font-weight: 700; }
  .totals-row.drrf { color: #ea580c; font-size: 10px; }
  .notes-box { padding: 10px 14px; background: #e6faf0; border-left: 3px solid #00E784; border-radius: 4px; font-size: 11px; color: #444444; margin-bottom: 16px; }
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
  .status-DRAFT { background: #f1f5f9; color: #64748b; }
  .status-PENDING { background: #fef3c7; color: #d97706; }
  .status-PAID { background: #99ffd4; color: #00E784; }
  .status-OVERDUE { background: #fee2e2; color: #dc2626; }
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
return (<div className="fixed inset-0 z-[65] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} role="dialog" aria-modal="true"><div className="aki-card w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden" style={{ borderRadius: '16px', boxShadow: 'var(--shadow)' }}><div className="shrink-0 flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--aki-success-bg)' }}><QrCode size={13} className="text-white" /></div><div><p className="font-semibold text-sm leading-none" style={{ color: 'var(--text)' }}>Invoice Preview</p><p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-4)' }}>{newInvoice.invoiceNumber} · {newInvoice.customer || "No customer"}</p></div>{isDraft && (<span className="aki-badge xs" style={{ background: 'var(--surface-alt)', color: 'var(--text-2)' }}>Draft</span>)}</div><div className="flex items-center gap-2"><button onClick={handlePrint} className="aki-btn aki-btn-secondary xs"><Printer size={13} /> Print / PDF</button><button onClick={onBackToEdit} className="aki-btn aki-btn-secondary xs"><ArrowLeft size={13} /> Edit</button><button onClick={onClose} className="aki-btn aki-btn-ghost xs icon-only"><X size={15} /></button></div></div><div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-alt)' }}><div ref={printRef} className="aki-card mx-auto p-10 space-y-5 relative overflow-hidden" style={{ maxWidth: '780px' }}>{isDraft && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{zIndex:0}}><span className="text-[100px] font-semibold rotate-[-35deg] tracking-wider" style={{ color: 'var(--border-alt)', opacity: 0.6 }}>DRAFT</span></div>)}<div className="flex justify-between items-start pb-5 border-b-[3px] border-emerald-600" style={{position:"relative",zIndex:1}}><div>{newInvoice.companyLogo && (<img src={newInvoice.companyLogo} alt="Logo" className="h-12 object-contain mb-2 rounded" />)}<p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{newInvoice.companyTitle || "TAX INVOICE"}</p><p className="text-xs text-slate-500 mt-1">{newInvoice.companySubheading || settings?.company_name || "OVDS ovds"}</p>{settings?.company_address && <p className="ovds-caption mt-0.5">{settings.company_address}</p>}{settings?.company_tin && <p className="ovds-caption">TIN: {settings.company_tin}</p>}</div><div className="flex flex-col items-end gap-2"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrData)}`} alt="NBE QR" className="w-[90px] h-[90px] mix-blend-multiply" /><span className="text-[9px] text-violet-600 font-semibold flex items-center gap-1"><QrCode size={9} /> NBE-IQR</span></div></div><div className="ovds-grid-layout cols-2 p-4 bg-white rounded-xl border border-slate-100 text-xs" style={{position:"relative",zIndex:1}}><div><p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Invoice Details</p><div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1"><span className="text-slate-500 font-bold">Invoice #</span><span className="font-semibold text-slate-800">{newInvoice.invoiceNumber}</span><span className="text-slate-500 font-bold">Date</span><span className="text-slate-700">{newInvoice.date}</span><span className="text-slate-500 font-bold">Due</span><span className="text-slate-700">{newInvoice.dueDate || "—"}</span>{newInvoice.paymentTerms && <><span className="text-slate-500 font-bold">Terms</span><span className="text-slate-700">{newInvoice.paymentTerms}</span></>}{newInvoice.orderNumber && <><span className="text-slate-500 font-bold">Order #</span><span className="text-slate-700">{newInvoice.orderNumber}</span></>}</div><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium uppercase mt-1 ${newInvoice.status==="PAID"?"bg-emerald-100 text-emerald-700":newInvoice.status==="OVERDUE"?"bg-rose-100 text-rose-700":newInvoice.status==="DRAFT"?"bg-slate-100 text-slate-500":"bg-amber-100 text-amber-700"}`}>{newInvoice.status}</span></div><div><p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Bill To</p><p className="font-semibold text-slate-800 text-sm">{newInvoice.customer || "—"}</p>{newInvoice.customerEmail && <p className="text-slate-500">{newInvoice.customerEmail}</p>}{newInvoice.customerPhone && <p className="text-slate-500">{newInvoice.customerPhone}</p>}{newInvoice.customerTin && <p className="text-slate-500 font-mono">TIN: {newInvoice.customerTin}</p>}{newInvoice.customerAddress && <p className="text-slate-500">{newInvoice.customerAddress}</p>}</div></div><div style={{position:"relative",zIndex:1}}><table className="w-full text-xs border-collapse"><thead><tr className="bg-slate-800 text-white"><th className="text-left px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide rounded-tl-lg">Item / Description</th><th className="text-center px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-12">Qty</th><th className="text-right px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-24">Unit Price</th><th className="text-right px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-16">Disc%</th><th className="text-right px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-16">VAT%</th><th className="text-right px-3 py-2.5 font-semibold text-[10px] uppercase tracking-wide w-28 rounded-tr-lg">Net Amount</th></tr></thead><tbody>{filledItems.map((li:any,i:number)=>{const item=itemsList.find((it:any)=>it.id===li.itemId);const gross=li.price*li.quantity;const disc=gross*((li.discount||0)/100);const net=gross-disc;const vatRate=item?Number(item.vatRate):Number(settings?.ovds_default_vat_rate||15);return(<tr key={i} className={`border-b border-slate-100 ${i%2===1?"bg-slate-50/60":""}`}><td className="px-3 py-2.5"><p className="font-bold text-slate-800">{item?.name||li.description||li.itemId}</p>{li.description&&item&&<p className="text-[10px] text-slate-400 italic mt-0.5">{li.description}</p>}</td><td className="px-3 py-2.5 text-center text-slate-600">{li.quantity}</td><td className="px-3 py-2.5 text-right text-slate-600">{fmt(li.price)}</td><td className="px-3 py-2.5 text-right text-rose-500 font-bold">{(li.discount||0)>0?`-${li.discount}%`:"—"}</td><td className="px-3 py-2.5 text-right text-violet-600 font-bold">{vatRate}%</td><td className="px-3 py-2.5 text-right font-semibold text-slate-800">{fmt(net)}</td></tr>);})}{filledItems.length===0&&(<tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400 italic text-xs">No items added yet</td></tr>)}</tbody></table></div><div className="flex justify-end" style={{position:"relative",zIndex:1}}><div className="w-72 space-y-1.5 text-xs">{discountAmount>0&&(<div className="flex justify-between"><span className="text-rose-500 font-bold">Discount</span><span className="font-semibold text-rose-500">-{fmt(discountAmount)}</span></div>)}<div className="flex justify-between"><span className="text-slate-500 font-bold">Subtotal (excl. VAT)</span><span className="font-semibold text-slate-700">{fmt(subtotal)}</span></div><div className="flex justify-between"><span className="text-slate-500 font-bold flex items-center gap-1">VAT {effectiveVatPct>0&&<span className="px-1 py-0.5 bg-violet-100 text-violet-600 rounded text-[10px] font-medium">{effectiveVatPct}%</span>}</span><span className="font-semibold text-violet-700">{fmt(vatAmount)}</span></div><div className="flex justify-between"><span className="text-slate-500 font-bold flex items-center gap-1">DRRF <span className="px-1 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[10px] font-medium">1%</span></span><span className="font-semibold text-emerald-700">{fmt(drrf)}</span></div><div className="flex justify-between border-t-2 border-slate-800 pt-2 mt-1"><span className="font-semibold text-slate-800 text-sm">Total</span><span className="font-semibold text-emerald-600 dark:text-emerald-400 text-lg">{fmt(total)}</span></div><div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100"><span>DRRF (1% · Reg. 570/2025)</span><span className="text-orange-500 font-bold">{fmt(drrf)}</span></div></div></div>{newInvoice.customerNotes&&(<div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl text-xs text-emerald-800" style={{position:"relative",zIndex:1}}><p className="font-semibold text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Notes to Customer</p><p className="leading-relaxed">{newInvoice.customerNotes}</p></div>)}{(newInvoice.ifrsPerformanceObligation||newInvoice.ifrsContractRef||newInvoice.ifrsCreditRisk)&&(<div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-2" style={{position:"relative",zIndex:1}}><p className="font-semibold text-[10px] uppercase tracking-wider text-violet-700 flex items-center gap-1.5"><BookOpen size={10} /> IFRS / IASB Compliance Disclosures</p><div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">{newInvoice.ifrsPerformanceObligation&&(<><span className="text-violet-500 font-bold">Performance Obligation (IFRS 15.22)</span><span className="font-semibold text-violet-800">{newInvoice.ifrsPerformanceObligation.replace(/_/g," ")}</span></>)}{newInvoice.ifrsContractRef&&(<><span className="text-violet-500 font-bold">Contract Reference (IFRS 15.9)</span><span className="font-semibold text-violet-800 font-mono">{newInvoice.ifrsContractRef}</span></>)}{newInvoice.ifrsCreditRisk&&(<><span className="text-violet-500 font-bold">ECL Stage (IFRS 9.5.5)</span><span className={`font-semibold ${newInvoice.ifrsCreditRisk==="HIGH"?"text-rose-700":newInvoice.ifrsCreditRisk==="MEDIUM"?"text-amber-700":"text-emerald-700"}`}>{newInvoice.ifrsCreditRisk==="HIGH"?"Stage 3 — Credit-impaired":newInvoice.ifrsCreditRisk==="MEDIUM"?"Stage 2 — Underperforming":"Stage 1 — Performing"}</span></>)}{newInvoice.ifrsReceivableClass&&(<><span className="text-violet-500 font-bold">Receivable Class (IAS 1.60)</span><span className="font-semibold text-violet-800">{newInvoice.ifrsReceivableClass==="NON_CURRENT"?"Non-Current Asset":"Current Asset"}</span></>)}</div></div>)}<div className="flex items-center justify-between px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-[10px]" style={{position:"relative",zIndex:1}}><span className="font-semibold text-rose-700">🛡️ ERCA VAT Proclamation No. 1341/2024</span><div className="flex items-center gap-4 text-rose-600 font-bold"><span>Taxable: {fmt(subtotal)}</span><span>·</span><span>VAT: {fmt(vatAmount)}</span><span>·</span><span>WHT: {fmt(wht)}</span></div></div><div className="flex justify-between text-[9px] text-slate-400 pt-3 border-t border-slate-100" style={{position:"relative",zIndex:1}}><span>Generated: {new Date().toLocaleString()} · OVDS ovds</span><span>Tax Invoice — retain for your records</span></div></div></div><div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-white"><div className="flex items-center gap-2 text-xs text-slate-500">{filledItems.length>0&&(<span className="flex items-center gap-1 font-bold"><CheckCircle2 size={12} className="text-emerald-500" />{filledItems.length} item{filledItems.length!==1?"s":""} · Total: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(total)}</span></span>)}</div><div className="flex items-center gap-2"><button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"><Printer size={14} /> Print / PDF</button><button onClick={onBackToEdit} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">Edit</button><button onClick={onSend} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10/30 flex items-center gap-2"><Send size={14} /> Send Invoice</button></div></div></div></div>);};export default PreviewModal;






