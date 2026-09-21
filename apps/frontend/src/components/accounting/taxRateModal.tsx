import { Button } from '@ovds/ui';
import { X, Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';


interface TaxRateFormData {
  id?: string;
  name: string;
  rate: number;
  type: 'VAT' | 'SALES_TAX' | 'WITHHOLDING' | 'INCOME_TAX' | 'DRRF' | 'CUSTOM';
  calculationType: 'NORMAL' | 'INCLUSIVE' | 'COMPOUND' | 'FIXED' | 'WITHHOLDING';
  currency: string;
  appliesTo: string[];
  description?: string;
  isActive: boolean;
  isInclusive?: boolean;
  isCompound?: boolean;
  compoundParentId?: string;
  specificAmount?: number;
  roundingRule?: string;
  attachmentCount?: number;
}

interface TaxRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  rate?: TaxRateFormData | null;
  onSuccess: () => void;
  title: string;
  isEdit: boolean;
}

const TaxRateModal: React.FC<TaxRateModalProps> = ({ isOpen, onClose, rate, onSuccess, title, isEdit }) => {
  const [formData, setFormData] = useState<TaxRateFormData>({
    name: '',
    rate: 0.15,
    type: 'VAT',
    calculationType: 'NORMAL',
    currency: 'ETB',
    appliesTo: ['INVOICE', 'ITEM'],
    description: '',
    isActive: true,
    isInclusive: false,
    isCompound: false,
    specificAmount: 0,
    roundingRule: 'HALF_UP',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rate && isOpen) {
      setFormData({
        id: rate.id,
        name: rate.name,
        rate: rate.rate,
        type: rate.type,
        calculationType: rate.calculationType || 'NORMAL',
        currency: (rate as any).currency || 'ETB',
        appliesTo: rate.appliesTo || ['INVOICE', 'ITEM'],
        description: rate.description || '',
        isActive: rate.isActive,
        isInclusive: rate.isInclusive || false,
        isCompound: rate.isCompound || false,
        compoundParentId: rate.compoundParentId || '',
        specificAmount: rate.specificAmount || 0,
        roundingRule: rate.roundingRule || 'HALF_UP',
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        rate: 0.15,
        type: 'VAT',
        calculationType: 'NORMAL',
        currency: 'ETB',
        appliesTo: ['INVOICE', 'ITEM'],
        description: '',
        isActive: true,
        isInclusive: false,
        isCompound: false,
        compoundParentId: '',
        specificAmount: 0,
        roundingRule: 'HALF_UP',
      });
    }
  }, [rate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        rate: formData.rate,
        type: formData.type,
        calculationType: formData.calculationType,
        appliesTo: formData.appliesTo,
        description: formData.description,
        isActive: formData.isActive,
        isInclusive: formData.isInclusive,
        isCompound: formData.isCompound,
        compoundParentId: formData.compoundParentId || null,
        specificAmount: formData.specificAmount,
        roundingRule: formData.roundingRule,
      };

      if (isEdit && (rate as any)?.id) {
        await api.patch(`/ovds/tax-rates/${(rate as any).id}`, payload);
        toast.success('Tax rate updated');
      } else {
        await api.post('/ovds/tax-rates', payload);
        toast.success('Tax rate created');
      }
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to save tax rate');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
              placeholder="e.g. Standard VAT 15%"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              required
              value={formData.rate}
              onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
              placeholder="0.15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tax Category
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="VAT">VAT</option>
              <option value="SALES_TAX">Sales Tax</option>
              <option value="WITHHOLDING">Withholding</option>
              <option value="INCOME_TAX">Income Tax</option>
              <option value="DRRF">DRRF</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Calculation Method
            </label>
            <select
              value={formData.calculationType}
              onChange={(e) => setFormData({...formData, calculationType: e.target.value as any})}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="NORMAL">Normal — Added on top (exclusive)</option>
              <option value="INCLUSIVE">Inclusive — Tax embedded in price</option>
              <option value="COMPOUND">Compound — Tax on tax</option>
              <option value="FIXED">Fixed — Flat amount</option>
              <option value="WITHHOLDING">Withholding — Deducted at source</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              {formData.calculationType === 'NORMAL' && 'Tax is added on top of the subtotal (e.g., standard VAT 15%).'}
              {formData.calculationType === 'INCLUSIVE' && 'The displayed price already includes tax; system back-calculates the tax portion.'}
              {formData.calculationType === 'COMPOUND' && 'Tax is calculated on top of previously applied taxes (tax-on-tax).'}
              {formData.calculationType === 'FIXED' && 'A fixed monetary amount is added regardless of the item cost.'}
              {formData.calculationType === 'WITHHOLDING' && 'Tax is withheld by the payer and remitted to the tax authority.'}
            </p>
          </div>

          {formData.calculationType === 'FIXED' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fixed Amount (ETB)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.specificAmount || 0}
                onChange={(e) => setFormData({...formData, specificAmount: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                placeholder="0.00"
              />
            </div>
          )}

          {formData.calculationType === 'COMPOUND' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Compound Parent Tax
              </label>
              <input
                type="text"
                value={formData.compoundParentId || ''}
                onChange={(e) => setFormData({...formData, compoundParentId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                placeholder="ID of parent tax rate (optional)"
              />
              <p className="text-xs text-slate-400 mt-1">
                Leave empty to compound on all previously applied taxes.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Rounding Rule
            </label>
            <select
              value={formData.roundingRule || 'HALF_UP'}
              onChange={(e) => setFormData({...formData, roundingRule: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="HALF_UP">Half Up (standard)</option>
              <option value="HALF_EVEN">Half Even (banker's rounding)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Applies To
            </label>
            <div className="space-y-2">
              {(['INVOICE', 'BILL', 'ITEM'] as const).map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.appliesTo.includes(option)}
                    onChange={(e) => {
                      const newAppliesTo = e.target.checked
                        ? [...formData.appliesTo, option]
                        : formData.appliesTo.filter(t => t !== option);
                      setFormData({...formData, appliesTo: newAppliesTo});
                    }}
                    className="rounded border-slate-300 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] focus:ring-teal-400"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
              placeholder="Additional notes about this tax rate..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ETB">ETB (Ethiopian Birr)</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded border-slate-300 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] focus:ring-teal-400"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : <><Save size={16} className="mr-2" />{isEdit ? 'Update' : 'Create'}</>}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaxRateModal;
