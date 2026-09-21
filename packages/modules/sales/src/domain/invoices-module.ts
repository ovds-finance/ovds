/**
 * InvoicesModule
 * ──────────────
 * The canonical ModuleApp implementation for the Invoicing bounded context.
 *
 * Follows the Ovds SaaS module lifecycle:
 *   register(eventBus)  → subscribe to cross-domain events, declare data flow
 *   boot(container)     → resolve runtime services, attach LedgerObserver
 *   routes()            → declarative route manifests consumed by the router
 *   menus()             → navigation items injected into the sidebar
 *   settings()          → tenant-configurable keys surfaced in Settings UI
 *   permissions()       → RBAC permission keys for the invoices domain
 *   health()            → liveness probe
 *
 * This class is framework-agnostic. The NestJS CoreModule bootstraps it via
 * ModuleBootstrap.getInstance() during application startup.
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
import {
  INVOICE_EVENTS,
  type InvoiceSentPayload,
  type PaymentReceivedPayload,
  type InvoiceOverduePayload,
} from '@ovds/shared';
import type { Event } from '@ovds/core';

export class InvoicesModule extends ModuleApp {
  constructor() {
    super({
      name: 'invoices',
      displayName: 'Ovds SaaS — Invoices & Billing',
      version: '2.0.0',
      description:
        'Full-lifecycle invoice management for Ovds SaaS: drafting, sending, payment collection, ' +
        'multi-currency support, EIMS registration, and IFRS 15 revenue recognition.',
      author: 'Ovds SaaS Platform',
      category: 'sales',
      icon: 'FileText',
      // Depends on core accounting being available for GL posting
      dependsOn: ['accounting', 'settings'],
      installType: 'core',
      subscriptionTiers: ['starter', 'professional', 'enterprise'],
      complianceStandards: ['IFRS15', 'IFRS9', 'ETH-VAT', 'DRRF', 'EIMS'],
      dataFlow: {
        // Events this module dispatches onto the EventBus
        emitsTo: [
          'accounting',   // LedgerObserver posts GL entries
          'notifications', // NotificationObserver sends emails / SMS
          'crm',           // CRM pipeline updates on invoice state change
        ],
        // Events this module listens to (none yet — pure emitter)
        receivesFrom: [],
      },
    });
  }

  // ── register(eventBus) ───────────────────────────────────────────────────
  // Subscribe to inbound cross-domain events and set up the module's own
  // internal reactions that don't belong in the Ledger or Notification layers.

  async register(eventBus: ModuleAppEventBus): Promise<void> {
    // React to overdue events dispatched by the scheduler
    eventBus.listen(
      INVOICE_EVENTS.OVERDUE,
      (event: Event) => this.onInvoiceOverdue(event),
      { priority: 50 },
    );

    // React to payment received — update CRM deal stage if applicable
    eventBus.listen(
      INVOICE_EVENTS.PAYMENT_RECEIVED,
      (event: Event) => this.onPaymentReceived(event),
      { priority: 50 },
    );

    this.logger.log('InvoicesModule event listeners registered');
  }

  // ── boot(container) ──────────────────────────────────────────────────────
  // Resolve heavy runtime dependencies from the DI container.
  // Keep this lightweight — the real work happens in register().

  async boot(container: ModuleAppContainer): Promise<void> {
    const hasPrisma = container.has('prisma');
    const hasSettings = container.has('settings');

    this.logger.log(
      `InvoicesModule booted [prisma=${hasPrisma}, settings=${hasSettings}]`,
    );
  }

  // ── routes() ─────────────────────────────────────────────────────────────

  routes(): ModuleAppRoute[] {
    return [
      {
        path: '/sales/invoices',
        component: 'InvoicesPage',
        permissions: ['invoices:read'],
        meta: { title: 'Invoices', icon: 'FileText', layoutMode: 'inline' },
      },
      {
        path: '/sales/invoices/new',
        component: 'InvoiceFormPage',
        permissions: ['invoices:write'],
        meta: { title: 'New Invoice', icon: 'Plus', layoutMode: 'slider' },
      },
      {
        path: '/sales/invoices/:id/edit',
        component: 'InvoiceFormPage',
        permissions: ['invoices:write'],
        meta: { title: 'Edit Invoice', icon: 'Edit2', layoutMode: 'slider' },
      },
      {
        path: '/sales/estimates',
        component: 'EstimatesPage',
        permissions: ['invoices:read'],
        meta: { title: 'Estimates', icon: 'ClipboardList', layoutMode: 'inline' },
      },
      {
        path: '/sales/credit-notes',
        component: 'CreditNotesPage',
        permissions: ['invoices:read'],
        meta: { title: 'Credit Notes', layoutMode: 'inline' },
      },
    ];
  }

  // ── menus() ──────────────────────────────────────────────────────────────

  menus(): ModuleAppMenuItem[] {
    return [
      {
        key: 'sales',
        label: 'Sales',
        icon: 'TrendingUp',
        order: 20,
        group: 'income',
        children: [
          {
            key: 'sales.invoices',
            label: 'Invoices',
            path: '/sales/invoices',
            icon: 'FileText',
            order: 1,
            requiredPermissions: ['invoices:read'],
          },
          {
            key: 'sales.estimates',
            label: 'Estimates',
            path: '/sales/estimates',
            icon: 'ClipboardList',
            order: 2,
            requiredPermissions: ['invoices:read'],
          },
          {
            key: 'sales.credit-notes',
            label: 'Credit Notes',
            path: '/sales/credit-notes',
            icon: 'Receipt',
            order: 3,
            requiredPermissions: ['invoices:read'],
          },
          {
            key: 'sales.customers',
            label: 'Customers',
            path: '/accounting/hub?tab=CUSTOMERS',
            icon: 'Users',
            order: 4,
            requiredPermissions: ['customers:read'],
          },
        ],
      },
    ];
  }

  // ── settings() ───────────────────────────────────────────────────────────

  settings(): ModuleAppSetting[] {
    return [
      {
        key: 'invoices.prefix',
        label: 'Invoice Number Prefix',
        type: 'text',
        defaultValue: 'INV',
        group: 'invoices',
      },
      {
        key: 'invoices.due_days',
        label: 'Default Due Days',
        type: 'number',
        defaultValue: 30,
        group: 'invoices',
      },
      {
        key: 'invoices.default_vat_rate',
        label: 'Default VAT Rate (%)',
        type: 'number',
        defaultValue: 15,
        group: 'invoices',
      },
      {
        key: 'invoices.default_currency',
        label: 'Default Invoice Currency',
        type: 'text',
        defaultValue: 'ETB',
        group: 'invoices',
      },
      {
        key: 'invoices.auto_send_eims',
        label: 'Auto-register invoices with EIMS',
        type: 'boolean',
        defaultValue: false,
        group: 'invoices',
      },
      {
        key: 'invoices.show_discount_column',
        label: 'Show discount column in line items grid',
        type: 'boolean',
        defaultValue: true,
        group: 'invoices',
      },
      {
        key: 'invoices.show_tax_column',
        label: 'Show tax column in line items grid',
        type: 'boolean',
        defaultValue: true,
        group: 'invoices',
      },
      {
        key: 'invoices.payment_terms_options',
        label: 'Payment Terms Options',
        type: 'select',
        defaultValue: 'NET30',
        options: [
          { label: 'Due on receipt', value: 'DUE_ON_RECEIPT' },
          { label: 'Net 15', value: 'NET15' },
          { label: 'Net 30', value: 'NET30' },
          { label: 'Net 60', value: 'NET60' },
          { label: 'Net 90', value: 'NET90' },
        ],
        group: 'invoices',
      },
    ];
  }

  // ── permissions() ────────────────────────────────────────────────────────

  permissions(): ModuleAppPermission[] {
    return [
      {
        key: 'invoices:read',
        label: 'View Invoices',
        description: 'View invoices, estimates, and payment history',
        roles: ['ADMIN', 'FINANCE', 'SALES', 'VIEWER'],
      },
      {
        key: 'invoices:write',
        label: 'Create & Edit Invoices',
        description: 'Draft, update, send, and duplicate invoices',
        roles: ['ADMIN', 'FINANCE', 'SALES'],
      },
      {
        key: 'invoices:delete',
        label: 'Delete Invoices',
        description: 'Delete DRAFT invoices',
        roles: ['ADMIN', 'FINANCE'],
      },
      {
        key: 'invoices:payment',
        label: 'Record Payments',
        description: 'Record and reconcile invoice payments',
        roles: ['ADMIN', 'FINANCE'],
      },
      {
        key: 'invoices:void',
        label: 'Void / Cancel Invoices',
        description: 'Void or cancel issued invoices',
        roles: ['ADMIN'],
      },
      {
        key: 'invoices:eims',
        label: 'EIMS Registration',
        description: 'Register invoices with the Ethiopian EIMS system',
        roles: ['ADMIN', 'FINANCE'],
      },
    ];
  }

  // ── health() ─────────────────────────────────────────────────────────────

  async health(): Promise<ModuleAppHealth> {
    // The module itself has no external dependencies to check — the DB and
    // event bus are checked by the platform kernel. This is a lightweight signal.
    return {
      status: 'healthy',
      message: 'InvoicesModule operational',
      checkedAt: new Date(),
    };
  }

  // ── Internal event handlers ───────────────────────────────────────────────

  private onInvoiceOverdue(event: Event): void {
    const { invoice, daysPastDue } = event.payload as InvoiceOverduePayload;
    this.logger.warn(
      `Invoice ${invoice.invoiceNumber} is ${daysPastDue} day(s) past due for company ${invoice.companyId}`,
    );
    // Further reactions (e.g. auto-email dunning) would be delegated to the
    // NotificationsModule by dispatching INVOICE_EVENTS.OVERDUE — already done
    // by the scheduler before this listener fires.
  }

  private onPaymentReceived(event: Event): void {
    const { invoice, payment, newStatus } = event.payload as PaymentReceivedPayload;
    this.logger.log(
      `Payment of ${payment.amount} ${payment.currencyCode} received on ` +
      `invoice ${invoice.invoiceNumber} → status now ${newStatus}`,
    );
  }
}

// ── Singleton factory (used by ModuleBootstrap.registerModule) ────────────────

export function createInvoicesModule(): InvoicesModule {
  return new InvoicesModule();
}
