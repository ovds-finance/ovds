import { estimatesApi } from '@ovds/features/accounting';
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Cat 8 — Frontend API Client Method Name Aliases (estimatesApi)
 *
 * These tests confirm the FIX is in place (task 10.1).
 * After fix: estimatesApi.delete and estimatesApi.convert exist as aliases.
 *
 * Validates: Requirements 8.1, 8.2, 3.3, 3.4
 */


// Stub browser globals absent in the Node test environment
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
  vi.stubGlobal('sessionStorage', {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: null }),
    text: async () => '',
  }));
});

describe('Fix Verified: estimatesApi aliases (Cat 8)', () => {
  it('FIX VERIFIED: estimatesApi.delete alias now exists', () => {
    expect(typeof (estimatesApi as any).delete).toBe('function');
    expect(typeof estimatesApi.remove).toBe('function');
  });

  it('FIX VERIFIED: estimatesApi.convert alias now exists', () => {
    expect(typeof (estimatesApi as any).convert).toBe('function');
    expect(typeof estimatesApi.convertToInvoice).toBe('function');
  });

  it('FIX VERIFIED: estimatesApi.delete("id") resolves without TypeError', async () => {
    await expect((estimatesApi as any).delete('test-id')).resolves.toBeDefined();
  });

  it('FIX VERIFIED: estimatesApi.convert("id") resolves without TypeError', async () => {
    await expect((estimatesApi as any).convert('test-id')).resolves.toBeDefined();
  });

  it('PRESERVATION: existing estimatesApi.remove and estimatesApi.convertToInvoice work', () => {
    expect(typeof estimatesApi.remove).toBe('function');
    expect(typeof estimatesApi.convertToInvoice).toBe('function');
  });

  it('PRESERVATION: all CRUD methods remain intact', () => {
    expect(typeof estimatesApi.list).toBe('function');
    expect(typeof estimatesApi.get).toBe('function');
    expect(typeof estimatesApi.create).toBe('function');
    expect(typeof estimatesApi.update).toBe('function');
    expect(typeof estimatesApi.remove).toBe('function');
    expect(typeof estimatesApi.send).toBe('function');
    expect(typeof estimatesApi.convertToInvoice).toBe('function');
    expect(typeof estimatesApi.stats).toBe('function');
    expect(typeof estimatesApi.nextNumber).toBe('function');
  });
});
