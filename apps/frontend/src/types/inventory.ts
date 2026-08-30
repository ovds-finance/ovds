export interface Item {
  id: string;
  name: string;
  code: string;
  category?: string;
  categoryId?: string;
  companyId?: string;
  salePrice: number;
  vatRate: number;
  stock: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  reorderLevel: number;
  costPrice: number;
  description?: string;
  itemType: string;
  groupId?: string;
  warehouseId?: string;
  imageUrl?: string;
  barcode?: string;
  unit?: string;
  minOrderQty?: number;
  maxOrderQty?: number;
  isActive: boolean;
  status?: string;
}

export interface ItemGroup {
  id: string;
  name: string;
  description?: string;
  companyId?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: { items: number };
}

export interface ItemVariant {
  id: string;
  itemId: string;
  companyId?: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
  attributes?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager?: string;
  companyId?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TransferOrder {
  id: string;
  reference: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: 'DRAFT' | 'PENDING' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
  companyId?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string | Date;
  completedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  items?: TransferOrderItem[];
}

export interface TransferOrderItem {
  id: string;
  transferOrderId: string;
  itemId: string;
  companyId?: string;
  quantity: number;
  unitCost: number;
  notes?: string;
  item?: Item;
}

export interface InventoryAdjustment {
  id: string;
  reference: string;
  itemId: string;
  quantity: number;
  type: 'ADD' | 'SUBTRACT' | 'SET' | 'DAMAGE' | 'RETURN' | 'TRANSFER' | 'INVOICE_SALE' | 'BILL_PURCHASE' | 'INVOICE_CANCEL' | 'NRV_WRITEDOWN' | 'STOCKTAKE_SURPLUS' | 'STOCKTAKE_SHORTAGE';
  reason?: string;
  notes?: string;
  adjustedBy?: string;
  companyId?: string;
  warehouseId?: string;
  createdAt: string | Date;
  item?: Item;
}

export interface WarehouseStockEntry {
  itemId: string;
  warehouseId: string;
  quantity: number;
  committedQty: number;
  incomingQty: number;
  availableQty: number;
  itemName: string;
  itemCode: string;
  warehouseName: string;
  warehouseCode: string;
}

export interface LowStockAlert {
  itemId: string;
  itemName: string;
  itemCode: string;
  currentStock: number;
  reorderLevel: number;
  shortageQty: number;
  warehouseName: string;
  unitCost: number;
  estimatedReorderCost: number;
}

export interface InventorySummaryReport {
  dateFrom: string;
  dateTo: string;
  items: Array<{
    itemId: string;
    itemName: string;
    itemCode: string;
    openingQty: number;
    receivedQty: number;
    soldQty: number;
    adjustedQty: number;
    closingQty: number;
    openingValue: number;
    closingValue: number;
  }>;
  totalOpeningValue: number;
  totalClosingValue: number;
}

export interface ProductSalesPerformance {
  itemId: string;
  itemName: string;
  itemCode: string;
  unit: string;
  totalQtySold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPct: number;
  transactionCount: number;
}

export interface StockMovement {
  id: string;
  companyId?: string;
  itemId: string;
  type: string;
  quantity: number;
  unitCost: number;
  reference?: string;
  warehouseFrom?: string;
  warehouseTo?: string;
  createdAt: string | Date;
}

export interface InventoryAgingEntry {
  itemId: string;
  itemName: string;
  itemCode: string;
  warehouseName: string;
  currentStock: number;
  oldestReceiptDate?: string;
  daysInStock: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
  unitCost: number;
  totalValue: number;
}

export interface ReorderSuggestion {
  itemId: string;
  itemName: string;
  itemCode: string;
  warehouseName: string;
  currentStock: number;
  reorderLevel: number;
  suggestedQty: number;
  unitCost: number;
  estimatedCost: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface BatchAdjustResult {
  success: boolean;
  adjusted: number;
  failed: number;
  errors: string[];
}

export interface AllAlertsResult {
  lowStock: LowStockAlert[];
  outOfStock: LowStockAlert[];
  total: number;
  critical: number;
  warning: number;
}

export interface AlertNotifyResult {
  sent: number;
  alertCount: number;
  userCount: number;
  message?: string;
}

export interface DemandForecastEntry {
  itemId: string;
  itemName: string;
  itemCode: string;
  currentStock: number;
  avgDailySales: number;
  daysOfStock: number;
  projectedStock: number;
  recommendedOrder: number;
  forecastConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface SupplierPerformanceEntry {
  vendorId: string;
  vendorName: string;
  email?: string;
  paymentTerms?: string;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  billCount: number;
  overdueCount: number;
  paymentReliability: number;
  avgPaymentDays: number;
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

export interface CostedItem extends Item {
  unitCost: number;
  totalValue: number;
  inventoryValue?: number;
  writeDownRequired?: boolean;
}

export interface InventoryResult {
  items: CostedItem[];
  totalValue: number;
  method: 'FIFO' | 'LIFO' | 'WA';
  companyId?: string;
  lifoWarning?: string;
}
