/**
 * IoT Smart Billing Tab — shows all auto-generated billable triggers
 * and allows attaching them to invoices.
 */
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../rbac/AuthContext';
import { useIotBillingTriggers, useAttachTriggersToInvoice, type IotBillingTrigger } from '../../services/iotApi';
import { fmtDateTime, fmtCurrency } from '../../utils/fmt';
import { AppTable, AppTh, AppTd, AppTr, Btn, Icon, Amount, Modal, FormField, Input } from '../ui';


const IotBillingTab: React.FC = () => {
  const { can } = useAuth();
  const [filter, setFilter] = useState<'pending' | 'invoiced' | 'all'>('pending');
  const [attaching, setAttaching] = useState<IotBillingTrigger | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const [customerId, setCustomerId] = useState('');

  const invoiced = filter === 'pending' ? false : filter === 'invoiced' ? true : undefined;
  const { data: triggers = [], isLoading, refetch } = useIotBillingTriggers(invoiced);
  const attachMutation = useAttachTriggersToInvoice();

  const totalPending = triggers
    .filter(t => !t.invoiced)
    .reduce((s, t) => s + Number(t.billableAmount), 0);

  const handleAttach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !customerId) return toast.error('Invoice ID and Customer ID are required');
    try {
      const attached = await attachMutation.mutateAsync({ invoiceId, customerId });
      toast.success(`${Array.isArray(attached) ? attached.length : 1} billing trigger(s) attached to invoice`);
      setAttaching(null);
      setInvoiceId('');
      setCustomerId('');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to attach triggers');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ovds-card p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending Triggers</p>
          <p className="text-[24px] font-bold text-slate-800 dark:text-slate-100">
            {triggers.filter(t => !t.invoiced).length}
          </p>
        </div>
        <div className="ovds-card p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending Amount</p>
          <p className="text-[18px] font-bold text-violet-600">
            {fmtCurrency(totalPending, 'ETB')}
          </p>
        </div>
        <div className="ovds-card p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Already Invoiced</p>
          <p className="text-[24px] font-bold text-[var(--pro-azure)]">
            {triggers.filter(t => t.invoiced).length}
          </p>
        </div>
        <div className="ovds-card p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Events</p>
          <p className="text-[24px] font-bold text-slate-800 dark:text-slate-100">{triggers.length}</p>
        </div>
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {[['pending','Pending'], ['invoiced','Invoiced'], ['all','All']] .map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v as any)}
              className={[
                'px-3 py-1.5 text-[11px] font-semibold transition-colors',
                filter === v ? 'bg-[var(--pro-azure)] text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              {l}
            </button>
          ))}
        </div>
        <Btn variant="ghost" size="sm" icon="REFRESH" onClick={() => refetch()}>Refresh</Btn>
        {can('iot:write') && triggers.filter(t => !t.invoiced).length > 0 && (
          <Btn
            variant="primary"
            size="sm"
            icon="BANKNOTE"
            onClick={() => setAttaching(triggers.find(t => !t.invoiced) ?? null)}
          >
            Attach to Invoice
          </Btn>
        )}
      </div>

      {/* How it works info */}
      {filter === 'pending' && triggers.filter(t => !t.invoiced).length === 0 && (
        <div className="ovds-card py-10 text-center">
          <Icon name="ZAP" size={28} className="mx-auto text-violet-400 mb-3" />
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">No pending billing events</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
            Smart billing triggers are created automatically when a device crosses a configured
            threshold (e.g. energy &gt; 100 kWh). Configure thresholds in the device settings.
          </p>
        </div>
      )}

      <AppTable loading={isLoading}>
        <thead>
          <tr>
            <AppTh>Device</AppTh>
            <AppTh>Trigger Type</AppTh>
            <AppTh>Description</AppTh>
            <AppTh>Metric</AppTh>
            <AppTh>Value / Threshold</AppTh>
            <AppTh>Amount</AppTh>
            <AppTh>Status</AppTh>
            <AppTh>Invoice</AppTh>
            <AppTh>Time</AppTh>
            {can('iot:write') && <AppTh>Action</AppTh>}
          </tr>
        </thead>
        <tbody>
          {triggers.map(t => (
            <AppTr key={t.id}>
              <AppTd>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{t.device?.name ?? '—'}</p>
                  <p className="text-[10px] text-slate-400">{t.device?.location ?? t.device?.deviceType ?? ''}</p>
                </div>
              </AppTd>
              <AppTd>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                  {t.triggerType.replace('_', ' ')}
                </span>
              </AppTd>
              <AppTd>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 max-w-[220px] truncate">{t.lineItemDescription}</p>
              </AppTd>
              <AppTd>
                <span className="text-[11px] font-mono text-slate-500">{t.metricKey ?? '—'}</span>
              </AppTd>
              <AppTd>
                {t.actualValue != null ? (
                  <span className="text-[11px]">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{Number(t.actualValue).toFixed(2)}</span>
                    {t.thresholdValue != null && (
                      <span className="text-slate-400"> / {Number(t.thresholdValue).toFixed(2)}</span>
                    )}
                  </span>
                ) : '—'}
              </AppTd>
              <AppTd>
                <Amount value={t.billableAmount} currency={t.currencyCode} />
              </AppTd>
              <AppTd>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  t.invoiced ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-amber-100 text-amber-700'
                }`}>
                  {t.invoiced ? 'INVOICED' : 'PENDING'}
                </span>
              </AppTd>
              <AppTd>
                {t.linkedInvoiceNo ? (
                  <span className="text-[11px] font-mono text-[var(--pro-azure)]">{t.linkedInvoiceNo}</span>
                ) : <span className="text-slate-300">—</span>}
              </AppTd>
              <AppTd>
                <span className="text-[11px] text-slate-500">{fmtDateTime(t.createdAt)}</span>
              </AppTd>
              {can('iot:write') && (
                <AppTd>
                  {!t.invoiced && (
                    <button
                      onClick={() => { setAttaching(t); setCustomerId(t.customerId ?? ''); }}
                      className="text-[10px] font-bold text-violet-600 hover:underline"
                    >
                      Attach
                    </button>
                  )}
                </AppTd>
              )}
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      {/* Attach to invoice modal */}
      {attaching && (
        <Modal
          open
          title="Attach Billing Triggers to Invoice"
          onClose={() => setAttaching(null)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setAttaching(null)}>Cancel</Btn>
              <Btn variant="primary" loading={attachMutation.isPending} onClick={handleAttach}>
                Attach All Pending Triggers
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
              <p className="text-[12px] text-violet-700 dark:text-violet-300">
                All uninvoiced billing triggers for the customer will be attached to the specified invoice as line items.
              </p>
            </div>
            <form onSubmit={handleAttach} className="space-y-4">
              <FormField label="Invoice ID *" required>
                <Input
                  value={invoiceId}
                  onChange={e => setInvoiceId(e.target.value)}
                  placeholder="Paste the invoice UUID"
                />
              </FormField>
              <FormField label="Customer ID *" required>
                <Input
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  placeholder="Paste the customer UUID"
                />
              </FormField>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default IotBillingTab;
