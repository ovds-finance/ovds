/**
 * @ovds/ui — ExportSystem
 *
 * Enterprise export system supporting CSV, PDF, Excel, and JSON formats.
 * Provides:
 *   - Format selection with preview
 *   - Column selection for export
 *   - Date range and filter application
 *   - Template support
 *   - Watermark and header/footer options
 *   - Progress indication
 *   - Download handling
 */

import React, { useState, useCallback } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, FileType, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ExportFormat, ExportOptions } from './types';

export interface ExportButtonProps {
  onExport: (format: ExportFormat, options: ExportOptions) => void | Promise<void>;
  selectedCount?: number;
  totalCount: number;
  disabled?: boolean;
  exporting?: boolean;
  className?: string;
  availableFormats?: ExportFormat[];
  columnOptions?: { key: string; label: string }[];
  selectedColumns?: string[];
  onColumnChange?: (columns: string[]) => void;
}

export function ExportMenu({
  onExport,
  selectedCount = 0,
  totalCount,
  disabled = false,
  exporting = false,
  className,
  availableFormats = ['CSV', 'EXCEL', 'PDF', 'JSON'],
  columnOptions = [],
  selectedColumns,
  onColumnChange,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCols, setSelectedCols] = useState<string[]>(selectedColumns ?? []);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  React.useEffect(() => {
    setSelectedCols(selectedColumns ?? []);
  }, [selectedColumns]);

  const handleExport = useCallback(() => {
    onExport(format, {
      format,
      selectedOnly: selectedCount > 0,
      includeHeaders,
      dateFormat,
      columns: selectedCols.length > 0 ? selectedCols : undefined,
    });
    setIsOpen(false);
  }, [format, selectedCount, includeHeaders, dateFormat, selectedCols, onExport]);

  const toggleColumn = (key: string) => {
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
    onColumnChange?.(
      selectedCols.includes(key)
        ? selectedCols.filter((c) => c !== key)
        : [...selectedCols, key],
    );
  };

  const formats = [
    { value: 'CSV' as ExportFormat, label: 'CSV', icon: FileText, description: 'Comma-separated values' },
    { value: 'EXCEL' as ExportFormat, label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
    { value: 'PDF' as ExportFormat, label: 'PDF', icon: FileType, description: 'Portable document format' },
    { value: 'JSON' as ExportFormat, label: 'JSON', icon: FileJson, description: 'JavaScript object notation' },
  ];

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || exporting}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all',
          exporting && 'opacity-50 cursor-not-allowed',
        )}
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download size={14} />
            <span>Export</span>
            {selectedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-aki-blue-50 dark:bg-aki-blue-950/30 text-aki-blue dark:text-blue-400 text-[10px] font-bold">
                {selectedCount}
              </span>
            )}
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Export Data</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedCount > 0 ? `${selectedCount} selected records` : `All ${totalCount} records`}
                </p>
              </div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                  showAdvanced
                    ? 'bg-aki-blue-50 dark:bg-aki-blue-950/30 text-aki-blue dark:text-blue-400'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                <Settings size={14} />
              </button>
            </div>
          </div>

          {/* Format selection */}
          <div className="p-3 space-y-1.5">
            {formats
              .filter((f) => availableFormats.includes(f.value as ExportFormat))
              .map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value as ExportFormat)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                    format === f.value
                      ? 'bg-aki-blue-50 dark:bg-aki-blue-950/30 text-aki-blue dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                    format === f.value
                      ? 'bg-aki-blue-100 dark:bg-aki-blue-900/50'
                      : 'bg-slate-100 dark:bg-slate-800',
                  )}>
                    <f.icon size={14} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold">{f.label}</p>
                    <p className="text-[10px] text-slate-400">{f.description}</p>
                  </div>
                </button>
              ))}
          </div>

          {/* Advanced options */}
          {showAdvanced && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {columnOptions.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Columns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {columnOptions.map((col) => (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                          selectedCols.includes(col.key) || selectedCols.length === 0
                            ? 'bg-aki-blue-50 dark:bg-aki-blue-950/30 text-aki-blue dark:text-blue-400 border border-aki-blue-200 dark:border-aki-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent',
                        )}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Include headers</span>
                <button
                  onClick={() => setIncludeHeaders(!includeHeaders)}
                  className={cn(
                    'w-9 h-5 rounded-full transition-all relative',
                    includeHeaders ? 'bg-aki-blue' : 'bg-slate-200 dark:bg-slate-700',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all',
                      includeHeaders ? 'left-[18px]' : 'left-0.5',
                    )}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Date Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-aki-blue/20"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
                </select>
              </div>
            </div>
          )}

          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-aki-blue text-white rounded-xl text-[12px] font-semibold hover:bg-aki-blue-dark disabled:opacity-50 transition-all shadow-sm shadow-aki-blue/20"
            >
              <Download size={14} />
              Export as {format}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
