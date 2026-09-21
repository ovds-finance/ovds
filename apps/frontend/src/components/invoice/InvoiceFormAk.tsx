/**
 * InvoiceFormAk — Ovds SaaS State-Driven Invoice Form
 * ─────────────────────────────────────────────────────
 * Implements the Ovds SaaS frontend architecture: a pure, state-driven
 * component that only reflects state and dispatches actions. No direct
 * API calls; parent owns submission.
 *
 * Architecture patterns (Ovds SaaS spec):
 *   1. Pure state reflection — component reflects state, dispatches actions.
 *      Parent owns onSave / onSaveAndSend. No direct API calls.
 *   2. Dynamic Column Matrix — line-item grid columns driven by a
 *      ColumnConfig array. Toggling a column rewrites the DOM width.
 *   3. Context-Aware Modals (Inline Creation) — if a customer does not exist
 *      while drafting, a nested sub-modal handles entry creation without
 *      force-refreshing or interrupting the active parent transaction state.
 *   4. Live Totals — subtotal, VAT, DRRF, and grand total recompute on every
 *      keystroke via useMemo (equivalent to Vue computed properties).
 *   5. Multi-Currency — foreign currency + rate fields; the Exchange
 *      Transformer retains both base and converted values simultaneously.
 */

import { roundCurrency } from '@ovds/shared';
import {
  Plus,
  Trash2,
  ChevronDown,
  X,
  User,
  Tag,
  Percent,
  Hash,
  DollarSign,
  Eye,
  EyeOff,
  AlertCircle,
  Save,
  Send,
} from 'lucide-react';
import React, {
  useState,
  useCallback,
  useMemo,
  useId,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  id: string;
  itemId?: string;
  description: string;
  quantity: number;
  price: number;
  /** Whether to show the discount sub-row for this line */
  showDiscount: boolean;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  /** Whether VAT applies to this line */
  showTax: boolean;
  /** Optional override tax rate (null = use invoice-level vatRate) */
  taxRate: number | null;
}

export interface InvoiceFormData {
  customerId: string | null;
  customerName: string;
  currencyCode: string;
  /** Exchange rate: 1 currencyCode = currencyRate ETB */
  currencyRate: number;
  date: string;
  dueDate: string;
  paymentTerms: string;
  vatRate: number;
  /** Invoice-level discount applied after all line discounts */
  invoiceDiscountType: 'FIXED' | 'PERCENT';
  invoiceDiscountValue: number;
  notes: string;
  footer: string;
  items: InvoiceLineItem[];
}

export interface CustomerOption {
  id: string;
  name: string;
  email?: string;
  tin?: string;
}

export interface ItemOption {
  id: string;
  name: string;
  description?: string;
  salePrice: number;
}

/** Column visibility config — drives the dynamic grid matrix. */
export interface InvoiceColumnConfig {
  key: 'description' | 'quantity' | 'price' | 'discount' | 'tax' | 'total';
  label: string;
  visible: boolean;
  /** Tailwind width class */
  widthCls: string;
}

