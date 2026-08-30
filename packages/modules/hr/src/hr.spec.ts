import { describe, it, expect } from 'vitest';
import { HrModuleProvider, hrModule, HrService } from './index';
import { createMockEventBus, createMockContainer } from '@ovds/core';

describe('HrModuleProvider', () => {
  it('is created from the singleton instance', () => {
    expect(hrModule).toBeInstanceOf(HrModuleProvider);
  });

  it('has correct module info', () => {
    expect(hrModule.info.name).toBe('hr');
    expect(hrModule.info.displayName).toBe('Human Resources');
    expect(hrModule.info.category).toBe('hr');
    expect(hrModule.info.icon).toBe('Users');
    expect(hrModule.info.dependsOn).toEqual(['core', 'settings']);
  });

  it('starts as not registered and not booted', () => {
    const mod = new HrModuleProvider();
    expect(mod.isRegistered).toBe(false);
    expect(mod.isBooted).toBe(false);
  });

  it('defines routes for all HR sections', () => {
    const routes = hrModule.routes();
    const paths = routes.map((r) => r.path);

    expect(paths).toContain('/hr/employees');
    expect(paths).toContain('/hr/attendance');
    expect(paths).toContain('/hr/payroll');
    expect(paths).toContain('/hr/leaves');
    expect(paths).toContain('/hr/pay-calendars');
    expect(paths).toContain('/hr/assets');
  });

  it('defines menu item for HR section', () => {
    const menus = hrModule.menus();
    expect(menus.length).toBeGreaterThan(0);
    expect(menus[0].key).toBe('hr');
    expect(menus[0].label).toBe('Human Resources');
  });

  it('defines permissions for employee management', () => {
    const permissions = hrModule.permissions();
    const keys = permissions.map((p) => p.key);

    expect(keys).toContain('employees.view');
    expect(keys).toContain('employees.create');
    expect(keys).toContain('employees.edit');
    expect(keys).toContain('employees.delete');
  });

  it('defines permissions for pay calendars and HR assets', () => {
    const permissions = hrModule.permissions();
    const keys = permissions.map((p) => p.key);

    expect(keys).toContain('pay_calendars.view');
    expect(keys).toContain('pay_calendars.create');
    expect(keys).toContain('pay_calendars.edit');
    expect(keys).toContain('pay_calendars.delete');
    expect(keys).toContain('hr_assets.view');
    expect(keys).toContain('hr_assets.allocate');
    expect(keys).toContain('hr_assets.return');
  });

  it('registers with event bus and marks as registered', () => {
    const mod = new HrModuleProvider();
    const eventBus = createMockEventBus();
    const container = createMockContainer();

    mod.register(eventBus as any);
    mod.boot(container as any);

    expect(mod.isRegistered).toBe(true);
    expect(mod.isBooted).toBe(true);
  });
});

describe('HrService', () => {
  it('creates an employee and dispatches event', async () => {
    const eventBus = createMockEventBus();
    const service = new HrService(eventBus);

    const emp = await service.createEmployee({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      companyId: 'comp-1',
    });

    expect(emp.id).toBeDefined();
    expect(emp.firstName).toBe('John');
    expect(service.getEmployeeCount()).toBe(1);
    expect(eventBus.dispatchedEvents).toHaveLength(1);
  });

  it('updates an existing employee', async () => {
    const service = new HrService();
    const emp = await service.createEmployee({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      companyId: 'comp-1',
    });

    const updated = await service.updateEmployee(emp.id, { firstName: 'Jane2' });
    expect(updated?.firstName).toBe('Jane2');
    expect(updated?.lastName).toBe('Smith');
  });

  it('returns null for updating non-existent employee', async () => {
    const service = new HrService();
    const result = await service.updateEmployee('nonexistent', { firstName: 'X' });
    expect(result).toBeNull();
  });

  it('finds employee by id', async () => {
    const service = new HrService();
    const emp = await service.createEmployee({
      firstName: 'Bob',
      lastName: 'Builder',
      email: 'bob@example.com',
      companyId: 'comp-1',
    });

    const found = await service.findEmployee(emp.id);
    expect(found?.email).toBe('bob@example.com');
  });

  it('lists employees filtered by company', async () => {
    const service = new HrService();
    await service.createEmployee({ firstName: 'A', lastName: 'A', email: 'a@test.com', companyId: 'comp-1' });
    await service.createEmployee({ firstName: 'B', lastName: 'B', email: 'b@test.com', companyId: 'comp-2' });

    const comp1Employees = await service.listEmployees('comp-1');
    expect(comp1Employees).toHaveLength(1);
    expect(comp1Employees[0].firstName).toBe('A');
  });

  it('deletes an employee and dispatches event', async () => {
    const eventBus = createMockEventBus();
    const service = new HrService(eventBus);
    const emp = await service.createEmployee({ firstName: 'Del', lastName: 'Me', email: 'del@test.com', companyId: 'comp-1' });

    const deleted = await service.deleteEmployee(emp.id);
    expect(deleted).toBe(true);
    expect(service.getEmployeeCount()).toBe(0);
  });

  it('marks attendance with event dispatch', async () => {
    const eventBus = createMockEventBus();
    const service = new HrService(eventBus);

    await service.markAttendance({
      employeeId: 'emp-1',
      date: '2024-01-01',
      checkIn: '09:00',
      status: 'present',
      companyId: 'comp-1',
    });

    expect(eventBus.dispatchedEvents).toHaveLength(1);
  });

  it('requests leave with event dispatch', async () => {
    const eventBus = createMockEventBus();
    const service = new HrService(eventBus);

    await service.requestLeave({
      employeeId: 'emp-1',
      leaveType: 'annual',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      status: 'pending',
      companyId: 'comp-1',
    });

    expect(eventBus.dispatchedEvents).toHaveLength(1);
  });
});
