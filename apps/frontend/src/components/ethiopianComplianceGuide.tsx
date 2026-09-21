/**
 * EthiopianComplianceGuide — in-app compliance reference panel.
 * Shows Ethiopian tax rates, deadlines, and regulatory links.
 * Can be embedded in any page or opened as a modal.
 */
import {
  BookOpen, ChevronDown, ChevronUp, Globe, Shield,
  Banknote, Users, Calendar, ExternalLink, CheckCircle2,
  AlertTriangle, FileText, X, Bell, Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'vat',
    title: 'VAT — Proclamation No. 1341/2024',
    icon: <Globe size={14} />,
    color: 'text-orange-600 dark:text-orange-400',
    content: (
      <div className="space-y-2 text-xs">
        {[
          { label: 'Standard Rate', value: '15%', note: 'On all taxable supplies' },
          { label: 'Zero-Rated', value: '0%', note: 'Exports, international transport' },
          { label: 'Exempt', value: 'N/A', note: 'Healthcare, education, financial services' },
          { label: 'Registration Threshold', value: 'ETB 1M/year', note: 'Mandatory registration' },
          { label: 'Filing Deadline', value: '30th of following month', note: 'Monthly return' },
          { label: 'Late Penalty', value: 'ETB 500/day', note: 'Per day after deadline' },
          { label: 'Reverse Charge', value: '15%', note: 'Foreign digital services' },
          { label: 'Withholding VAT', value: '15%', note: 'Withheld from suppliers' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              <span className="text-slate-400 ml-1">— {item.note}</span>
            </div>
            <span className="font-semibold text-orange-600 dark:text-orange-400 shrink-0 ml-2">{item.value}</span>
          </div>
        ))}
        <a href="https://etax.erca.gov.et" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline font-bold mt-2">
          eTax Portal <ExternalLink size={10} />
        </a>
      </div>
    ),
  },
  {
    id: 'pit',
    title: 'Personal Income Tax (PIT)',
    icon: <Users size={14} />,
    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    content: (
      <div className="space-y-1.5 text-xs">
        {[
          { range: '0 – 2,000 ETB', rate: '0%', tax: '0' },
          { range: '2,001 – 4,000 ETB', rate: '15%', tax: '(taxable − 2,000) × 15%' },
          { range: '4,001 – 7,000 ETB', rate: '20%', tax: '300 + (taxable − 4,000) × 20%' },
          { range: '7,001 – 10,000 ETB', rate: '25%', tax: '900 + (taxable − 7,000) × 25%' },
          { range: '10,001 – 14,000 ETB', rate: '30%', tax: '1,650 + (taxable − 10,000) × 30%' },
          { range: '> 14,000 ETB', rate: '35%', tax: '2,850 + (taxable − 14,000) × 35%' },
        ].map(b => (
          <div key={b.range} className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-800/50 rounded-lg">
            <span className="font-mono text-slate-600 dark:text-slate-300">{b.range}</span>
            <span className="font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{b.rate}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 px-2 py-2 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-lg mt-2">
          <span className="text-slate-600 dark:text-slate-300">Pension: Employee <strong>7%</strong> + Employer <strong>11%</strong> · Cap: ETB 15,000 insurable earnings</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Proclamation No. 1395/2025 — effective July 7, 2025. Tax-free threshold raised from ETB 600 → ETB 2,000.</p>
      </div>
    ),
  },
  {
    id: 'drrf',
    title: 'DRRF — Regulation No. 570/2025',
    icon: <Shield size={14} />,
    color: 'text-rose-600 dark:text-rose-400',
    content: (
      <div className="space-y-1.5 text-xs">
        {[
          { category: 'Annual Sales Revenue', rate: '5%' },
          { category: 'Service Fees (Telecom/Bank)', rate: '5%' },
          { category: 'Airtime Sales', rate: '5%' },
          { category: 'Tobacco & Alcohol', rate: '5%' },
          { category: 'Telecom / Digital Services', rate: '5%' },
          { category: 'Loan Value', rate: '1%' },
          { category: 'Insurance Premium', rate: '1%' },
          { category: 'Salary Contribution', rate: '1%' },
          { category: 'Dividend Distributions', rate: '1%' },
          { category: 'Contraband / Confiscated Goods', rate: '1%' },
          { category: 'Government Budget', rate: '0.25%' },
          { category: 'Ticket Sales (Domestic)', rate: 'ETB 100 flat' },
          { category: 'Fuel Sales', rate: 'ETB 200 flat' },
          { category: 'Government Service', rate: 'ETB 200 flat' },
        ].map(c => (
          <div key={c.category} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
            <span className="text-slate-600 dark:text-slate-300">{c.category}</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">{c.rate}</span>
          </div>
        ))}
        <p className="text-slate-400 mt-1">Quarterly submission to EDRRFO · Commercial Bank of Ethiopia</p>
      </div>
    ),
  },
  {
    id: 'bit',
    title: 'Business Income Tax (BIT)',
    icon: <Banknote size={14} />,
    color: 'text-violet-600 dark:text-violet-400',
    content: (
      <div className="space-y-2 text-xs">
        {[
          { label: 'Corporate Rate', value: '30%', note: 'Flat rate on net profit' },
          { label: 'Minimum Alternative Tax (MAT)', value: '2.5%', note: 'Of annual turnover — pay whichever is higher (Proc. 1395/2025)' },
          { label: 'Filing Deadline', value: 'Nov 7', note: 'Within 4 months of EFY end (July 7)' },
          { label: 'Withholding Tax — Services', value: '3%', note: 'On service payments ≥ ETB 10,000 (Proc. 1395/2025)' },
          { label: 'Withholding Tax — Goods', value: '3%', note: 'On goods payments ≥ ETB 20,000 (Proc. 1395/2025)' },
          { label: 'Turnover Tax (TOT) — Goods', value: '2%', note: 'Category B taxpayers (turnover < ETB 2M, not VAT-registered)' },
          { label: 'Turnover Tax (TOT) — Services', value: '10%', note: 'Category B taxpayers (turnover < ETB 2M, not VAT-registered)' },
          { label: 'Cash Transaction Limit', value: 'ETB 30,000', note: 'Above this must be via bank/cheque — not tax-deductible if cash' },
          { label: 'Dividend Tax', value: '10%', note: 'On distributed profits' },
          { label: 'Capital Gains', value: '15%', note: 'On asset disposals' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              <span className="text-slate-400 ml-1">— {item.note}</span>
            </div>
            <span className="font-semibold text-violet-600 dark:text-violet-400 shrink-0 ml-2">{item.value}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'deadlines',
    title: 'Filing Calendar 2026',
    icon: <Calendar size={14} />,
    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    content: (
      <div className="space-y-1.5 text-xs">
        {[
          { month: 'Monthly', event: 'VAT Return', deadline: '30th of following month', severity: 'warning' },
          { month: 'Monthly', event: 'TOT Return (Category B)', deadline: '30th of following month', severity: 'warning' },
          { month: 'Monthly', event: 'PIT Withholding', deadline: 'With payroll run', severity: 'info' },
          { month: 'Monthly', event: 'WHT Remittance (3%)', deadline: '30th of following month', severity: 'info' },
          { month: 'Quarterly', event: 'DRRF Levy', deadline: '15th of last month of quarter', severity: 'warning' },
          { month: 'Annual', event: 'BIT Declaration', deadline: 'November 7', severity: 'critical' },
          { month: 'Annual', event: 'MAT Assessment', deadline: 'November 7 (with BIT)', severity: 'critical' },
          { month: 'Annual', event: 'VAT Reconciliation', deadline: 'March 31', severity: 'warning' },
          { month: 'Annual', event: 'Pension Audit', deadline: 'End of fiscal year', severity: 'info' },
        ].map(d => (
          <div key={d.event} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${
            d.severity === 'critical' ? 'bg-rose-50 dark:bg-rose-950/20' :
            d.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20' :
            'bg-white dark:bg-slate-800/50'
          }`}>
            {d.severity === 'critical' ? <AlertTriangle size={10} className="text-rose-500 shrink-0" /> :
             d.severity === 'warning' ? <AlertTriangle size={10} className="text-amber-500 shrink-0" /> :
             <CheckCircle2 size={10} className="text-[var(--pro-azure)] shrink-0" />}
            <div className="flex-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">{d.event}</span>
              <span className="text-slate-400 ml-1">({d.month})</span>
            </div>
            <span className="text-slate-500 dark:text-slate-400 shrink-0">{d.deadline}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'ifrs18',
    title: 'IFRS 18 — Effective 1 January 2027',
    icon: <Sparkles size={14} />,
    color: 'text-purple-600 dark:text-purple-400',
    content: (
      <div className="space-y-3 text-xs">
        <div className="flex items-start gap-2 px-3 py-2.5 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900">
          <Bell size={12} className="text-purple-500 shrink-0 mt-0.5" />
          <p className="text-purple-700 dark:text-purple-300">
            <strong>IFRS 18 replaces IAS 1</strong> on 1 January 2027. Prepare your income statement structure now — retrospective application required.
          </p>
        </div>
        {[
          { label: 'New P&L Categories', value: 'Operating / Investing / Financing', note: 'All income statement items must be mapped' },
          { label: 'MPMs Required', value: 'Disclose & reconcile', note: 'Management-defined Performance Measures (e.g. EBITDA)' },
          { label: 'Subtotals', value: 'Standardised', note: 'Gross profit, operating profit — now mandatory' },
          { label: 'Effective Date', value: '1 Jan 2027', note: 'Early adoption permitted' },
          { label: 'Comparatives', value: 'Restate 2026', note: 'Prior year must be restated under IFRS 18 structure' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              <span className="text-slate-400 ml-1">— {item.note}</span>
            </div>
            <span className="font-semibold text-purple-600 dark:text-purple-400 shrink-0 ml-2">{item.value}</span>
          </div>
        ))}
        <div className="space-y-1.5">
          <p className="font-bold text-slate-600 dark:text-slate-300">Readiness Checklist</p>
          {[
            'Map all P&L line items to Operating / Investing / Financing',
            'Identify all Management-defined Performance Measures (MPMs)',
            'Prepare MPM reconciliation note to IFRS line items',
            'Plan comparative period restatement for 2026',
            'Update financial statement templates',
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 size={10} className="text-purple-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">{item}</span>
            </div>
          ))}
        </div>
        <a href="https://www.ifrs.org/issued-standards/list-of-standards/ifrs-18-presentation-and-disclosure-in-financial-statements/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline font-bold mt-1">
          IFRS 18 on IASB.org <ExternalLink size={10} />
        </a>
      </div>
    ),
  },
  {
    id: 'sustainability',
    title: 'IFRS S1 & S2 — Sustainability Disclosures (2024)',
    icon: <Globe size={14} />,
    color: 'text-teal-600 dark:text-teal-400',
    content: (
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2 px-3 py-2.5 bg-teal-50 dark:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-900">
          <Bell size={12} className="text-teal-500 shrink-0 mt-0.5" />
          <p className="text-teal-700 dark:text-teal-300">
            <strong>IFRS S1 & S2</strong> are mandatory for Tier 1 entities (LARGE_ENTERPRISE, GOVERNMENT) from 1 January 2024. Relevant for Ethiopian agriculture, energy, and manufacturing sectors.
          </p>
        </div>
        {[
          { label: 'IFRS S1 — Governance', value: 'Board oversight', note: 'Disclose board oversight of sustainability risks and opportunities' },
          { label: 'IFRS S1 — Strategy', value: 'Business model impact', note: 'Sustainability risks affecting strategy and cash flows' },
          { label: 'IFRS S1 — Risk Management', value: 'Identification process', note: 'How sustainability risks are identified and managed' },
          { label: 'IFRS S1 — Metrics & Targets', value: 'Quantitative KPIs', note: 'Metrics used to monitor sustainability performance' },
          { label: 'IFRS S2 — Physical Risks', value: 'Climate exposure', note: 'Drought, flooding, temperature impacts on Ethiopian operations' },
          { label: 'IFRS S2 — Transition Risks', value: 'Regulatory changes', note: 'Carbon pricing, technology shifts in energy/manufacturing' },
          { label: 'IFRS S2 — GHG Emissions', value: 'Scope 1 & 2', note: 'Direct and indirect energy emissions in CO₂ equivalent' },
          { label: 'IFRS S2 — Scenario Analysis', value: '1.5°C / 2°C / 4°C', note: 'Climate scenario resilience assessment' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              <span className="text-slate-400 ml-1">— {item.note}</span>
            </div>
            <span className="font-semibold text-teal-600 dark:text-teal-400 shrink-0 ml-2 text-right max-w-[100px]">{item.value}</span>
          </div>
        ))}
        <a href="https://www.ifrs.org/groups/international-sustainability-standards-board/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-bold mt-1">
          ISSB on IASB.org <ExternalLink size={10} />
        </a>
      </div>
    ),
  },
  {
    id: 'etax',
    title: 'E-Tax Portal — Online Filing Guide',
    icon: <Globe size={14} />,
    color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
    content: (
      <div className="space-y-3 text-xs">
        <div className="flex items-start gap-2 px-3 py-2.5 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-xl border border-[var(--pro-azure-100)] dark:border-green-900">
          <Globe size={12} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
          <p className="text-[var(--pro-azure-dark)] dark:text-green-300">
            File VAT, TOT, WHT, and BIT electronically at{' '}
            <a href="https://etax.erca.gov.et" target="_blank" rel="noopener noreferrer" className="font-bold underline">etax.erca.gov.et</a>{' '}
            using your TIN and password. Filing is required every month — even with zero transactions.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          <p className="font-bold text-slate-600 dark:text-slate-300">Filing Steps</p>
          {[
            { n: 1, label: 'Access the portal', detail: 'Go to etax.erca.gov.et' },
            { n: 2, label: 'Log in', detail: 'Enter TIN, username, and password' },
            { n: 3, label: 'Navigate to Declaration', detail: 'Tax Declaration → choose VAT, TOT, or WHT' },
            { n: 4, label: 'Fill in details', detail: 'Enter monthly sales, purchases, and income data' },
            { n: 5, label: 'Submit & confirm', detail: 'Review, submit, and download the submission receipt' },
            { n: 6, label: 'Pay', detail: 'Use the payment slip at a commercial bank or via Telebirr / CBE Pay' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-2 px-2 py-1.5 bg-white dark:bg-slate-800/50 rounded-lg">
              <span className="w-4 h-4 rounded-full bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-green-300 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{s.label}</span>
                <span className="text-slate-400 ml-1">— {s.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Net VAT formula */}
        <div className="px-3 py-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
          <p className="text-[10px] font-bold text-slate-500 mb-1">Net VAT Formula</p>
          <p className="text-slate-700 dark:text-slate-300">Net VAT = Output VAT − Input VAT</p>
          <p className="text-[10px] text-slate-400 mt-1">Output &gt; Input → Pay to ERCA &nbsp;|&nbsp; Input &gt; Output → Refund / carry forward</p>
        </div>

        {/* TOT */}
        <div className="space-y-1">
          <p className="font-bold text-slate-600 dark:text-slate-300">Turnover Tax (TOT) — Category B</p>
          {[
            { label: 'TOT — Goods', value: '2%', note: 'Turnover < ETB 2M/year, not VAT-registered' },
            { label: 'TOT — Services', value: '10%', note: 'Same threshold as goods' },
            { label: 'Filing deadline', value: '30th', note: 'Of the following month — zero report required' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                <span className="text-slate-400 ml-1">— {item.note}</span>
              </div>
              <span className="font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0 ml-2">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Zero declaration warning */}
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900">
          <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-700 dark:text-amber-300">
            <strong>Zero Declaration:</strong> File a zero return even with no transactions. Late filing penalty is ETB 500/day for VAT and TOT.
          </p>
        </div>

        {/* Support */}
        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">MoR Support</p>
          <p className="text-slate-500">📞 +251 11 662 98 00 &nbsp;·&nbsp; ✉️ info.mor@mor.gov.et</p>
        </div>
      </div>
    ),
  },
  {
    id: 'resources',
    title: 'Official Resources',
    icon: <FileText size={14} />,
    color: 'text-teal-600 dark:text-teal-400',
    content: (
      <div className="space-y-1.5 text-xs">
        {[
          { label: 'eTax Portal (ERCA)', url: 'https://etax.erca.gov.et', desc: 'VAT filing, BIT, WHT' },
          { label: 'ERCA Official Site', url: 'https://erca.gov.et', desc: 'Regulations, proclamations' },
          { label: 'Ministry of Revenues', url: 'https://mor.gov.et', desc: 'Tax policy, directives' },
          { label: 'Pension Authority', url: 'https://epra.gov.et', desc: 'Pension registration' },
          { label: 'EDRRFO (DRRF)', url: 'https://edrrfo.gov.et', desc: 'Disaster fund remittance' },
          { label: 'NBE (National Bank)', url: 'https://nbe.gov.et', desc: 'e-Invoice QR standards' },
        ].map(link => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between px-2 py-2 bg-white dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">{link.label}</span>
              <span className="text-slate-400 ml-1">— {link.desc}</span>
            </div>
            <ExternalLink size={10} className="text-slate-300 group-hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors shrink-0" />
          </a>
        ))}
      </div>
    ),
  },
];

interface EthiopianComplianceGuideProps {
  onClose?: () => void;
  defaultOpen?: string;
}

const EthiopianComplianceGuide: React.FC<EthiopianComplianceGuideProps> = ({
  onClose,
  defaultOpen = 'vat',
}) => {
  const [openSection, setOpenSection] = useState<string | null>(defaultOpen);

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-xl flex items-center justify-center">
            <BookOpen size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Ethiopian Compliance Guide</p>
            <p className="ovds-caption">2026 Regulatory Reference · MoR & ERCA</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {SECTIONS.map(section => (
          <div key={section.id}>
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className={section.color}>{section.icon}</span>
                <span className={`text-sm font-bold ${section.color}`}>{section.title}</span>
              </div>
              {openSection === section.id
                ? <ChevronUp size={13} className="text-slate-400" />
                : <ChevronDown size={13} className="text-slate-400" />
              }
            </button>
            {openSection === section.id && (
              <div className="px-5 pb-4 animate-in fade-in slide-in-from-top-1 duration-150">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <p className="text-[9px] text-slate-400 text-center">
          Reference: Proclamation No. 1341/2024 · Regulation No. 570/2025 · Income Tax Proc. 979/2016 · MoR 2026 Directives
        </p>
      </div>
    </div>
  );
};

export default EthiopianComplianceGuide;