export interface InvoiceFormAkProps {
  initialData?: Partial<InvoiceFormData>;
  customers: CustomerOption[];
  items: ItemOption[];
  /** Called when user saves as draft */
  onSave: (data: InvoiceFormData) => void;
  /** Called when user saves and immediately sends */
  onSaveAndSend: (data: InvoiceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  /** Currency options available for the company */
  currencies?: string[];
  /** Functional (base) currency */
  baseCurrency?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_VAT_RATE = 15;
const DEFAULT_DRRF_RATE = 0.01;
const MS_PER_DAY = 86_400_000;
const DEFAULT_DUE_DAYS = 30;

function newLineItem(): InvoiceLineItem {
  return {
    id: Math.random().toString(36).slice(2, 11),
    description: '',
    quantity: 1,
    price: 0,
    showDiscount: false,
    discountType: 'FIXED',
    discountValue: 0,
    showTax: true,
    taxRate: null,
  };
}

const DEFAULT_FORM: InvoiceFormData = {
  customerId: null,
  customerName: '',
  currencyCode: 'ETB',
  currencyRate: 1,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + DEFAULT_DUE_DAYS * MS_PER_DAY)
    .toISOString()
    .split('T')[0],
  paymentTerms: 'NET30',
  vatRate: DEFAULT_VAT_RATE,
  invoiceDiscountType: 'FIXED',
  invoiceDiscountValue: 0,
  notes: '',
  footer: '',
  items: [newLineItem()],
};

const DEFAULT_COLUMNS: InvoiceColumnConfig[] = [
  { key: 'description', label: 'Description',  visible: true,  widthCls: 'flex-1 min-w-0' },
  { key: 'quantity',    label: 'Qty',           visible: true,  widthCls: 'w-20' },
  { key: 'price',       label: 'Unit Price',    visible: true,  widthCls: 'w-32' },
  { key: 'discount',    label: 'Discount',      visible: false, widthCls: 'w-28' },
  { key: 'tax',         label: 'Tax',           visible: true,  widthCls: 'w-24' },
  { key: 'total',       label: 'Total',         visible: true,  widthCls: 'w-32' },
];

// ── Tiny sub-components ───────────────────────────────────────────────────────

const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({
  htmlFor,
  children,
}) => (
  <label
    htmlFor={htmlFor}
    className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
  >
    {children}
  </label>
);

const FieldInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props,
) => (
  <input
    {...props}
    className={[
      'block w-full rounded-lg border border-slate-200 dark:border-slate-700',
      'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
      'px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]',
      'placeholder:text-slate-400 transition-colors',
      props.className ?? '',
    ].join(' ')}
  />
);

const FieldSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (
  props,
) => (
  <select
    {...props}
    className={[
      'block w-full rounded-lg border border-slate-200 dark:border-slate-700',
      'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
      'px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]',
      'cursor-pointer transition-colors',
      props.className ?? '',
    ].join(' ')}
  />
);

// ── Context-aware customer sub-modal ─────────────────────────────────────────
// Inline creation of a new customer without interrupting the parent invoice.

interface NewCustomerModalProps {
  onClose: () => void;
  onCreated: (customer: CustomerOption) => void;
}

