import React, { useMemo } from 'react';

export interface VatLineItemView {
  id: string;
  invoiceReference: string;
  rateCategory: string;
  percentage: string;
  netAmount: string;
  vatAmount: string;
}

export interface VatDeclarationView {
  id: string;
  companyId: string;
  taxPeriod: string;
  countryCode: string;
  status: string;
  totalNetSales: string;
  totalVatDue: string;
  netVatPayable: string;
  lineItems: VatLineItemView[];
}

function _toFixed4(value: string | number): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Math.round(n * 10000) / 10000;
}

function fmtCurrency(value: string | number, decimals = 2): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return 'ETB 0.00';
  return 'ETB ' + new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export const VatDeclarationReview: React.FC<{ report: VatDeclarationView }> = ({ report }) => {

  const UIComputedMetrics = useMemo(() => {
    let crossCheckedVat = 0;

    report.lineItems.forEach(item => {
      const net = parseFloat(item.netAmount || '0');
      const rate = parseFloat(item.percentage || '0');
      crossCheckedVat = Math.round((crossCheckedVat + net * rate) * 10000) / 10000;
    });

    const systemVat = parseFloat(report.totalVatDue || '0');
    const isMatch = Math.abs(crossCheckedVat - systemVat) < 0.0001;

    return {
      crossCheckedTotalVat: crossCheckedVat.toFixed(2),
      isSystemCalculatedMatch: isMatch,
    };
  }, [report]);

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', color: '#1f2937' }}>
      <header style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>VAT Compliance Control Sheet</h1>
        <p>Statement Token: <code>{report.id}</code> | Region: <strong>{report.countryCode}</strong> | Period: {report.taxPeriod}</p>
      </header>

      <section style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <small style={{ color: '#6b7280', fontWeight: 'bold' }}>Reported Total Sales</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{fmtCurrency(report.totalNetSales)}</div>
        </div>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <small style={{ color: '#6b7280', fontWeight: 'bold' }}>Reported Tax Due</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{fmtCurrency(report.totalVatDue)}</div>
        </div>
        <div style={{ background: UIComputedMetrics.isSystemCalculatedMatch ? '#ecfdf5' : '#fef2f2', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <small style={{ color: UIComputedMetrics.isSystemCalculatedMatch ? '#047857' : '#b91c1c', fontWeight: 'bold' }}>UI Audit Check</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: UIComputedMetrics.isSystemCalculatedMatch ? '#065f46' : '#991b1b' }}>
            ETB {UIComputedMetrics.crossCheckedTotalVat}
          </div>
        </div>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '12px' }}>Invoice Ref</th>
            <th style={{ padding: '12px' }}>Rate Category</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Rate (%)</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Net Amount</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>VAT Amount</th>
          </tr>
        </thead>
        <tbody>
          {report.lineItems.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px' }}>{item.invoiceReference}</td>
              <td style={{ padding: '12px' }}><span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: '#e0f2fe' }}>{item.rateCategory}</span></td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{(parseFloat(item.percentage) * 100).toFixed(2)}%</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{fmtCurrency(item.netAmount)}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{fmtCurrency(item.vatAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
