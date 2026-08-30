import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowUpRight } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useBusiness } from '../../context/businessContext';
import { fmtCurrency, DocStackLayout, type DocStackItem, WidgetCard } from '@ovds/ui';
import { Icon } from '../ui';

interface Props {
  currency?: string;
}

const RecentInvoicesWidget: React.FC<Props> = ({ currency = 'ETB' }) => {
  const { selectedCompanyId } = useBusiness();

  const { data, loading } = useApiQuery<any>(
    `/ovds/invoices/stats${selectedCompanyId ? `?companyId=${selectedCompanyId}&take=5` : '?take=5'}`,
    { enabled: !!selectedCompanyId, staleTime: 30_000, suppressToast: true }
  );

  const rawInvoices: any[] = data?.recent ?? data?.data ?? [];

  // Map API invoices to DocStackItem shape
  const items: DocStackItem[] = rawInvoices.map((inv: any) => ({
    id: inv.id,
    title: `#${inv.invoiceNumber ?? inv.id?.slice(-6)}`,
    subtitle: inv.customer?.name ?? inv.customerName ?? '',
    amount: fmtCurrency(inv.total ?? inv.totalAmount ?? 0, currency),
    status: (inv.status ?? 'draft').toLowerCase(),
    date: inv.date ?? inv.createdAt,
    dueDate: inv.dueDate,
  }));

  return (
    <WidgetCard
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
              <FileText size={14} className="text-sky-600" />
            </div>
            <div>
              <h3 className="ovds-card-title">Recent Invoices</h3>
              <p className="ovds-caption">{loading ? 'Loading…' : `${items.length} of last invoices`}</p>
            </div>
          </div>
          <Link
            to="/sales/invoices"
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline shrink-0"
          >
            All invoices <ArrowUpRight size={11} />
          </Link>
        </div>
      }
    >
      <DocStackLayout
        items={items}
        loading={loading}
        emptyLabel="No recent invoices"
        emptyDescription="Create your first invoice to see it here."
        rowIcon={() => <Icon name="INVOICE" size={15} />}
        className="-mx-[14px] -mb-[14px]"
      />
    </WidgetCard>
  );
};

export default RecentInvoicesWidget;

