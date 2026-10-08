import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowLeft, Database, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LedgerEntry {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: string;
  vatAmount: string;
  account: {
    code: string;
    name: string;
  };
  description: string | null;
  createdAt: string;
}

interface JournalTransaction {
  id: string;
  referenceNumber: string;
  type: string;
  narration: string;
  createdAt: string;
  _count: { entries: number };
}

interface TaxpayerInfo {
  tinNumber: string;
  legalName: string;
  type: string;
  connectionMode: string;
}

async function fetchTaxpayer(tenantId: string): Promise<TaxpayerInfo> {
  const { data } = await axios.get(`/api/mor/taxpayers/${tenantId}`);
  return data;
}

async function fetchTransactions(tenantId: string): Promise<JournalTransaction[]> {
  const { data } = await axios.get(`/api/mor/taxpayers/${tenantId}/transactions`);
  return data;
}

async function fetchEntries(tenantId: string, transactionId?: string): Promise<LedgerEntry[]> {
  const params = transactionId ? `?transactionId=${transactionId}` : '';
  const { data } = await axios.get(`/api/mor/taxpayers/${tenantId}/ledger-entries${params}`);
  return data;
}

export function LedgerAuditPage(): React.ReactElement {
  const { tenantId, transactionId } = useParams<{ tenantId: string; transactionId?: string }>();

  const { data: taxpayer, isLoading: tpLoading } = useQuery({
    queryKey: ['taxpayer', tenantId],
    queryFn: () => fetchTaxpayer(tenantId!),
    enabled: !!tenantId,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', tenantId],
    queryFn: () => fetchTransactions(tenantId!),
    enabled: !!tenantId,
  });

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['entries', tenantId, transactionId],
    queryFn: () => fetchEntries(tenantId!, transactionId),
    enabled: !!tenantId,
  });

  if (tpLoading || txLoading || entriesLoading) return <div className="p-6">Loading ledger…</div>;

  return (
    <div className="p-6">
      <Link to={`/ledger/${tenantId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Ledger
      </Link>

      {taxpayer && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{taxpayer.legalName}</h1>
          <p className="text-sm text-gray-500">
            TIN: {taxpayer.tinNumber} | Type: {taxpayer.type} | Mode: {taxpayer.connectionMode}
          </p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Journal Transactions ({transactions?.length ?? 0})
        </h2>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Ledger Entries ({entries?.length ?? 0})
        </h2>
        {entries && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Account</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Amount</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">VAT</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-sm">{e.type}</td>
                    <td className="px-4 py-2 text-sm">{e.account?.code} — {e.account?.name}</td>
                    <td className="px-4 py-2 text-sm">{e.amount}</td>
                    <td className="px-4 py-2 text-sm">{e.vatAmount}</td>
                    <td className="px-4 py-2 text-sm">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
