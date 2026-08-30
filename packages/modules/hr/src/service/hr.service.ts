import type { EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto, CreateAttendanceDto, CreateLeaveDto } from '../dto/hr.dto';
import { dispatchEvent, type EventBusInterface } from '@ovds/core';

export class HrService {
  private employees: Map<string, EmployeeDto> = new Map();
  private attendances: Map<string, CreateAttendanceDto & { id: string }> = new Map();
  private leaves: Map<string, CreateLeaveDto & { id: string }> = new Map();

  constructor(private eventBus?: EventBusInterface) {}

  async createEmployee(dto: CreateEmployeeDto): Promise<EmployeeDto> {
    const id = `emp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const employee: EmployeeDto = {
      id,
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.set(id, employee);

    await dispatchEvent(this.eventBus, 'hr.employee.created', employee, HrService.name);
    return employee;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<EmployeeDto | null> {
    const existing = this.employees.get(id);
    if (!existing) return null;

    const updated: EmployeeDto = {
      ...existing,
      ...dto,
      updatedAt: new Date(),
    };
    this.employees.set(id, updated);

    await dispatchEvent(this.eventBus, 'hr.employee.updated', updated, HrService.name);
    return updated;
  }

  async findEmployee(id: string): Promise<EmployeeDto | null> {
    return this.employees.get(id) ?? null;
  }

  async listEmployees(companyId: string): Promise<EmployeeDto[]> {
    return Array.from(this.employees.values()).filter((emp) => emp.companyId === companyId);
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const existed = this.employees.delete(id);
    if (existed) {
      await dispatchEvent(this.eventBus, 'hr.employee.deleted', { id }, HrService.name);
    }
    return existed;
  }

  async markAttendance(dto: CreateAttendanceDto): Promise<string> {
    const id = `att_${Date.now()}`;
    const record = { id, ...dto };
    this.attendances.set(id, record);
    await dispatchEvent(this.eventBus, 'hr.attendance.marked', record, HrService.name);
    return id;
  }

  async requestLeave(dto: CreateLeaveDto): Promise<string> {
    const id = `lev_${Date.now()}`;
    const record = { id, ...dto };
    this.leaves.set(id, record);
    await dispatchEvent(this.eventBus, 'hr.leave.requested', record, HrService.name);
    return id;
  }

  getEmployeeCount(): number {
    return this.employees.size;
  }
}
