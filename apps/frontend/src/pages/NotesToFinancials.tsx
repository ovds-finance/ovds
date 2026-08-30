import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppPage, Btn, Icon,
} from '../components/ui';
import { STANDARD_NOTES } from '../pages/FinancialStatements';

const NotesToFinancials: React.FC = () => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['IAS 1.112']));
  const toggle = (ref: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(ref)) {
        n.delete(ref);
      } else {
        n.add(ref);
      }
      return n;
    });

  return (
    <AppPage
      title="Notes to Financial Statements"
      subtitle="IAS 1.112 — Mandatory disclosures and accounting policies"
      actions={
        <Link to="/reports/financial-statements">
          <Btn variant="secondary" size="sm" icon={<Icon name="ARROW_LEFT" size={11} />}>
            Back to Statements
          </Btn>
        </Link>
      }
    >
      <div className="p-4 bg-violet-50 border border-violet-200 dark:bg-violet-950/20 dark:border-violet-800 rounded-xl text-xs text-violet-700 dark:text-violet-300 mb-6">
        <p className="font-bold mb-1 flex items-center gap-2">
          <Icon name="INFO" size={12} /> Notes to Financial Statements — IAS 1.112
        </p>
        <p>
          Notes form an integral part of the financial statements and must be
          cross-referenced to statement line items. Mandatory disclosures are
          pre-populated below based on your accounting policies. Edit notes in
          Settings → IFRS Standards.
        </p>
      </div>

      <div className="space-y-3">
        {STANDARD_NOTES.map((note) => (
          <div key={note.ref} className="ovds-widget-card overflow-hidden">
            <button
              onClick={() => toggle(note.ref)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 rounded-full font-mono">
                  {note.ref}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {note.title}
                </span>
              </div>
              <Icon
                name={expanded.has(note.ref) ? 'CHEVRON_UP' : 'CHEVRON_DOWN'}
                size={13}
                className="text-slate-400"
              />
            </button>
            {expanded.has(note.ref) && (
              <div className="px-5 pb-5">
                <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {note.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center py-4 mt-4">
        <p className="text-xs text-slate-400">
          Additional notes (segment information, related party disclosures,
          events after reporting date) should be added per IAS 24, IFRS 8, and
          IAS 10.
        </p>
        <Link
          to="/settings"
          className="text-xs text-emerald-600 underline mt-1 inline-block"
        >
          Configure accounting policies in Settings →
        </Link>
      </div>
    </AppPage>
  );
};

export default NotesToFinancials;
