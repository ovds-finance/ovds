// AddInvoiceModal — Ovds-style invoice builder
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { currencyApi } from '@ovds/features/accounting';
import { evalMath } from '@ovds/ui';
import {
  X, Mail, Phone, MapPin, Plus, Trash2, FileText, Send, Eye,
  AlertTriangle, QrCode, Save,
  ChevronLeft, ChevronRight, ChevronDown, Repeat2, Tag,
  User, CheckCircle2, ShieldCheck, Percent,
  StickyNote, LayoutTemplate, Upload, BookOpen,
  Loader2, Link2, Hash, Paperclip, UserPlus,
  GripVertical, RefreshCw, Wand2, ExternalLink,
  Columns, Sparkles, Type, Palette,
} from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

import { useBusiness } from '../../context/businessContext';
import { useWarehouses } from '../../services/inventoryApi';
import { invoicesApi } from '../../services/ovdsApi';
import { QR_CODE_SERVICE_URL } from '../../utils/constants';
import { calcLineTax } from '../../utils/ethiopianTax';
import { amountInWords } from '../../utils/fmt';
import CustomFieldRenderer, { type CustomFieldValuesMap } from '../CustomFieldRenderer';

interface AddInvoiceModalProps {
  showAddModal: boolean;
  newInvoice: any;
  setNewInvoice: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  setShowReceiptViewer: (v: boolean) => void;
  itemsList: any[];
  currency: string;
  customers: string[];
  showCustomerSuggestions: boolean;
  setShowCustomerSuggestions: (v: boolean) => void;
  applyPaymentTerms: (terms: string) => void;
  templates: any[];
  showTemplateMenu: boolean;
  setShowTemplateMenu: (v: boolean) => void;
  loadTemplate: (tpl: any) => void;
  saveTemplate: () => void;
  deleteTemplate: (name: string) => void;
  onSubmit: (e: React.FormEvent, status?: string) => void;
  onPreview: () => void;
  onOpenCustomerRegistry?: () => void;
  onAddPayment?: () => void;
  convertedFromEstimate?: string | null; // estimate number this was converted from
  settings: any;
  /** Called whenever custom field values change — parent passes to invoice save payload */
  onCustomFieldsChange?: (values: CustomFieldValuesMap) => void;
}

// ── Shared style tokens (Ovds SaaS-aligned, maps to CSS variables) ──────────
const _inp = "aki-input";
const _lbl = "aki-label";

const PAYMENT_TERMS = [
  { value: 'IMMEDIATE', label: 'Due Immediately' },
  { value: 'NET7',  label: 'Net 7 days' },
  { value: 'NET15', label: 'Net 15 days' },
  { value: 'NET30', label: 'Net 30 days' },
  { value: 'NET60', label: 'Net 60 days' },
  { value: 'NET90', label: 'Net 90 days' },
];

const PAYMENT_SOURCES = [
  { value: '',              label: 'Select source...' },
  { value: 'CASH',          label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'TELECOM',       label: 'Ethio Telecom (telebirr)' },
  { value: 'CHEQUE',        label: 'Cheque' },
  { value: 'MOBILE_BANKING',label: 'Mobile Banking' },
  { value: 'CREDIT_CARD',   label: 'Credit Card' },
];

