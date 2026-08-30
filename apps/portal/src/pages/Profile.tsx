import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface CustomerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  tin?: string;
  balance?: number;
  currencyCode?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/crm/customers/me');
      setProfile(data?.data ?? data ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number, currency = 'ETB') =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your account details and balance</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{profile.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Customer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{profile.email || '-'}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{profile.phone || '-'}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">TIN</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{profile.tin || '-'}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Balance</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                {profile.balance !== undefined ? fmt(profile.balance, profile.currencyCode) : '-'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 sm:col-span-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Address</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                {[profile.address, profile.city, profile.region].filter(Boolean).join(', ') || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
