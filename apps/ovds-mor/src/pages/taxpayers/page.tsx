import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';

interface TaxpayerTenant {
  id: string;
  tinNumber: string;
  legalName: string;
  tradeName: string | null;
  type: string;
  connectionMode: string;
  createdAt: string;
}

async function fetchTaxpayers(): Promise<TaxpayerTenant[]> {
  const { data } = await axios.get('/api/mor/taxpayers');
  return data;
}

export function TaxpayersPage(): React.ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mor-taxpayers'],
    queryFn: fetchTaxpayers,
  });

  if (isLoading) return <div className="p-6">Loading taxpayers…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load taxpayers.</div>;
  if (!data || data.length === 0) {
    return <div className="p-6">No taxpayers found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Registered Taxpayers</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">TIN</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Legal Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Connection</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Registered</th>
              <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-sm">{t.tinNumber}</td>
                <td className="px-4 py-2 text-sm">{t.legalName}</td>
                <td className="px-4 py-2 text-sm">{t.type}</td>
                <td className="px-4 py-2 text-sm">{t.connectionMode}</td>
                <td className="px-4 py-2 text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    to={`/ledger/${t.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Ledger <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
