import { ModuleApp, type EventBusInterface, type ModuleContainer, type ModuleRoute, type MenuItem, type ModuleSetting, type ModulePermission } from '@ovds/core';

export class MaintainingTechnologyModuleProvider extends ModuleApp {
  constructor() {
    super({
      name: 'maintaining-technology',
      displayName: 'Maintaining Technology',
      version: '1.0.0',
      description: 'IT maintenance schedules, backup verification, access controls, and infrastructure health monitoring for accounting systems.',
      author: 'OVDS Core',
      category: 'maintaining-technology',
      icon: 'Server',
      dependsOn: ['core', 'settings'],
    });
  }

  async register(eventBus: EventBusInterface): Promise<void> {
    this.setEventBus(eventBus);
    this.logger.log('Maintaining Technology module registering event listeners...', 'MaintainingTechnologyModule');

    eventBus.listen('core.company.created', async (event: any) => {
      this.logger.log(`New company created, initializing maintenance defaults`, 'MaintainingTechnologyModule');
    });

    eventBus.listen('settings.system.updated', async (event: any) => {
      this.logger.log(`System settings updated, re-evaluating maintenance schedule`, 'MaintainingTechnologyModule');
    });

    this.markRegistered();
  }

  async boot(container: ModuleContainer): Promise<void> {
    this.setContainer(container);
    this.logger.log('Maintaining Technology module booting...', 'MaintainingTechnologyModule');
    this.markBooted();
  }

  routes(): ModuleRoute[] {
    return [
      { path: '/settings/maintaining-technology', component: '@ovds/modules/maintaining-technology/pages/MaintainingTechnologyPage', permissions: ['maintaining_technology.view'] },
    ];
  }

  menus(): MenuItem[] {
    return [
      {
        key: 'settings-maintaining-technology',
        label: 'Maintaining Technology',
        path: '/settings/maintaining-technology',
        icon: 'Server',
        order: 112,
        group: 'system',
        requiredPermissions: ['maintaining_technology.view'],
      },
    ];
  }

  settings(): ModuleSetting[] {
    return [
      { key: 'backup_frequency', label: 'Backup Frequency', type: 'select', defaultValue: 'daily', options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ], group: 'maintenance' },
      { key: 'backup_retention_days', label: 'Backup Retention (days)', type: 'number', defaultValue: '30', group: 'maintenance' },
      { key: 'patch_window_start', label: 'Patch Window Start', type: 'text', defaultValue: '22:00', group: 'maintenance' },
      { key: 'patch_window_end', label: 'Patch Window End', type: 'text', defaultValue: '23:59', group: 'maintenance' },
      { key: 'auto_backup_enabled', label: 'Automated Backups', type: 'boolean', defaultValue: 'true', group: 'maintenance' },
      { key: 'cloud_sync_enabled', label: 'Cloud Sync', type: 'boolean', defaultValue: 'true', group: 'maintenance' },
      { key: 'drill_frequency', label: 'Disaster Recovery Drill Frequency', type: 'select', defaultValue: 'quarterly', options: [
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Semi-Annually', value: 'semi_annually' },
        { label: 'Annually', value: 'annually' },
      ], group: 'maintenance' },
      { key: 'min_free_storage_pct', label: 'Minimum Free Storage %', type: 'number', defaultValue: '30', group: 'hardware' },
      { key: 'ups_test_frequency', label: 'UPS Test Frequency', type: 'select', defaultValue: 'bi_annually', options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Bi-Annually', value: 'bi_annually' },
        { label: 'Annually', value: 'annually' },
      ], group: 'hardware' },
      { key: 'permission_review_frequency', label: 'Permission Review Frequency', type: 'select', defaultValue: 'quarterly', options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Annually', value: 'annually' },
      ], group: 'access' },
      { key: 'audit_log_retention_days', label: 'Audit Log Retention (days)', type: 'number', defaultValue: '365', group: 'access' },
      { key: 'index_defrag_frequency', label: 'Index Defrag Frequency', type: 'select', defaultValue: 'weekly', options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ], group: 'database' },
      { key: 'log_pruning_enabled', label: 'Transaction Log Pruning', type: 'boolean', defaultValue: 'true', group: 'database' },
      { key: 'archiving_frequency', label: 'Historical Data Archiving', type: 'select', defaultValue: 'annually', options: [
        { label: 'Annually', value: 'annually' },
        { label: 'Semi-Annually', value: 'semi_annually' },
      ], group: 'database' },
    ];
  }

  permissions(): ModulePermission[] {
    return [
      { key: 'maintaining_technology.view', label: 'View Maintenance Dashboard', description: 'View IT maintenance schedules and status' },
      { key: 'maintaining_technology.manage_backups', label: 'Manage Backups', description: 'Configure and trigger backups' },
      { key: 'maintaining_technology.manage_patches', label: 'Manage Patches', description: 'Apply OS and software patches' },
      { key: 'maintaining_technology.manage_access', label: 'Manage Access Controls', description: 'Review and update user permissions' },
      { key: 'maintaining_technology.run_diagnostics', label: 'Run Diagnostics', description: 'Execute system health checks' },
      { key: 'maintaining_technology.manage_settings', label: 'Manage Maintenance Settings', description: 'Configure maintenance schedules and policies' },
    ];
  }
}

export const maintainingTechnologyModule = new MaintainingTechnologyModuleProvider();
