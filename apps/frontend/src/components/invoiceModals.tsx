import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import type { CapturedInvoiceData } from './invoices/invoiceCaptureModal';
import type { ReceiptEvidence } from './receiptViewer';
import type { Invoice } from '../pages/Invoices';
import api from '../services/api';
import { invoicesApi } from '../services/ovdsApi';
import { useBusiness } from '../context/businessContext';
import toast from 'react-hot-toast';
import { prompt } from '../utils/confirm';

// -- Lazy-loaded modal sub-components ----------------------------------------
// Each modal is only fetched when it's first opened, keeping the initial
// Invoices page bundle lean.
const AddInvoiceModal      = lazy(() => import('./invoices/addInvoiceModal'));
const PreviewModalLazy     = lazy(() => import('./invoices/previewModal').then(m => ({ default: m.PreviewModal })));
const RecordPaymentModal   = lazy(() => import('./invoices/recordPaymentModal'));
const InvoiceCaptureModal  = lazy(() => import('./invoices/invoiceCaptureModal'));
const TelecomReceiptViewer = lazy(() => import('./receiptViewer'));
const CustomerRegistryModal = lazy(() => import('./invoices/customerRegistryModal'));
const InvoiceBatchModal    = lazy(() => import('./invoices/invoiceBatchModal'));
const IngestionHubModal    = lazy(() => import('./invoices/ingestionHubModal').then(m => ({ default: m.IngestionHubModal })));
const InvoiceDrawer        = lazy(() => import('./invoices/invoiceDrawer'));

// -- Modal Context ------------------------------------------------------------
interface ModalContextType {
  showAddModal: boolean;
  setShowAddModal: (v: boolean) => void;
  showCaptureModal: boolean;
  setShowCaptureModal: (v: boolean) => void;
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
  showReceiptViewer: boolean;
  setShowReceiptViewer: (v: boolean) => void;
  receiptViewerRef: string;
  setReceiptViewerRef: (v: string) => void;
  evidenceInvoice: Invoice | null;
  setEvidenceInvoice: (v: Invoice | null) => void;
  editingInvoice: Invoice | null;
  setEditingInvoice: (v: Invoice | null) => void;
  paymentInvoice: Invoice | null;
  setPaymentInvoice: (v: Invoice | null) => void;
  showCustomerRegistry: boolean;
  setShowCustomerRegistry: (v: boolean) => void;
  showBatchModal: 'send' | 'cancel' | null;
  setShowBatchModal: (v: 'send' | 'cancel' | null) => void;
  showIngestionHub: boolean;
  setShowIngestionHub: (v: boolean) => void;
  drawerInvoice: Invoice | null;
  setDrawerInvoice: (v: Invoice | null) => void;
  newInvoice: any;
  setNewInvoice: (v: any) => void;
  customers: string[];
  itemsList: any[];
  settings: any;
  currency: string;
  onCaptureApply: (data: CapturedInvoiceData) => void;
  onSaveEvidence: (id: string, evidence: ReceiptEvidence) => void;
  onSubmitInvoice?: (e: React.FormEvent) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModals = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModals must be used within ModalProvider');
  return context;
};

// -- Provider -----------------------------------------------------------------
interface Props {
  children?: ReactNode;
  newInvoice: any;
  setNewInvoice: (v: any) => void;
  customers: string[];
  itemsList: any[];
  settings: any;
  currency: string;
  onCaptureApply: (data: CapturedInvoiceData) => void;
  onSaveEvidence: (id: string, evidence: ReceiptEvidence) => void;
  onSubmitInvoice?: (e: React.FormEvent) => void;
  onRefresh?: () => void;
  onDuplicate?: (id: string) => void;
  onCreditNote?: (id: string) => void;
  onDebitNote?: (id: string, amount: number) => void;
  onStatusChange?: (id: string, status: string) => void;
  showAddModal: boolean;
  setShowAddModal: (v: boolean) => void;
  showCaptureModal: boolean;
  setShowCaptureModal: (v: boolean) => void;
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
  showReceiptViewer: boolean;
  setShowReceiptViewer: (v: boolean) => void;
  receiptViewerRef: string;
  setReceiptViewerRef: (v: string) => void;
  evidenceInvoice: Invoice | null;
  setEvidenceInvoice: (v: Invoice | null) => void;
  editingInvoice: Invoice | null;
  setEditingInvoice: (v: Invoice | null) => void;
  paymentInvoice: Invoice | null;
  setPaymentInvoice: (v: Invoice | null) => void;
  showCustomerRegistry: boolean;
  setShowCustomerRegistry: (v: boolean) => void;
  showBatchModal: 'send' | 'cancel' | null;
  setShowBatchModal: (v: 'send' | 'cancel' | null) => void;
  showIngestionHub: boolean;
  setShowIngestionHub: (v: boolean) => void;
  drawerInvoice?: Invoice | null;
  setDrawerInvoice?: (v: Invoice | null) => void;
}

