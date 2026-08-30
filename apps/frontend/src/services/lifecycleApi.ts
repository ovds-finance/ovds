/**
 * Lifecycle Webhooks — Auto-trigger reorder actions and external integrations
 */
import { apiPost } from './api';

export interface ReorderWebhookPayload {
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderLevel: number;
  suggestedQuantity: number;
  unit: string;
  companyId?: string;
}

export async function triggerLowStockWebhook(payload: ReorderWebhookPayload): Promise<void> {
  await apiPost('/ovds/items/webhook/low-stock', payload);
}

export interface ItemLifecycleWebhookPayload {
  itemId: string;
  itemName: string;
  event: 'CREATED' | 'SOLD' | 'PURCHASED' | 'STOCK_ADJUSTED' | 'LOW_STOCK' | 'REORDER_TRIGGERED';
  companyId?: string;
  metadata?: Record<string, unknown>;
}

export async function sendLifecycleEvent(payload: ItemLifecycleWebhookPayload): Promise<void> {
  await apiPost('/ovds/items/webhook/lifecycle-event', payload);
}

export interface ReorderSuggestion {
  itemId: string;
  itemName: string;
  suggestedQuantity: number;
  unitCost: number;
  totalCost: number;
  reason: string;
}