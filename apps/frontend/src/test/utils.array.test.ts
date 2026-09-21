/**
 * Tests for frontend/src/utils/array.ts
 * Covers safe array extraction from OVDS API response shapes.
 */
import { describe, it, expect } from 'vitest';

import { toArray, unwrapArray, unwrapNestedArray } from '../utils/array';

// -- toArray() -----------------------------------------------------------------
describe('toArray()', () => {
  it('returns the array unchanged', () => {
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('returns [] for null', () => {
    expect(toArray(null)).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(toArray(undefined)).toEqual([]);
  });

  it('returns [] for a plain object', () => {
    expect(toArray({ a: 1 })).toEqual([]);
  });

  it('returns [] for a string', () => {
    expect(toArray('hello')).toEqual([]);
  });

  it('returns [] for a number', () => {
    expect(toArray(42)).toEqual([]);
  });

  it('returns empty array unchanged', () => {
    expect(toArray([])).toEqual([]);
  });
});

// -- unwrapArray() -------------------------------------------------------------
describe('unwrapArray()', () => {
  it('unwraps paginated response: res.data.data.data', () => {
    const res = { data: { data: { data: [1, 2, 3], pagination: {} } } };
    expect(unwrapArray(res)).toEqual([1, 2, 3]);
  });

  it('unwraps wrapped array: res.data.data', () => {
    const res = { data: { data: [1, 2, 3] } };
    expect(unwrapArray(res)).toEqual([1, 2, 3]);
  });

  it('unwraps direct array: res.data', () => {
    const res = { data: [1, 2, 3] };
    expect(unwrapArray(res)).toEqual([1, 2, 3]);
  });

  it('returns [] for null response', () => {
    expect(unwrapArray(null)).toEqual([]);
  });

  it('returns [] for undefined response', () => {
    expect(unwrapArray(undefined)).toEqual([]);
  });

  it('returns [] for empty object', () => {
    expect(unwrapArray({})).toEqual([]);
  });

  it('returns [] when data is a non-array object', () => {
    const res = { data: { message: 'ok' } };
    expect(unwrapArray(res)).toEqual([]);
  });

  it('handles real-world employee list response shape', () => {
    const res = {
      data: {
        data: [
          { id: 'emp-1', firstName: 'Abebe' },
          { id: 'emp-2', firstName: 'Tigist' },
        ],
        pagination: { page: 1, take: 20, total: 2 },
      },
    };
    const result = unwrapArray(res);
    expect(result).toHaveLength(2);
    expect(result[0].firstName).toBe('Abebe');
  });
});

// -- unwrapNestedArray() -------------------------------------------------------
describe('unwrapNestedArray()', () => {
  it('unwraps from res.data.data[key]', () => {
    const res = { data: { data: { bills: [{ id: 'b1' }] } } };
    expect(unwrapNestedArray(res, 'bills')).toEqual([{ id: 'b1' }]);
  });

  it('unwraps from res.data[key]', () => {
    const res = { data: { invoices: [{ id: 'inv-1' }] } };
    expect(unwrapNestedArray(res, 'invoices')).toEqual([{ id: 'inv-1' }]);
  });

  it('falls back to res.data.data when key not found', () => {
    const res = { data: { data: [1, 2, 3] } };
    expect(unwrapNestedArray(res, 'missing')).toEqual([1, 2, 3]);
  });

  it('falls back to res.data when nothing else matches', () => {
    const res = { data: [1, 2, 3] };
    expect(unwrapNestedArray(res, 'missing')).toEqual([1, 2, 3]);
  });

  it('returns [] for null response', () => {
    expect(unwrapNestedArray(null, 'items')).toEqual([]);
  });

  it('returns [] when key does not exist and no fallback', () => {
    const res = { data: { message: 'ok' } };
    expect(unwrapNestedArray(res, 'items')).toEqual([]);
  });
});