export const InvoiceModalsProvider: React.FC<Props> = ({
  children,
  newInvoice,
  setNewInvoice,
  customers,
  itemsList,
  settings,
  currency,
  onCaptureApply,
  onSaveEvidence,
  onSubmitInvoice,
  showAddModal,
  setShowAddModal,
  showCaptureModal,
  setShowCaptureModal,
  showPreview,
  setShowPreview,
  showReceiptViewer,
  setShowReceiptViewer,
  receiptViewerRef,
  setReceiptViewerRef,
  evidenceInvoice,
  setEvidenceInvoice,
  editingInvoice,
  setEditingInvoice,
  paymentInvoice,
  setPaymentInvoice,
  showCustomerRegistry,
  setShowCustomerRegistry,
  showBatchModal,
  setShowBatchModal,
  showIngestionHub,
  setShowIngestionHub,
  drawerInvoice,
  setDrawerInvoice,
}) => {
  return (
    <ModalContext.Provider value={{
      showAddModal, setShowAddModal,
      showCaptureModal, setShowCaptureModal,
      showPreview, setShowPreview,
      showReceiptViewer, setShowReceiptViewer,
      receiptViewerRef, setReceiptViewerRef,
      evidenceInvoice, setEvidenceInvoice,
      editingInvoice, setEditingInvoice,
      paymentInvoice, setPaymentInvoice,
      showCustomerRegistry, setShowCustomerRegistry,
      showBatchModal, setShowBatchModal,
      showIngestionHub, setShowIngestionHub,
      drawerInvoice: drawerInvoice ?? null,
      setDrawerInvoice: setDrawerInvoice ?? (() => {}),
      newInvoice, setNewInvoice,
      customers, itemsList, settings, currency,
      onCaptureApply, onSaveEvidence, onSubmitInvoice,
    }}>
      {children}
    </ModalContext.Provider>
  );
};

