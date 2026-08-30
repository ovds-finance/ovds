import React, { useState, useEffect } from 'react';
import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit3, Paperclip
} from 'lucide-react';
import AttachmentModal from '../banking/attachmentModal';
import { Button } from '@ovds/ui';
import { Badge } from '@ovds/ui';
import TaxRateModal from './taxRateModal';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'VAT' | 'SALES_TAX' | 'WITHHOLDING' | 'INCOME_TAX' | 'DRRF' | 'CUSTOM';
  calculationType: 'NORMAL' | 'INCLUSIVE' | 'COMPOUND' | 'FIXED' | 'WITHHOLDING';
  appliesTo?: string[];
  description?: string;
  isActive: boolean;
  isInclusive?: boolean;
  isCompound?: boolean;
  compoundParentId?: string;
  specificAmount?: number;
  roundingRule?: string;
  attachmentCount?: number;
  currency?: string;
}

const TaxRatesTable: React.FC = () => {
  const { can } = useAuth();
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedRateForAttachments, setSelectedRateForAttachments] = useState<string>('');
  const [attachments] = useState<{ id: string; filename: string; mimeType: string; fileSize: number; description?: string }[]>([]);
  const [selectedRates, setSelectedRates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRate, setCurrentRate] = useState<TaxRate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const res = await api.get('/ovds/tax-rates');
      setRates(res.data);
    } catch {
      toast.error('Failed to load tax rates');
    } finally {
      setLoading(false);
    }
  };

  const filteredRates = rates.filter(rate =>
    rate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.calculationType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRates = filteredRates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredRates.length / ITEMS_PER_PAGE);

  const selectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRates(paginatedRates.map(r => r.id));
    } else {
      setSelectedRates([]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedRates(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const createDefaultRates = async () => {
    try {
      await api.post('/ovds/tax-rates', {
        name: 'Standard VAT',
        rate: 0.15,
        type: 'VAT',
        calculationType: 'NORMAL',
        appliesTo: ['INVOICE', 'ITEM']
      });
      await api.post('/ovds/tax-rates', {
        name: 'Withholding Tax',
        rate: 0.02,
        type: 'WITHHOLDING',
        calculationType: 'WITHHOLDING',
        appliesTo: ['BILL']
      });
      toast.success('Default tax rates created');
      loadRates();
    } catch {
      toast.error('Failed to create default rates');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await api.patch(`/ovds/tax-rates/${id}`, { isActive: !current });
      setRates(rates.map(r => r.id === id ? {...r, isActive: !current} : r));
      toast.success('Tax rate updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const deleteRate = async (id: string) => {
    if (!confirm('Delete this tax rate?')) return;
    try {
      await api.delete(`/ovds/tax-rates/${id}`);
      setRates(rates.filter(r => r.id !== id));
      toast.success('Tax rate deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div>Loading tax rates...</div>;

  const calcTypeColor = (calcType: string) => {
    switch (calcType) {
      case 'NORMAL': return 'default';
      case 'INCLUSIVE': return 'secondary';
      case 'COMPOUND': return 'destructive';
      case 'FIXED': return 'outline';
      case 'WITHHOLDING': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Tax Rates ({filteredRates.length})</h2>
        <div className="flex items-center gap-2">
          {selectedRates.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {/* bulk toggle later */}}
              >
                Activate ({selectedRates.length})
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {/* bulk delete later */}}
              >
                Delete ({selectedRates.length})
              </Button>
            </div>
          )}
          {can('ovds:write') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-2" />
              New Rate
            </Button>
          )}
          {can('ovds:write') && (
            <Button onClick={async () => {
              try {
                await api.post('/ovds/tax-rates/seed-et');
                toast.success('Ethiopian tax rates seeded');
                loadRates();
              } catch {
                toast.error('Failed to seed tax rates');
              }
            }} variant="outline" size="sm">
              Seed Ethiopian Defaults
            </Button>
          )}
          <Button onClick={loadRates} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search rates..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="ovds-table w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRates.length === paginatedRates.length && paginatedRates.length > 0}
                  onChange={(e) => selectAll(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 dark:text-emerald-400 focus:ring-teal-400"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Calc Type</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Active</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Attachments</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedRates.map((rate) => (
              <tr key={rate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRates.includes(rate.id)}
                    onChange={() => toggleSelection(rate.id)}
                    className="rounded border-slate-300 text-emerald-600 dark:text-emerald-400 focus:ring-teal-400 w-4 h-4"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{rate.name}</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-emerald-700">
                  {rate.calculationType === 'FIXED'
                    ? `ETB ${(rate.specificAmount || 0).toFixed(2)}`
                    : `${(rate.rate * 100).toFixed(1)}%`}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={rate.type === 'VAT' ? 'default' : 'secondary'}>
                    {rate.type}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={calcTypeColor(rate.calculationType)}>
                    {rate.calculationType}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(rate.id, rate.isActive)}
                    className="h-8 w-20"
                  >
                    {rate.isActive ? 'Active' : 'Inactive'}
                  </Button>
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedRateForAttachments(rate.id);
                      setShowAttachmentModal(true);
                    }}
                  >
                    <Paperclip size={14} />
                    {rate.attachmentCount || 0}
                  </Button>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setCurrentRate(rate);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                    onClick={() => deleteRate(rate.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>

          {totalPages > 1 && (
            <tfoot>
              <tr>
                <td colSpan={8} className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm text-slate-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {rates.length === 0 && (
        <div className="ovds-empty">
          <Plus size={48} className="mx-auto mb-4 opacity-25" />
          <p className="text-lg font-medium">No tax rates configured</p>
          <p className="mt-1">Create your first VAT/Sales Tax rate or use defaults</p>
          {can('ovds:write') && (
            <Button onClick={createDefaultRates} className="mt-4">
              <Plus size={16} className="mr-2" />
              Setup Default Rates
            </Button>
          )}
        </div>
      )}

      <TaxRateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        rate={null}
        onSuccess={loadRates}
        title="New Tax Rate"
        isEdit={false}
      />

      <TaxRateModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        rate={currentRate ? {
          ...currentRate,
          appliesTo: currentRate.appliesTo || ['INVOICE', 'ITEM']
        } as any : null}
        onSuccess={loadRates}
        title="Edit Tax Rate"
        isEdit={true}
      />

      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        taxRateId={selectedRateForAttachments}
        attachments={attachments}
        onSuccess={() => {
          loadRates();
        }}
      />
    </div>
  );
};

export default TaxRatesTable;