const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tin, setTin] = useState('');
  const uid = useId();

  const handleSave = () => {
    if (!name.trim()) return;
    // In a real app this would POST to the API; here we create a temp record
    // and the parent adds it to its customer list without a full page refresh.
    onCreated({
      id: `temp-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || undefined,
      tin: tin.trim() || undefined,
    });
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby={`${uid}-title`}
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            id={`${uid}-title`}
            className="text-base font-semibold text-slate-800 dark:text-slate-100"
          >
            New Customer
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor={`${uid}-name`}>
              Name <span className="text-rose-500">*</span>
            </FieldLabel>
            <FieldInput
              id={`${uid}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              autoFocus
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${uid}-email`}>Email</FieldLabel>
            <FieldInput
              id={`${uid}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="accounts@acme.com"
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${uid}-tin`}>TIN (optional)</FieldLabel>
            <FieldInput
              id={`${uid}-tin`}
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="0000000000"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create Customer
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main InvoiceFormAk ────────────────────────────────────────────────────────

export const InvoiceFormAk: React.FC<InvoiceFormAkProps> = ({
  initialData,
  customers: initialCustomers,
  items: catalogItems,
  onSave,
  onSaveAndSend,
  onCancel,
  loading = false,
  currencies = ['ETB', 'USD', 'EUR', 'GBP'],
  baseCurrency = 'ETB',
}) => {
  const uid = useId();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<InvoiceFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });
  const [customers, setCustomers] = useState<CustomerOption[]>(initialCustomers);
  const [columns, setColumns] = useState<InvoiceColumnConfig[]>(DEFAULT_COLUMNS);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // ── Derived column visibility ──────────────────────────────────────────────
  const visibleCols = useMemo(
    () => columns.filter((c) => c.visible),
    [columns],
  );

  // ── Live totals (pure computation — no side-effects) ──────────────────────
  const totals = useMemo(() => {
    const vatRate = form.vatRate / 100;

    // Per-line net amounts
    const lineNets = form.items.map((item) => {
      const gross = item.price * item.quantity;
      const disc =
        item.showDiscount
          ? item.discountType === 'PERCENT'
            ? gross * (item.discountValue / 100)
            : item.discountValue
          : 0;
      return Math.max(0, gross - disc);
    });

    const subtotalRaw = lineNets.reduce((a, n) => a + n, 0);

    // Invoice-level discount
    const invoiceDisc =
      form.invoiceDiscountType === 'PERCENT'
        ? subtotalRaw * (form.invoiceDiscountValue / 100)
        : form.invoiceDiscountValue;
    const subtotal = Math.max(0, subtotalRaw - invoiceDisc);

    // VAT per taxable line
    const vatAmount = form.items.reduce((acc, item, i) => {
      if (!item.showTax) return acc;
      const rate = item.taxRate !== null ? item.taxRate / 100 : vatRate;
      return acc + lineNets[i] * rate;
    }, 0);

    // DRRF 1% of subtotal after invoice discount
    const drrfAmount = roundCurrency(subtotal * DEFAULT_DRRF_RATE);

    const grandTotal = roundCurrency(subtotal + vatAmount + drrfAmount);

    // Multi-currency: base equivalent
    const baseTotal =
      form.currencyCode === baseCurrency
        ? grandTotal
        : roundCurrency(grandTotal * form.currencyRate);

    return {
      subtotalRaw: roundCurrency(subtotalRaw),
      invoiceDisc: roundCurrency(invoiceDisc),
      subtotal: roundCurrency(subtotal),
      vatAmount: roundCurrency(vatAmount),
      drrfAmount,
      grandTotal,
      baseTotal,
    };
  }, [form, baseCurrency]);

  // ── Line item helpers ──────────────────────────────────────────────────────

  const updateItem = useCallback(
    (id: string, patch: Partial<InvoiceLineItem>) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === id ? { ...it, ...patch } : it,
        ),
      }));
    },
    [],
  );

  const addItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, newLineItem()],
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  }, []);

  const handleCatalogSelect = useCallback(
    (itemId: string, lineId: string) => {
      const catalogItem = catalogItems.find((i) => i.id === itemId);
      if (!catalogItem) return;
      updateItem(lineId, {
        itemId: catalogItem.id,
        description: catalogItem.description ?? catalogItem.name,
        price: catalogItem.salePrice,
      });
    },
    [catalogItems, updateItem],
  );

  // ── Customer sub-modal handlers ────────────────────────────────────────────

  const handleNewCustomerCreated = useCallback((customer: CustomerOption) => {
    setCustomers((prev) => [...prev, customer]);
    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
    }));
    setShowNewCustomerModal(false);
  }, []);

  // ── Column toggle ──────────────────────────────────────────────────────────

  const toggleColumn = useCallback((key: InvoiceColumnConfig['key']) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)),
    );
  }, []);

  // ── Currency ───────────────────────────────────────────────────────────────

  const isForeignCurrency = form.currencyCode !== baseCurrency;

  // ── Formatters ─────────────────────────────────────────────────────────────
  const fmt = useCallback(
    (n: number) =>
      new Intl.NumberFormat('en-ET', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n),
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Context-aware customer sub-modal ── */}
      {showNewCustomerModal && (
        <NewCustomerModal
          onClose={() => setShowNewCustomerModal(false)}
          onCreated={handleNewCustomerCreated}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 p-5 bg-slate-50 dark:bg-slate-950 min-h-screen">
        {/* ── Left / main form area (3/4 width on md+) ── */}
        <div className="md:col-span-3 flex flex-col gap-5">

          {/* ── Header card: Customer + Dates ── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Customer selector */}
              <div className="sm:col-span-2 lg:col-span-1">
                <FieldLabel htmlFor={`${uid}-customer`}>
                  <span className="flex items-center gap-1.5">
                    <User size={12} aria-hidden /> Customer
                  </span>
                </FieldLabel>
                <div className="flex gap-1.5">
                  <FieldSelect
                    id={`${uid}-customer`}
                    value={form.customerId ?? ''}
                    onChange={(e) => {
                      const c = customers.find((c) => c.id === e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        customerId: e.target.value || null,
                        customerName: c?.name ?? '',
                      }));
                    }}
                    className="flex-1"
                  >
                    <option value="">— Select customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </FieldSelect>
                  {/* "+ New" triggers the sub-modal without leaving the form */}
                  <button
                    type="button"
                    title="Create new customer"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="flex-shrink-0 w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-[var(--pro-azure)] hover:border-[var(--pro-azure)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] outline-none"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {!form.customerId && (
                  <p className="mt-1 text-[11px] text-amber-500 flex items-center gap-1">
                    <AlertCircle size={10} aria-hidden /> Required to issue invoice
                  </p>
                )}
              </div>

              {/* Currency */}
              <div>
                <FieldLabel htmlFor={`${uid}-currency`}>Currency</FieldLabel>
                <div className="flex gap-1.5">
                  <FieldSelect
                    id={`${uid}-currency`}
                    value={form.currencyCode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        currencyCode: e.target.value,
                        currencyRate: e.target.value === baseCurrency ? 1 : prev.currencyRate,
                      }))
                    }
                    className="flex-1"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </FieldSelect>
                  {isForeignCurrency && (
                    <FieldInput
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={form.currencyRate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          currencyRate: parseFloat(e.target.value) || 1,
                        }))
                      }
                      title={`Exchange rate: 1 ${form.currencyCode} = ? ${baseCurrency}`}
                      className="w-28"
                      placeholder="Rate"
                    />
                  )}
                </div>
                {isForeignCurrency && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    1 {form.currencyCode} = {form.currencyRate} {baseCurrency}
                  </p>
                )}
              </div>

              {/* Invoice date */}
              <div>
                <FieldLabel htmlFor={`${uid}-date`}>Invoice Date</FieldLabel>
                <FieldInput
                  id={`${uid}-date`}
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>

              {/* Due date */}
              <div>
                <FieldLabel htmlFor={`${uid}-due`}>Due Date</FieldLabel>
                <FieldInput
                  id={`${uid}-due`}
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                />
              </div>

              {/* Payment terms */}
              <div>
                <FieldLabel htmlFor={`${uid}-terms`}>Payment Terms</FieldLabel>
                <FieldSelect
                  id={`${uid}-terms`}
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, paymentTerms: e.target.value }))
                  }
                >
                  {['DUE_ON_RECEIPT', 'NET15', 'NET30', 'NET60', 'NET90'].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ').replace('NET', 'Net ')}
                      </option>
                    ),
                  )}
                </FieldSelect>
              </div>
            </div>
          </div>

          {/* ── Line items card ── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Hash size={13} aria-hidden /> Line Items
              </h3>
              {/* Dynamic column visibility toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnToggle((v) => !v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Eye size={12} aria-hidden /> Columns <ChevronDown size={11} aria-hidden />
                </button>
                {showColumnToggle && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 min-w-[160px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Toggle Columns
                    </p>
                    {columns
                      .filter((c) => c.key !== 'description' && c.key !== 'total')
                      .map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 cursor-pointer py-1 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"
                        >
                          <input
                            type="checkbox"
                            checked={col.visible}
                            onChange={() => toggleColumn(col.key)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[var(--pro-azure)] focus:ring-[var(--pro-azure)]"
                          />
                          {col.label}
                        </label>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column headers — dynamic grid */}
            <div className="flex items-center gap-2 px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {visibleCols.map((col) => (
                <div
                  key={col.key}
                  className={`${col.widthCls} text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ${
                    col.key === 'total' ? 'text-right' : ''
                  }`}
                >
                  {col.label}
                </div>
              ))}
              {/* Spacer for the remove button */}
              <div className="w-8 flex-shrink-0" />
            </div>

            {/* Line item rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {form.items.map((item) => {
                const gross = item.price * item.quantity;
                const disc =
                  item.showDiscount
                    ? item.discountType === 'PERCENT'
                      ? gross * (item.discountValue / 100)
                      : item.discountValue
                    : 0;
                const net = Math.max(0, gross - disc);

                return (
                  <div key={item.id} className="px-5 py-3 space-y-2">
                    {/* Main row */}
                    <div className="flex items-center gap-2">
                      {visibleCols.map((col) => {
                        if (col.key === 'description') {
                          return (
                            <div key="description" className={col.widthCls}>
                              {/* Catalog item picker */}
                              {catalogItems.length > 0 && (
                                <FieldSelect
                                  value={item.itemId ?? ''}
                                  onChange={(e) =>
                                    handleCatalogSelect(e.target.value, item.id)
                                  }
                                  className="mb-1.5 text-xs py-1.5"
                                >
                                  <option value="">— Select item —</option>
                                  {catalogItems.map((ci) => (
                                    <option key={ci.id} value={ci.id}>
                                      {ci.name}
                                    </option>
                                  ))}
                                </FieldSelect>
                              )}
                              <FieldInput
                                value={item.description}
                                onChange={(e) =>
                                  updateItem(item.id, { description: e.target.value })
                                }
                                placeholder="Item description"
                              />
                            </div>
                          );
                        }

                        if (col.key === 'quantity') {
                          return (
                            <div key="quantity" className={col.widthCls}>
                              <FieldInput
                                type="number"
                                min="0"
                                step="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    quantity: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="text-center"
                              />
                            </div>
                          );
                        }

                        if (col.key === 'price') {
                          return (
                            <div key="price" className={col.widthCls}>
                              <FieldInput
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="text-right"
                              />
                            </div>
                          );
                        }

                        if (col.key === 'discount') {
                          return (
                            <div key="discount" className={`${col.widthCls} flex gap-1`}>
                              <FieldInput
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.discountValue}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    discountValue: parseFloat(e.target.value) || 0,
                                    showDiscount: true,
                                  })
                                }
                                className="text-right"
                              />
                              <button
                                type="button"
                                title={
                                  item.discountType === 'PERCENT'
                                    ? 'Switch to fixed'
                                    : 'Switch to percent'
                                }
                                onClick={() =>
                                  updateItem(item.id, {
                                    discountType:
                                      item.discountType === 'PERCENT'
                                        ? 'FIXED'
                                        : 'PERCENT',
                                  })
                                }
                                className="flex-shrink-0 w-8 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors text-xs font-bold"
                              >
                                {item.discountType === 'PERCENT' ? (
                                  <Percent size={12} />
                                ) : (
                                  <DollarSign size={12} />
                                )}
                              </button>
                            </div>
                          );
                        }

                        if (col.key === 'tax') {
                          return (
                            <div key="tax" className={col.widthCls}>
                              <button
                                type="button"
                                title={item.showTax ? 'Remove tax' : 'Apply tax'}
                                onClick={() =>
                                  updateItem(item.id, { showTax: !item.showTax })
                                }
                                className={[
                                  'w-full h-9 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-colors',
                                  item.showTax
                                    ? 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:border-green-800 dark:bg-green-900/30 dark:text-[var(--pro-azure-light)]'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600',
                                ].join(' ')}
                              >
                                {item.showTax ? (
                                  <>
                                    <Eye size={11} aria-hidden />
                                    {item.taxRate ?? form.vatRate}%
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={11} aria-hidden />
                                    No tax
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        }

                        if (col.key === 'total') {
                          return (
                            <div
                              key="total"
                              className={`${col.widthCls} text-right font-semibold text-slate-800 dark:text-slate-100 tabular-nums text-sm py-2`}
                            >
                              {form.currencyCode} {fmt(net)}
                            </div>
                          );
                        }

                        return null;
                      })}

                      {/* Remove button */}
                      <div className="w-8 flex-shrink-0 flex items-center justify-center">
                        <button
                          type="button"
                          aria-label="Remove line item"
                          onClick={() => removeItem(item.id)}
                          disabled={form.items.length === 1}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-0 disabled:cursor-default"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add item button */}
            <div className="px-5 py-3 border-t border-dashed border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:text-[var(--pro-azure-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] rounded"
              >
                <Plus size={14} aria-hidden /> Add line item
              </button>
            </div>
          </div>

          {/* ── Notes & Footer ── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor={`${uid}-notes`}>Notes to Customer</FieldLabel>
                <textarea
                  id={`${uid}-notes`}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Payment instructions, thank-you message…"
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)] resize-none"
                />
              </div>
              <div>
                <FieldLabel htmlFor={`${uid}-footer`}>Footer Text</FieldLabel>
                <textarea
                  id={`${uid}-footer`}
                  value={form.footer}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, footer: e.target.value }))
                  }
                  rows={3}
                  placeholder="Terms and conditions, bank details…"
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)] resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar: summary + actions (1/4 width on md+) ── */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sticky top-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 flex items-center gap-1.5">
              <Tag size={13} aria-hidden /> Invoice Summary
            </h3>

            {/* Totals breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmt(totals.subtotalRaw)}</span>
              </div>

              {totals.invoiceDisc > 0 && (
                <div className="flex justify-between text-xs text-rose-500">
                  <span>Discount</span>
                  <span className="tabular-nums">−{fmt(totals.invoiceDisc)}</span>
                </div>
              )}

              {totals.invoiceDisc > 0 && (
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-dashed border-slate-100 dark:border-slate-800 pt-1.5">
                  <span>Net</span>
                  <span className="tabular-nums">{fmt(totals.subtotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>VAT ({form.vatRate}%)</span>
                <span className="tabular-nums">{fmt(totals.vatAmount)}</span>
              </div>

              {totals.drrfAmount > 0 && (
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>DRRF (1%)</span>
                  <span className="tabular-nums">{fmt(totals.drrfAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-50 border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                <span>{form.currencyCode} Total</span>
                <span className="tabular-nums">{fmt(totals.grandTotal)}</span>
              </div>

              {/* Base currency equivalent for foreign-currency invoices */}
              {isForeignCurrency && (
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 pt-0.5">
                  <span>≈ {baseCurrency} equivalent</span>
                  <span className="tabular-nums">{fmt(totals.baseTotal)}</span>
                </div>
              )}
            </div>

            {/* VAT rate override */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <FieldLabel htmlFor={`${uid}-vat`}>VAT Rate (%)</FieldLabel>
              <FieldInput
                id={`${uid}-vat`}
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.vatRate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    vatRate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            {/* Invoice-level discount */}
            <div className="mt-3">
              <FieldLabel htmlFor={`${uid}-inv-disc`}>
                Invoice Discount
              </FieldLabel>
              <div className="flex gap-1.5">
                <FieldInput
                  id={`${uid}-inv-disc`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.invoiceDiscountValue}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      invoiceDiscountValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="flex-1"
                />
                <button
                  type="button"
                  title="Toggle discount type"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      invoiceDiscountType:
                        prev.invoiceDiscountType === 'PERCENT'
                          ? 'FIXED'
                          : 'PERCENT',
                    }))
                  }
                  className="flex-shrink-0 w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors text-xs font-bold"
                >
                  {form.invoiceDiscountType === 'PERCENT' ? (
                    <Percent size={13} />
                  ) : (
                    <DollarSign size={13} />
                  )}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={loading || !form.customerId}
                onClick={() => onSaveAndSend(form)}
                className="w-full inline-flex items-center justify-center gap-2 bg-[var(--pro-azure)] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--pro-azure-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] outline-none"
              >
                <Send size={14} aria-hidden />
                Save &amp; Issue Invoice
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => onSave(form)}
                className="w-full inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 outline-none"
              >
                <Save size={14} aria-hidden />
                Save as Draft
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceFormAk;