const CURRENCIES = [
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

const RECURRING_INTERVALS = [
  { value: 'WEEKLY',    label: 'Weekly' },
  { value: 'MONTHLY',   label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY',    label: 'Yearly' },
];

const BLANK_LINE = () => ({
  id: Math.random().toString(36).substr(2, 9),
  itemId: '', quantity: 1, price: 0, description: '',
  showDiscount: false, showTax: true, showTaxPanel: false,
  discountType: 'FIXED', discountValue: 0, taxRate: null,
});

interface InvoiceTax {
  id: string; name: string; rate: number;
  type: 'PERCENT' | 'FIXED'; amount: number;
}

const PRESET_TAXES: Omit<InvoiceTax, 'id' | 'amount'>[] = [
  { name: 'VAT',    rate: 15, type: 'PERCENT' },
  { name: 'DRRF',   rate: 1,  type: 'PERCENT' },
  { name: 'WHT',    rate: 3,  type: 'PERCENT' },
  { name: 'Excise', rate: 10, type: 'PERCENT' },
];

// ── Collapsible section wrapper ──────────────────────────────────────────
const Sec: React.FC<{
  title: string; icon: React.ReactNode; open?: boolean;
  children: React.ReactNode; badge?: React.ReactNode;
}> = ({ title, icon, open: initOpen = false, children, badge }) => {
  const [open, setOpen] = useState(initOpen);
  return (
    <div style={{ borderTop: '1px solid var(--border-alt)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-3 transition-colors group"
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}
      >
        <span className="flex items-center gap-2 ovds-label">
          <span style={{ color: 'var(--text-4)', transition: 'color 120ms' }}>{icon}</span>
          {title}{badge}
        </span>
        <ChevronDown size={13} style={{ color: 'var(--text-4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 space-y-4" style={{ background: 'var(--surface-alt)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ── Ovds-style item row ──────────────────────────────────────────────
const SortableItemRow = ({ item, index, onRemove, onChange, itemsList, settings, currency, onEnterNext }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform), transition,
    zIndex: isDragging ? 50 : 0, opacity: isDragging ? 0.5 : 1,
  };

  const selectedItem = itemsList.find((it: any) => it.id === item.itemId);
  const gross   = Number(item.price) * Number(item.quantity);
  const lineDisc = item.showDiscount
    ? (item.discountType === 'PERCENT'
        ? gross * ((Number(item.discountValue) || 0) / 100)
        : (Number(item.discountValue) || 0))
    : 0;
  const lineTotal = Math.max(0, gross - lineDisc);
  const effectiveTaxRate = item.taxRate != null
    ? Number(item.taxRate)
    : (selectedItem?.vatRate ?? Number(settings?.ovds_default_vat_rate || 15));
  const lineTax  = calcLineTax(lineTotal, effectiveTaxRate);
  const stockQty = selectedItem?.stockQuantity;
  const stockBadge = stockQty != null
    ? stockQty === 0  ? { label: 'Out of stock', cls: 'aki-badge xs solid-danger' }
    : stockQty <= 10  ? { label: `${stockQty} left`, cls: 'aki-badge xs solid-warning' }
    : { label: `${stockQty} in stock`, cls: 'aki-badge xs solid-success' }
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderBottom: '1px solid var(--border-alt)', background: isDragging ? 'var(--aki-blue-50)' : undefined }}
      className="group last:border-0 transition-colors"
      onMouseEnter={e => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = 'var(--surface-alt)'; }}
      onMouseLeave={e => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = ''; }}
    >      {/* ── Main row: drag | # | item | qty | price | total | actions ── */}
      <div className="grid grid-cols-[28px_20px_1fr_72px_120px_100px_64px] gap-2 items-start px-4 py-3">
        {/* Drag handle */}
        <div {...attributes} {...listeners}
          className="mt-2.5 cursor-grab active:cursor-grabbing transition-colors"
          style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}
        >
          <GripVertical size={14} />
        </div>
        {/* Row number */}
        <div className="mt-2.5 text-[10px] font-bold tabular-nums select-none" style={{ color: 'var(--text-4)' }}>
          {index + 1}
        </div>

        {/* Item + description */}
        <div className="min-w-0 space-y-1.5">
          <select value={item.itemId}
            onChange={(e) => {
              const it = itemsList.find((i: any) => i.id === e.target.value);
              onChange(index, {
                itemId: e.target.value,
                price: it?.price || 0,
                description: it?.description || '',
                customName: '',
                taxRate: it?.vatRate !== undefined ? Number(it.vatRate) : null,
              });
            }}
            className="w-full px-2.5 py-2 aki-input cursor-pointer">
            <option value="">— Select item —</option>
            {itemsList.map((it: any) => (
              <option key={it.id} value={it.id}>{it.name}</option>
            ))}
            <option value="CUSTOM">Custom entry...</option>
          </select>

          {item.itemId === 'CUSTOM' && (
            <input type="text" placeholder="Item name..."
              value={item.customName || ''}
              onChange={(e) => onChange(index, { customName: e.target.value })}
              className="w-full px-2.5 py-1.5 aki-input" />
          )}

          <input type="text" placeholder="Description (optional)..."
            value={item.description}
            onChange={(e) => onChange(index, { description: e.target.value })}
            className="aki-input"
            style={{ background: 'transparent', borderColor: 'var(--border-alt)', color: 'var(--text-3)' }}
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            {stockBadge && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${stockBadge.cls}`}>
                {stockBadge.label}
              </span>
            )}
            {selectedItem?.unit && (
              <span className="aki-badge xs" style={{ background: 'var(--surface-alt)', color: 'var(--text-4)' }}>
                {selectedItem.unit}
              </span>
            )}
          </div>
        </div>

        {/* Qty */}
        <input type="number" min="1" step="any" value={item.quantity || ''}
          onChange={(e) => onChange(index, { quantity: e.target.value })}
          onBlur={(e) => { const v = evalMath(e.target.value); if (v !== null) onChange(index, { quantity: v }); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnterNext?.(e.currentTarget); } }}
          data-line-field
          className="w-full px-2 py-2 aki-input text-center font-semibold tabular-nums" />

        {/* Unit price */}
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none" style={{ color: 'var(--text-4)' }}>
            {currency}
          </span>
          <input type="number" step="any" value={item.price || ''}
            onChange={(e) => onChange(index, { price: e.target.value })}
            onBlur={(e) => { const v = evalMath(e.target.value); if (v !== null) onChange(index, { price: v }); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnterNext?.(e.currentTarget); } }}
            data-line-field
            className="w-full pl-8 pr-2 py-2 aki-input text-right font-semibold tabular-nums" />
        </div>

        {/* Line total */}
        <div className="pt-2 text-right">
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>
            {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          {effectiveTaxRate > 0 && (
            <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-4)' }}>+{effectiveTaxRate}% VAT</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-0.5 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onChange(index, { showTaxPanel: !item.showTaxPanel })}
            title="Tax"
            className="ovds-doc-action-btn"
            style={item.showTaxPanel ? { color: '#5B21B6', background: '#EDE9FE' } : {}}>
            <Percent size={12} />
          </button>
          <button type="button" onClick={() => onChange(index, { showDiscount: !item.showDiscount })}
            title="Discount"
            className="ovds-doc-action-btn"
            style={item.showDiscount ? { color: 'var(--aki-blue)', background: 'var(--aki-blue-50)' } : {}}>
            <Tag size={12} />
          </button>
          <button type="button" onClick={() => onRemove(index)}
            title="Remove"
            className="ovds-doc-action-btn danger">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Tax panel */}
      {item.showTaxPanel && (
        <div
          className="mx-4 mb-3 flex items-center gap-3 px-3 py-2 rounded"
          style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}
        >
          <span className="text-[11px] font-bold shrink-0 uppercase tracking-wide" style={{ color: '#5B21B6' }}>VAT</span>
          <div className="flex gap-1">
            {Array.from(new Set([0, 5, 10, 15, Number(settings?.ovds_default_vat_rate || 15)])).sort((a, b) => a - b).map((rate) => (
              <button key={rate} type="button"
                onClick={() => onChange(index, { taxRate: rate, showTaxPanel: false })}
                className="px-2.5 py-1 text-[11px] font-bold rounded transition-all"
                style={
                  effectiveTaxRate === rate
                    ? { background: '#5B21B6', color: '#fff' }
                    : { background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }
                }
              >
                {rate}%
              </button>
            ))}
          </div>
          <span className="text-[11px] ml-auto font-bold" style={{ color: '#5B21B6' }}>
            = {currency} {lineTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Discount panel */}
      {item.showDiscount && (
        <div
          className="mx-4 mb-3 flex items-center gap-3 px-3 py-2 rounded"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span className="ovds-label shrink-0">Disc.</span>
          <div className="flex p-0.5 rounded ml-auto" style={{ background: 'var(--surface-alt)' }}>
            {['FIXED', 'PERCENT'].map((t) => (
              <button key={t} type="button"
                onClick={() => onChange(index, { discountType: t })}
                className="px-2 py-0.5 text-[10px] font-bold rounded transition-all"
                style={
                  item.discountType === t
                    ? { background: 'var(--aki-blue)', color: '#fff' }
                    : { color: 'var(--text-4)' }
                }
              >
                {t === 'FIXED' ? currency : '%'}
              </button>
            ))}
          </div>
          <input
            type="number" placeholder="0" value={item.discountValue || ''}
            onChange={(e) => onChange(index, { discountValue: e.target.value })}
            className="aki-input"
            style={{ width: '80px', height: '32px', textAlign: 'right' }}
          />
          {Number(item.discountValue) > 0 && (
            <span className="text-[11px] ml-auto font-bold" style={{ color: '#F43F5E' }}>
              −{currency} {(item.discountType === 'PERCENT'
                ? Number(item.price) * Number(item.quantity) * (Number(item.discountValue) / 100)
                : Number(item.discountValue)
              ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
export default function AddInvoiceModal({
  showAddModal, newInvoice, setNewInvoice, onClose, setShowReceiptViewer,
  itemsList, currency, customers, showCustomerSuggestions, setShowCustomerSuggestions,
  applyPaymentTerms, templates, showTemplateMenu, setShowTemplateMenu,
  loadTemplate, saveTemplate, deleteTemplate, onSubmit, onPreview,
  onOpenCustomerRegistry, onAddPayment, convertedFromEstimate, settings,
  onCustomFieldsChange,
}: AddInvoiceModalProps) {
  const { warehouses } = useWarehouses();
  const { selectedCompanyId: ctxCompanyId, companies } = useBusiness();
  // Fallback: if selectedCompanyId is null but companies exist, use the first one
  const selectedCompanyId = ctxCompanyId ?? (companies.length > 0 ? companies[0].id : null);

  // ── Currency conversion ────────────────────────────────────────────────────
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const baseCurrency = (settings?.default_currency || 'ETB').toUpperCase();

  useEffect(() => {
    const cur = (newInvoice.invoiceCurrency || currency || 'ETB').toUpperCase();
    if (cur === baseCurrency) { setFxRate(1); setFxError(null); return; }
    setFxLoading(true); setFxError(null); setFxRate(null);
    currencyApi.convert(1, cur, baseCurrency)
      .then((res: any) => {
        const rate = res?.rate ?? res?.converted ?? null;
        if (rate && rate > 0) setFxRate(Number(rate));
        else setFxError('Rate unavailable');
      })
      .catch(() => setFxError('Rate unavailable'))
      .finally(() => setFxLoading(false));
  }, [newInvoice.invoiceCurrency, currency, baseCurrency]);

  const fmtFx = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const convertToBase = (amount: number) => fxRate ? Math.round(amount * fxRate * 100) / 100 : null;

  // ── Custom fields ──────────────────────────────────────────────────────────
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValuesMap>({});

  const handleCustomFieldChange = useCallback((values: CustomFieldValuesMap) => {
    setCustomFieldValues(values);
    onCustomFieldsChange?.(values);
  }, [onCustomFieldsChange]);

  // ── Invoice number loading state ─────────────────────────────────────
  // Tracks the async nextNumber API fetch so the UI can show a pending
  // indicator instead of a bare '—' while the number is being generated.
  const [isLoadingInvoiceNumber, setIsLoadingInvoiceNumber] = useState(false);

  // ── New-customer inline form state ────────────────────────────────────
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerDraft, setNewCustomerDraft] = useState({ name: '', currency: 'ETB', email: '', phone: '' });

  // ── Send To inline email panel state ─────────────────────────────────
  const [_showSendPanel, setShowSendPanel] = useState(false);
  const [_sendEmail, setSendEmail] = useState({ to: '', subject: '', message: '' });

  const commitNewCustomer = () => {
    if (!newCustomerDraft.name.trim()) { toast.error('Customer name is required'); return; }
    setNewInvoice((p: any) => ({
      ...p,
      customer: newCustomerDraft.name.trim(),
      customerEmail: newCustomerDraft.email || p.customerEmail,
      customerPhone: newCustomerDraft.phone || p.customerPhone,
      invoiceCurrency: newCustomerDraft.currency,
    }));
    setShowNewCustomerForm(false);
    setNewCustomerDraft({ name: '', currency: 'ETB', email: '', phone: '' });
    toast.success('Customer added');
  };

  const _openSendPanel = useCallback(() => {
    const subTotal = (newInvoice.items || []).reduce((acc: number, item: any) => {
      const gross = Number(item.price) * Number(item.quantity);
      const disc = item.showDiscount
        ? (item.discountType === 'PERCENT' ? gross * (Number(item.discountValue) / 100) : Number(item.discountValue))
        : 0;
      return acc + (gross - disc);
    }, 0);
    const fmtAmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
    const invoiceCur = newInvoice.invoiceCurrency || currency;
    setSendEmail({
      to: newInvoice.customerEmail || '',
      subject: `Invoice ${newInvoice.invoiceNumber || ''} from ${settings?.company_name || 'OVDS'}`,
      message: `Dear ${newInvoice.customer || 'Customer'},\n\nPlease find attached invoice ${newInvoice.invoiceNumber || ''} for ${invoiceCur} ${fmtAmt(subTotal)}.\n\nPayment is due by ${newInvoice.dueDate || '—'}.\n\nThank you for your business.`,
    });
    setShowSendPanel(true);
  }, [newInvoice, currency, settings]);

  // ── Attachments ───────────────────────────────────────────────────────
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<{ name: string; size: number; dataUrl: string }[]>([]);
  const handleAttachFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10 MB`); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments(prev => [...prev, { name: file.name, size: file.size, dataUrl: e.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeAttachment = (idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx));
  const fmtFileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setNewInvoice((prev: any) => {
        const oldIndex = prev.items.findIndex((i: any) => i.id === active.id);
        const newIndex = prev.items.findIndex((i: any) => i.id === over?.id);
        return { ...prev, items: arrayMove(prev.items, oldIndex, newIndex) };
      });
    }
  };

  const updateItem = (index: number, changes: any) =>
    setNewInvoice((prev: any) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...changes };
      return { ...prev, items };
    });

  const removeLine = (index: number) =>
    setNewInvoice((prev: any) => ({
      ...prev,
      items: prev.items.length === 1 ? [BLANK_LINE()] : prev.items.filter((_: any, i: number) => i !== index),
    }));

  const addLine = () =>
    setNewInvoice((prev: any) => ({ ...prev, items: [...prev.items, BLANK_LINE()] }));

  const focusNextLineField = useCallback((current: HTMLInputElement) => {
    const fields = Array.from(document.querySelectorAll<HTMLInputElement>('[data-line-field]'));
    const idx = fields.indexOf(current);
    const next = fields[idx + 1] ?? fields[0];
    next?.focus(); next?.select();
  }, []);

  // ── Refs ──────────────────────────────────────────────────────────────
  const customerRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const taxSelectorRef = useRef<HTMLDivElement>(null);

  const [tinValidating, setTinValidating] = useState(false);
  const [tinResult, setTinResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [showTaxSelector, setShowTaxSelector] = useState(false);

  // ── Named taxes ───────────────────────────────────────────────────────
  const addNamedTax = (preset: Omit<InvoiceTax, 'id' | 'amount'>) => {
    const taxes: InvoiceTax[] = newInvoice.taxes || [];
    if (taxes.find(t => t.name === preset.name)) { toast.error(`${preset.name} already added`); return; }
    setNewInvoice((prev: any) => ({
      ...prev,
      taxes: [...(prev.taxes || []), { ...preset, id: Math.random().toString(36).substr(2, 9), amount: 0 }],
    }));
    setShowTaxSelector(false);
  };
  const removeNamedTax = (id: string) =>
    setNewInvoice((prev: any) => ({ ...prev, taxes: (prev.taxes || []).filter((t: InvoiceTax) => t.id !== id) }));
  const addCustomTax = () => {
    setNewInvoice((prev: any) => ({
      ...prev,
      taxes: [...(prev.taxes || []), { id: Math.random().toString(36).substr(2, 9), name: 'Custom', rate: 0, type: 'PERCENT', amount: 0 }],
    }));
    setShowTaxSelector(false);
  };
  const _updateNamedTax = (id: string, changes: Partial<InvoiceTax>) =>
    setNewInvoice((prev: any) => ({
      ...prev,
      taxes: (prev.taxes || []).map((t: InvoiceTax) => t.id === id ? { ...t, ...changes } : t),
    }));

  // ── CC / BCC ──────────────────────────────────────────────────────────
  const addCcEmail = () => setNewInvoice((p: any) => ({ ...p, ccEmails: [...(p.ccEmails || []), ''] }));
  const removeCcEmail = (i: number) => setNewInvoice((p: any) => ({ ...p, ccEmails: (p.ccEmails || []).filter((_: string, idx: number) => idx !== i) }));
  const updateCcEmail = (i: number, v: string) => setNewInvoice((p: any) => { const a = [...(p.ccEmails || [])]; a[i] = v; return { ...p, ccEmails: a }; });
  const addBccEmail = () => setNewInvoice((p: any) => ({ ...p, bccEmails: [...(p.bccEmails || []), ''] }));
  const removeBccEmail = (i: number) => setNewInvoice((p: any) => ({ ...p, bccEmails: (p.bccEmails || []).filter((_: string, idx: number) => idx !== i) }));
  const updateBccEmail = (i: number, v: string) => setNewInvoice((p: any) => { const a = [...(p.bccEmails || [])]; a[i] = v; return { ...p, bccEmails: a }; });

  // ── Auto-fetch next invoice number on new-invoice open ───────────────────
  useEffect(() => {
    if (!showAddModal || newInvoice.id || newInvoice.invoiceNumber || !selectedCompanyId) return;
    // Use the typed API helper which correctly passes companyId as a query param
    setIsLoadingInvoiceNumber(true);
    invoicesApi.nextNumber(selectedCompanyId)
      .then((res: { nextNumber: string }) => {
        if (res?.nextNumber) {
          setNewInvoice((prev: any) => ({
            ...prev,
            invoiceNumber: prev.invoiceNumber || res.nextNumber,
          }));
        }
      })
      .catch(() => {/* non-fatal — user can still enter manually */})
      .finally(() => setIsLoadingInvoiceNumber(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddModal, selectedCompanyId]);

  // ── Keyboard / click-outside effects ─────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (selectedCompanyId) {
          const form = document.getElementById('invoice-form') as HTMLFormElement | null;
          form?.requestSubmit();
        }
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose, selectedCompanyId]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) setShowTemplateMenu(false);
    };
    if (showTemplateMenu) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showTemplateMenu, setShowTemplateMenu]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowCustomerSuggestions(false);
    };
    if (showCustomerSuggestions) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showCustomerSuggestions, setShowCustomerSuggestions]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (taxSelectorRef.current && !taxSelectorRef.current.contains(e.target as Node)) setShowTaxSelector(false);
    };
    if (showTaxSelector) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showTaxSelector]);

  // ── TIN validation ────────────────────────────────────────────────────
  const validateTin = useCallback(async () => {
    const tin = (newInvoice.customerTin || '').trim();
    if (!tin) { toast.error('Enter a TIN first'); return; }
    setTinValidating(true); setTinResult(null);
    await new Promise(r => setTimeout(r, 400));
    const valid = /^\d{10}$/.test(tin);
    setTinResult({ valid, message: valid ? 'TIN format valid — 10 digits ✓' : 'Invalid TIN — must be exactly 10 digits' });
    if (valid) toast.success('TIN format valid ✓'); else toast.error('Invalid TIN');
    setTinValidating(false);
  }, [newInvoice.customerTin]);

  // ── Totals ────────────────────────────────────────────────────────────
  const subtotal = (newInvoice.items || []).reduce((acc: number, item: any) => {
    const gross = Number(item.price) * Number(item.quantity);
    const disc = item.showDiscount
      ? (item.discountType === 'PERCENT' ? gross * (Number(item.discountValue) / 100) : Number(item.discountValue))
      : 0;
    return acc + (gross - disc);
  }, 0);

  const invoiceDisc = newInvoice.discountLocation !== 'LINE'
    ? (newInvoice.discountType === 'PERCENT'
        ? subtotal * ((Number(newInvoice.discountValue) || 0) / 100)
        : (Number(newInvoice.discountValue) || 0))
    : 0;
  const subtotalAfterDisc = Math.max(0, subtotal - invoiceDisc);

  const vatAmount = (newInvoice.items || []).reduce((acc: number, item: any) => {
    const gross = Number(item.price) * Number(item.quantity);
    const disc = item.showDiscount
      ? (item.discountType === 'PERCENT' ? gross * ((Number(item.discountValue) || 0) / 100) : (Number(item.discountValue) || 0))
      : 0;
    const net  = gross - disc;
    const rate = item.taxRate !== undefined && item.taxRate !== null
      ? Number(item.taxRate)
      : Number(settings?.ovds_default_vat_rate ?? 15);
    return acc + (item.showTax !== false ? calcLineTax(net, rate) : 0);
  }, 0);

  // BUG FIX (DRRF base): DRRF is levied on the post-discount subtotal, not the
  // pre-discount one. The backend's calculateInvoiceTotals() was computing
  // drrfAmount = subtotal * 0.01 (before invoice-level discount), causing the
  // stored value to exceed what the customer is shown here. Both sides now use
  // subtotalAfterDisc so the UI, the PDF, and the DB agree.
  const drrfAmount = subtotalAfterDisc * 0.01;

  // WHT note: WHT is a withholding obligation on the payer, not a tax collected
  // by the seller. It reduces the net cash received but does not change the
  // invoice total. Removed the dead `whtAmount` variable — it was computed at
  // the wrong rate (2% vs the correct ETH_TAX.WHT_GOODS_RATE of 3%) and was
  // never added to any total or rendered anywhere.

  const namedTaxes: InvoiceTax[] = (newInvoice.taxes || []).map((t: InvoiceTax) => ({
    ...t,
    amount: t.type === 'PERCENT' ? subtotalAfterDisc * (t.rate / 100) : t.rate,
  }));
  const hasNamedTaxes = namedTaxes.length > 0;
  // BUG FIX (grand total): when namedTaxes are present the old formula silently
  // dropped drrfAmount from the total. DRRF is always due regardless of whether
  // custom taxes are also applied, so it must be included in both branches.
  const grandTotal = hasNamedTaxes
    ? subtotalAfterDisc + vatAmount + drrfAmount + namedTaxes.reduce((s: number, t: InvoiceTax) => s + t.amount, 0)
    : subtotalAfterDisc + vatAmount + drrfAmount;

  const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const cur  = newInvoice.invoiceCurrency || currency;

  // ── Completeness & ERCA checks ────────────────────────────────────────
  // ── Single source of truth for ERCA completeness ─────────────────────────
  // Used both for the % score and for the rendered checklist — keeps them in sync.
  // FS No. is only required for VAT-registered businesses; treat undefined as required.
  const isNotVatRegistered = (newInvoice as any).isVatRegistered === false;
  // While the invoice number is being fetched, treat it as provisionally satisfied
  // so the score doesn't momentarily plunge to 0% on every open.
  const invoiceNumOk = !!newInvoice.invoiceNumber || !!newInvoice.id || isLoadingInvoiceNumber;
  const ercaChecks = [
    { label: 'Invoice # set',    ok: invoiceNumOk,   pending: isLoadingInvoiceNumber && !newInvoice.invoiceNumber },
    { label: 'Customer set',     ok: !!newInvoice.customer,                                                         pending: false },
    { label: 'Date set',         ok: !!newInvoice.date && !!newInvoice.dueDate,                                     pending: false },
    { label: 'Items with price', ok: (newInvoice.items || []).some((i: any) => Number(i.price) > 0),               pending: false },
    { label: 'VAT 15% applied',  ok: vatAmount > 0,                                                                pending: false },
    { label: 'Customer TIN set', ok: !!newInvoice.customerTin,                                                      pending: false },
    // FS No. required only for VAT-registered businesses
    { label: 'FS No. set',       ok: !!(newInvoice as any).fsNo || isNotVatRegistered,                              pending: false },
  ];
  const completenessScore = Math.round(
    (ercaChecks.filter(c => c.ok).length / ercaChecks.length) * 100
  );

  // No JS measurement needed — Layout sets --sidebar-w on <html> synchronously
  // on every collapse/expand. The panel uses it directly via inline style.

  // ── Wizard step state (Ovds-inspired) ───────────────────────────
  // Step 1 = Details, Step 2 = Customer, Step 3 = Items, Step 4 = Review
  const [wizardStep, setWizardStep] = useState(1);

  const hasItems = (newInvoice.items || []).some((i: any) => Number(i.price) > 0);

  // Step completion guards
  // Invoice # may arrive async from the API — treat it as done if a number is
  // being fetched (i.e. the modal is open for a new invoice with a company set).
  const step1Done = (!!newInvoice.invoiceNumber || !!newInvoice.id || !!selectedCompanyId) && !!newInvoice.date && !!newInvoice.dueDate;
  const step2Done = !!newInvoice.customer;
  const step3Done = hasItems;

  const _canGoNext = (step: number) => {
    if (step === 1) return step1Done;
    if (step === 2) return step2Done;
    if (step === 3) return step3Done;
    return true;
  };

  // Auto-advance to next step on completion
  const _goNext = () => { if (wizardStep < 4) setWizardStep(s => s + 1); };
  const _goBack = () => { if (wizardStep > 1) setWizardStep(s => s - 1); };

  if (!showAddModal) return null;


  // ════════════════════════════════════════════════════════════════════════
  // RENDER — Refrens/Ovds SaaS single-page invoice form
  // ════════════════════════════════════════════════════════════════════════
  // Portal to document.body so the modal escapes any stacking context
  // created by ancestor elements (e.g. <main overflow-y:auto> in layout.tsx).
  // Without the portal, overflow-y:auto on <main> creates a new stacking
  // context that can render above a fixed z-[310] child of the root.
  return createPortal(
    <>
      {/* Backdrop — sits between sidebar (z:110) and modal panel (z:115), only covers the content area */}
      <div
        className="fixed top-0 bottom-0 right-0 z-[112]"
        style={{ left: 'var(--sidebar-w, 0px)', background: 'rgba(10,16,30,0.35)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Full-screen panel — starts after the sidebar, sidebar (z:110) stays visible above */}
      <div
        className="fixed top-0 bottom-0 right-0 z-[113] flex flex-col overflow-hidden"
        style={{ left: 'var(--sidebar-w, 0px)', background: 'var(--surface)' }}
      >

        {/* ── TOP BAR ──────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-5" style={{ height: 48, borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <nav className="ovds-breadcrumb" style={{ marginBottom: 0 }}>
            <span className="hidden sm:inline" style={{ color: 'var(--text-4)' }}>Sales</span>
            <span className="sep hidden sm:inline">›</span>
            <span className="hidden sm:inline" style={{ color: 'var(--text-4)' }}>Invoices</span>
            <span className="sep hidden sm:inline">›</span>
            <span className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--text-2)' }}>
              {newInvoice.id ? `Edit · ${newInvoice.invoiceNumber || '—'}` : 'New Invoice'}
            </span>
            {convertedFromEstimate && (
              <span className="aki-badge sm solid-purple ml-2 hidden sm:inline-flex">↙ From {convertedFromEstimate}</span>
            )}
          </nav>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="aki-badge sm solid-info hidden md:inline-flex"><ShieldCheck size={9} /> ERCA</span>
            <span className="aki-badge sm pill hidden sm:inline-flex" style={{
              background: completenessScore === 100 ? '#D1FAE5' : completenessScore >= 60 ? '#FEF3C7' : 'var(--surface-alt)',
              color: completenessScore === 100 ? '#065F46' : completenessScore >= 60 ? '#92400E' : 'var(--text-4)',
              border: `1px solid ${completenessScore === 100 ? '#A7F3D0' : completenessScore >= 60 ? '#FDE68A' : 'var(--border-alt)'}`,
            }}>{completenessScore}%</span>
            <div ref={templateMenuRef} className="relative hidden sm:block">
              <button type="button" onClick={() => setShowTemplateMenu(!showTemplateMenu)} className="aki-btn aki-btn-secondary xs">
                <LayoutTemplate size={12} /><span className="hidden sm:inline">Templates</span>
              </button>
              {showTemplateMenu && (
                <div className="aki-flyout-menu absolute right-0 top-full mt-1.5 w-56 z-[200]" style={{ padding: 0 }}>
                  <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-alt)' }}><p className="ovds-label">Saved Templates</p></div>
                  <div className="max-h-48 overflow-y-auto">
                    {templates.length === 0 ? <p className="px-4 py-4 ovds-caption italic text-center">No templates saved</p>
                      : templates.map((tpl: any) => (
                        <div key={tpl.name} className="flex items-center justify-between px-3 py-2 group" onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          <button type="button" onClick={() => loadTemplate(tpl)} className="flex items-center gap-2 flex-1 text-left min-w-0">
                            <FileText size={12} style={{ color: 'var(--aki-blue)', flexShrink: 0 }} />
                            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>{tpl.name}</span>
                          </button>
                          <button type="button" onClick={() => deleteTemplate(tpl.name)} className="ovds-doc-action-btn opacity-0 group-hover:opacity-100"><Trash2 size={11} /></button>
                        </div>
                      ))}
                  </div>
                  <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border-alt)' }}>
                    <button type="button" onClick={() => { saveTemplate(); setShowTemplateMenu(false); }} className="w-full aki-btn aki-btn-secondary xs justify-center"><Save size={11} /> Save as template</button>
                  </div>
                </div>
              )}
            </div>
            <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
            <button type="button" onClick={onClose} className="aki-btn aki-btn-ghost xs icon-only" aria-label="Close"><X size={15} /></button>
          </div>
        </div>

        {/* ── SPLIT BODY: LEFT form 45% | RIGHT live preview 55% ─── */}
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* ══ LEFT: Form column — 45% width, min 380px ═════════════ */}
          <div className="invoice-form-col flex flex-col overflow-y-auto shrink-0" style={{ width: '45%', minWidth: 380, maxWidth: 560, borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
            <form id="invoice-form" onSubmit={onSubmit}>
              <div className="px-5 py-5 space-y-4">

                {/* ERCA notice — new invoice only */}
                {!newInvoice.id && (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg" style={{ background: 'linear-gradient(90deg,var(--aki-blue) 0%,#1a6fe8 100%)' }}>
                    <ShieldCheck size={12} className="text-white shrink-0" />
                    <span className="text-[11px] font-semibold text-white flex-1 tracking-wide">ERCA Compliant · Regulation 570/2025 · Ethiopian Tax Invoice</span>
                    <div className="flex gap-2.5 shrink-0">
                      {[
                        { l: 'TIN', d: !!settings?.company_tin },
                        { l: 'Items', d: itemsList.length > 0 },
                        { l: 'Dates', d: !!newInvoice.date && !!newInvoice.dueDate },
                      ].map(h => (
                        <span key={h.l} className="text-[10px] font-bold text-white flex items-center gap-1" style={{ opacity: h.d ? 1 : 0.55 }}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0`} style={{ background: h.d ? '#86EFAC' : 'rgba(255,255,255,0.4)' }} />
                          {h.l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit mode: draft warning */}
                {newInvoice.id && newInvoice.status === 'DRAFT' && (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[12px] font-semibold" style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                    <AlertTriangle size={13} className="shrink-0" />
                    This is a <strong>DRAFT</strong> invoice — changes are reflected to reports only after sending.
                  </div>
                )}

                {/* ── Invoice Details card ── */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                    <div className="flex items-center gap-2"><Hash size={12} style={{ color: 'var(--aki-blue)' }} /><span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>Invoice Details</span></div>
                    {newInvoice.invoiceNumber && <span className="aki-badge sm solid-info font-mono"># {newInvoice.invoiceNumber}</span>}
                  </div>
                  <div className="px-4 py-4 space-y-3">

                    {/* Row 1: Invoice # + Currency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="aki-label">Invoice #</label>
                        <div className="flex gap-1">
                          <input type="text" placeholder="INV-001" className="aki-input flex-1 min-w-0 font-mono" value={newInvoice.invoiceNumber}
                            onChange={e => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })} />
                          {!newInvoice.invoiceNumber && (
                            <button type="button" className="aki-btn aki-btn-secondary icon-only shrink-0" title="Auto-generate"
                              onClick={async () => {
                                try { const r = await invoicesApi.nextNumber(selectedCompanyId ?? ''); if (r?.nextNumber) setNewInvoice((p: any) => ({ ...p, invoiceNumber: r.nextNumber })); }
                                catch { setNewInvoice((p: any) => ({ ...p, invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100)}` })); }
                              }}><RefreshCw size={12} /></button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="aki-label">Currency</label>
                        <select className="aki-input aki-select" value={newInvoice.invoiceCurrency} onChange={e => setNewInvoice({ ...newInvoice, invoiceCurrency: e.target.value })}>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Exchange rate — only when foreign currency selected */}
                    {newInvoice.invoiceCurrency && newInvoice.invoiceCurrency !== baseCurrency && (
                      <div>
                        <label className="aki-label">Exchange Rate</label>
                        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-alt)' }}>
                          {fxLoading ? (
                            <Loader2 size={12} className="animate-spin" style={{ color: 'var(--aki-blue)' }} />
                          ) : fxRate ? (
                            <>
                              <span className="text-[11px] font-bold" style={{ color: 'var(--text-2)' }}>1 {newInvoice.invoiceCurrency} =</span>
                              <span className="text-[12px] font-black tabular-nums" style={{ color: 'var(--aki-blue)' }}>{fmtFx(fxRate)} {baseCurrency}</span>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold" style={{ color: '#F43F5E' }}>{fxError || '—'}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Row 2: Invoice Date + Due Date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="aki-label">Invoice Date <span style={{ color: '#F43F5E' }}>*</span></label>
                        <input type="date" className="aki-input" value={newInvoice.date} onChange={e => setNewInvoice({ ...newInvoice, date: e.target.value })} />
                      </div>
                      <div>
                        <label className="aki-label">Due Date <span style={{ color: '#F43F5E' }}>*</span></label>
                        <input type="date" className="aki-input" value={newInvoice.dueDate} onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} />
                      </div>
                    </div>

                    {/* Row 3: Payment Terms + Payment Source */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="aki-label">Payment Terms</label>
                        <select className="aki-input aki-select" value={newInvoice.paymentTerms} onChange={e => applyPaymentTerms(e.target.value)}>
                          {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="aki-label">Payment Source</label>
                        <select className="aki-input aki-select" value={newInvoice.paymentSource} onChange={e => setNewInvoice({ ...newInvoice, paymentSource: e.target.value })}>
                          {PAYMENT_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Order / PO # + Warehouse */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="aki-label">Order / PO #</label>
                        <input type="text" placeholder="PO-2026-001" className="aki-input" value={newInvoice.orderNumber || ''} onChange={e => setNewInvoice({ ...newInvoice, orderNumber: e.target.value })} />
                      </div>
                      <div>
                        <label className="aki-label">Warehouse</label>
                        <select className="aki-input aki-select" value={newInvoice.warehouseId || ''} onChange={e => setNewInvoice({ ...newInvoice, warehouseId: e.target.value })}>
                          <option value="">Select…</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Conditional: telebirr Reference */}
                    {newInvoice.paymentSource === 'TELECOM' && (
                      <div>
                        <label className="aki-label">telebirr Reference</label>
                        <input type="text" className="aki-input font-mono" placeholder="M-XXXXX" value={newInvoice.telecomReceiptRef || ''} onChange={e => setNewInvoice({ ...newInvoice, telecomReceiptRef: e.target.value })} />
                      </div>
                    )}

                    {/* Conditional: Bank Name */}
                    {newInvoice.paymentSource === 'BANK_TRANSFER' && (
                      <div>
                        <label className="aki-label">Bank Name</label>
                        <input type="text" className="aki-input" placeholder="CBE / Awash / Dashen…" value={newInvoice.bankName || ''} onChange={e => setNewInvoice({ ...newInvoice, bankName: e.target.value })} />
                      </div>
                    )}

                  </div>
                </div>

                {/* ── Bill To card ── */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                    <div className="flex items-center gap-2"><User size={12} style={{ color: 'var(--aki-blue)' }} /><span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>Bill To</span></div>
                    <div className="flex items-center gap-1.5">
                      {newInvoice.customer && <button type="button" onClick={() => setNewInvoice((p: any) => ({ ...p, customer: '', customerEmail: '', customerPhone: '', customerAddress: '', customerTin: '' }))} className="aki-btn aki-btn-ghost xs"><X size={10} /> Change</button>}
                      {!newInvoice.customer && !showNewCustomerForm && <button type="button" onClick={() => setShowNewCustomerForm(true)} className="aki-btn aki-btn-primary xs"><UserPlus size={11} /> New</button>}
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {!newInvoice.customer && !showNewCustomerForm && (
                      <div ref={customerRef} className="relative">
                        <div className="aki-input-group">
                          <User size={12} className="aki-input-icon" />
                          <input type="text" placeholder="Search customers…" className="aki-input"
                            onChange={e => { setNewInvoice((p: any) => ({ ...p, _customerSearch: e.target.value })); setShowCustomerSuggestions(true); }}
                            onFocus={() => setShowCustomerSuggestions(true)} />
                        </div>
                        {showCustomerSuggestions && customers.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
                            <div className="max-h-[180px] overflow-y-auto p-1">
                              {customers.filter(c => c.toLowerCase().includes((newInvoice._customerSearch || '').toLowerCase())).map((c, i) => (
                                <button key={i} type="button" onClick={() => { setNewInvoice((p: any) => ({ ...p, customer: c, _customerSearch: undefined })); setShowCustomerSuggestions(false); }}
                                  className="w-full text-left px-3 py-2 text-[13px] font-semibold rounded-lg flex items-center gap-2.5 hover:bg-[var(--pro-azure-50)] transition-colors" style={{ color: 'var(--text-2)' }}>
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: 'var(--surface-alt)', color: 'var(--text-3)' }}>{c[0]?.toUpperCase()}</div>
                                  {c}
                                </button>
                              ))}
                            </div>
                            <div className="p-2" style={{ borderTop: '1px solid var(--border-alt)' }}>
                              <button type="button" onClick={() => { setShowCustomerSuggestions(false); setShowNewCustomerForm(true); }}
                                className="w-full flex items-center justify-center gap-2 py-1.5 text-[12px] font-bold rounded-lg hover:bg-[var(--pro-azure-50)] transition-colors" style={{ color: 'var(--aki-blue)' }}>
                                <UserPlus size={12} /> New Customer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {showNewCustomerForm && (
                      <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--aki-blue-50)', border: '1px solid var(--aki-blue-100)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: 'var(--aki-blue)' }}><UserPlus size={10} /> New Customer</span>
                          <button type="button" onClick={() => setShowNewCustomerForm(false)} className="aki-btn aki-btn-ghost xs icon-only"><X size={10} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="aki-field col-span-2">
                            <label className="aki-label required">Name</label>
                            <input type="text" placeholder="Customer name" className="aki-input" autoFocus value={newCustomerDraft.name}
                              onChange={e => setNewCustomerDraft(p => ({ ...p, name: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitNewCustomer(); } }} />
                          </div>
                          <div className="aki-field">
                            <label className="aki-label">Currency</label>
                            <select className="aki-input aki-select" value={newCustomerDraft.currency} onChange={e => setNewCustomerDraft(p => ({ ...p, currency: e.target.value }))}>
                              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
                            </select>
                          </div>
                          <div className="aki-field">
                            <label className="aki-label">Email</label>
                            <input type="email" placeholder="email@example.com" className="aki-input" value={newCustomerDraft.email} onChange={e => setNewCustomerDraft(p => ({ ...p, email: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={commitNewCustomer} className="flex-1 aki-btn aki-btn-primary xs justify-center"><CheckCircle2 size={11} /> Save & Select</button>
                          <button type="button" onClick={onOpenCustomerRegistry} className="aki-btn aki-btn-secondary xs">Full Form</button>
                        </div>
                      </div>
                    )}
                     {newInvoice.customer && !showNewCustomerForm && (
                       <div className="space-y-3">
                         <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                           <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0" style={{ background: '#D1FAE5', color: '#065F46' }}>{newInvoice.customer[0]?.toUpperCase()}</div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>{newInvoice.customer}</p>
                             {newInvoice.customerEmail && <p className="text-[10px] truncate" style={{ color: 'var(--text-4)' }}>{newInvoice.customerEmail}</p>}
                           </div>
                           <CheckCircle2 size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div className="aki-field">
                             <label className="aki-label">Email</label>
                             <div className="aki-input-group"><Mail size={12} className="aki-input-icon" /><input type="email" placeholder="customer@email.com" className="aki-input" value={newInvoice.customerEmail || ''} onChange={e => setNewInvoice({ ...newInvoice, customerEmail: e.target.value })} /></div>
                           </div>
                           <div className="aki-field">
                             <label className="aki-label">Phone</label>
                             <div className="aki-input-group"><Phone size={12} className="aki-input-icon" /><input type="tel" placeholder="+251 9XX XXX XXX" className="aki-input" value={newInvoice.customerPhone || ''} onChange={e => setNewInvoice({ ...newInvoice, customerPhone: e.target.value })} /></div>
                           </div>
                         </div>
                         <div className="aki-field">
                           <label className="aki-label">TIN (Buyer)</label>
                           <div className="flex gap-1">
                             <input type="text" placeholder="0000000000" maxLength={10} className="aki-input font-mono flex-1" value={newInvoice.customerTin || ''} onChange={e => {
                               const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                               setNewInvoice({ ...newInvoice, customerTin: val });
                             }} />
                             <button type="button" onClick={validateTin} disabled={tinValidating || !newInvoice.customerTin} className="aki-btn aki-btn-secondary xs shrink-0">
                               {tinValidating ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
                             </button>
                           </div>
                           {tinResult && <p className="aki-field-hint mt-1 flex items-center gap-1 font-semibold" style={{ color: tinResult.valid ? '#4FBA6F' : '#E11D48' }}>{tinResult.valid ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />} {tinResult.message}</p>}
                           <p className="aki-field-hint mt-1" style={{ color: 'var(--text-4)' }}>10-digit buyer TIN — must not match your company TIN</p>
                         </div>
                         <div className="pt-2" style={{ borderTop: '1px solid var(--border-alt)' }}>
                           <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Buyer Address (B2B)</p>
                           <div className="grid grid-cols-2 gap-2">
                             <div className="aki-field">
                               <label className="aki-label">Region</label>
                               <input type="text" placeholder="e.g. Addis Ababa" className="aki-input" value={newInvoice.buyerRegion || ''} onChange={e => setNewInvoice({ ...newInvoice, buyerRegion: e.target.value })} />
                             </div>
                             <div className="aki-field">
                               <label className="aki-label">Zone</label>
                               <input type="text" placeholder="e.g. Bole" className="aki-input" value={newInvoice.buyerZone || ''} onChange={e => setNewInvoice({ ...newInvoice, buyerZone: e.target.value })} />
                             </div>
                             <div className="aki-field">
                               <label className="aki-label">Wereda</label>
                               <input type="text" placeholder="Wereda number" className="aki-input" value={newInvoice.buyerWereda || ''} onChange={e => setNewInvoice({ ...newInvoice, buyerWereda: e.target.value })} />
                             </div>
                             <div className="aki-field">
                               <label className="aki-label">Kebele</label>
                               <input type="text" placeholder="e.g. 101" className="aki-input" value={newInvoice.buyerKebele || ''} onChange={e => setNewInvoice({ ...newInvoice, buyerKebele: e.target.value })} />
                             </div>
                             <div className="aki-field">
                               <label className="aki-label">City / Sub-city</label>
                               <input type="text" placeholder="e.g. Bole" className="aki-input" value={newInvoice.buyerCity || ''} onChange={e => setNewInvoice({ ...newInvoice, buyerCity: e.target.value })} />
                             </div>
                             <div className="aki-field">
                               <label className="aki-label">House Number</label>
                               <input type="text" placeholder="e.g. 123B" className="aki-input" value={newInvoice.buyerHouseNumber || ''} onChange={e => setNewInvoice({ ...newInvoice, buyerHouseNumber: e.target.value })} />
                             </div>
                           </div>
                         </div>
                         <div className="aki-field">
                           <label className="aki-label">Billing Address (summary)</label>
                           <div className="aki-input-group"><MapPin size={12} className="aki-input-icon" /><input type="text" placeholder="Addis Ababa, Ethiopia" className="aki-input" value={newInvoice.customerAddress || ''} onChange={e => setNewInvoice({ ...newInvoice, customerAddress: e.target.value })} /></div>
                         </div>
                         <div className="aki-field col-span-2">
                           <label className="aki-label">FS No. (SRM / ERCA TASS)</label>
                           <div className="aki-input-group"><ShieldCheck size={12} className="aki-input-icon" /><input type="text" placeholder="FSR-2025-XXXXXX" maxLength={50} className="aki-input font-mono" value={(newInvoice as any).fsNo || ''} onChange={e => setNewInvoice({ ...newInvoice, fsNo: e.target.value.toUpperCase() } as any)} /></div>
                         </div>
                       </div>
                     )}
                  </div>
                </div>

                {/* ── Line Items card ── */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                    <div className="flex items-center gap-2"><FileText size={12} style={{ color: 'var(--aki-blue)' }} /><span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>Line Items</span></div>
                    <span className="aki-badge sm solid-default">{(newInvoice.items || []).filter((i: any) => Number(i.price) > 0).length} line{(newInvoice.items || []).filter((i: any) => Number(i.price) > 0).length !== 1 ? 's' : ''}</span>
                  </div>
                  {/* Column headers */}
                  <div className="grid gap-2 px-4 py-2" style={{ gridTemplateColumns: '28px 20px 1fr 72px 120px 100px 64px', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-alt)' }}>
                    <div /><div />
                    <span className="ovds-label">Item</span>
                    <span className="ovds-label text-center">Qty</span>
                    <span className="ovds-label text-right">Price</span>
                    <span className="ovds-label text-right">Total</span>
                    <div />
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={newInvoice.items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                      {newInvoice.items.map((item: any, index: number) => (
                        <SortableItemRow key={item.id} item={item} index={index} onRemove={removeLine} onChange={updateItem} itemsList={itemsList} settings={settings} currency={cur} onEnterNext={focusNextLineField} />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <button type="button" onClick={addLine}
                    className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors"
                    style={{ borderTop: '1px dashed var(--border)', color: 'var(--text-4)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--aki-blue-50)'; (e.currentTarget as HTMLElement).style.color = 'var(--aki-blue)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-alt)' }}><Plus size={12} /></span>
                    Add an Item
                  </button>
                  {/* Totals */}
                  {(newInvoice.items || []).some((i: any) => Number(i.price) > 0) && (
                    <div className="px-5 py-4 flex justify-end" style={{ borderTop: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                      <div className="w-full max-w-xs space-y-1.5">
                        <div className="flex justify-between text-[13px]"><span style={{ color: 'var(--text-3)' }}>Subtotal</span><span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{cur} {fmt2(subtotal)}</span></div>
                        {/* Discount row */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: 'var(--surface)', border: '1px solid var(--border-alt)' }}>
                          <Tag size={11} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-4)' }}>Disc.</span>
                          <div className="flex p-0.5 ml-auto rounded" style={{ background: 'var(--surface-alt)' }}>
                            {['FIXED', 'PERCENT'].map(t => (
                              <button key={t} type="button" onClick={() => setNewInvoice({ ...newInvoice, discountType: t })}
                                className="px-2 py-0.5 text-[10px] font-bold rounded"
                                style={{ background: newInvoice.discountType === t ? 'var(--aki-blue)' : 'transparent', color: newInvoice.discountType === t ? '#fff' : 'var(--text-4)' }}>
                                {t === 'FIXED' ? cur : '%'}
                              </button>
                            ))}
                          </div>
                          <input type="number" min="0" step="any" placeholder="0" className="aki-input" style={{ width: 72, height: 28, textAlign: 'right', fontSize: 12 }}
                            value={newInvoice.discountValue || ''} onChange={e => setNewInvoice({ ...newInvoice, discountValue: e.target.value })} />
                        </div>
                        {invoiceDisc > 0 && <div className="flex justify-between text-[13px]"><span style={{ color: '#F43F5E' }}>Discount</span><span className="font-semibold tabular-nums" style={{ color: '#F43F5E' }}>− {cur} {fmt2(invoiceDisc)}</span></div>}
                        {vatAmount > 0 && <div className="flex justify-between text-[13px]"><span style={{ color: '#8B5CF6' }}>VAT (15%)</span><span className="font-semibold tabular-nums" style={{ color: '#8B5CF6' }}>{cur} {fmt2(vatAmount)}</span></div>}
                        {!hasNamedTaxes && subtotal > 0 && <div className="flex justify-between text-[13px]"><span style={{ color: 'var(--text-3)' }}>DRRF (1%)</span><span className="font-semibold tabular-nums" style={{ color: 'var(--text-2)' }}>{cur} {fmt2(drrfAmount)}</span></div>}
                        {namedTaxes.map((t: InvoiceTax) => (
                          <div key={t.id} className="flex justify-between items-center group text-[13px]">
                            <span className="flex items-center gap-1" style={{ color: '#10B981' }}>{t.name} {t.type === 'PERCENT' ? `${t.rate}%` : ''}<button type="button" onClick={() => removeNamedTax(t.id)} className="ovds-doc-action-btn opacity-0 group-hover:opacity-100" style={{ width: 14, height: 14 }}><X size={9} /></button></span>
                            <span className="font-semibold tabular-nums" style={{ color: '#10B981' }}>{cur} {fmt2(t.amount)}</span>
                          </div>
                        ))}
                        {/* Add tax */}
                        <div ref={taxSelectorRef} className="relative">
                          <button type="button" onClick={() => setShowTaxSelector(v => !v)} className="aki-btn aki-btn-ghost xs" style={{ color: 'var(--aki-blue)' }}><Plus size={11} /> Add Tax</button>
                          {showTaxSelector && (
                            <div className="aki-flyout-menu absolute bottom-full left-0 mb-1 w-44 z-50" style={{ padding: 0 }}>
                              <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-alt)' }}><p className="ovds-label">Add Tax</p></div>
                              {PRESET_TAXES.map(pt => (
                                <button key={pt.name} type="button" onClick={() => addNamedTax(pt)} className="w-full flex items-center justify-between px-3 py-2 transition-colors"
                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--aki-blue-50)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{pt.name}</span><span className="ovds-caption">{pt.rate}%</span>
                                </button>
                              ))}
                              <button type="button" onClick={addCustomTax} className="w-full flex items-center gap-2 px-3 py-2 transition-colors" style={{ borderTop: '1px solid var(--border-alt)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                <Plus size={11} style={{ color: 'var(--text-4)' }} /><span className="text-[12px] font-semibold" style={{ color: 'var(--text-3)' }}>Custom tax…</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Grand total */}
                        <div className="pt-2 flex justify-between items-baseline" style={{ borderTop: '2px solid var(--border)' }}>
                          <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>Total ({cur})</span>
                          <span className="text-[20px] font-black tabular-nums" style={{ color: 'var(--aki-blue)', letterSpacing: '-0.02em' }}>{fmt2(grandTotal)}</span>
                        </div>
                        <p className="text-[10px] italic mt-1 leading-relaxed" style={{ color: 'var(--text-4)' }}>{amountInWords(grandTotal, cur)}</p>
                        {fxRate && fxRate !== 1 && (
                          <div className="pt-1 flex justify-between items-baseline">
                            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-4)' }}>= {baseCurrency}</span>
                            <span className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--text-3)' }}>{fmt2(convertToBase(grandTotal)!)} {baseCurrency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Branding & Layout card ── */}
                {(() => {
                  const activeColor = (newInvoice as any).invoiceColor || '#10B981';
                  return (
                    <div className="rounded-xl border border-slate-200 overflow-hidden" style={{ background: 'var(--surface)' }}>
                      {/* Card header — live color accent strip */}
                      <div
                        className="flex items-center gap-2 px-4 py-2.5"
                        style={{
                          borderBottom: '1px solid var(--border-alt)',
                          background: `linear-gradient(90deg, ${activeColor}18 0%, var(--surface-alt) 60%)`,
                          borderLeft: `3px solid ${activeColor}`,
                        }}
                      >
                        <LayoutTemplate size={12} style={{ color: activeColor }} />
                        <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>Branding & Layout</span>
                        {/* Live color dot */}
                        <span
                          className="ml-auto w-4 h-4 rounded-full border-2 border-white/60 shadow-sm shrink-0"
                          style={{ background: activeColor }}
                          title={`Active theme: ${activeColor}`}
                        />
                      </div>

                      <div className="px-4 py-3 space-y-3">
                        {/* Document title + layout */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="aki-field">
                            <label className="aki-label">Document Title</label>
                            <select
                              className="aki-input aki-select"
                              value={(newInvoice as any).companyTitle || 'TAX INVOICE'}
                              onChange={e => setNewInvoice({ ...newInvoice, companyTitle: e.target.value } as any)}
                            >
                              {['TAX INVOICE', 'INVOICE', 'PROFORMA INVOICE', 'RECEIPT', 'QUOTE', 'CREDIT NOTE', 'DEBIT NOTE'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div className="aki-field">
                            <label className="aki-label">Layout Template</label>
                            <select
                              className="aki-input aki-select"
                              value={(newInvoice as any).invoiceTemplate || 'modern'}
                              onChange={e => setNewInvoice({ ...newInvoice, invoiceTemplate: e.target.value } as any)}
                            >
                              <option value="simple">Simple</option>
                              <option value="modern">Modern</option>
                              <option value="detailed">Detailed</option>
                              <option value="compact">Compact</option>
                            </select>
                          </div>
                        </div>

                        {/* Color theme */}
                        <div className="aki-field">
                          <label className="aki-label flex items-center gap-1.5">
                            <Palette size={11} style={{ color: 'var(--text-4)' }} />
                            Invoice Color Theme
                          </label>
                          <div className="flex gap-2 flex-wrap items-center">
                            {[
                              { name: 'Emerald',  value: '#10B981' },
                              { name: 'Blue',     value: '#2563EB' },
                              { name: 'Indigo',   value: '#4F46E5' },
                              { name: 'Violet',   value: '#7C3AED' },
                              { name: 'Purple',   value: '#6366F1' },
                              { name: 'Rose',     value: '#E11D48' },
                              { name: 'Amber',    value: '#D97706' },
                              { name: 'Teal',     value: '#0D9488' },
                              { name: 'Slate',    value: '#475569' },
                              { name: 'Black',    value: '#111827' },
                            ].map(c => (
                              <button
                                key={c.name}
                                type="button"
                                title={c.name}
                                onClick={() => setNewInvoice({ ...newInvoice, invoiceColor: c.value } as any)}
                                className="w-6 h-6 rounded-md border-2 transition-all focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
                                style={{
                                  background: c.value,
                                  borderColor: activeColor === c.value ? '#111827' : 'transparent',
                                  transform: activeColor === c.value ? 'scale(1.25)' : 'scale(1)',
                                  boxShadow: activeColor === c.value ? `0 0 0 1px white, 0 0 0 3px ${c.value}` : 'none',
                                }}
                                aria-label={c.name}
                                aria-pressed={activeColor === c.value}
                              />
                            ))}
                            {/* Custom hex */}
                            <div className="flex items-center gap-1.5 ml-1">
                              <div className="w-5 h-5 rounded border border-slate-200 dark:border-slate-600 shrink-0" style={{ background: activeColor }} />
                              <input
                                type="text"
                                maxLength={7}
                                value={activeColor}
                                onChange={e => {
                                  const v = e.target.value;
                                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setNewInvoice({ ...newInvoice, invoiceColor: v } as any);
                                }}
                                className="aki-input text-xs font-mono"
                                style={{ width: 72 }}
                                placeholder="#10B981"
                                aria-label="Custom color hex"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Custom background URL */}
                        <div className="aki-field">
                          <label className="aki-label flex items-center gap-1.5">
                            <Type size={11} style={{ color: 'var(--text-4)' }} />
                            Background Image URL
                            <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">Pro</span>
                          </label>
                          <input
                            type="url"
                            className="aki-input"
                            placeholder="https://cdn.example.com/letterhead.png"
                            value={(newInvoice as any).backgroundImageUrl || ''}
                            onChange={e => setNewInvoice({ ...newInvoice, backgroundImageUrl: e.target.value } as any)}
                          />
                          <p className="text-[9px] mt-1" style={{ color: 'var(--text-4)' }}>
                            Use a letterhead or watermark image as the PDF background. Full layout control available in the{' '}
                            <a href="/apps/invoice-templates" className="font-semibold" style={{ color: 'var(--aki-blue)' }}>Template Builder</a>.
                          </p>
                        </div>

                        {/* Custom Terms & Conditions */}
                        <div className="aki-field">
                          <label className="aki-label">Custom Terms & Conditions</label>
                          <textarea
                            placeholder="Payment terms, late fees, dispute resolution…"
                            className="aki-textarea"
                            style={{ minHeight: 48 }}
                            value={(newInvoice as any).terms || ''}
                            onChange={e => setNewInvoice({ ...newInvoice, terms: e.target.value } as any)}
                          />
                        </div>

                        {/* Template builder callout */}
                        <div
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
                          style={{ background: 'linear-gradient(90deg,#7c3aed18,#6366f110)', border: '1px solid #c4b5fd50' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Wand2 size={13} style={{ color: '#7C3AED', flexShrink: 0 }} />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold truncate" style={{ color: '#5b21b6' }}>Print-ready Invoice Template App</p>
                              <p className="text-[9px] leading-tight" style={{ color: '#7c3aed' }}>
                                Drag-and-drop builder · unlimited custom fields · multiple templates
                              </p>
                            </div>
                          </div>
                          <a
                            href="/apps/invoice-templates"
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors"
                            style={{ background: '#7C3AED' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#6d28d9')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#7C3AED')}
                          >
                            Open <ExternalLink size={9} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Notes, Footer & Options card ── */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                    <StickyNote size={12} style={{ color: 'var(--text-3)' }} />
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>Notes & Options</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="aki-field">
                        <label className="aki-label">Customer Notes</label>
                        <textarea placeholder="Visible to the customer…" className="aki-textarea" style={{ minHeight: 64 }} value={newInvoice.customerNotes || ''} onChange={e => setNewInvoice({ ...newInvoice, customerNotes: e.target.value })} />
                      </div>
                      <div className="aki-field">
                        <label className="aki-label">Invoice Footer</label>
                        <textarea placeholder="Bank details, payment instructions…" className="aki-textarea" style={{ minHeight: 64 }} value={newInvoice.footer || ''} onChange={e => setNewInvoice({ ...newInvoice, footer: e.target.value })} />
                      </div>
                    </div>
                    {/* Recurring */}
                    <label className="flex items-center gap-3 cursor-pointer select-none p-2.5 rounded-lg" style={{ background: newInvoice.isRecurring ? '#F5F3FF' : 'var(--surface-alt)', border: `1px solid ${newInvoice.isRecurring ? '#DDD6FE' : 'var(--border-alt)'}` }}>
                      <input type="checkbox" checked={!!newInvoice.isRecurring} onChange={e => setNewInvoice({ ...newInvoice, isRecurring: e.target.checked })} className="w-4 h-4 rounded shrink-0" style={{ accentColor: '#7C3AED' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Repeat automatically</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>Auto-generates on the selected interval</p>
                      </div>
                      {newInvoice.isRecurring && (
                        <select className="aki-input aki-select ml-2 shrink-0" style={{ width: 110 }} value={newInvoice.recurringInterval} onChange={e => setNewInvoice({ ...newInvoice, recurringInterval: e.target.value })}>
                          {RECURRING_INTERVALS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      )}
                    </label>
                    {/* Email CC/BCC */}
                    <div className="space-y-2">
                      {['ccEmails', 'bccEmails'].map(field => {
                        const isCC = field === 'ccEmails';
                        const list: string[] = newInvoice[field] || [];
                        const add = isCC ? addCcEmail : addBccEmail;
                        const remove = isCC ? removeCcEmail : removeBccEmail;
                        const update = isCC ? updateCcEmail : updateBccEmail;
                        return (
                          <div key={field} className="flex items-start gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide mt-2.5 w-8 shrink-0" style={{ color: 'var(--text-4)' }}>{isCC ? 'CC' : 'BCC'}</span>
                            <div className="flex-1 space-y-1.5">
                              {list.map((email, i) => (
                                <div key={i} className="flex gap-1.5">
                                  <input type="email" placeholder={`${isCC ? 'cc' : 'bcc'}@example.com`} className="aki-input flex-1" value={email} onChange={e => update(i, e.target.value)} />
                                  <button type="button" onClick={() => remove(i)} className="aki-btn aki-btn-secondary icon-only"><X size={11} /></button>
                                </div>
                              ))}
                              <button type="button" onClick={add} className="aki-btn aki-btn-ghost xs" style={{ color: 'var(--aki-blue)' }}><Plus size={10} /> Add</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Attachments */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="ovds-label">Attachments</p>
                        <button type="button" onClick={() => attachInputRef.current?.click()} className="aki-btn aki-btn-secondary xs"><Paperclip size={11} /> Attach</button>
                        <input ref={attachInputRef} type="file" multiple className="hidden" onChange={e => handleAttachFiles(e.target.files)} />
                      </div>
                      {attachments.length > 0 ? (
                        <div className="space-y-1">
                          {attachments.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-alt)' }}>
                              <Paperclip size={11} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                              <span className="text-[11px] font-medium flex-1 truncate" style={{ color: 'var(--text-2)' }}>{f.name}</span>
                              <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>{fmtFileSize(f.size)}</span>
                              <button type="button" onClick={() => removeAttachment(i)} className="ovds-doc-action-btn danger"><X size={10} /></button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-[11px] italic" style={{ color: 'var(--text-4)' }}>PDF / images up to 10 MB each</p>}
                    </div>
                    {/* IFRS advanced (collapsible) */}
                    <Sec title="IFRS & Advanced" icon={<BookOpen size={12} />}>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {[
                          { label: 'Performance Obligation', key: 'ifrsPerformanceObligation', type: 'text', placeholder: 'e.g. Consulting services' },
                          { label: 'Contract Reference', key: 'ifrsContractRef', type: 'text', placeholder: 'CTR-2026-001' },
                          { label: 'ECL Provision %', key: 'ifrsEclProvision', type: 'number', placeholder: '2.5' },
                          { label: 'Late Interest % p.a.', key: 'lateInterestRate', type: 'number', placeholder: '15' },
                        ].map(f => (
                          <div key={f.key} className="aki-field">
                            <label className="aki-label">{f.label}</label>
                            <input type={f.type} placeholder={f.placeholder} className="aki-input" value={newInvoice[f.key] || ''} onChange={e => setNewInvoice({ ...newInvoice, [f.key]: e.target.value })} />
                          </div>
                        ))}
                        {[
                          { label: 'Recognition Timing', key: 'ifrsRecognitionTiming', opts: [['POINT_IN_TIME', 'Point in Time'], ['OVER_TIME', 'Over Time']] },
                          { label: 'Credit Risk', key: 'ifrsCreditRisk', opts: [['LOW', 'Low'], ['MEDIUM', 'Medium'], ['HIGH', 'High']] },
                          { label: 'Receivable Class', key: 'ifrsReceivableClass', opts: [['CURRENT', 'Current'], ['NON_CURRENT', 'Non-Current']] },
                          { label: 'Measurement', key: 'ifrsMeasurementCategory', opts: [['AMORTISED_COST', 'Amortised Cost'], ['FVTPL', 'FVTPL'], ['FVTOCI', 'FVTOCI']] },
                        ].map(f => (
                          <div key={f.key} className="aki-field">
                            <label className="aki-label">{f.label}</label>
                            <select className="aki-input aki-select" value={newInvoice[f.key] || f.opts[0][0]} onChange={e => setNewInvoice({ ...newInvoice, [f.key]: e.target.value })}>
                              {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </Sec>
                    {/* Custom fields */}
                    {selectedCompanyId && (
                      <div>
                        <p className="ovds-label mb-2">Custom Fields</p>
                        <CustomFieldRenderer feature="invoice" entityId={newInvoice.id} companyId={selectedCompanyId} onChange={handleCustomFieldChange} initialValues={customFieldValues} showTitle={false} />
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ height: 4 }} />
              </div>
            </form>
          </div>{/* end left column */}

          {/* ══ RIGHT: Live Invoice Document Preview — 55% ══════════ */}
          <div
            className="hidden lg:flex flex-col flex-1 overflow-hidden"
            style={{ background: '#F1F5F9' }}
          >
            {/* ── Top bar: "Live Preview" label ── */}
            <div
              className="flex items-center justify-between gap-2 px-5 py-2 shrink-0"
              style={{
                borderBottom: `2px solid ${(newInvoice as any).invoiceColor || '#2563EB'}`,
                background: '#E2E8F0',
              }}
            >
              <div className="flex items-center gap-2">
                <Eye size={11} style={{ color: '#64748B' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>
                  Live Preview
                </span>
                <span className="aki-badge sm pill solid-info ml-1">Auto-updates</span>
              </div>
              <div className="flex items-center gap-2">
                {isLoadingInvoiceNumber && (
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
                  >
                    Generating #…
                  </span>
                )}
                {newInvoice.invoiceNumber && (
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${(newInvoice as any).invoiceColor || '#2563EB'}15`,
                      color: (newInvoice as any).invoiceColor || '#2563EB',
                      border: `1px solid ${(newInvoice as any).invoiceColor || '#2563EB'}40`,
                    }}
                  >
                    # {newInvoice.invoiceNumber}
                  </span>
                )}
                <span className="text-[10px]" style={{ color: '#94A3B8' }}>
                  {(newInvoice as any).companyTitle || 'TAX INVOICE'}
                </span>
              </div>
            </div>

            {/* ── Scrollable paper area — centred, max-width keeps it A4-ish ── */}
            <div className="flex-1 overflow-y-auto flex justify-center py-5 px-6" style={{ background: '#F1F5F9' }}>
              <div className="w-full" style={{ maxWidth: 480 }}>

                {/* ════════════════════════════════════════════════
                    PAPER CARD — A4-style, matches reference design
                    ════════════════════════════════════════════════ */}
                <div
                  className="bg-white overflow-hidden"
                  style={{
                    borderRadius: 8,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid #E2E8F0',
                    fontFamily: "'Segoe UI', Arial, sans-serif",
                  }}
                >
                  {/* ── HEADER: seller top-left · document title top-right ── */}
                  <div className="px-6 pt-5 pb-4" style={{ borderBottom: `3px solid ${(newInvoice as any).invoiceColor || '#2563EB'}` }}>
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: seller identity */}
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[16px] font-black leading-tight truncate"
                          style={{ color: '#111827' }}
                        >
                          {settings?.company_name || 'Your Company'}
                        </p>
                        {settings?.company_address && (
                          <p className="text-[10px] mt-0.5 leading-snug" style={{ color: '#4B5563' }}>
                            {settings.company_address}
                          </p>
                        )}
                        {settings?.company_phone && (
                          <p className="text-[10px]" style={{ color: '#4B5563' }}>{settings.company_phone}</p>
                        )}
                        {settings?.company_email && (
                          <p className="text-[10px]" style={{ color: '#4B5563' }}>{settings.company_email}</p>
                        )}
                        {settings?.company_tin && (
                          <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>
                            <span className="font-semibold">TAX ID</span>{' '}
                            <span className="font-mono">{settings.company_tin}</span>
                          </p>
                        )}
                        {settings?.company_vat_number && (
                          <p className="text-[10px]" style={{ color: '#6B7280' }}>
                            <span className="font-semibold">VAT No.</span>{' '}
                            <span className="font-mono">{settings.company_vat_number}</span>
                          </p>
                        )}
                      </div>

                      {/* Right: document title + number */}
                      <div className="text-right shrink-0">
                        <p
                          className="text-[20px] font-black tracking-tight leading-none"
                          style={{ color: (newInvoice as any).invoiceColor || '#2563EB' }}
                        >
                          {(newInvoice as any).companyTitle || 'TAX INVOICE'}
                        </p>
                        {newInvoice.invoiceNumber ? (
                          <p className="text-[11px] font-mono font-bold mt-1" style={{ color: '#374151' }}>
                            {newInvoice.invoiceNumber}
                          </p>
                        ) : isLoadingInvoiceNumber ? (
                          <p className="text-[10px] italic mt-1" style={{ color: '#D97706' }}>Generating…</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* ── INVOICE META: invoice details left · bill-to right ── */}
                  <div className="grid px-6 py-4" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, borderBottom: '1px dashed #D1D5DB' }}>
                    {/* Left: invoice meta */}
                    <div className="space-y-1">
                      {[
                        { l: 'Invoice:', v: newInvoice.invoiceNumber || (isLoadingInvoiceNumber ? '…' : '—') },
                        { l: 'Client:', v: newInvoice.customer || '—' },
                        { l: 'Date:', v: newInvoice.date ? new Date(newInvoice.date).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                        ...(newInvoice.dueDate ? [{ l: 'Due:', v: new Date(newInvoice.dueDate).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }) }] : []),
                        ...((newInvoice as any).orderNumber ? [{ l: 'Order #:', v: (newInvoice as any).orderNumber }] : []),
                        ...((newInvoice as any).fsNo ? [{ l: 'FS No.:', v: (newInvoice as any).fsNo }] : []),
                      ].map(row => (
                        <div key={row.l} className="flex items-baseline gap-2">
                          <span className="text-[10px] font-semibold w-14 shrink-0" style={{ color: '#6B7280' }}>{row.l}</span>
                          <span className="text-[11px] font-bold" style={{ color: '#111827' }}>{row.v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Right: bill-to */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#9CA3AF' }}>Bill To</p>
                      {newInvoice.customer ? (
                        <div className="space-y-0.5">
                          <p className="text-[12px] font-bold" style={{ color: '#111827' }}>{newInvoice.customer}</p>
                          {newInvoice.customerAddress && (
                            <p className="text-[10px]" style={{ color: '#4B5563' }}>{newInvoice.customerAddress}</p>
                          )}
                          {newInvoice.customerPhone && (
                            <p className="text-[10px]" style={{ color: '#4B5563' }}>{newInvoice.customerPhone}</p>
                          )}
                          {newInvoice.customerEmail && (
                            <p className="text-[10px]" style={{ color: '#6B7280' }}>{newInvoice.customerEmail}</p>
                          )}
                          {newInvoice.customerTin && (
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#9CA3AF' }}>
                              TIN: {newInvoice.customerTin}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] italic" style={{ color: '#9CA3AF' }}>No customer selected</p>
                      )}
                    </div>
                  </div>

                  {/* ── ITEMS TABLE ── */}
                  <div>
                    {/* Table header */}
                    <div
                      className="grid px-5 py-2"
                      style={{
                        gridTemplateColumns: '1fr 52px 80px 80px',
                        background: (newInvoice as any).invoiceColor || '#2563EB',
                      }}
                    >
                      {['Description', 'QTY', 'Price', 'Total (ETB)'].map((h, i) => (
                        <span
                          key={h}
                          className="text-[9px] font-bold uppercase tracking-wider text-white"
                          style={{ textAlign: i === 0 ? 'left' : 'right' }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Table rows */}
                    {(newInvoice.items || []).filter((i: any) => Number(i.price) > 0 || i.itemId).length > 0
                      ? (newInvoice.items as any[])
                          .filter((i: any) => Number(i.price) > 0 || i.itemId)
                          .map((item: any, idx: number) => {
                            const gross = Number(item.price || 0) * Number(item.quantity || 1);
                            const disc = item.showDiscount
                              ? (item.discountType === 'PERCENT'
                                  ? gross * (Number(item.discountValue) / 100)
                                  : Number(item.discountValue))
                              : 0;
                            const lineTotal = Math.max(0, gross - disc);
                            const itemName =
                              item.customName ||
                              (itemsList.find((it: any) => it.id === item.itemId)?.name) ||
                              item.itemId ||
                              `Item ${idx + 1}`;
                            return (
                              <div key={idx}>
                                <div
                                  className="grid px-5 py-2"
                                  style={{
                                    gridTemplateColumns: '1fr 52px 80px 80px',
                                    background: idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF',
                                  }}
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: '#111827' }}>
                                      {itemName}
                                    </p>
                                    {item.description && (
                                      <p className="text-[9px] mt-0.5 leading-snug line-clamp-2 italic" style={{ color: '#6B7280' }}>
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-[11px] tabular-nums text-right shrink-0" style={{ color: '#374151' }}>
                                    {Number(item.quantity || 1)}
                                  </span>
                                  <span className="text-[11px] tabular-nums text-right shrink-0" style={{ color: '#374151' }}>
                                    {Number(item.price || 0).toFixed(2)}
                                  </span>
                                  <span className="text-[11px] font-semibold tabular-nums text-right shrink-0" style={{ color: '#111827' }}>
                                    {lineTotal.toFixed(2)}
                                  </span>
                                </div>
                                {/* Dotted separator between rows */}
                                <div style={{ borderBottom: '1px dashed #E5E7EB' }} />
                              </div>
                            );
                          })
                      : (
                        <div className="px-6 py-6 flex items-center justify-center">
                          <p className="text-[11px] italic" style={{ color: '#9CA3AF' }}>Add items to see them here</p>
                        </div>
                      )
                    }
                  </div>

                  {/* ── TOTALS ── */}
                  {(newInvoice.items || []).some((i: any) => Number(i.price) > 0) && (
                    <div className="px-5 py-3 flex justify-end" style={{ borderTop: '1px dashed #D1D5DB' }}>
                      <div style={{ minWidth: 200 }}>
                        {[
                          { l: 'Subtotal', v: fmt2(subtotal), color: '#374151' },
                          ...(vatAmount > 0 ? [{ l: `VAT (15%)`, v: fmt2(vatAmount), color: '#7C3AED' }] : []),
                          ...(invoiceDisc > 0 ? [{ l: 'Discount', v: `− ${fmt2(invoiceDisc)}`, color: '#EF4444' }] : []),
                          ...(!hasNamedTaxes && subtotal > 0 ? [{ l: 'DRRF (1%)', v: fmt2(drrfAmount), color: '#374151' }] : []),
                          ...namedTaxes.map((t: InvoiceTax) => ({
                            l: `${t.name}${t.type === 'PERCENT' ? ` ${t.rate}%` : ''}`,
                            v: fmt2(t.amount),
                            color: '#10B981',
                          })),
                        ].map(row => (
                          <div key={row.l} className="flex items-baseline justify-between gap-8 mb-1">
                            <span className="text-[11px]" style={{ color: '#6B7280' }}>{row.l}</span>
                            <span className="text-[11px] font-semibold tabular-nums" style={{ color: row.color }}>
                              {cur} {row.v}
                            </span>
                          </div>
                        ))}
                        {/* Dotted separator before total */}
                        <div className="my-1.5" style={{ borderTop: '1px dashed #D1D5DB' }} />
                        <div className="flex items-baseline justify-between gap-8">
                          <span className="text-[13px] font-bold" style={{ color: '#111827' }}>Total</span>
                          <span
                            className="text-[15px] font-black tabular-nums"
                            style={{ color: (newInvoice as any).invoiceColor || '#2563EB', letterSpacing: '-0.02em' }}
                          >
                            {cur} {fmt2(grandTotal)}
                          </span>
                        </div>
                        <p className="text-[9px] italic mt-1 text-right leading-relaxed" style={{ color: '#9CA3AF' }}>
                          {amountInWords(grandTotal, cur)}
                        </p>
                        {fxRate && fxRate !== 1 && (
                          <div className="flex items-baseline justify-between gap-8 mt-1">
                            <span className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>= {baseCurrency}</span>
                            <span className="text-[10px] font-bold tabular-nums" style={{ color: '#374151' }}>
                              {fmt2(convertToBase(grandTotal)!)} {baseCurrency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── NOTES / FOOTER / TERMS ── */}
                  {(newInvoice.customerNotes || newInvoice.footer || (newInvoice as any).terms) && (
                    <div className="px-6 py-3 space-y-2" style={{ borderTop: '1px dashed #D1D5DB', background: '#F9FAFB' }}>
                      {newInvoice.customerNotes && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#9CA3AF' }}>Notes</p>
                          <p className="text-[10px] leading-snug" style={{ color: '#4B5563' }}>{newInvoice.customerNotes}</p>
                        </div>
                      )}
                      {(newInvoice.footer || (newInvoice as any).terms) && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#9CA3AF' }}>Terms</p>
                          <p className="text-[10px] leading-snug" style={{ color: '#4B5563' }}>
                            {newInvoice.footer || (newInvoice as any).terms}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── PAYMENT + SIGNATURE block (matches reference image) ── */}
                  {grandTotal > 0 && (
                    <div className="px-6 py-4" style={{ borderTop: '1px dashed #D1D5DB' }}>
                      {/* Authorised signature line */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div style={{ height: 28, borderBottom: '1px solid #374151', width: 120, marginBottom: 4 }} />
                          <p className="text-[9px]" style={{ color: '#6B7280' }}>
                            {settings?.company_name || 'Authorised Signatory'}
                          </p>
                          {settings?.company_name && (
                            <p className="text-[9px] italic" style={{ color: '#9CA3AF' }}>
                              Note: Payment will be processed per agreed terms.
                            </p>
                          )}
                        </div>
                        {/* Bank / payment info */}
                        {(settings?.company_bank_account || settings?.company_bank_name) && (
                          <div className="text-right text-[9px]" style={{ color: '#6B7280' }}>
                            {settings.company_bank_name && (
                              <p>Payment via <strong>{settings.company_bank_name}</strong></p>
                            )}
                            {settings.company_bank_account && (
                              <p className="font-mono">A/C: {settings.company_bank_account}</p>
                            )}
                            {settings.company_swift && (
                              <p>SWIFT: {settings.company_swift}</p>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Dotted payment footer line */}
                      <div className="mt-3 pt-2" style={{ borderTop: '1px dashed #D1D5DB' }}>
                        <p className="text-[9px] text-center" style={{ color: '#9CA3AF' }}>
                          {newInvoice.footer ||
                            `Payment made via bank transfer in the name of ${settings?.company_name || 'company'}. Reference invoice number on all remittances.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── QR STRIP — shown as soon as there are items, even while number is loading ── */}
                  {grandTotal > 0 && (
                    <div
                      className="flex items-center gap-3 px-6 py-3"
                      style={{
                        borderTop: '1px solid #E5E7EB',
                        background: `${(newInvoice as any).invoiceColor || '#2563EB'}0D`,
                      }}
                    >
                      {newInvoice.invoiceNumber ? (
                        <img
                          src={`${QR_CODE_SERVICE_URL}?size=48x48&data=${encodeURIComponent(
                            `NBE-IQR|${settings?.ovds_merchant_id || 'Ovds-01'}|${grandTotal.toFixed(2)}|${newInvoice.invoiceNumber}|${cur}|${vatAmount.toFixed(2)}`
                          )}`}
                          alt="NBE QR"
                          className="rounded shrink-0"
                          style={{
                            width: 40, height: 40,
                            border: `1.5px solid ${(newInvoice as any).invoiceColor || '#BFDBFE'}`,
                          }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        /* Placeholder box while invoice number is being generated */
                        <div
                          className="rounded shrink-0 flex items-center justify-center"
                          style={{
                            width: 40, height: 40,
                            border: `1.5px dashed ${(newInvoice as any).invoiceColor || '#BFDBFE'}`,
                            background: `${(newInvoice as any).invoiceColor || '#2563EB'}08`,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>⏳</span>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-bold" style={{ color: (newInvoice as any).invoiceColor || '#2563EB' }}>
                          NBE-IQR · ERCA Compliant
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: '#6B7280' }}>
                          {newInvoice.invoiceNumber
                            ? 'Regulation 570/2025'
                            : isLoadingInvoiceNumber
                            ? 'QR generates once invoice # is ready'
                            : 'Enter invoice # to generate QR'}
                        </p>
                      </div>
                    </div>
                  )}

                </div>{/* end paper card */}

                {/* ════════════════════════════════════════════════
                    ERCA READINESS CARD
                    ════════════════════════════════════════════════ */}
                <div
                  className="mt-3 bg-white overflow-hidden"
                  style={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                  {/* Header row */}
                  <div
                    className="flex items-center justify-between px-5 py-2.5"
                    style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}
                  >
                    <p className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: '#111827' }}>
                      <ShieldCheck size={12} style={{ color: '#2563EB' }} />
                      ERCA Readiness
                    </p>
                    <span
                      className="text-[10px] font-black tabular-nums"
                      style={{ color: completenessScore === 100 ? '#4FBA6F' : completenessScore >= 60 ? '#D97706' : '#DC2626' }}
                    >
                      {completenessScore}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="px-5 pt-2.5 pb-1">
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${completenessScore}%`,
                          background: completenessScore === 100 ? '#10B981' : completenessScore >= 60 ? '#F59E0B' : '#EF4444',
                        }}
                      />
                    </div>
                  </div>

                  {/* Checklist — two columns */}
                  <div className="px-5 pb-3 pt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {ercaChecks.map(c => (
                      <div key={c.label} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: c.pending ? '#FEF3C7' : c.ok ? '#D1FAE5' : '#FEE2E2',
                            border: `1px solid ${c.pending ? '#FDE68A' : c.ok ? '#6EE7B7' : '#FECACA'}`,
                          }}
                        >
                          {c.pending
                            ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', display: 'block' }} />
                            : c.ok
                            ? <CheckCircle2 size={7} style={{ color: '#4FBA6F' }} />
                            : <AlertTriangle size={6} style={{ color: '#DC2626' }} />}
                        </div>
                        <span
                          className="text-[10px] leading-tight"
                          style={{ color: c.pending ? '#92400E' : c.ok ? '#374151' : '#BE123C' }}
                        >
                          {c.label}{c.pending ? '…' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* bottom breathing room */}
                <div style={{ height: 24 }} />
              </div>
            </div>
          </div>{/* end right column */}

        </div>{/* end split body */}

        {/* ── STICKY FOOTER ────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5" style={{ height: 52, background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          {/* Left: progress + shortcut hint */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completenessScore}%`, background: completenessScore === 100 ? '#10B981' : completenessScore >= 60 ? '#F59E0B' : '#F43F5E' }} />
              </div>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: completenessScore === 100 ? '#10B981' : completenessScore >= 60 ? '#F59E0B' : '#F43F5E' }}>{completenessScore}%</span>
            </div>
            <span className="text-[10px] font-mono hidden lg:inline" style={{ color: 'var(--text-5)' }}>
              Ctrl+S save · Ctrl+↵ send · Esc close
            </span>
          </div>
          {/* Right: actions */}
          <div className="flex items-center gap-2 ml-auto">
            {newInvoice.id && ['PENDING', 'SENT', 'OVERDUE', 'PARTIAL'].includes(newInvoice.status) && (
              <button type="button" onClick={onAddPayment} className="aki-btn aki-btn-success sm"><Plus size={13} /><span className="hidden sm:inline"> Add Payment</span></button>
            )}
            <button type="button" onClick={onPreview} className="aki-btn aki-btn-secondary sm"><Eye size={13} /><span className="hidden sm:inline"> Preview</span></button>
            <button type="button" onClick={(e) => onSubmit(e as any, 'PENDING')} disabled={!selectedCompanyId} className="aki-btn aki-btn-success sm"><Send size={13} /><span className="hidden sm:inline"> Send</span></button>
            <button
              type="submit" form="invoice-form"
              disabled={!selectedCompanyId}
              title={!selectedCompanyId ? 'Select a company first' : 'Ctrl+S'}
              className="aki-btn aki-btn-primary sm"
            >
              <Save size={13} /> {newInvoice.id ? 'Update' : 'Save Draft'}
            </button>
          </div>
        </div>

      </div>{/* end full-screen panel */}
    </>,
    document.body,
  );
}

