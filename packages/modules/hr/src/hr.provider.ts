import { ModuleApp, type EventBusInterface, type ModuleContainer, type ModuleRoute, type MenuItem, type ModuleSetting, type ModulePermission } from '@ovds/core';

export class HrModuleProvider extends ModuleApp {
  constructor() {
    super({
      name: 'hr',
      displayName: 'Human Resources',
      version: '1.0.0',
      description: 'Employee management, attendance, payroll, pay calendars, and asset allocation.',
      author: 'OVDS Core',
      category: 'hr',
      icon: 'Users',
      dependsOn: ['core', 'settings'],
    });
  }

  async register(eventBus: EventBusInterface): Promise<void> {
    this.setEventBus(eventBus);
    this.logger.log('HR module registering event listeners...', 'HrModule');

    eventBus.listen('core.company.created', async (event: any) => {
      this.logger.log(`New company created, initializing HR defaults`, 'HrModule');
    });

    eventBus.listen('core.user.created', async (event: any) => {
      this.logger.log(`New user created, checking HR employee linkage`, 'HrModule');
    });

    this.markRegistered();
  }

  async boot(container: ModuleContainer): Promise<void> {
    this.setContainer(container);
    this.logger.log('HR module booting...', 'HrModule');
    this.markBooted();
  }

  routes(): ModuleRoute[] {
    return [
      { path: '/hr/employees', component: '@ovds/modules/hr/pages/Employees', permissions: ['employees.view'] },
      { path: '/hr/attendance', component: '@ovds/modules/hr/pages/Attendance', permissions: ['attendance.view'] },
      { path: '/hr/payroll', component: '@ovds/modules/hr/pages/Payroll', permissions: ['payroll.view'] },
      { path: '/hr/leaves', component: '@ovds/modules/hr/pages/Leaves', permissions: ['leaves.view'] },
      { path: '/hr/pay-calendars', component: '@ovds/modules/hr/pages/PayCalendars', permissions: ['pay_calendars.view'] },
      { path: '/hr/assets', component: '@ovds/modules/hr/pages/HrAssets', permissions: ['hr_assets.view'] },
    ];
  }

  menus(): MenuItem[] {
    return [
      {
        key: 'hr',
        label: 'Human Resources',
        path: '/hr/employees',
        icon: 'Users',
        order: 20,
        group: 'hr',
        requiredPermissions: ['employees.view'],
      },
    ];
  }

  permissions(): ModulePermission[] {
    return [
      { key: 'employees.view', label: 'View Employees', description: 'View employee list and details' },
      { key: 'employees.create', label: 'Create Employees', description: 'Add new employees' },
      { key: 'employees.edit', label: 'Edit Employees', description: 'Edit employee records' },
      { key: 'employees.delete', label: 'Delete Employees', description: 'Remove employees' },
      { key: 'attendance.view', label: 'View Attendance', description: 'View attendance records' },
      { key: 'attendance.verify', label: 'Verify Attendance', description: 'Verify attendance records' },
      { key: 'payroll.view', label: 'View Payroll', description: 'View payroll records' },
      { key: 'payroll.generate', label: 'Generate Payroll', description: 'Generate payroll runs' },
      { key: 'payroll.approve', label: 'Approve Payroll', description: 'Approve payroll runs' },
      { key: 'leaves.view', label: 'View Leaves', description: 'View leave requests' },
      { key: 'leaves.approve', label: 'Approve Leaves', description: 'Approve leave requests' },
      { key: 'pay_calendars.view', label: 'View Pay Calendars', description: 'View pay calendar configurations' },
      { key: 'pay_calendars.create', label: 'Create Pay Calendars', description: 'Create new pay calendars' },
      { key: 'pay_calendars.edit', label: 'Edit Pay Calendars', description: 'Edit pay calendar settings' },
      { key: 'pay_calendars.delete', label: 'Delete Pay Calendars', description: 'Delete pay calendars' },
      { key: 'hr_assets.view', label: 'View HR Assets', description: 'View employee asset allocations' },
      { key: 'hr_assets.allocate', label: 'Allocate Assets', description: 'Assign assets to employees' },
      { key: 'hr_assets.return', label: 'Return Assets', description: 'Process asset returns' },
    ];
  }
}

export const hrModule = new HrModuleProvider();
