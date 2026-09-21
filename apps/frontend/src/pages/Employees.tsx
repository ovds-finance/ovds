/**
 * Employees — ovds-style employee management
 * AppPage · AppKpi · AppTable · useApiCrud
 * Ethiopian payroll: PIT, pension, DRRF
 */
import {
  Users, Plus, Edit2, Trash2, Download, RefreshCw,
  Mail, Phone, Building2, Banknote, Calendar, Upload,
} from 'lucide-react';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select,
  SearchBar, EmptyState, Pagination, EthTaxBadge, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { departmentsApi, employeesApi } from '../services/hrApi';
import { confirm } from '../utils/confirm';
import { fmtETB, calculatePIT } from '../utils/ethiopianTax';

interface Employee {
  id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  department?: { name: string };
  designation?: string;
  employmentNature?: string;
  payrollStatus?: string;
  baseSalary?: number;
  companyId?: string;
  bankName?: string;
  accountNumber?: string;
  emergencyContact?: string;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'FULL_TIME' | 'PART_TIME';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const EmployeeForm: React.FC<{
  data: Partial<Employee>;
  onChange: (d: Partial<Employee>) => void;
  departments: any[];
}> = ({ data, onChange, departments }) => {
  const set = (k: keyof Employee, v: any) => onChange({ ...data, [k]: v });
  const pitPreview = data.baseSalary ? calculatePIT(Number(data.baseSalary)) : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First Name" required>
          <Input value={data.firstName ?? ''} onChange={e => set('firstName', e.target.value)} placeholder="First name" />
        </FormField>
        <FormField label="Last Name" required>
          <Input value={data.lastName ?? ''} onChange={e => set('lastName', e.target.value)} placeholder="Last name" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email">
          <Input type="email" value={data.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="employee@company.com" />
        </FormField>
        <FormField label="Phone">
          <Input value={data.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+251 9XX XXX XXX" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Department">
          <Select value={data.departmentId ?? ''} onChange={e => set('departmentId', e)}>
            <option value="">Select Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Position">
          <Input value={data.designation ?? ''} onChange={e => set('designation', e.target.value)} placeholder="Job title" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Employment Nature">
          <Select value={data.employmentNature ?? 'Permanent'} onChange={e => set('employmentNature', e)}>
            <option value="Permanent">Permanent</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Intern">Intern</option>
          </Select>
        </FormField>
        <FormField label="Employee ID">
          <Input value={data.employeeId ?? ''} onChange={e => set('employeeId', e.target.value)} placeholder="EMP-001" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Basic Salary (ETB)">
          <Input type="number" step="0.01" value={data.baseSalary ?? ''} onChange={e => set('baseSalary', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
        <FormField label="Employment Nature">
          <Select value={data.employmentNature ?? 'Permanent'} onChange={e => set('employmentNature', e)}>
            <option value="Permanent">Permanent</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Intern">Intern</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Bank Name">
          <Input value={data.bankName ?? ''} onChange={e => set('bankName', e.target.value)} placeholder="e.g. CBE, Awash Bank" />
        </FormField>
        <FormField label="Account Number">
          <Input value={data.accountNumber ?? ''} onChange={e => set('accountNumber', e.target.value)} placeholder="Bank account number" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Phone">
          <Input value={data.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+251 9XX XXX XXX" />
        </FormField>
        <FormField label="Emergency Contact">
          <Input value={(data as any).emergencyContact ?? ''} onChange={e => set('emergencyContact' as any, e.target.value)} placeholder="Emergency contact name & phone" />
        </FormField>
      </div>
      {/* PIT preview */}
      {pitPreview && (
        <div className="p-3 bg-[var(--pro-azure-50)] rounded-xl border border-[var(--pro-azure-100)] space-y-1.5">
          <p className="text-[10px] font-bold text-[var(--pro-azure-dark)] uppercase tracking-wider">Ethiopian PIT Preview</p>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div><p className="text-slate-500">Gross</p><p className="font-bold text-slate-700">{fmtETB(pitPreview.grossSalary)}</p></div>
            <div><p className="text-slate-500">Income Tax</p><p className="font-bold text-rose-600">{fmtETB(pitPreview.incomeTax)}</p></div>
            <div><p className="text-slate-500">Net Pay</p><p className="font-bold text-[var(--pro-azure-dark)]">{fmtETB(pitPreview.netSalary)}</p></div>
            <div><p className="text-slate-500">Pension (7%)</p><p className="font-bold text-violet-600">{fmtETB(pitPreview.pensionEmployee)}</p></div>
            <div><p className="text-slate-500">Employer (11%)</p><p className="font-bold text-amber-600">{fmtETB(pitPreview.pensionEmployer)}</p></div>
            <div><p className="text-slate-500">DRRF (1%)</p><p className="font-bold text-orange-600">{fmtETB(pitPreview.drrf)}</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

const Employees: React.FC = () => {
  usePageTitle('Employees');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]       = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [modal, setModal]   = useState<{ open: boolean; data: Partial<Employee> }>({ open: false, data: {} });
  const [departments, setDepartments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const apiParams = useMemo(() => {
    const p: any = { search: debouncedSearch.trim() || undefined };
    if (tab === 'ACTIVE') p.status = 'ACTIVE';
    if (tab === 'INACTIVE') p.status = 'INACTIVE';
    if (tab === 'FULL_TIME') p.employmentNature = 'Permanent';
    if (tab === 'PART_TIME') p.employmentNature = 'Contract';
    return p;
  }, [debouncedSearch, tab]);

  const fetchSummary = useCallback(() => {
    if (selectedCompanyId) {
      employeesApi.getPayrollStatusSummary(selectedCompanyId).then(setSummary);
    }
  }, [selectedCompanyId]);

  React.useEffect(() => {
    if (selectedCompanyId) {
      departmentsApi.list({ companyId: selectedCompanyId }).then((res: any) => {
        setDepartments((res as any)?.data || res || []);
      });
      fetchSummary();
    }
  }, [selectedCompanyId, fetchSummary]);

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } =
    useApiCrud<Employee>({
      endpoint: '/hr/employees',
      companyId: selectedCompanyId,
      params: apiParams,
      pageSize: 25,
      pollMs: 120_000,
    });

  React.useEffect(() => {
    if (selectedCompanyId) {
      fetchSummary();
    }
  }, [selectedCompanyId, rows, fetchSummary]);

  const kpiCells = useMemo(() => {
    return [
      {
        label: 'Total',
        value: summary?.total ?? total,
        color: 'green' as const,
      },
      {
        label: 'Active',
        value: summary?.activeCount ?? 0,
        color: 'sky' as const,
      },
      {
        label: 'Permanent',
        value: summary?.permanentCount ?? 0,
        color: 'violet' as const,
      },
      { label: 'Payroll', value: fmtETB(summary?.totalSalary ?? 0), color: 'amber' as const },
    ];
  }, [summary, total]);

  const handleSave = useCallback(async () => {
    if (!modal.data.firstName?.trim() || !modal.data.lastName?.trim()) {
      toast.error('First and last name are required');
      return;
    }
    const result = await save({
      ...modal.data,
    } as any);
    if (result) setModal((m) => ({ ...m, open: false }));
  }, [modal.data, save]);

  const handleExport = () => {
    const headers = 'ID,Name,Email,Designation,Nature,Salary,Status\n';
    const csvRows = rows
      .map(
        (e) =>
          `"${e.employeeId ?? ''}","${e.firstName} ${e.lastName}","${e.email ?? ''}","${e.designation ?? ''}","${e.employmentNature ?? ''}",${e.baseSalary ?? 0},"${e.payrollStatus ?? 'ACTIVE'}"`,
      )
      .join('\n');
    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <AppPage
      title="Employees"
      subtitle={`${rows.length} employees · Ethiopian payroll & PIT · Healthcare & Pharmaceuticals · Manufacturing & Logistics · IT & Software · ERP · Consumer Insights`}
      icon={<Users size={18} />}
      crumbs={[{ label: 'Employees' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',       label: 'All',       count: summary?.total ?? total },
            { key: 'ACTIVE',    label: 'Active',    count: summary?.activeCount ?? 0 },
            { key: 'FULL_TIME', label: 'Permanent', count: summary?.permanentCount ?? 0 },
            { key: 'PART_TIME', label: 'Contract', count: summary?.contractCount ?? 0 },
            { key: 'INACTIVE',  label: 'Inactive',  count: summary?.inactiveCount ?? 0 },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExport}>Export</Btn>
          {can('employees:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { employmentNature: 'Permanent', payrollStatus: 'ACTIVE' } })}>
              New Employee
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />
      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search employees…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{total} employees</span>
      </div>
      <AppTable>
        <thead><tr>
          <AppTh>Employee</AppTh>
          <AppTh>Contact</AppTh>
          <AppTh>Department</AppTh>
          <AppTh>Position</AppTh>
          <AppTh>Nature</AppTh>
          <AppTh align="right">Salary</AppTh>
          <AppTh>Status</AppTh>
          <AppTh align="right" width="80px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={<Users size={18} />} title="No employees" desc="Add your first employee to start payroll" action={can('employees:write') ? { label: 'Add Employee', onClick: () => setModal({ open: true, data: { employmentNature: 'Permanent', payrollStatus: 'ACTIVE' } }) } : undefined} /></td></tr>
          ) : rows.map(e => (
            <AppTr key={e.id}>
              <AppTd>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--pro-azure)] to-teal-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {e.firstName.charAt(0)}{e.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800">{e.firstName} {e.lastName}</p>
                    {e.employeeId && <p className="text-[9px] font-mono text-slate-400">{e.employeeId}</p>}
                  </div>
                </div>
              </AppTd>
              <AppTd>
                <div className="space-y-0.5">
                  {e.email && <div className="flex items-center gap-1 text-[10px] text-slate-500"><Mail size={9} className="text-slate-300" />{e.email}</div>}
                  {e.phone && <div className="flex items-center gap-1 text-[10px] text-slate-500"><Phone size={9} className="text-slate-300" />{e.phone}</div>}
                </div>
              </AppTd>
              <AppTd>
                {e.department?.name
                  ? <div className="flex items-center gap-1 text-[11px] text-slate-600"><Building2 size={10} className="text-slate-300" />{e.department.name}</div>
                  : <span className="text-[10px] text-slate-300">—</span>
                }
              </AppTd>
              <AppTd><span className="text-[11px] text-slate-600">{e.designation ?? '—'}</span></AppTd>
              <AppTd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  e.employmentNature === 'Permanent' ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]' :
                  e.employmentNature === 'Contract' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                  'bg-white text-slate-600 border-slate-200'
                }`}>{(e.employmentNature ?? 'Permanent').replace(/_/g, ' ')}</span>
              </AppTd>
              <AppTd align="right">
                {e.baseSalary
                  ? <Amount value={e.baseSalary} size="sm" />
                  : <span className="text-[10px] text-slate-300">—</span>
                }
              </AppTd>
              <AppTd><StatusBadge status={e.payrollStatus ?? 'ACTIVE'} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can('employees:write') && (
                    <>
                      <button onClick={() => setModal({ open: true, data: { ...e } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"><Edit2 size={11} /></button>
                      <button onClick={async () => { if (await confirm({ title: `Delete "${e.firstName} ${e.lastName}"?`, variant: 'danger' })) remove(e.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))} title={modal.data.id ? `Edit: ${modal.data.firstName} ${modal.data.lastName}` : 'New Employee'} subtitle="Ethiopian PIT · Pension 7%/11% · DRRF 1%"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save' : 'Add Employee'}</Btn></>}>
        <EmployeeForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} departments={departments} />
      </Modal>
    </AppPage>
  );
};

export default Employees;

