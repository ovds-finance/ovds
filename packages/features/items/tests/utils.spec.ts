/**
 * @ovds/features/items — utilities unit tests.
 *
 * Pure functions only — no React, no network. Safe under the node env.
 */
import {
  fmtPrice,
  fmtQty,
  calcLineTotal,
  calcVatAmount,
  calcMargin,
  calcMarkup,
  getStockStatus,
  isLowStock,
  itemTypeLabel,
  itemStatusLabel,
  generateItemCode,
} from '../src/utils';

describe('fmtPrice', () => {
  it('formats a number as ETB currency', () => {
    expect(fmtPrice(1234.5)).toBe('ETB\u00a01,234.50');
  });
  it('returns em dash for null/undefined', () => {
    expect(fmtPrice(null)).toBe('—');
    expect(fmtPrice(undefined)).toBe('—');
  });
  it('respects a custom currency', () => {
    // en-ET locale prints USD as "$100.00" — assert the decimal block robustly
    // across Intl backends.
    expect(fmtPrice(100, 'USD')).toMatch(/100\.00/);
    expect(fmtPrice(100, 'USD')).not.toBe(fmtPrice(100));
  });
});

describe('fmtQty', () => {
  it('formats an integer with no decimals', () => {
    expect(fmtQty(1500)).toBe('1,500');
  });
  it('returns em dash for null/undefined', () => {
    expect(fmtQty(null)).toBe('—');
  });
});

describe('calcLineTotal', () => {
  it('computes subtotal + VAT + total', () => {
    const r = calcLineTotal(2, 100, 15);
    expect(r.lineSubtotal).toBe(200);
    expect(r.vatAmount).toBe(30);
    expect(r.lineTotal).toBe(230);
  });
  it('rounds to two decimals', () => {
    const r = calcLineTotal(3, 19.99, 15);
    // 3 * 19.99 = 59.97; VAT = 8.9955 -> 9; total = 68.97
    expect(r.lineSubtotal).toBe(59.97);
    expect(r.vatAmount).toBe(9);
    expect(r.lineTotal).toBe(68.97);
  });
});

describe('calcVatAmount', () => {
  it('defaults to 15% VAT', () => {
    expect(calcVatAmount(100)).toEqual({ vatAmount: 15, total: 115 });
  });
  it('supports a custom rate', () => {
    expect(calcVatAmount(200, 0)).toEqual({ vatAmount: 0, total: 200 });
  });
});

describe('calcMargin', () => {
  it('computes absolute and percentage margin', () => {
    const r = calcMargin(120, 80);
    expect(r.margin).toBe(40);
    expect(r.marginPercent).toBe(33.33);
  });
  it('treats missing cost as 0', () => {
    expect(calcMargin(100).margin).toBe(100);
  });
  it('returns 0% margin when sale price is 0', () => {
    expect(calcMargin(0, 50).marginPercent).toBe(0);
  });
});

describe('calcMarkup', () => {
  it('computes markup on cost', () => {
    expect(calcMarkup(120, 80)).toBe(50); // (40/80)*100
  });
  it('returns 0 when cost is 0', () => {
    expect(calcMarkup(100, 0)).toBe(0);
  });
});

describe('stock status', () => {
  it('isLowStock flags stock at or below reorder level', () => {
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(4, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
    expect(isLowStock(undefined, 5)).toBe(false);
  });

  it('getStockStatus classifies by type', () => {
    expect(getStockStatus(100, 10)).toBe('IN_STOCK');
    expect(getStockStatus(10, 10)).toBe('LOW_STOCK');
    expect(getStockStatus(0, 10)).toBe('OUT_OF_STOCK');
    expect(getStockStatus(-5, 10)).toBe('OUT_OF_STOCK');
  });

  it('getStockStatus is NOT_TRACKED for non-inventory items', () => {
    expect(getStockStatus(0, 0, false)).toBe('NOT_TRACKED');
    expect(getStockStatus(100, 10, false)).toBe('NOT_TRACKED');
  });
});

describe('label helpers', () => {
  it('itemTypeLabel maps known types', () => {
    expect(itemTypeLabel('PRODUCT')).toBe('Product');
    expect(itemTypeLabel('SERVICE')).toBe('Service');
    expect(itemTypeLabel('DIGITAL')).toBe('Digital');
  });
  it('itemTypeLabel returns unknown value as-is', () => {
    expect(itemTypeLabel('WEIRD')).toBe('WEIRD');
  });
  it('itemTypeLabel returns em dash for null', () => {
    expect(itemTypeLabel(null)).toBe('—');
  });
  it('itemStatusLabel maps known statuses', () => {
    expect(itemStatusLabel('ACTIVE')).toBe('Active');
    expect(itemStatusLabel('INACTIVE')).toBe('Inactive');
    expect(itemStatusLabel('DISCONTINUED')).toBe('Discontinued');
  });
});

describe('generateItemCode', () => {
  it('builds a code from name initials + sequence', () => {
    expect(generateItemCode('Widget Pro', 1)).toBe('WP-001');
  });
  it('truncates initials to 4 chars', () => {
    // 5 words of initials would be "VL PNE" → slice(0,4) → "VLPN"
    expect(generateItemCode('Very Long Product Name Extra', 12)).toBe('VLPN-012');
  });
});
