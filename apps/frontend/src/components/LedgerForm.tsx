import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';

import type { CreateLedgerEntryDTO, JournalLineDTO, AccountResponseDTO } from '@ovds/dto';

export function LedgerForm({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<JournalLineDTO[]>([
    { accountId: '', type: 'DEBIT', amount: 0 },
    { accountId: '', type: 'CREDIT', amount: 0 },
  ]);

  const { data: accounts, isLoading: accountsLoading } = useQuery<AccountResponseDTO[]>({
    queryKey: ['accounts', companyId],
    queryFn: () =>
      fetch(`/api/accounting/ledgers/accounts?companyId=${companyId}`).then((res) => res.json()),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (newEntry: CreateLedgerEntryDTO) => {
      return fetch('/api/accounting/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      }).then((res) => {
        if (!res.ok) throw new Error('Transaction submission failed validation constraints.');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', companyId] });
      alert('Ledger Entry posted successfully!');
      setDescription('');
      setReference('');
      setLines([
        { accountId: '', type: 'DEBIT', amount: 0 },
        { accountId: '', type: 'CREDIT', amount: 0 },
      ]);
    },
    onError: (err: any) => alert(err.message),
  });

  const handleLineChange = (index: number, key: keyof JournalLineDTO, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [key]: value };
    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', type: 'DEBIT', amount: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const totalDebits = lines
    .filter((l) => l.type === 'DEBIT')
    .reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const totalCredits = lines
    .filter((l) => l.type === 'CREDIT')
    .reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    mutation.mutate({ companyId, description, reference, lines });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white shadow rounded-lg max-w-4xl mx-auto space-y-6"
    >
      <h2 className="text-xl font-bold text-gray-900">Record Manual Ledger Entry</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">Memo Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reference (optional)</label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Invoice UUID or Bill Number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50"
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Transaction Entries Matrix</label>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="h-4 w-4" />
            Add Line
          </button>
        </div>
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <select
              value={line.accountId}
              onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
              required
              disabled={accountsLoading}
              className="flex-1 rounded-md border-gray-300 p-2 bg-gray-50 text-sm"
            >
              <option value="">-- Choose Target Account --</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  [{acc.code}] {acc.name}
                </option>
              ))}
            </select>

            <select
              value={line.type}
              onChange={(e) => handleLineChange(idx, 'type', e.target.value)}
              className="w-32 rounded-md border-gray-300 p-2 bg-gray-50 text-sm"
            >
              <option value="DEBIT">DEBIT (+)</option>
              <option value="CREDIT">CREDIT (-)</option>
            </select>

            <input
              type="number"
              step="0.01"
              min="0.01"
              value={line.amount || ''}
              onChange={(e) =>
                handleLineChange(idx, 'amount', parseFloat(e.target.value))
              }
              required
              className="w-36 rounded-md border-gray-300 p-2 bg-gray-50 text-sm text-right"
              placeholder="0.00"
            />

            <button
              type="button"
              onClick={() => removeLine(idx)}
              disabled={lines.length <= 2}
              className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-md text-sm font-semibold">
        <div className="space-x-4">
          <span className="text-blue-700">Total Debits: ${totalDebits.toFixed(2)}</span>
          <span className="text-purple-700">Total Credits: ${totalCredits.toFixed(2)}</span>
        </div>
        {isBalanced ? (
          <span className="text-green-600">✓ Matrix Balanced</span>
        ) : (
          <span className="text-red-500">
            ✗ Out of Balance (${Math.abs(totalDebits - totalCredits).toFixed(2)})
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!isBalanced || mutation.isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition flex items-center justify-center gap-2"
      >
        {mutation.isPending ? (
          'Posting Transaction...'
        ) : (
          <>
            <Save className="h-4 w-4" />
            Commit Transaction Log
          </>
        )}
      </button>
    </form>
  );
}
