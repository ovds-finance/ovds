import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EntryLine {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

export function CreateJournalForm() {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<EntryLine[]>([
    { accountId: '', type: 'DEBIT', amount: 0 },
    { accountId: '', type: 'CREDIT', amount: 0 },
  ]);

  const mutation = useMutation({
    mutationFn: async (newTx: { description: string; entries: EntryLine[] }) => {
      const res = await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Transaction processing failed.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-history'] });
      alert('Journal entry safely posted to Ledger.');
    },
    onError: (err: Error) => {
      alert(`Error: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ description, entries });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-xl max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Record Journal Entry</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Memo / Description</label>
        <input 
          type="text" 
          className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500"
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required 
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Transaction Lines</label>
        {entries.map((entry, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <input 
              type="text" 
              placeholder="Account UUID" 
              className="flex-1 p-2 border border-gray-300 rounded-md"
              value={entry.accountId}
              onChange={(e) => {
                const updated = [...entries];
                updated[idx].accountId = e.target.value;
                setEntries(updated);
              }}
              required
            />
            <select 
              className="p-2 border border-gray-300 rounded-md"
              value={entry.type}
              onChange={(e) => {
                const updated = [...entries];
                updated[idx].type = e.target.value as 'DEBIT' | 'CREDIT';
                setEntries(updated);
              }}
            >
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>
            <input 
              type="number" 
              step="0.01" 
              placeholder="Amount" 
              className="w-32 p-2 border border-gray-300 rounded-md"
              value={entry.amount || ''}
              onChange={(e) => {
                const updated = [...entries];
                updated[idx].amount = parseFloat(e.target.value) || 0;
                setEntries(updated);
              }}
              required
            />
          </div>
        ))}
      </div>

      <button 
        type="submit" 
        className="w-full py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
      >
        Post to Core Ledger
      </button>
    </form>
  );
}