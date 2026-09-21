/**
 * Notes to Financial Statements
 * Full IFRS — IAS 1.112–138
 *
 * Required disclosures per IAS 1.112:
 *  (a) Basis of preparation and accounting policies (IAS 1.117)
 *  (b) Information required by IFRS not presented elsewhere
 *  (c) Information relevant to understanding the financial statements
 *
 * Business-type aware: Manufacturing, Large Enterprise, SMB, Freelancer, Government
 * Covers: IAS 1, IAS 2, IAS 7, IAS 8, IAS 10, IAS 12, IAS 16, IAS 19, IAS 21,
 *         IAS 23, IAS 24, IAS 28, IAS 36, IAS 37, IAS 38, IAS 40, IAS 41,
 *         IFRS 3, IFRS 7, IFRS 8, IFRS 9, IFRS 10, IFRS 15, IFRS 16
 */
import { ChevronDown, ChevronUp, BookOpen, Shield, Banknote, Package, Building2, Users, BarChart3, Globe, Layers } from 'lucide-react';
import React, { useState } from 'react';

import { useBusiness } from '../../../context/businessContext';
import { useIFRSAccess } from '../../../hooks/useIfrsAccess';

interface NoteSection {
  id: string;
  number: string;
  title: string;
  ifrsRef: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const NoteBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{title}</p>
    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">{children}</div>
  </div>
);

