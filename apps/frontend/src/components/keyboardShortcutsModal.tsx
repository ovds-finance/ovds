/**
 * KeyboardShortcutsModal — shows all global keyboard shortcuts.
 * Triggered by pressing `?` anywhere in the app (outside inputs).
 */
import React, { useEffect } from 'react';
import { Icon } from './ui';

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open global search' },
      { keys: ['Home'], description: 'Scroll to top of page' },
      { keys: ['Esc'], description: 'Close modal / drawer / search' },
      { keys: ['?'], description: 'Toggle keyboard shortcuts' },
      { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
      { keys: ['A'], description: 'Toggle activity feed' },
      { keys: ['D'], description: 'Toggle dashboard manager' },
      { keys: ['W'], description: 'Open company setup wizard' },
      { keys: ['R'], description: 'Refresh current page data' },
      { keys: ['Alt', '←'], description: 'Previous dashboard' },
      { keys: ['Alt', '→'], description: 'Next dashboard' },
    ],
  },
  {
    label: 'G-Chord Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'I'], description: 'Go to Invoices' },
      { keys: ['G', 'W'], description: 'Go to Bills' },
      { keys: ['G', 'X'], description: 'Go to Expenses' },
      { keys: ['G', 'P'], description: 'Go to Payroll' },
      { keys: ['G', 'E'], description: 'Go to Employees' },
      { keys: ['G', 'A'], description: 'Go to Attendance' },
      { keys: ['G', 'C'], description: 'Go to CRM' },
      { keys: ['G', 'K'], description: 'Go to Sales Pipeline' },
      { keys: ['G', 'L'], description: 'Go to General Ledger' },
      { keys: ['G', 'B'], description: 'Go to Bank Accounts' },
      { keys: ['G', 'F'], description: 'Go to Fund Transfers' },
      { keys: ['G', 'Q'], description: 'Go to Petty Cash' },
      { keys: ['G', 'R'], description: 'Go to Bank Reconciliation' },
      { keys: ['G', 'G'], description: 'Go to FX & Currencies' },
      { keys: ['G', '4'], description: 'Go to Telebirr & Chapa' },
      { keys: ['G', '5'], description: 'Go to IoT Device Registry' },
      { keys: ['G', '6'], description: 'Go to Telematics Sync' },
      { keys: ['G', '7'], description: 'Go to Smart Billing (POS)' },
      { keys: ['G', 'V'], description: 'Go to VAT Return' },
      { keys: ['G', 'T'], description: 'Go to Tax Dashboard' },
      { keys: ['G', 'Y'], description: 'Go to BIT Declaration' },
      { keys: ['G', '8'], description: 'Go to TOT Filing' },
      { keys: ['G', 'H'], description: 'Go to Reports' },
      { keys: ['G', 'Z'], description: 'Go to Budgets' },
      { keys: ['G', '2'], description: 'Go to IFRS Dashboard' },
      { keys: ['G', '3'], description: 'Go to Fixed Assets' },
      { keys: ['G', '9'], description: 'Go to Tax Liability Estimator' },
      { keys: ['G', '0'], description: 'Go to IAS 2 Stock Valuation' },
      { keys: ['G', 'O'], description: 'Go to e-Tax Declaration' },
      { keys: ['G', 'U'], description: 'Go to Audit Trail & IoT Logs' },
      { keys: ['G', '1'], description: 'Go to Pension Submissions' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
      { keys: ['G', 'N'], description: 'Go to Notifications' },
      { keys: ['G', 'M'], description: 'Go to Users' },
      { keys: ['G', 'J'], description: 'Go to Projects' },
    ],
  },
  {
    label: 'ovds',
    shortcuts: [
      { keys: ['N'], description: 'New invoice (on Invoices page)' },
      { keys: ['F'], description: 'Focus search field' },
      { keys: ['P'], description: 'Print / export selected' },
    ],
  },
  {
    label: 'Payroll',
    shortcuts: [
      { keys: ['G'], description: 'Generate payroll run' },
      { keys: ['E'], description: 'Export payslips' },
    ],
  },
  {
    label: 'Notifications',
    shortcuts: [
      { keys: ['M'], description: 'Mark all as read' },
      { keys: ['R'], description: 'Refresh notifications' },
      { keys: ['Esc'], description: 'Clear filters' },
    ],
  },
  {
    label: 'General',
    shortcuts: [
      { keys: ['Tab'], description: 'Move focus forward' },
      { keys: ['Shift', 'Tab'], description: 'Move focus backward' },
      { keys: ['Enter'], description: 'Confirm / submit' },
    ],
  },
];

interface Props {
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-aki-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-aki-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Icon name="KEYBOARD" size={15} className="text-slate-500 dark:text-slate-400" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Keyboard Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            aria-label="Close"
          >
            <Icon name="CLOSE" size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.shortcuts.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 py-1.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {s.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, ki) => (
                        <React.Fragment key={ki}>
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-mono shadow-sm">
                            {k}
                          </kbd>
                          {ki < s.keys.length - 1 && (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">
                              +
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-semibold font-mono">
              ?
            </kbd>{' '}
            anywhere to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;




