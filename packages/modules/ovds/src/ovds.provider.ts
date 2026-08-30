import { ModuleApp, type EventBusInterface, type ModuleContainer, type ModuleRoute, type MenuItem, type ModuleSetting, type ModulePermission } from '@ovds/core';

export class ovdsModuleProvider extends ModuleApp {
  constructor() {
    super({
      name: 'ovds',
      displayName: 'ovds',
      version: '1.0.0',
      description: 'invoice, billing, expenses, and financial operations.',
      author: 'OVDS Core',
      category: 'ovds',
      icon: 'DollarSign',
      dependsOn: ['core', 'settings'],
    });
  }

  async register(eventBus: EventBusInterface): Promise<void> {
    this.setEventBus(eventBus);
    this.logger.log('ovds module registering event listeners...', 'ovdsModule');

    eventBus.listen('core.company.created', async (event: any) => {
      this.logger.log(`New company created, initializing ovds defaults`, 'ovdsModule');
    });

    this.markRegistered();
  }

  async boot(container: ModuleContainer): Promise<void> {
    this.setContainer(container);
    this.logger.log('ovds module booting...', 'ovdsModule');
    this.markBooted();
  }

  routes(): ModuleRoute[] {
    return [
      { path: '/sales/invoices', component: '@ovds/modules/ovds/pages/Invoices', permissions: ['invoices.view'] },
      { path: '/purchases/bills', component: '@ovds/modules/ovds/pages/Bills', permissions: ['bills.view'] },
      { path: '/sales/estimates', component: '@ovds/modules/ovds/pages/Estimates', permissions: ['estimates.view'] },
      { path: '/accounting/chart-of-accounts', component: '@ovds/modules/ovds/pages/ChartOfAccounts', permissions: ['accounting.view'] },
      { path: '/accounting/journals', component: '@ovds/modules/ovds/pages/JournalEntries', permissions: ['journal.view'] },
      { path: '/banking/accounts', component: '@ovds/modules/ovds/pages/BankAccounts', permissions: ['banking.view'] },
      { path: '/banking/reconciliation', component: '@ovds/modules/ovds/pages/Reconciliation', permissions: ['reconciliation.view'] },
    ];
  }

  menus(): MenuItem[] {
    return [
      {
        key: 'ovds',
        label: 'ovds',
        path: '/sales/invoices',
        icon: 'DollarSign',
        order: 30,
        group: 'ovds',
        requiredPermissions: ['invoices.view'],
      },
      {
        key: 'accounting',
        label: 'Accounting',
        path: '/accounting/chart-of-accounts',
        icon: 'BookOpen',
        order: 31,
        group: 'ovds',
        requiredPermissions: ['accounting.view'],
      },
      {
        key: 'banking',
        label: 'Banking',
        path: '/banking/accounts',
        icon: 'Landmark',
        order: 32,
        group: 'ovds',
        requiredPermissions: ['banking.view'],
      },
    ];
  }

  settings(): ModuleSetting[] {
    return [
      {
        key: 'invoice_prefix',
        label: 'Invoice Prefix',
        type: 'text',
        defaultValue: 'INV-',
        group: 'invoice',
      },
      {
        key: 'default_payment_terms',
        label: 'Default Payment Terms',
        type: 'text',
        defaultValue: 'Net 30',
        group: 'invoice',
      },
    ];
  }

  permissions(): ModulePermission[] {
    return [
      { key: 'invoices.view', label: 'View Invoices', description: 'View invoices' },
      { key: 'invoices.create', label: 'Create Invoices', description: 'Create new invoices' },
      { key: 'invoices.edit', label: 'Edit Invoices', description: 'Edit invoices' },
      { key: 'invoices.delete', label: 'Delete Invoices', description: 'Delete invoices' },
      { key: 'bills.view', label: 'View Bills', description: 'View bills' },
      { key: 'bills.create', label: 'Create Bills', description: 'Create new bills' },
      { key: 'estimates.view', label: 'View Estimates', description: 'View estimates' },
      { key: 'accounting.view', label: 'View Accounting', description: 'View chart of accounts and journals' },
      { key: 'accounting.create', label: 'Create Journal Entries', description: 'Create journal entries' },
      { key: 'accounting.post', label: 'Post Journal Entries', description: 'Post/approve journal entries' },
      { key: 'banking.view', label: 'View Banking', description: 'View bank accounts and transactions' },
      { key: 'banking.reconcile', label: 'Reconcile Bank Statements', description: 'Match bank statement lines' },
      { key: 'reconciliation.view', label: 'View Reconciliation', description: 'View bank reconciliation' },
    ];
  }
}

export const ovdsModule = new ovdsModuleProvider();
