/**
 * InvoicesModule — backend-local factory
 * ────────────────────────────────────────
 * Provides a NestJS-compilable InvoicesModule factory for ModuleBootstrapService.
 *
 * Why this file exists:
 *   packages/modules/sales uses moduleResolution "bundler" + noEmit, so it
 *   produces no dist and cannot be imported by the backend's node16 resolver.
 *   This file re-implements the factory inline using only packages that the
 *   backend already has in its node_modules (@ovds/core, @ovds/shared).
 *
 * The canonical source of truth (routes, menus, settings, permissions) is
 *   packages/modules/sales/src/domain/invoices-module.ts
 * Keep both files in sync when changing module metadata.
 */

import {
  ModuleApp,
  type ModuleAppEventBus,
  type ModuleAppContainer,
  type ModuleAppRoute,
  type ModuleAppMenuItem,
  type ModuleAppSetting,
  type ModuleAppPermission,
  type ModuleAppHealth,
} from '@ovds/core';
import type { Event } from '@ovds/core';
import {
  INVOICE_EVENTS,
  type InvoiceSentPayload,
  type PaymentReceivedPayload,
  type InvoiceOverduePayload,
} from '@ovds/shared';

class InvoicesModuleLocal extends ModuleApp {
  constructor() {
    super({
      name: 'invoices',
      displayName: 'Ovds SaaS — Invoices & Billing',
      version: '2.0.0',
      description: 'Full-lifecycle invoice management for Ovds SaaS: drafting, sending, payment collection, multi-currency support, EIMS registration, and IFRS 15 revenue recognition.',
      author: 'Ovds SaaS Platform',
      category: 'sales',
      icon: 'FileText',
      dependsOn: ['accounting', 'settings'],
      installType: 'core',
      subscriptionTiers: ['starter', 'professional', 'enterprise'],
      complianceStandards: ['IFRS15', 'IFRS9', 'ETH-VAT', 'DRRF', 'EIMS'],
      dataFlow: {
        emitsTo: ['accounting', 'notifications', 'crm'],
        receivesFrom: [],
      },
    });
  }

  async register(eventBus: ModuleAppEventBus): Promise<void> {
    eventBus.listen(
      INVOICE_EVENTS.OVERDUE,
      (event: Event) => {
        const { invoice, daysPastDue } = event.payload as InvoiceOverduePayload;
        this.logger.warn(`Invoice ${invoice.invoiceNumber} is ${daysPastDue} day(s) past due`);
      },
      { priority: 50 },
    );

    eventBus.listen(
      INVOICE_EVENTS.PAYMENT_RECEIVED,
      (event: Event) => {
        const { invoice, payment, newStatus } = event.payload as PaymentReceivedPayload;
        this.logger.log(
          `Payment ${payment.amount} ${payment.currencyCode} on ${invoice.invoiceNumber} → ${newStatus}`,
        );
      },
      { priority: 50 },
    );
  }

  async boot(_container: ModuleAppContainer): Promise<void> {
    this.logger.log('Ovds SaaS InvoicesModule booted');
  }

  routes(): ModuleAppRoute[] {
    return [
      { path: '/sales/invoices',         component: 'InvoicesPage',    permissions: ['invoices:read'],  meta: { layoutMode: 'inline' } },
      { path: '/sales/invoices/new',     component: 'InvoiceFormPage', permissions: ['invoices:write'], meta: { layoutMode: 'slider' } },
      { path: '/sales/invoices/:id/edit',component: 'InvoiceFormPage', permissions: ['invoices:write'], meta: { layoutMode: 'slider' } },
      { path: '/sales/estimates',        component: 'EstimatesPage',   permissions: ['invoices:read'],  meta: { layoutMode: 'inline' } },
      { path: '/sales/credit-notes',     component: 'CreditNotesPage', permissions: ['invoices:read'],  meta: { layoutMode: 'inline' } },
    ];
  }

  menus(): ModuleAppMenuItem[] {
    return [{
      key: 'sales', label: 'Sales', icon: 'TrendingUp', order: 20, group: 'income',
      children: [
        { key: 'sales.invoices',     label: 'Invoices',     path: '/sales/invoices',         icon: 'FileText',    order: 1, requiredPermissions: ['invoices:read'] },
        { key: 'sales.estimates',    label: 'Estimates',    path: '/sales/estimates',        icon: 'ClipboardList',order: 2, requiredPermissions: ['invoices:read'] },
        { key: 'sales.credit-notes', label: 'Credit Notes', path: '/sales/credit-notes',     icon: 'Receipt',     order: 3, requiredPermissions: ['invoices:read'] },
        { key: 'sales.customers',    label: 'Customers',    path: '/accounting/hub?tab=CUSTOMERS', icon: 'Users', order: 4, requiredPermissions: ['customers:read'] },
      ],
    }];
  }

  settings(): ModuleAppSetting[] {
    return [
      { key: 'invoices.prefix',              label: 'Invoice Number Prefix',         type: 'text',    defaultValue: 'INV',   group: 'invoices' },
      { key: 'invoices.due_days',            label: 'Default Due Days',              type: 'number',  defaultValue: 30,      group: 'invoices' },
      { key: 'invoices.default_vat_rate',    label: 'Default VAT Rate (%)',          type: 'number',  defaultValue: 15,      group: 'invoices' },
      { key: 'invoices.default_currency',    label: 'Default Invoice Currency',      type: 'text',    defaultValue: 'ETB',   group: 'invoices' },
      { key: 'invoices.auto_send_eims',      label: 'Auto-register with EIMS',       type: 'boolean', defaultValue: false,   group: 'invoices' },
      { key: 'invoices.show_discount_column',label: 'Show discount column',          type: 'boolean', defaultValue: true,    group: 'invoices' },
      { key: 'invoices.show_tax_column',     label: 'Show tax column',               type: 'boolean', defaultValue: true,    group: 'invoices' },
      {
        key: 'invoices.payment_terms_options', label: 'Payment Terms', type: 'select', defaultValue: 'NET30', group: 'invoices',
        options: [
          { label: 'Due on receipt', value: 'DUE_ON_RECEIPT' },
          { label: 'Net 15',  value: 'NET15' },
          { label: 'Net 30',  value: 'NET30' },
          { label: 'Net 60',  value: 'NET60' },
          { label: 'Net 90',  value: 'NET90' },
        ],
      },
    ];
  }

  permissions(): ModuleAppPermission[] {
    return [
      { key: 'invoices:read',    label: 'View Invoices',        description: 'View invoices and payment history',          roles: ['ADMIN','FINANCE','SALES','VIEWER'] },
      { key: 'invoices:write',   label: 'Create & Edit',        description: 'Draft, update, send, and duplicate invoices', roles: ['ADMIN','FINANCE','SALES'] },
      { key: 'invoices:delete',  label: 'Delete Invoices',      description: 'Delete DRAFT invoices',                      roles: ['ADMIN','FINANCE'] },
      { key: 'invoices:payment', label: 'Record Payments',      description: 'Record and reconcile payments',               roles: ['ADMIN','FINANCE'] },
      { key: 'invoices:void',    label: 'Void Invoices',        description: 'Void or cancel issued invoices',              roles: ['ADMIN'] },
      { key: 'invoices:eims',    label: 'EIMS Registration',    description: 'Register invoices with EIMS',                roles: ['ADMIN','FINANCE'] },
    ];
  }

  async health(): Promise<ModuleAppHealth> {
    return { status: 'healthy', message: 'InvoicesModule operational', checkedAt: new Date() };
  }
}

export function createInvoicesModule(): InvoicesModuleLocal {
  return new InvoicesModuleLocal();
}
