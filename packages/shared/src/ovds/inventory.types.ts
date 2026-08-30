import { Item as BaseItem } from '../types';

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
  country: string;
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
  quantity: number;
  unitCost: number;
  notes?: string;
  item?: BaseItem;
}

export interface InventoryAdjustment {
  id: string;
  reference: string;
  itemId: string;
  quantity: number;
  type: 'ADD' | 'SUBTRACT' | 'SET' | 'DAMAGE' | 'RETURN' | 'TRANSFER';
  reason?: string;
  notes?: string;
  adjustedBy?: string;
  companyId?: string;
  warehouseId?: string;
  createdAt: string | Date;
  item?: BaseItem;
}

export type InventoryMethod = 'FIFO' | 'LIFO' | 'WA';

export interface CostedItem extends BaseItem {
  unitCost: number;
  totalValue: number;
  inventoryValue?: number;
  writeDownRequired?: boolean;
  // Prisma Decimal fields coerced to number at the service layer
  salePrice: number;
  vatRate: number;
}

export interface InventoryResult {
  items: CostedItem[];
  totalValue: number;
  method: InventoryMethod;
  companyId?: string;
  lifoWarning?: string;
}
