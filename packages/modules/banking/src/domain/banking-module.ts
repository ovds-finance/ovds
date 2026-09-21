/**
 * BankingModule — Ovds SaaS
 * ──────────────────────────
 * Pluggable ModuleApp for the Banking & Feeds bounded context.
 *
 * Handles: bank accounts, bank feeds, transaction import, reconciliation,
 * fund transfers, and real-time balance visibility.
 *
 * Follows the same Ovds SaaS module lifecycle as InvoicesModule:
 *   register(eventBus) → boot(container) → routes/menus/settings/permissions
 *
 * Data flow:
 *   emitsTo:      ['accounting']       — BankFeedImported triggers GL auto-match
 *   receivesFrom: ['invoices']         — PaymentReceived updates reconciliation queue
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
  type PaymentReceivedPayload,
} from '@ovds/shared';
import type { Event } from '@ovds/core';

export const BANKING_EVENTS = {
  FEED_IMPORTED:       'banking.feed.imported',
  TRANSACTION_MATCHED: 'banking.transaction.matched',
  RECONCILIATION_DONE: 'banking.reconciliation.completed',
  TRANSFER_CREATED:    'banking.transfer.created',
} as const;

export class BankingModule extends ModuleApp {
  constructor() {
    super({
      name: 'banking',
      displayName: 'Ovds SaaS — Banking & Feeds',
      version: '1.0.0',
      description:
        'Bank feeds, transaction import, real-time balances, reconciliation, ' +
        'and fund transfers for the Ovds SaaS platform.',
      author: 'Ovds SaaS Platform',
      category: 'banking',
      icon: 'Landmark',
      dependsOn: ['accounting', 'settings'],
      installType: 'core',
      subscriptionTiers: ['professional', 'enterprise'],
      complianceStandards: ['IFRS9', 'ETH-NBE'],
      dataFlow: {
        emitsTo: ['accounting'],
        receivesFrom: ['invoices'],
      },
    });
  }

  // ── register(eventBus) ────────────────────────────────────────────────────

  async register(eventBus: ModuleAppEventBus): Promise<void> {
    // React to invoice payments — add to reconciliation queue
    eventBus.listen(
      INVOICE_EVENTS.PAYMENT_RECEIVED,
      (event: Event) => {
        const { invoice, payment } = event.payload as PaymentReceivedPayload;
        this.logger.log(
          `BankingModule: queuing reconciliation for payment ` +
          `${payment.id} on invoice ${invoice.invoiceNumber}`,
        );
        // Real implementation would enqueue against the bank transaction matcher
      },
      { priority: 60 },
    );

    this.logger.log('BankingModule event listeners registered');
  }

  // ── boot(container) ───────────────────────────────────────────────────────

  async boot(_container: ModuleAppContainer): Promise<void> {
    this.logger.log('Ovds SaaS BankingModule booted');
  }

  // ── routes() ─────────────────────────────────────────────────────────────

  routes(): ModuleAppRoute[] {
    return [
      { path: '/banking/accounts',          component: 'BankAccountsPage',     permissions: ['banking:read'],  meta: { layoutMode: 'inline' } },
      { path: '/banking/feeds',             component: 'BankFeedsPage',         permissions: ['banking:read'],  meta: { layoutMode: 'inline' } },
      { path: '/banking/transactions',      component: 'TransactionsPage',      permissions: ['banking:read'],  meta: { layoutMode: 'inline' } },
      { path: '/banking/reconciliation',    component: 'ReconciliationPage',    permissions: ['banking:write'], meta: { layoutMode: 'inline' } },
      { path: '/banking/transfers',         component: 'FundTransfersPage',     permissions: ['banking:write'], meta: { layoutMode: 'slider' } },
      { path: '/banking/transfers/new',     component: 'FundTransferFormPage',  permissions: ['banking:write'], meta: { layoutMode: 'slider' } },
      { path: '/banking/statement-import',  component: 'StatementImportPage',   permissions: ['banking:write'], meta: { layoutMode: 'slider' } },
    ];
  }

  // ── menus() ──────────────────────────────────────────────────────────────

  menus(): ModuleAppMenuItem[] {
    return [{
      key: 'banking',
      label: 'Banking',
      icon: 'Landmark',
      order: 30,
      group: 'finance',
      children: [
        { key: 'banking.accounts',       label: 'Bank Accounts',     path: '/banking/accounts',       icon: 'CreditCard',    order: 1, requiredPermissions: ['banking:read'] },
        { key: 'banking.feeds',          label: 'Bank Feeds',        path: '/banking/feeds',           icon: 'Rss',           order: 2, requiredPermissions: ['banking:read'] },
        { key: 'banking.transactions',   label: 'Transactions',      path: '/banking/transactions',    icon: 'ArrowLeftRight',order: 3, requiredPermissions: ['banking:read'] },
        { key: 'banking.reconciliation', label: 'Reconciliation',    path: '/banking/reconciliation',  icon: 'CheckSquare',   order: 4, requiredPermissions: ['banking:write'] },
        { key: 'banking.transfers',      label: 'Fund Transfers',    path: '/banking/transfers',       icon: 'ArrowRightLeft',order: 5, requiredPermissions: ['banking:write'] },
      ],
    }];
  }

  // ── settings() ───────────────────────────────────────────────────────────

  settings(): ModuleAppSetting[] {
    return [
      { key: 'banking.default_account',      label: 'Default Bank Account',          type: 'text',    defaultValue: '',      group: 'banking' },
      { key: 'banking.auto_match_threshold',  label: 'Auto-match Confidence (%)',     type: 'number',  defaultValue: 85,      group: 'banking' },
      { key: 'banking.auto_reconcile',        label: 'Auto-reconcile on high match',  type: 'boolean', defaultValue: false,   group: 'banking' },
      { key: 'banking.feed_sync_interval',    label: 'Feed sync interval (minutes)',  type: 'number',  defaultValue: 60,      group: 'banking' },
      {
        key: 'banking.default_statement_format',
        label: 'Default Statement Import Format',
        type: 'select',
        defaultValue: 'CSV',
        group: 'banking',
        options: [
          { label: 'CSV',    value: 'CSV' },
          { label: 'OFX',    value: 'OFX' },
          { label: 'MT940',  value: 'MT940' },
          { label: 'CAMT053',value: 'CAMT053' },
        ],
      },
    ];
  }

  // ── permissions() ────────────────────────────────────────────────────────

  permissions(): ModuleAppPermission[] {
    return [
      { key: 'banking:read',         label: 'View Banking',        description: 'View bank accounts, feeds, and transactions',    roles: ['ADMIN', 'FINANCE', 'VIEWER'] },
      { key: 'banking:write',        label: 'Manage Banking',      description: 'Import statements, create transfers, reconcile',  roles: ['ADMIN', 'FINANCE'] },
      { key: 'banking:reconcile',    label: 'Reconcile',           description: 'Approve and post reconciliation matches',         roles: ['ADMIN', 'FINANCE'] },
      { key: 'banking:delete',       label: 'Delete Transactions', description: 'Delete unmatched imported transactions',          roles: ['ADMIN'] },
    ];
  }

  // ── health() ─────────────────────────────────────────────────────────────

  async health(): Promise<ModuleAppHealth> {
    return {
      status: 'healthy',
      message: 'Ovds SaaS BankingModule operational',
      checkedAt: new Date(),
    };
  }
}

export function createBankingModule(): BankingModule {
  return new BankingModule();
}
