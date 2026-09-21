import { X } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useEscapeKey } from '../../hooks';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';
import CustomFieldRenderer, { type CustomFieldValuesMap } from '../CustomFieldRenderer';

interface VendorModalProps {
  vendor?: any;
  companyId?: string;
  onClose: () => void;
  onSave: () => void;
}

const VendorModal: React.FC<VendorModalProps> = ({
  vendor,
  companyId,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    name: vendor?.name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    tin: vendor?.tin || '',
    notes: vendor?.notes || '',
    paymentTerms: vendor?.paymentTerms || 'NET30',
    category: vendor?.category || 'SUPPLIER',
  });
  const [saving, setSaving] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValuesMap>({});
  const handleCustomFieldChange = useCallback((values: CustomFieldValuesMap) => {
    setCustomFieldValues(values);
  }, []);
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  useEscapeKey(onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!canWrite) {
      setSaving(false);
      toast.error('Insufficient permissions');
      return;
    }
    try {
      const payload = { ...form, customFields: customFieldValues };
      if (vendor) {
        await api.patch(`/ovds/vendors/${vendor.id}`, payload);
        toast.success('Vendor updated');
      } else {
        await api.post('/ovds/vendors', payload);
        toast.success('Vendor created');
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={vendor ? 'Edit Vendor' : 'New Vendor'}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {vendor ? 'Edit Vendor' : 'New Vendor'}
          </p>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Vendor / Supplier name"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>
            {[
              {
                label: 'Email',
                field: 'email',
                type: 'email',
                placeholder: 'vendor@example.com',
              },
              {
                label: 'Phone',
                field: 'phone',
                type: 'text',
                placeholder: '+251 9XX XXX XXX',
              },
              {
                label: 'TIN',
                field: 'tin',
                type: 'text',
                placeholder: 'Tax ID number',
              },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {label}
                </label>
                <input
                  type={type}
                  value={(form as any)[field]}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  placeholder={placeholder}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 dark:placeholder-slate-500"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 dark:placeholder-slate-500"
              >
                {[
                  'SUPPLIER',
                  'CONTRACTOR',
                  'SERVICE_PROVIDER',
                  'UTILITY',
                  'GOVERNMENT',
                  'OTHER',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Payment Terms
              </label>
              <select
                value={form.paymentTerms}
                onChange={(e) =>
                  setForm({ ...form, paymentTerms: e.target.value })
                }
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 dark:placeholder-slate-500"
              >
                {['NET7', 'NET15', 'NET30', 'NET60', 'NET90', 'IMMEDIATE'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Address
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Vendor address"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-400/10 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>
            {companyId && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Custom Fields</p>
                <CustomFieldRenderer feature="vendor" entityId={vendor?.id} companyId={vendor?.companyId || companyId}
                  onChange={handleCustomFieldChange} showTitle={false} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-500-dark disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : vendor
                  ? 'Update Vendor'
                  : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorModal;









