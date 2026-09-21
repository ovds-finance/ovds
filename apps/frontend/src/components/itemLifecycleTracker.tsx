/**
 * ItemLifecycleTracker — Visual component showing item journey through OVDS ovds modules
 *
 * Displays a horizontal progress bar showing:
 *   ITEMS → CRM → SALES → PURCHASES → INVENTORY → BANKING → ACCOUNTING → TAX → IFRS → REPORTS
 *
 * Usage:
 *   <ItemLifecycleTracker
 *     itemId="item-uuid"
 *     currentStage="SALES"
 *     metrics={{
 *       totalInvoiced: 150000,
 *       totalPurchased: 85000,
 *       currentStock: 45,
 *       lowStockAlert: true,
 *       arBalance: 25000,
 *       apBalance: 12000,
 *     }}
 *   />
 */
import { Package, Users2, Receipt, ShoppingCart, Warehouse, Banknote, BookOpen, FileText, BarChart3 } from 'lucide-react';
import React from 'react';

export type ItemLifecycleStage = 'ITEMS' | 'CRM' | 'SALES' | 'PURCHASES' | 'INVENTORY' | 'BANKING' | 'ACCOUNTING' | 'TAX' | 'IFRS' | 'REPORTS';

export interface ItemLifecycleMetrics {
  totalInvoiced?: number;
  totalSoldQty?: number;
  totalPurchased?: number;
  currentStock?: number;
  reorderLevel?: number;
  lowStockAlert?: boolean;
  arBalance?: number;
  apBalance?: number;
  vatCollected?: number;
  whtWithheld?: number;
  inventoryValue?: number;
}

export interface ItemLifecycleTrackerProps {
  itemId?: string;
  itemName?: string;
  currentStage?: ItemLifecycleStage;
  completedStages?: ItemLifecycleStage[];
  metrics?: ItemLifecycleMetrics;
  className?: string;
}

const STAGES: Array<{
  key: ItemLifecycleStage;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = [
  { key: 'ITEMS', label: 'Items', icon: <Package size={16} />, description: 'Master data setup', color: '#00E784' },
  { key: 'CRM', label: 'CRM', icon: <Users2 size={16} />, description: 'Customer relations', color: '#38BDF8' },
  { key: 'SALES', label: 'Sales', icon: <Receipt size={16} />, description: 'Invoices & orders', color: '#F59E0B' },
  { key: 'PURCHASES', label: 'Purchases', icon: <ShoppingCart size={16} />, description: '3-way matching', color: '#EC4899' },
  { key: 'INVENTORY', label: 'Inventory', icon: <Warehouse size={16} />, description: 'Stock levels', color: '#8B5CF6' },
  { key: 'BANKING', label: 'Banking', icon: <Banknote size={16} />, description: 'Payments & receipts', color: '#14B8A6' },
  { key: 'ACCOUNTING', label: 'Accounting', icon: <BookOpen size={16} />, description: 'Journal entries', color: '#F97316' },
  { key: 'TAX', label: 'Tax', icon: <FileText size={16} />, description: 'VAT & WHT', color: '#EF4444' },
  { key: 'IFRS', label: 'IFRS', icon: <BarChart3 size={16} />, description: 'Compliance', color: '#6366F1' },
  { key: 'REPORTS', label: 'Reports', icon: <BarChart3 size={16} />, description: 'Insights', color: '#84CC16' },
];

export const ItemLifecycleTracker: React.FC<ItemLifecycleTrackerProps> = ({
  itemId,
  itemName,
  currentStage = 'ITEMS',
  completedStages = [],
  metrics,
  className = '',
}) => {
  const currentIdx = STAGES.findIndex(s => s.key === currentStage);
  const isStageCompleted = (stage: ItemLifecycleStage) =>
    completedStages.includes(stage) || STAGES.findIndex(s => s.key === stage) < currentIdx;

  return (
    <div className={`item-lifecycle-tracker ${className}`}>
      {/* Journey bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Multi-color top bar */}
        <div className="flex h-2">
          {STAGES.map((stage, _i) => {
            const stageCompleted = isStageCompleted(stage.key);
            return (
              <div
                key={stage.key}
                className="transition-all duration-500"
                style={{
                  background: stageCompleted ? stage.color : '#E2E8F0',
                  width: `${100 / STAGES.length}%`,
                  opacity: stageCompleted ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>

        {/* Stage nodes */}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${STAGES.length}, 1fr)` }}>
          {STAGES.map((stage, i) => {
            const stageCompleted = isStageCompleted(stage.key);
            const isActive = i === currentIdx;

            return (
              <div
                key={stage.key}
                className={`p-4 text-center transition-all ${isActive ? 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure)]/10' : ''}`}
              >
                {/* Icon circle */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 transition-all"
                  style={{
                    background: stageCompleted ? `${stage.color}15` : '#F1F5F9',
                    border: `2px solid ${stageCompleted ? stage.color : '#E2E8F0'}`,
                  }}
                >
                  <div style={{ color: stageCompleted ? stage.color : '#94A3B8' }}>
                    {stage.icon}
                  </div>
                </div>

                {/* Label */}
                <p className={`text-[11px] font-black uppercase tracking-wider mb-1 transition-all ${
                  stageCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                }`}>
                  {stage.label}
                </p>

                {/* Description */}
                <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics panel */}
      {metrics && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Sales metrics */}
          {metrics.totalInvoiced !== undefined && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoiced</p>
              <p className="text-lg font-black text-[var(--pro-azure)] tabular-nums mt-1">
                ETB {metrics.totalInvoiced.toLocaleString()}
              </p>
            </div>
          )}

          {/* Stock metrics */}
          {metrics.currentStock !== undefined && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock</p>
                {metrics.lowStockAlert && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 uppercase">
                    Low
                  </span>
                )}
              </div>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 tabular-nums mt-1">
                {metrics.currentStock} units
              </p>
            </div>
          )}

          {/* AR/AP Balance */}
          {metrics.arBalance !== undefined && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AR Balance</p>
              <p className="text-lg font-black text-sky-600 tabular-nums mt-1">
                ETB {metrics.arBalance.toLocaleString()}
              </p>
            </div>
          )}

          {metrics.apBalance !== undefined && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AP Balance</p>
              <p className="text-lg font-black text-rose-600 tabular-nums mt-1">
                ETB {metrics.apBalance.toLocaleString()}
              </p>
            </div>
          )}

          {/* Inventory value */}
          {metrics.inventoryValue !== undefined && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory Value</p>
              <p className="text-lg font-black text-violet-600 tabular-nums mt-1">
                ETB {metrics.inventoryValue.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Inline styles for the component
const inlineStyles = `
.item-lifecycle-tracker {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
`;

// Inject styles on mount
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = inlineStyles;
  document.head.appendChild(styleEl);
}
