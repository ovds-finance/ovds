/**
 * @ovds/features/items — API client unit tests.
 *
 * Runs under the root vitest config (node env). The itemsApi client has no
 * runtime deps (all @ovds/contracts imports are type-only), so we can exercise
 * the URL/method/header/body logic with a mocked global.fetch.
 */
import {
  itemsApi,
  catalogItemsApi,
  itemStatsApi,
  stockAdjustmentApi,
  itemGroupsApi,
  warehousesApi,
  stockMovementsApi,
  priceListsApi,
} from '../src/services/itemsApi';
import type { Item, ItemGroup } from '../src/types';

function mockResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
    const ok = init.ok ?? (status >= 200 && status < 300);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

const mockFetch = vi.fn(async () => mockResponse({}));
const mockLocalStorage = {
  getItem: vi.fn((key: string) =>
    key === 'selectedCompanyId' ? 'company-123' : null,
  ),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(async () => mockResponse({}));
  (globalThis as any).fetch = mockFetch;
  (globalThis as any).localStorage = mockLocalStorage;
  mockLocalStorage.getItem.mockClear();
});

afterEach(() => {
  delete (globalThis as any).fetch;
  delete (globalThis as any).localStorage;
});

describe('itemsApi', () => {
  it('list calls GET /ovds/inventory/items with company header and query', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], total: 0 }));
    await itemsApi.list({ companyId: 'company-123', search: 'widget', page: 2, limit: 25 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ovds/inventory/items?companyId=company-123&search=widget&page=2&limit=25');
    expect(opts.method).toBe('GET');
    expect(opts.headers['Authorization']).toBeUndefined();
    expect(opts.headers['x-company-id']).toBe('company-123');
  });

  it('list preserves the full paginated envelope (reqRaw)', async () => {
    const envelope = { data: [{ id: 'i1' }], total: 42, page: 1, totalPages: 3 };
    mockFetch.mockResolvedValueOnce(mockResponse(envelope));
    const res = await itemsApi.list({ companyId: 'c1' });
    expect((res as any).data).toHaveLength(1);
    expect((res as any).total).toBe(42);
    expect((res as any).totalPages).toBe(3);
  });

  it('get calls GET /ovds/inventory/items/:id', async () => {
    const item: Item = { id: '1', name: 'Widget', code: 'W1', salePrice: 10, vatRate: 15, stock: 3, reorderLevel: 5, itemType: 'PRODUCT', status: 'ACTIVE', isActive: true } as any;
    mockFetch.mockResolvedValueOnce(mockResponse(item));
    const result = await itemsApi.get('1');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ovds/inventory/items/1');
    expect(result.id).toBe('1');
  });

  it('create sends POST with JSON body', async () => {
    const payload = { name: 'Gadget', code: 'G1', salePrice: 5, vatRate: 15, itemType: 'PRODUCT' };
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'new', ...payload }));
    const result = await itemsApi.create(payload);
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.body).toBe(JSON.stringify(payload));
    expect(result.id).toBe('new');
  });

  it('update sends PATCH /ovds/inventory/items/:id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: '1', name: 'Updated' }));
    await itemsApi.update('1', { name: 'Updated' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ovds/inventory/items/1');
    expect(opts.method).toBe('PATCH');
  });

  it('remove sends DELETE /ovds/inventory/items/:id', async () => {
    // 204 path
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => null, text: async () => '' });
    await itemsApi.remove('1');
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ovds/inventory/items/1');
    expect(opts.method).toBe('DELETE');
  });

  it('nrvWriteDown posts to the nrv-writedown sub-route', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
    await itemsApi.nrvWriteDown('1', 50, 'Below cost', 'IAS 2 note');
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ovds/inventory/items/1/nrv-writedown');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe(JSON.stringify({ nrvAmount: 50, reason: 'Below cost', notes: 'IAS 2 note' }));
  });
});

