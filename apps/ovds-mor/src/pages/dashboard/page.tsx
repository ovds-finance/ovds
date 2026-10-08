import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { FileText, Users, Landmark, Receipt } from 'lucide-react';

interface DashboardMetric {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

async function fetchDashboardData(): Promise<{
  taxpayerCount: number;
  submissionCount: number;
  pendingReview: number;
  totalTaxCollected: number;
}> {
  const { data } = await axios.get('/api/mor/dashboard');
  return data;
}

export function DashboardPage(): React.ReactElement {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mor-dashboard'],
    queryFn: fetchDashboardData,
  });

  const metrics: DashboardMetric[] = data
    ? [
        { label: 'Taxpayers Registered', value: data.taxpayerCount, icon: <Users className="w-5 h-5" /> },
        { label: 'Submissions Filed', value: data.submissionCount, icon: <FileText className="w-5 h-5" /> },
        { label: 'Pending Review', value: data.pendingReview, icon: <Receipt className="w-5 h-5" /> },
        { label: 'Tax Collected', value: `ETB ${data.totalTaxCollected.toLocaleString()}`, icon: <Landmark className="w-5 h-5" /> },
      ]
    : [];

  if (isLoading) return <div className="p-6">Loading dashboard…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load dashboard.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ministry of Revenue — Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            {m.icon}
            <div>
              <p className="text-sm text-gray-500">{m.label}</p>
              <p className="text-xl font-semibold">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
