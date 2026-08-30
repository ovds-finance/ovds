/**
 * Stock Valuation Types — @ovds/shared
 * IAS 2 — Inventories: FIFO and Weighted Average Cost (AVCO).
 * LIFO is prohibited under IFRS.
 */

export type StockValuationMethod = 'FIFO' | 'AVCO';
export type StockTransactionType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'OPENING';

export interface StockValuationLayer {
  id: string;
  itemId: string;
  companyId?: string | null;
  warehouseId?: string | null;
  transactionType: StockTransactionType;
  valuationMethod: StockValuationMethod;
  date: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  remainingQty: number;       // For FIFO: qty remaining in this layer
  runningAvco?: number | null; // For AVCO: running average cost
  runningQty?: number | null;
  runningValue?: number | null;
  reference?: string | null;
  journalEntryId?: string | null;
  createdAt: string;
}

export interface StockValuationSummary {
  itemId: string;
  itemName: string;
  itemCode: string;
  method: StockValuationMethod;
  currentQty: number;
  currentValue: number;
  unitCost: number;           // Current AVCO or latest FIFO layer cost
  reorderLevel: number;
  belowReorder: boolean;
}

export interface CogsCalculation {
  itemId: string;
  quantityIssued: number;
  totalCogs: number;
  method: StockValuationMethod;
  layers?: Array<{           // FIFO layers consumed
    layerId: string;
    qtyConsumed: number;
    unitCost: number;
    cost: number;
  }>;
}

/** IAS 2 NRV test: if cost > NRV, write down to NRV */
export interface NrvTest {
  itemId: string;
  costPerUnit: number;
  nrvPerUnit: number;        // Net Realisable Value = selling price - completion costs
  writeDownRequired: boolean;
  writeDownAmount: number;
}