describe('itemStatsApi', () => {
  it('stats calls GET /ovds/inventory/stats', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ totalItems: 10, lowStockCount: 2, outOfStockCount: 1, categoryCount: 3 }));
    const stats = await itemStatsApi.get('company-123');
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ovds/inventory/stats?companyId=company-123');
    expect((stats as any).totalItems).toBe(10);
  });
});

describe('stockAdjustmentApi', () => {
  it('adjust posts the stock-adjustment body to /ovds/inventory/adjust', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
    await stockAdjustmentApi.adjust({ itemId: 'i1', delta: -3, reason: ' shrinkage ' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ovds/inventory/adjust');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe(JSON.stringify({ itemId: 'i1', delta: -3, reason: ' shrinkage ' }));
  });
});

describe('itemGroupsApi', () => {
  it('list calls GET /ovds/inventory/item-groups', async () => {
    const groups: ItemGroup[] = [{ id: 'g1', name: 'Raw Materials', companyId: 'c1' } as any];
    mockFetch.mockResolvedValueOnce(mockResponse(groups));
    const result = await itemGroupsApi.list('c1');
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ovds/inventory/item-groups?companyId=c1');
    expect(Array.isArray(result)).toBe(true);
    expect((result as any[])[0].id).toBe('g1');
  });

  it('create sends POST /ovds/inventory/item-groups', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'g1', name: 'X' }));
    await itemGroupsApi.create({ name: 'X', companyId: 'c1' });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ovds/inventory/item-groups');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });
});

describe('warehousesApi', () => {
  it('list calls GET /ovds/inventory/warehouses', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));
    await warehousesApi.list('c1');
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ovds/inventory/warehouses?companyId=c1');
  });
});

describe('stockMovementsApi', () => {
  it('list forwards query params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], total: 0 }));
    await stockMovementsApi.list({ companyId: 'c1', type: 'OUT' });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ovds/inventory/stock-movements?companyId=c1&type=OUT');
  });
});

describe('priceListsApi', () => {
  it('list calls GET /ovds/price-lists', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));
    await priceListsApi.list('c1');
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ovds/price-lists?companyId=c1');
  });
});

describe('catalogItemsApi (deprecated alias)', () => {
  it('adjustStock delegates to stockAdjustmentApi.adjust with an itemId body', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
    await catalogItemsApi.adjustStock('i1', -3, 'count');
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ovds/inventory/adjust');
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe(JSON.stringify({ itemId: 'i1', delta: -3, reason: 'count' }));
  });

  it('list delegates to itemsApi.list', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: [], total: 0 }));
    await catalogItemsApi.list({ companyId: 'c1' });
    expect(mockFetch.mock.calls[0][0]).toBe('/api/ovds/inventory/items?companyId=c1&page=1&limit=50');
  });
});

describe('error handling', () => {
  it('throws a parsed error message on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Item not found' }),
      text: async () => 'Item not found',
    });
    await expect(itemsApi.get('missing')).rejects.toThrow('404:');
  });
});

describe('itemsApi.lookup', () => {
  it('calls GET /ovds/inventory/items/lookup?code=...&companyId=... and returns the compact item', async () => {
    const lookup = {
      id: 'i1',
      name: 'Widget',
      code: 'W1',
      description: 'A widget',
      salePrice: 12.5,
      costPrice: 7,
      vatRate: 15,
      itemType: 'PRODUCT',
      unit: 'UNIT',
      barcode: '1234',
      imageUrl: 'http://x/i.png',
      isActive: true,
      status: 'ACTIVE',
      group: { id: 'g1', name: 'Hardware' },
      category: { id: 'c1', name: 'Products', type: 'income' },
    };
    mockFetch.mockResolvedValueOnce(mockResponse(lookup));
    const result = await itemsApi.lookup('W1', 'company-123');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/ovds/inventory/items/lookup?code=W1&companyId=company-123');
    expect(opts.method).toBe('GET');
    expect(opts.headers['x-company-id']).toBe('company-123');
    expect(result.code).toBe('W1');
    expect(result.category?.type).toBe('income');
    expect(result.group?.name).toBe('Hardware');
  });
});
