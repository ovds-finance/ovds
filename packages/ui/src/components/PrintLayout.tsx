/**
 * PrintLayout — print-optimized wrapper for invoices, reports, and certificates.
 *
 * Renders a clean A4-page layout suitable for printing or PDF export.
 * Hides all non-print elements when printing.
 *
 * Usage:
 *   <PrintLayout
 *     title="Tax Invoice"
 *     logoUrl="/logo.png"
 *     companyName="OVDS Ltd."
 *     docNumber="INV-000042"
 *     docDate="Jun 7, 2026"
 *     footerNote="This is a computer-generated document. No signature required."
 *     onPrint={() => window.print()}
 *   >
 *     <PrintSection title="Bill To">...</PrintSection>
 *   </PrintLayout>
 */
import React from 'react';

// -- PrintSection -------------------------------------------------------------

export interface PrintSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const PrintSection: React.FC<PrintSectionProps> = ({ title, children, className = '' }) => (
  <div className={`mb-6 print:mb-5 ${className}`}>
    {title && (
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1 print:text-[9px]">
        {title}
      </h3>
    )}
    {children}
  </div>
);

// -- PrintTable ----------------------------------------------------------------

export interface PrintTableCol<T> {
  key:     keyof T | string;
  header:  string;
  align?:  'left' | 'right' | 'center';
  render?: (row: T, idx: number) => React.ReactNode;
}

export interface PrintTableProps<T> {
  cols:  PrintTableCol<T>[];
  rows:  T[];
  rowKey?: keyof T;
}

export function PrintTable<T extends Record<string, any>>({
  cols, rows, rowKey,
}: PrintTableProps<T>) {
  const alignCls = (align?: string) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <table className="w-full border-collapse text-[11px] print:text-[10px]">
      <thead>
        <tr className="border-b-2 border-slate-800">
          {cols.map(c => (
            <th
              key={String(c.key)}
              className={`py-1.5 px-2 font-bold text-slate-800 text-[10px] uppercase tracking-wider ${alignCls(c.align)}`}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={rowKey ? String(row[rowKey]) : idx}
            className="border-b border-slate-100 even:bg-slate-50/50"
          >
            {cols.map(c => (
              <td key={String(c.key)} className={`py-1.5 px-2 text-slate-700 ${alignCls(c.align)}`}>
                {c.render ? c.render(row, idx) : (row[c.key as keyof T] as React.ReactNode) ?? '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// -- PrintTotalsRow ------------------------------------------------------------

export interface PrintTotalsRowProps {
  label: string;
  value: string;
  bold?:  boolean;
  large?: boolean;
  top?:   boolean;
}

export const PrintTotalsRow: React.FC<PrintTotalsRowProps> = ({
  label, value, bold, large, top,
}) => (
  <div className={`flex justify-between items-center py-0.5 ${top ? 'border-t border-slate-200 mt-1 pt-2' : ''}`}>
    <span className={`text-${large ? '[13px]' : '[11px]'} ${bold ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>
      {label}
    </span>
    <span className={`text-${large ? '[14px]' : '[12px]'} tabular-nums ${bold ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
      {value}
    </span>
  </div>
);

// -- PrintLayout (main) --------------------------------------------------------

export interface PrintLayoutProps {
  title:        string;
  subtitle?:    string;
  /** Company logo URL (optional) */
  logoUrl?:     string;
  companyName?: string;
  companyAddress?: string[];
  companyTin?:  string;
  /** Document number (e.g. "INV-000042") */
  docNumber?:   string;
  docDate?:     string;
  docDueDate?:  string;
  /** Extra header fields */
  headerFields?: Array<{ label: string; value: string }>;
  footerNote?:  string;
  /** Optional print/download action (shown only on screen) */
  onPrint?:     () => void;
  onDownload?:  () => void;
  children:     React.ReactNode;
  /** Additional CSS class on the outer wrapper */
  className?:   string;
  /** Show ERCA tax compliance stamp */
  showErcaStamp?: boolean;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({
  title,
  subtitle,
  logoUrl,
  companyName,
  companyAddress = [],
  companyTin,
  docNumber,
  docDate,
  docDueDate,
  headerFields = [],
  footerNote,
  onPrint,
  onDownload,
  children,
  className = '',
  showErcaStamp = false,
}) => {
  return (
    <div className={`bg-white min-h-screen ${className}`}>
      {/* Screen-only toolbar */}
      {(onPrint || onDownload) && (
        <div className="print:hidden bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-3 no-print">
          <span className="text-[12px] font-semibold text-slate-600">{title}</span>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </button>
            )}
            {onPrint && (
              <button
                onClick={onPrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[12px] font-semibold hover:bg-slate-700 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print
              </button>
            )}
          </div>
        </div>
      )}

      {/* A4 paper body */}
      <div className="max-w-[800px] mx-auto px-8 py-10 print:px-6 print:py-8 print:max-w-none font-sans">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 print:mb-6">
          {/* Company info */}
          <div className="flex items-start gap-4">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={companyName ?? 'Logo'}
                className="h-12 w-auto object-contain print:h-10"
              />
            )}
            <div>
              {companyName && (
                <p className="text-[15px] font-bold text-slate-900 print:text-[13px]">{companyName}</p>
              )}
              {companyAddress.map((line, i) => (
                <p key={i} className="text-[11px] text-slate-500 print:text-[10px]">{line}</p>
              ))}
              {companyTin && (
                <p className="text-[10px] font-mono text-slate-500 mt-0.5 print:text-[9px]">TIN: {companyTin}</p>
              )}
            </div>
          </div>

          {/* Document info */}
          <div className="text-right">
            <h1 className="text-[20px] font-black text-slate-900 uppercase tracking-tight print:text-[16px]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-500 mt-0.5 print:text-[10px]">{subtitle}</p>
            )}
            {docNumber && (
              <p className="text-[14px] font-bold text-[var(--pro-azure-dark)] mt-1 print:text-[12px]">{docNumber}</p>
            )}
            {docDate && (
              <p className="text-[11px] text-slate-500 print:text-[10px]">
                Date: <span className="font-semibold text-slate-700">{docDate}</span>
              </p>
            )}
            {docDueDate && (
              <p className="text-[11px] text-slate-500 print:text-[10px]">
                Due: <span className="font-semibold text-rose-600">{docDueDate}</span>
              </p>
            )}
            {headerFields.map(f => (
              <p key={f.label} className="text-[11px] text-slate-500 print:text-[10px]">
                {f.label}: <span className="font-semibold text-slate-700">{f.value}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-slate-800 mb-6 print:mb-5" />

        {/* Content */}
        {children}

        {/* Footer */}
        <div className="mt-10 print:mt-6 border-t border-slate-200 pt-4 flex items-end justify-between gap-4">
          {footerNote && (
            <p className="text-[10px] text-slate-400 max-w-sm leading-relaxed print:text-[9px]">
              {footerNote}
            </p>
          )}
          {showErcaStamp && (
            <div className="shrink-0 border-2 border-[var(--pro-azure)] rounded px-3 py-1.5 text-center">
              <p className="text-[9px] font-bold text-[var(--pro-azure-dark)] uppercase tracking-wider">ERCA Compliant</p>
              <p className="text-[8px] text-[var(--pro-azure-dark)]">e-Tax Ready</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
