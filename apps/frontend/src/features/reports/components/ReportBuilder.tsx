import { AppPage, Btn } from '@ovds/ui';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../../../context/businessContext';
import { ALL_TEMPLATES, STANDARD_REPORTS, MODULAR_REPORTS } from '../reportRegistry';
import { defaultPeriod } from '../services/reportsService';
import type { ReportConfig, ReportTemplate, AccountingBasis, ExportFormat, ReportPeriod } from '../types';

interface Props {
  onBack: () => void;
  onComplete: (template: ReportTemplate, config: ReportConfig) => void;
}

const STEPS = ['Template', 'Basis', 'Timeline', 'Grouping', 'Export'];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

export default function ReportBuilder({ onBack, onComplete }: Props) {
  const { selectedCompanyId: companyId } = useBusiness();
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<string>(STANDARD_REPORTS[0].id);
  const [basis, setBasis] = useState<AccountingBasis>('accrual');
  const [period, setPeriod] = useState<ReportPeriod>(defaultPeriod());
  const [groupBy, setGroupBy] = useState<string>('');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [deliver, setDeliver] = useState(false);
  const [email, setEmail] = useState('');

  const template = ALL_TEMPLATES.find((t) => t.id === templateId) as ReportTemplate;

  useEffect(() => {
    const t = ALL_TEMPLATES.find((x) => x.id === templateId) as ReportTemplate;
    setBasis(t.basisSupported[0] ?? 'accrual');
    setGroupBy(t.groupByOptions[0] ?? '');
  }, [templateId]);

  const canProceed = () => {
    if (step === 0 && !template) return false;
    if (step === 1 && !template.basisSupported.includes(basis)) return false;
    if (step === 4 && deliver && !email.trim()) return false;
    return true;
  };

  const next = () => {
    if (!canProceed()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const generate = () => {
    if (!companyId) {
      toast('Select a company before building a report.');
      return;
    }
    if (deliver && !email.trim()) {
      toast.error('An email address is required for delivery.');
      return;
    }
    const config: ReportConfig = {
      reportId: template.id,
      basis,
      period,
      groupBy: groupBy || undefined,
    };
    if (deliver) {
      toast.success(`Report scheduled: ${template.title} will be emailed to ${email}.`);
    } else {
      toast.success(`Generating ${template.title}…`);
    }
    onComplete(template, config);
  };

  const activeTemplate = template;

  const radioGroups: Record<string, ReportTemplate[]> = {
    Standard: STANDARD_REPORTS,
    Modular: MODULAR_REPORTS,
  };

  return (
    <AppPage
      title="New Report"
      subtitle="Build a custom report from a template — choose basis, timeline and grouping."
      icon={<FileText size={16} className="text-white" />}
      iconBg="bg-[var(--pro-azure)]"
      crumbs={[{ label: 'Reports', to: '/reports-dashboard' }, { label: 'New Report' }]}
      actions={
        <>
          <Btn size="xs" variant="ghost" onClick={onBack}>← Back</Btn>
        </>
      }
    >
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <div key={label} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    active
                      ? 'bg-[var(--pro-azure)] text-white'
                      : done
                        ? 'bg-[var(--pro-azure-light)] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`ml-2 text-xs font-medium ${
                    active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="w-10 h-px bg-slate-200 dark:bg-slate-700 mx-2" />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          {step === 0 && (
            <div className="space-y-5">
              {Object.entries(radioGroups).map(([group, templates]) => (
                <div key={group}>
                  <SectionTitle>{group} reports</SectionTitle>
                  <div className="space-y-2">
                    {templates.map((t) => (
                      <label
                        key={t.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          templateId === t.id
                            ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="template"
                          value={t.id}
                          checked={templateId === t.id}
                          onChange={() => setTemplateId(t.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {t.title}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {t.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <SectionTitle>Accounting basis</SectionTitle>
              {activeTemplate.basisSupported.length > 1 ? (
                <div className="flex items-center gap-3">
                  {activeTemplate.basisSupported.map((b) => (
                    <Btn
                      key={b}
                      size="sm"
                      variant={basis === b ? 'primary' : 'ghost'}
                      onClick={() => setBasis(b)}
                    >
                      {b === 'accrual' ? 'Accrual' : 'Cash'}
                    </Btn>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Only accrual basis is supported for {activeTemplate.title}.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <SectionTitle>Reporting period</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">From</label>
                  <input
                    type="date"
                    value={period.start}
                    onChange={(e) => setPeriod({ ...period, start: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">To</label>
                  <input
                    type="date"
                    value={period.end}
                    onChange={(e) => setPeriod({ ...period, end: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <SectionTitle>Group by</SectionTitle>
              <div className="space-y-1">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Dimension
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                >
                  {activeTemplate.groupByOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace(/-/g, ' ')}
                    </option>
                  ))}
                  <option value="">None (no grouping)</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <SectionTitle>Export & delivery</SectionTitle>
              <div className="space-y-1">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                >
                  <option value="pdf">PDF (print-ready)</option>
                  <option value="csv">CSV (spreadsheet)</option>
                  <option value="xlsx">XLSX (spreadsheet)</option>
                </select>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deliver}
                  onChange={(e) => setDeliver(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-slate-600 dark:text-slate-300">
                  Schedule email delivery — send this report on a recurring basis.
                </span>
              </label>
              {deliver && (
                <div className="space-y-1">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Recipient email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="accountant@example.com"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <Btn size="xs" variant="ghost" onClick={back} disabled={step === 0}>
            <ChevronLeft size={14} className="mr-1" />
            Previous
          </Btn>
          {step < STEPS.length - 1 ? (
            <Btn size="sm" onClick={next} disabled={!canProceed()}>
              <ChevronRight size={14} className="mr-1" />
              Next
            </Btn>
          ) : (
            <Btn size="sm" variant="primary" onClick={generate} disabled={!canProceed()}>
              Generate report
            </Btn>
          )}
        </div>
      </div>
    </AppPage>
  );
}