// -- Main Modals Hub ---------------------------------------------------------
export const InvoiceModals: React.FC<Props> = ({
  showAddModal,
  setShowAddModal,
  showCaptureModal,
  setShowCaptureModal,
  showPreview,
  setShowPreview,
  showReceiptViewer,
  setShowReceiptViewer,
  receiptViewerRef,
  setReceiptViewerRef,
  evidenceInvoice,
  setEvidenceInvoice,
  editingInvoice,
  setEditingInvoice,
  paymentInvoice,
  setPaymentInvoice,
  showCustomerRegistry,
  setShowCustomerRegistry,
  showBatchModal,
  setShowBatchModal,
  showIngestionHub,
  setShowIngestionHub,
  newInvoice,
  setNewInvoice,
  customers,
  itemsList,
  settings,
  currency,
  onCaptureApply,
  onSaveEvidence,
  onSubmitInvoice,
  onRefresh,
  onDuplicate,
  onCreditNote,
  onDebitNote,
  onStatusChange,
  drawerInvoice,
  setDrawerInvoice,
}) => {
  const { showCustomerRegistry: ctxCustomerRegistry, setShowCustomerRegistry: setCtxCustomerRegistry } = useModals();
  // -- Track which invoice the drawer was showing so we can re-open it after payment
  const lastDrawerInvoiceIdRef = React.useRef<string | null>(null);
  // -- Customer suggestions state (wired to AddInvoiceModal) -----------------
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  // -- Template state --------------------------------------------------------
  const [templates, setTemplates] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('ovds_invoice_templates') ?? '[]'); }
    catch { return []; }
  });
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const applyPaymentTerms = useCallback((terms: string) => {
    const days: Record<string, number> = { IMMEDIATE: 0, NET7: 7, NET15: 15, NET30: 30, NET60: 60, NET90: 90 };
    const d = days[terms] ?? 30;
    const due = new Date(Date.now() + d * 86_400_000).toISOString().split('T')[0];
    setNewInvoice((prev: any) => ({ ...prev, paymentTerms: terms, dueDate: due }));
  }, [setNewInvoice]);

  // -- Auto-update dueDate when paymentTerms changes in the form ------------
  useEffect(() => {
    if (!newInvoice?.paymentTerms) return;
    const days: Record<string, number> = { IMMEDIATE: 0, NET7: 7, NET15: 15, NET30: 30, NET60: 60, NET90: 90 };
    const d = days[newInvoice.paymentTerms] ?? 30;
    const due = new Date(Date.now() + d * 86_400_000).toISOString().split('T')[0];
    setNewInvoice((prev: any) => ({ ...prev, dueDate: due }));
  }, [newInvoice?.paymentTerms]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveTemplate = useCallback(async () => {
    const name = await prompt({ title: 'Save template', placeholder: 'Template name' });
    if (!name?.trim()) return;
    const tpl = { name: name.trim(), data: newInvoice };
    const updated = [...templates.filter((t: any) => t.name !== name.trim()), tpl];
    setTemplates(updated);
    localStorage.setItem('ovds_invoice_templates', JSON.stringify(updated));
    toast.success(`Template "${name}" saved`);
  }, [newInvoice, templates]);

  const loadTemplate = useCallback((tpl: any) => {
    setNewInvoice((prev: any) => ({ ...prev, ...tpl.data }));
    setShowTemplateMenu(false);
    toast.success(`Template "${tpl.name}" loaded`);
  }, [setNewInvoice]);

  const deleteTemplate = useCallback((name: string) => {
    const updated = templates.filter((t: any) => t.name !== name);
    setTemplates(updated);
    localStorage.setItem('ovds_invoice_templates', JSON.stringify(updated));
  }, [templates]);

  // -- Sync editingInvoice into newInvoice ----------------------------------
  useEffect(() => {
    if (editingInvoice) {
      setNewInvoice({
        ...editingInvoice,
        customer: editingInvoice.customer ?? (editingInvoice as any).customerName ?? '',
        // Ensure items have internal IDs for dnd-kit and correct discount fields
        items: ((editingInvoice.items as any[]) || []).map((li: any) => {
          // Prefer new discountValue field; fall back to old discount percentage
          const hasNewDiscount = li.discountValue !== undefined && li.discountValue !== null;
          const discountValue = hasNewDiscount ? Number(li.discountValue) : Number(li.discount ?? 0);
          const discountType = li.discountType || 'FIXED';
          return {
            ...li,
            id: li.id || Math.random().toString(36).substring(2, 11),
            showDiscount: discountValue > 0,
            discountValue,
            discountType,
            // taxRate: preserve from DB; null means use default
            taxRate: li.taxRate !== undefined ? li.taxRate : null,
            showTax: li.showTax !== false, // default true for items from DB
            showTaxPanel: false,
          };
        }),
      });
      setShowAddModal(true);
    }
  }, [editingInvoice, setNewInvoice, setShowAddModal]);

  const handleAddModalClose = useCallback(() => {
    setShowAddModal(false);
    if (editingInvoice) setEditingInvoice(null);
  }, [editingInvoice, setEditingInvoice, setShowAddModal]);

  return (
    <Suspense fallback={null}>
      {/* Add/Edit Invoice Modal */}
      {showAddModal && (
        <AddInvoiceModal
          showAddModal={showAddModal}
          newInvoice={newInvoice}
          setNewInvoice={setNewInvoice}
          onClose={handleAddModalClose}
          setShowReceiptViewer={setShowReceiptViewer}
          itemsList={itemsList}
          currency={currency}
          customers={customers}
          showCustomerSuggestions={showCustomerSuggestions}
          setShowCustomerSuggestions={setShowCustomerSuggestions}
          applyPaymentTerms={applyPaymentTerms}
          templates={templates}
          showTemplateMenu={showTemplateMenu}
          setShowTemplateMenu={setShowTemplateMenu}
          loadTemplate={loadTemplate}
          saveTemplate={saveTemplate}
          deleteTemplate={deleteTemplate}
          onSubmit={onSubmitInvoice ?? (() => {})}
          onPreview={() => setShowPreview(true)}
          onOpenCustomerRegistry={() => {
            setShowAddModal(false);
            setCtxCustomerRegistry(true);
          }}
          onAddPayment={() => {
            // Promote the invoice being edited to the payment modal
            if (newInvoice?.id) {
              setPaymentInvoice(newInvoice as Invoice);
            }
          }}
          convertedFromEstimate={newInvoice?._convertedFromEstimate ?? null}
          settings={settings}
        />
      )}

      {/* Capture Modal */}
      {showCaptureModal && (
        <InvoiceCaptureModal
          onClose={() => setShowCaptureModal(false)}
          onApply={onCaptureApply}
          onSaveDraft={() => {}} // parent handles
          itemsList={itemsList}
          settings={settings}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModalLazy
          showPreview={showPreview}
          newInvoice={newInvoice}
          itemsList={itemsList}
          currency={currency}
          settings={settings}
          merchantId={settings.ovds_merchant_id || 'Ovds-01'}
          onClose={() => setShowPreview(false)}
          onBackToEdit={() => { setShowPreview(false); setShowAddModal(true); }}
          onSend={() => {
            setShowPreview(false);
            // Synthesise a submit event so handleSubmitInvoice receives a proper FormEvent
            const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
            onSubmitInvoice?.(syntheticEvent);
          }}
        />
      )}

      {/* Receipt Viewer */}
      {showReceiptViewer && (
        <TelecomReceiptViewer
          initialRef={receiptViewerRef}
          onClose={() => {
            setShowReceiptViewer(false);
            setReceiptViewerRef('');
            setEvidenceInvoice(null);
          }}
          onApply={(evidence) => onSaveEvidence(evidenceInvoice?.id || '', evidence)}
        />
      )}

      {/* Payment Modal */}
      {paymentInvoice && (
        <RecordPaymentModal
          invoice={paymentInvoice}
          currency={currency}
          onClose={() => setPaymentInvoice(null)}
          onSaved={async () => {
            setPaymentInvoice(null);
            onRefresh?.();
            // Re-open the drawer with fresh invoice data so payments/status are current
            const refId = lastDrawerInvoiceIdRef.current;
            if (refId && setDrawerInvoice) {
              try {
                // Use background header so the global error interceptor won't
                // show "Invoice not found" toasts if the fetch fails
                const res = await api.get(`/ovds/invoices/${refId}`, {
                  headers: { 'x-background': '1' },
                } as any);
                const fresh = res.data?.data ?? res.data;
                if (fresh) {
                  const normalised = {
                    ...fresh,
                    customer: fresh.customerName ?? fresh.customer ?? '',
                  };
                  setDrawerInvoice(normalised as Invoice);
                }
              } catch {
                // Non-fatal — drawer simply stays closed
              } finally {
                lastDrawerInvoiceIdRef.current = null;
              }
            }
          }}
        />
      )}

      {/* Customer Registry — wired with live data */}
      {(showCustomerRegistry || ctxCustomerRegistry) && (
        <CustomerRegistryModalWrapper
          onClose={() => {
            setShowCustomerRegistry(false);
            setCtxCustomerRegistry(false);
          }}
          onSelect={(c: any) => {
            setNewInvoice((prev: any) => ({
              ...prev,
              customer: c.name,
              customerId: c.id,
              customerEmail: c.email || prev.customerEmail,
              customerPhone: c.phone || prev.customerPhone,
              customerAddress: c.address || prev.customerAddress,
              customerTin: c.tin || prev.customerTin,
              paymentTerms: c.paymentTerms || prev.paymentTerms,
              invoiceCurrency: c.paymentCurrency || prev.invoiceCurrency,
              buyerRegion: c.region || prev.buyerRegion,
              buyerZone: c.zone || prev.buyerZone,
              buyerKebele: c.kebele || prev.buyerKebele,
              buyerWereda: c.wereda || prev.buyerWereda,
              buyerCity: c.city || prev.buyerCity,
              buyerHouseNumber: c.houseNumber || prev.buyerHouseNumber,
            }));
            setShowCustomerRegistry(false);
            setCtxCustomerRegistry(false);
            setShowAddModal(true);
          }}
        />
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <InvoiceBatchModal
          mode={showBatchModal}
          invoices={[]} // parent
          onClose={() => setShowBatchModal(null)}
          onDone={() => {}} // parent refresh
        />
      )}

      {/* Ingestion Hub Modal */}
      {showIngestionHub && (
        <IngestionHubModal
          onClose={() => setShowIngestionHub?.(false)}
          onRefresh={onRefresh}
        />
      )}

      {/* Invoice Drawer — slide-in detail panel on row click */}
      {drawerInvoice && setDrawerInvoice && (
        <InvoiceDrawer
          invoice={drawerInvoice}
          currency={currency}
          merchantId={settings?.ovds_merchant_id || 'Ovds-01'}
          onClose={() => setDrawerInvoice(null)}
          onPrint={(inv) => { window.open(`/api/ovds/invoices/${inv.id}/pdf`, '_blank'); }}
          onStatusChange={(id, status) => {
            setDrawerInvoice(null);
            onStatusChange?.(id, status);
          }}
          onEdit={(inv) => {
            setDrawerInvoice(null);
            setEditingInvoice(inv as Invoice);
          }}
          onDuplicate={(id) => {
            setDrawerInvoice(null);
            onDuplicate?.(id);
          }}
          onRecordPayment={(inv) => {
            // Remember which invoice was in the drawer so we can re-open it with fresh data
            lastDrawerInvoiceIdRef.current = inv.id;
            setDrawerInvoice(null);
            setPaymentInvoice(inv as Invoice);
          }}
          onCollectEvidence={(inv) => {
            setDrawerInvoice(null);
            setEvidenceInvoice(inv as Invoice);
            setShowReceiptViewer(true);
          }}
          onCreditNote={(id) => {
            setDrawerInvoice(null);
            onCreditNote?.(id);
          }}
          onDebitNote={(id, amount) => {
            setDrawerInvoice(null);
            onDebitNote?.(id, amount);
          }}
          onSend={async (id) => {
            setDrawerInvoice(null);
            try {
              await invoicesApi.send(id);
              toast.success('Invoice sent');
              onRefresh?.();
            } catch {
              toast.error('Failed to send invoice');
            }
          }}
          onRefresh={() => onRefresh?.()}
        />
      )}
    </Suspense>
  );
};

InvoiceModals.displayName = 'InvoiceModals';


// -- CustomerRegistryModalWrapper ---------------------------------------------
// Self-contained wrapper that fetches customers and passes them to the modal.
// Used inside InvoiceModals so the registry always has live data.
const CustomerRegistryModalWrapper: React.FC<{
  onClose: () => void;
  onSelect: (c: any) => void;
}> = ({ onClose, onSelect }) => {
  const { selectedCompanyId } = useBusiness();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch with or without companyId — backend falls back to req.companyId from JWT
      const url = selectedCompanyId
        ? `/ovds/customers/registry?companyId=${selectedCompanyId}`
        : `/ovds/customers/registry`;
      const r = await api.get(url);
      // Handle both { data: [...] } and plain array responses
      const raw = r.data?.data ?? r.data ?? [];
      setCustomers(Array.isArray(raw) ? raw : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <CustomerRegistryModal
      customers={customers}
      loading={loading}
      onClose={onClose}
      onRefresh={fetchCustomers}
      onSelect={onSelect}
      companyId={selectedCompanyId ?? undefined}
    />
  );
};