const NotesToFinancials: React.FC = () => {
  const { companies, selectedCompanyId } = useBusiness();
  const company = companies.find(c => c.id === selectedCompanyId);
  const businessType = (company as any)?.type ?? 'MEDIUM_ENTERPRISE';
  const { canView } = useIFRSAccess();
  const isManufacturing = businessType === 'MANUFACTURING';
  const isLargeEnterprise = businessType === 'LARGE_ENTERPRISE';
  const isGovernment = businessType === 'GOVERNMENT';
  const isFreelancer = businessType === 'FREELANCER';
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set(['note-1', 'note-2']));
  const reportDate = new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' });
  const year = new Date().getFullYear();

  const toggle = (id: string) => {
    const next = new Set(openNotes);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    setOpenNotes(next);
  };

  const NOTES: NoteSection[] = [
    {
      id: 'note-1',
      number: '1',
      title: 'Basis of Preparation',
      ifrsRef: 'IAS 1.112–138',
      icon: <BookOpen size={14} />,
      content: (
        <>
          <NoteBlock title="Statement of Compliance (IAS 1.16)">
            <p>These financial statements have been prepared in accordance with <strong>International Financial Reporting Standards (IFRS)</strong> as issued by the International Accounting Standards Board (IASB). They comply with all applicable IAS/IFRS standards and IFRIC/SIC interpretations effective for the period ending {reportDate}.</p>
          </NoteBlock>
          <NoteBlock title="Going Concern (IAS 1.25)">
            <p>The financial statements have been prepared on the going concern basis. Management has assessed the entity's ability to continue as a going concern for at least twelve months from the reporting date and is satisfied that no material uncertainty exists.</p>
          </NoteBlock>
          <NoteBlock title="Measurement Basis (IAS 1.117)">
            <p>The financial statements are prepared on the <strong>historical cost basis</strong>, except for the following which are measured at fair value: financial assets at FVTPL and FVOCI (IFRS 9), investment property (IAS 40 — fair value model where elected), and biological assets (IAS 41).</p>
          </NoteBlock>
          <NoteBlock title="Functional and Presentation Currency (IAS 21.17)">
            <p>The functional and presentation currency is the <strong>Ethiopian Birr (ETB)</strong>. All amounts are presented in ETB unless otherwise stated. Foreign currency transactions are translated at the spot rate on the transaction date; monetary items are retranslated at the closing rate.</p>
          </NoteBlock>
          <NoteBlock title="Reporting Period">
            <p>These financial statements cover the period ending <strong>{reportDate}</strong>. Comparative information is presented for the year ended {year - 1}. Prior period figures have been restated where required by IAS 8.</p>
          </NoteBlock>
          {isGovernment && (
            <NoteBlock title="Public Sector Considerations">
              <p>As a government entity, these statements are prepared in accordance with IFRS as adapted for public sector reporting. Fund accounting principles are applied where applicable. Budget vs. actual comparisons are presented as supplementary information.</p>
            </NoteBlock>
          )}
        </>
      ),
    },
    {
      id: 'note-2',
      number: '2',
      title: 'Significant Accounting Policies',
      ifrsRef: 'IAS 1.117',
      icon: <Shield size={14} />,
      content: (
        <>
          <NoteBlock title="Revenue Recognition (IFRS 15)">
            <p>Revenue is recognised when (or as) the entity satisfies a performance obligation by transferring a promised good or service to a customer. The five-step model is applied: (1) identify the contract, (2) identify performance obligations, (3) determine the transaction price, (4) allocate the transaction price, (5) recognise revenue when/as obligations are satisfied.</p>
            {isManufacturing && <p className="mt-1 text-slate-500">For manufacturing contracts, revenue from sale of goods is recognised at the point in time when control transfers to the customer (typically on delivery). Contract modifications are accounted for as separate contracts or modifications to existing contracts per IFRS 15.18–21.</p>}
            {isFreelancer && <p className="mt-1 text-slate-500">Service revenue is recognised over time using the output method (milestones achieved) or input method (costs incurred) as appropriate to the nature of the service contract.</p>}
          </NoteBlock>
          <NoteBlock title="Financial Instruments (IFRS 9)">
            <p><strong>Classification:</strong> Financial assets are classified at amortised cost, FVOCI, or FVTPL based on the business model and contractual cash flow characteristics. Financial liabilities are classified at amortised cost or FVTPL.</p>
            <p className="mt-1"><strong>Impairment (ECL):</strong> The Expected Credit Loss (ECL) model is applied. For trade receivables, the simplified approach (lifetime ECL provision matrix) is used. For other financial assets, the three-stage general approach applies.</p>
            <p className="mt-1"><strong>Hedge accounting:</strong> Where the entity designates hedging relationships, hedge accounting is applied per IFRS 9.6.</p>
          </NoteBlock>
          <NoteBlock title="Inventories (IAS 2)">
            <p>Inventories are measured at the lower of cost and net realisable value. Cost is determined using the <strong>First-In, First-Out (FIFO)</strong> method. Cost includes all costs of purchase, costs of conversion (direct labour + production overhead), and other costs to bring inventories to their present location and condition.</p>
            {isManufacturing && <p className="mt-1 text-slate-500">For manufactured goods, cost includes direct materials, direct labour, and a systematic allocation of fixed and variable production overheads based on normal capacity (IAS 2.12). Abnormal waste is expensed as incurred.</p>}
          </NoteBlock>
          <NoteBlock title="Property, Plant & Equipment (IAS 16)">
            <p>PPE is measured at cost less accumulated depreciation and impairment losses (<strong>cost model</strong>). The revaluation model may be applied to classes of assets where fair value can be reliably measured. Depreciation is on a straight-line basis over estimated useful lives: Buildings 20–50 years; Plant & Machinery 5–20 years; Vehicles 3–5 years; IT Equipment 3–5 years; Furniture 5–10 years. Residual values and useful lives are reviewed annually (IAS 16.51).</p>
          </NoteBlock>
          <NoteBlock title="Leases (IFRS 16)">
            <p>At commencement, the entity recognises a <strong>right-of-use (ROU) asset</strong> and a <strong>lease liability</strong> for all leases, except short-term leases (≤12 months) and low-value asset leases. The lease liability is measured at the present value of remaining lease payments, discounted at the incremental borrowing rate. The ROU asset is depreciated on a straight-line basis over the shorter of the lease term and the asset's useful life.</p>
          </NoteBlock>
          <NoteBlock title="Intangible Assets (IAS 38)">
            <p>Intangible assets acquired separately are recognised at cost. Internally generated intangibles are recognised only when the recognition criteria of IAS 38.57 are met (development phase costs only; research costs are expensed). Finite-life intangibles are amortised on a straight-line basis. Indefinite-life intangibles (including goodwill) are not amortised but tested for impairment annually (IAS 36).</p>
          </NoteBlock>
          <NoteBlock title="Impairment of Non-financial Assets (IAS 36)">
            <p>At each reporting date, the entity assesses whether there is any indication of impairment. If indicated, the recoverable amount (higher of fair value less costs of disposal and value in use) is estimated. An impairment loss is recognised when the carrying amount exceeds the recoverable amount. Goodwill is tested for impairment annually regardless of indicators.</p>
          </NoteBlock>
          <NoteBlock title="Employee Benefits (IAS 19)">
            <p><strong>Short-term benefits:</strong> Recognised as an expense when the service is rendered. <strong>Defined contribution plans:</strong> Pension contributions (Employee 7% + Employer 11% of basic salary per Ethiopian Pension Authority) are expensed when due. <strong>Defined benefit plans:</strong> Where applicable, the projected unit credit method is used; actuarial gains/losses are recognised in OCI (IAS 19.120).</p>
          </NoteBlock>
          <NoteBlock title="Income Taxes (IAS 12)">
            <p><strong>Current tax:</strong> Measured at the amount expected to be paid using tax rates enacted at the reporting date. Ethiopian Business Income Tax rate: <strong>30%</strong>. <strong>Deferred tax:</strong> Recognised for all temporary differences between the carrying amount of assets/liabilities and their tax bases, using the liability method. Deferred tax assets are recognised only to the extent that it is probable that future taxable profit will be available.</p>
          </NoteBlock>
          <NoteBlock title="Provisions & Contingencies (IAS 37)">
            <p>A provision is recognised when the entity has a present obligation (legal or constructive) as a result of a past event, it is probable that an outflow of resources will be required, and the amount can be reliably estimated. Provisions are measured at the best estimate of the expenditure required. Contingent liabilities are disclosed but not recognised unless the outflow is probable.</p>
          </NoteBlock>
          <NoteBlock title="Borrowing Costs (IAS 23)">
            <p>Borrowing costs directly attributable to the acquisition, construction, or production of a qualifying asset are capitalised as part of the cost of that asset. All other borrowing costs are expensed in the period incurred.</p>
          </NoteBlock>
          <NoteBlock title="Foreign Currency (IAS 21)">
            <p>Transactions in foreign currencies are translated at the spot rate on the transaction date. Monetary assets and liabilities are retranslated at the closing rate; exchange differences are recognised in profit or loss. Non-monetary items measured at historical cost are not retranslated. Translation differences on foreign operations are recognised in OCI (translation reserve).</p>
          </NoteBlock>
          {isLargeEnterprise && (
            <NoteBlock title="Business Combinations (IFRS 3)">
              <p>Business combinations are accounted for using the acquisition method. Goodwill is measured as the excess of the consideration transferred over the fair value of identifiable net assets acquired. Goodwill is not amortised but tested for impairment annually. Non-controlling interests are measured at either fair value or the proportionate share of the acquiree's identifiable net assets.</p>
            </NoteBlock>
          )}
          {isLargeEnterprise && (
            <NoteBlock title="Consolidated Financial Statements (IFRS 10)">
              <p>The consolidated financial statements include the financial statements of the parent and all subsidiaries over which the parent has control (power + exposure to variable returns + ability to use power to affect returns). Intercompany transactions, balances, and unrealised gains are eliminated on consolidation.</p>
            </NoteBlock>
          )}
        </>
      ),
    },
    {
      id: 'note-2b',
      number: '2B',
      title: 'New and Amended Standards Not Yet Effective',
      ifrsRef: 'IAS 8.30',
      icon: <Layers size={14} />,
      // Only shown to roles with ovds:read — IASB updates are ovds-group content
      content: !canView ? (
        <p className="text-xs text-slate-400 italic">Requires ovds:read permission to view IASB standard updates.</p>
      ) : (
        <>
          <NoteBlock title="IFRS 18 — Presentation and Disclosure in Financial Statements (effective 1 January 2027)">            <p>IFRS 18 replaces IAS 1 and is effective for annual periods beginning on or after 1 January 2027, with retrospective application required. The standard introduces three mandatory income statement categories (Operating, Investing, and Financing), standardises subtotals, and requires disclosure of Management-defined Performance Measures (MPMs) with reconciliation to IFRS line items.</p>
            <p className="mt-1">The entity is currently assessing the impact of IFRS 18 on the presentation of its financial statements. The income statement will be restructured to comply with the new category requirements. Any MPMs used in external communications (e.g. EBITDA, adjusted profit) will be disclosed and reconciled in the notes.</p>
          </NoteBlock>
          <NoteBlock title="IFRS 19 — Subsidiaries without Public Accountability: Disclosures (effective 1 January 2027)">
            <p>IFRS 19 permits eligible subsidiaries (those without public accountability) to apply reduced disclosure requirements while still applying full IFRS recognition and measurement. The entity is assessing whether any subsidiaries qualify for IFRS 19 adoption.</p>
          </NoteBlock>
          <NoteBlock title="IAS 1 (Amended) — Classification of Liabilities as Current or Non-current (effective 1 January 2024)">
            <p>Amendments clarify that the classification of liabilities as current or non-current is based on rights existing at the reporting date. Covenants tested after the reporting date do not affect classification. The entity has applied these amendments retrospectively. Non-current liabilities subject to post-reporting-date covenants are disclosed in Note {year >= 2024 ? '12' : '—'}.</p>
          </NoteBlock>
          <NoteBlock title="IFRS 9 / IFRS 7 (Amended) — Classification and Measurement of Financial Instruments (effective 1 January 2026)">
            <p>Amendments clarify the SPPI test for ESG-linked financial instruments, provide guidance on settlement via equity, and require enhanced IFRS 7 disclosures for instruments with contingent features. The entity is assessing the impact on its financial instrument classifications.</p>
          </NoteBlock>
        </>
      ),  // end canView ternary
    },
    {
      id: 'note-3',
      number: '3',
      title: 'Revenue from Contracts with Customers',
      ifrsRef: 'IFRS 15',
      icon: <Banknote size={14} />,
      content: (
        <>
          <NoteBlock title="Disaggregation of Revenue (IFRS 15.114)">
            <p>Revenue is disaggregated by type and timing of recognition as follows:</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="text-left px-3 py-2 font-bold">Revenue Stream</th>
                    <th className="text-right px-3 py-2 font-bold">Timing</th>
                    <th className="text-right px-3 py-2 font-bold">VAT Rate</th>
                    <th className="text-right px-3 py-2 font-bold">IFRS 15 Method</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: 'Sale of Goods', timing: 'Point in time', vat: '15%', method: 'Transfer of control' },
                    { type: 'Rendering of Services', timing: 'Over time', vat: '15%', method: 'Output / input method' },
                    { type: 'Construction Contracts', timing: 'Over time', vat: '15%', method: 'Percentage of completion' },
                    { type: 'Zero-rated Exports', timing: 'Point in time', vat: '0%', method: 'Transfer of control' },
                    { type: 'Exempt Supplies', timing: 'Point in time', vat: 'Exempt', method: 'Transfer of control' },
                    { type: 'Royalties / Licences', timing: 'Over time / point', vat: '15%', method: 'Usage-based / fixed fee' },
                  ].map(r => (
                    <tr key={r.type} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">{r.type}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{r.timing}</td>
                      <td className="px-3 py-2 text-right font-bold">{r.vat}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{r.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NoteBlock>
          <NoteBlock title="Contract Balances (IFRS 15.116)">
            <p><strong>Contract assets</strong> arise when the entity has satisfied a performance obligation but has not yet billed the customer. <strong>Contract liabilities</strong> (deferred revenue) arise when the entity has received consideration before satisfying a performance obligation. Both are presented separately on the Statement of Financial Position.</p>
          </NoteBlock>
          <NoteBlock title="VAT Compliance (Proclamation No. 1341/2024)">
            <p>The entity is registered for VAT. Standard rate: <strong>15%</strong>. Monthly VAT returns are filed by the 30th of the following month. Late filing penalty: ETB 500/day. VAT registration threshold: ETB 2,000,000/year (Regulation No. 570/2025).</p>
          </NoteBlock>
        </>
      ),
    },
    {
      id: 'note-4',
      number: '4',
      title: 'Inventories',
      ifrsRef: 'IAS 2',
      icon: <Package size={14} />,
      content: (
        <>
          <NoteBlock title="Measurement (IAS 2.9)">
            <p>Inventories are measured at the lower of cost and net realisable value (NRV). NRV is the estimated selling price in the ordinary course of business less the estimated costs of completion and selling expenses.</p>
          </NoteBlock>
          <NoteBlock title="Cost Formula (IAS 2.25)">
            <p>Cost is determined using the <strong>FIFO (First-In, First-Out)</strong> method. The system also supports LIFO and Weighted Average for management reporting purposes, but FIFO is used for IFRS financial statements.</p>
          </NoteBlock>
          {isManufacturing && (
            <NoteBlock title="Cost of Conversion (IAS 2.12) — Manufacturing">
              <p>For manufactured inventories, cost includes: (1) direct materials, (2) direct labour, (3) fixed production overheads allocated based on normal capacity, and (4) variable production overheads. Abnormal amounts of wasted materials, labour, and other production costs are excluded from cost and recognised as expenses in the period incurred.</p>
            </NoteBlock>
          )}
          <NoteBlock title="Write-downs and Reversals (IAS 2.28–33)">
            <p>Write-downs to NRV are recognised as an expense. Reversals of write-downs (when NRV increases) are recognised as a reduction in the cost of inventories recognised as an expense in the period of reversal, limited to the original write-down amount.</p>
          </NoteBlock>
        </>
      ),
    },
    {
      id: 'note-5',
      number: '5',
      title: 'Property, Plant & Equipment',
      ifrsRef: 'IAS 16',
      icon: <Building2 size={14} />,
      content: (
        <>
          <NoteBlock title="Measurement Model (IAS 16.29)">
            <p>The entity applies the <strong>cost model</strong>: PPE is carried at cost less accumulated depreciation and accumulated impairment losses. The revaluation model (IAS 16.31) may be applied to specific asset classes where fair value can be reliably measured; any revaluation surplus is recognised in OCI and accumulated in the revaluation reserve in equity.</p>
          </NoteBlock>
          <NoteBlock title="Depreciation (IAS 16.43)">
            <p>Depreciation is calculated on a straight-line basis over estimated useful lives. Each significant component of an item of PPE is depreciated separately (component approach). Useful lives and residual values are reviewed at each year-end.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-slate-100 dark:bg-slate-800"><th className="text-left px-3 py-2 font-bold">Asset Class</th><th className="text-right px-3 py-2 font-bold">Useful Life</th><th className="text-right px-3 py-2 font-bold">Method</th></tr></thead>
                <tbody>
                  {[
                    ['Buildings', '20–50 years', 'Straight-line'],
                    ['Plant & Machinery', '5–20 years', 'Straight-line'],
                    ['Vehicles', '3–5 years', 'Straight-line'],
                    ['IT Equipment', '3–5 years', 'Straight-line'],
                    ['Furniture & Fixtures', '5–10 years', 'Straight-line'],
                    ['Leasehold Improvements', 'Lease term', 'Straight-line'],
                  ].map(([cls, life, method]) => (
                    <tr key={cls} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">{cls}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{life}</td>
                      <td className="px-3 py-2 text-right">{method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NoteBlock>
          <NoteBlock title="Impairment (IAS 36)">
            <p>At each reporting date, the entity assesses whether there is any indication that an asset may be impaired. If indicated, the recoverable amount is estimated. An impairment loss is recognised when the carrying amount exceeds the recoverable amount and is recognised in profit or loss (unless the asset is carried at revalued amount, in which case it is treated as a revaluation decrease).</p>
          </NoteBlock>
        </>
      ),
    },
    {
      id: 'note-6',
      number: '6',
      title: 'Employee Benefits & Payroll',
      ifrsRef: 'IAS 19',
      icon: <Users size={14} />,
      content: (
        <>
          <NoteBlock title="Short-term Employee Benefits (IAS 19.9)">
            <p>Salaries, wages, bonuses, and social security contributions are accrued in the period in which the associated services are rendered. Payroll is processed monthly in accordance with Ethiopian labour law. Personal Income Tax (PIT) is withheld at source per the progressive brackets (0%–35%).</p>
          </NoteBlock>
          <NoteBlock title="Defined Contribution Plans (IAS 19.44)">
            <p>The entity contributes to the Ethiopian Pension Authority. Employee contribution: <strong>7%</strong> of basic salary. Employer contribution: <strong>11%</strong> of basic salary. These are defined contribution plans; the entity's obligation is limited to the contributions payable for the period.</p>
          </NoteBlock>
          <NoteBlock title="Defined Benefit Plans (IAS 19.55) — where applicable">
            <p>Where the entity operates defined benefit plans, the projected unit credit method is used to determine the present value of the defined benefit obligation and the related current service cost. Actuarial gains and losses are recognised immediately in OCI (not recycled to profit or loss). The net defined benefit liability/asset is presented on the Statement of Financial Position.</p>
          </NoteBlock>
          <NoteBlock title="Termination Benefits (IAS 19.159)">
            <p>Termination benefits are recognised at the earlier of: (a) when the entity can no longer withdraw the offer of those benefits, and (b) when the entity recognises costs for a restructuring within the scope of IAS 37 that involves the payment of termination benefits.</p>
          </NoteBlock>
          <NoteBlock title="Disaster Risk Reduction Fund (DRRF) — Regulation No. 570/2025">
            <p>The entity remits DRRF levies to EDRRFO. Salary contribution: 1% of net pay per payroll period. Annual sales revenue contribution: 5% of paid invoice subtotals. Quarterly remittance. These are recognised as expenses in the period the underlying transaction occurs.</p>
          </NoteBlock>
        </>
      ),
    },
    {
      id: 'note-7',
      number: '7',
      title: 'Financial Instruments',
      ifrsRef: 'IFRS 7 / IFRS 9',
      icon: <BarChart3 size={14} />,
      content: (
        <>
          <NoteBlock title="Classification & Measurement (IFRS 9.4)">
            <p>Financial assets are classified based on the entity's business model and the contractual cash flow characteristics:</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-slate-100 dark:bg-slate-800"><th className="text-left px-3 py-2 font-bold">Category</th><th className="text-right px-3 py-2 font-bold">Measurement</th><th className="text-right px-3 py-2 font-bold">Examples</th></tr></thead>
                <tbody>
                  {[
                    ['Amortised Cost', 'Effective interest rate', 'Trade receivables, loans, held-to-collect bonds'],
                    ['FVOCI (debt)', 'Fair value; gains/losses in OCI', 'Bonds held for both collection and sale'],
                    ['FVOCI (equity)', 'Fair value; gains/losses in OCI (no recycling)', 'Strategic equity investments'],
                    ['FVTPL', 'Fair value; gains/losses in P&L', 'Trading securities, derivatives'],
                  ].map(([cat, meas, ex]) => (
                    <tr key={cat} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 font-bold">{cat}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{meas}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NoteBlock>
          <NoteBlock title="Expected Credit Losses (IFRS 9.5.5)">
            <p>The entity applies the <strong>simplified approach</strong> for trade receivables and contract assets — lifetime ECL is recognised from initial recognition using a provision matrix based on historical credit loss rates, adjusted for forward-looking information. For other financial assets, the three-stage general approach is applied.</p>
          </NoteBlock>
          <NoteBlock title="Risk Disclosures (IFRS 7.31)">
            <p>The entity is exposed to: <strong>credit risk</strong> (managed through credit assessments and ECL provisioning), <strong>liquidity risk</strong> (managed through cash flow forecasting and committed credit facilities), and <strong>market risk</strong> (interest rate risk on variable-rate borrowings; foreign currency risk on foreign-denominated transactions).</p>
          </NoteBlock>
        </>
      ),
    },
    {
      id: 'note-8',
      number: '8',
      title: 'Income Taxes',
      ifrsRef: 'IAS 12',
      icon: <Shield size={14} />,
      content: (
        <>
          <NoteBlock title="Current Tax (IAS 12.46)">
            <p>Current tax is measured at the amount expected to be paid to (or recovered from) the tax authorities using tax rates enacted or substantively enacted at the reporting date. Ethiopian Business Income Tax (BIT) rate: <strong>30%</strong> of taxable profit. Annual BIT declaration is due within 4 months of the Ethiopian fiscal year end (by November 7).</p>
          </NoteBlock>
          <NoteBlock title="Deferred Tax (IAS 12.15)">
            <p>Deferred tax is recognised for all temporary differences between the carrying amounts of assets and liabilities in the financial statements and their corresponding tax bases. Deferred tax assets are recognised only to the extent that it is probable that sufficient future taxable profit will be available. Deferred tax is not recognised for: (a) initial recognition of goodwill, (b) initial recognition of assets/liabilities in transactions that are not business combinations and affect neither accounting nor taxable profit.</p>
          </NoteBlock>
          <NoteBlock title="Tax Rate Reconciliation (IAS 12.81)">
            <p>A reconciliation between the tax expense and the product of accounting profit multiplied by the applicable tax rate is presented in the tax note. Permanent differences (non-deductible expenses, exempt income) and temporary differences are disclosed.</p>
          </NoteBlock>
        </>
      ),
    },
    ...(isLargeEnterprise ? [{
      id: 'note-9',
      number: '9',
      title: 'Segment Reporting',
      ifrsRef: 'IFRS 8',
      icon: <Layers size={14} />,
      content: (
        <>
          <NoteBlock title="Operating Segments (IFRS 8.5)">
            <p>The entity identifies operating segments based on internal reports reviewed by the Chief Operating Decision Maker (CODM). Segments are reported separately when they meet the quantitative thresholds (10% of combined revenue, profit/loss, or assets). Segment information includes revenue, profit/loss, assets, liabilities, and capital expenditure.</p>
          </NoteBlock>
          <NoteBlock title="Geographic Information (IFRS 8.33)">
            <p>Revenue from external customers is attributed to geographic areas based on the location of the customer. Non-current assets are attributed based on the location of the assets. Material individual countries are disclosed separately.</p>
          </NoteBlock>
        </>
      ),
    }] : []),
    {
      id: 'note-10',
      number: isLargeEnterprise ? '10' : '9',
      title: 'Related Party Disclosures',
      ifrsRef: 'IAS 24',
      icon: <Globe size={14} />,
      content: (
        <>
          <NoteBlock title="Key Management Personnel (IAS 24.17)">
            <p>Key management personnel (KMP) are those persons having authority and responsibility for planning, directing, and controlling the activities of the entity. KMP compensation includes: short-term employee benefits, post-employment benefits, other long-term benefits, termination benefits, and share-based payments. Total KMP compensation is disclosed in aggregate.</p>
          </NoteBlock>
          <NoteBlock title="Related Party Transactions (IAS 24.18)">
            <p>All transactions with related parties are conducted on an arm's length basis at market rates. The nature of the relationship, the amount of transactions, outstanding balances, and any provisions for doubtful debts are disclosed for each category of related party. Commitments with related parties are also disclosed.</p>
          </NoteBlock>
          <NoteBlock title="Parent and Ultimate Controlling Party (IAS 24.13)">
            <p>The entity discloses the name of its parent entity and, if different, the ultimate controlling party, regardless of whether any transactions have occurred between the entity and those related parties.</p>
          </NoteBlock>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="ovds-widget-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-[var(--pro-azure-50)] dark:bg-green-950/30 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Notes to the Financial Statements</h2>
              <span className="text-[10px] font-medium text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Full IFRS · IAS 1.112</span>
            </div>
            <p className="ovds-caption">
              For the period ending {reportDate} · {company?.name ?? 'Company'} · ETB
              {isManufacturing && <span className="ml-2 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">Manufacturing</span>}
              {isLargeEnterprise && <span className="ml-2 text-[10px] font-medium text-violet-600 bg-violet-50 dark:bg-violet-950/30 px-1.5 py-0.5 rounded-full">Large Enterprise</span>}
              {isGovernment && <span className="ml-2 text-[10px] font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">Government</span>}
              {isFreelancer && <span className="ml-2 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">Freelancer</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {NOTES.map(note => (
        <div key={note.id} className="ovds-widget-card overflow-hidden shadow-sm">
          <button
            onClick={() => toggle(note.id)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left"
          >
            <span className="w-6 h-6 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-lg flex items-center justify-center text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0">
              {note.icon}
            </span>
            <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              Note {note.number} — {note.title}
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{note.ifrsRef}</span>
            {openNotes.has(note.id)
              ? <ChevronUp size={14} className="text-slate-400 shrink-0" />
              : <ChevronDown size={14} className="text-slate-400 shrink-0" />
            }
          </button>
          {openNotes.has(note.id) && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 animate-in slide-in-from-top-1 duration-150">
              {note.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotesToFinancials;






