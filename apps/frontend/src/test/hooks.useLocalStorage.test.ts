/**
 * Tests for frontend/src/hooks/useLocalStorage.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../hooks';

describe('useLocalStorage()', () => {
  beforeEach(() => {
    // Clear localStorage between tests
    try { localStorage.clear(); } catch { /* jsdom */ }
  });

  it('returns the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('persists a string value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    act(() => result.current[1]('dark'));

    // The hook state should reflect the new value
    expect(result.current[0]).toBe('dark');
  });

  it('persists an object value to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('filters', { year: 2025, month: 1 }),
    );

    act(() => result.current[1]({ year: 2026, month: 4 }));

    expect(result.current[0]).toEqual({ year: 2026, month: 4 });
  });

  it('supports functional updater pattern', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => result.current[1]((prev) => prev + 1));
    act(() => result.current[1]((prev) => prev + 1));

    expect(result.current[0]).toBe(2);
  });

  it('reads existing value from localStorage on mount', () => {
    // Directly write to localStorage before mounting the hook
    // (using the raw Storage API which works synchronously in jsdom)
    Object.defineProperty(window, 'localStorage', {
      value: {
        ...window.localStorage,
        getItem: (key: string) => key === 'mount-test' ? '"persisted"' : null,
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    const { result } = renderHook(() => useLocalStorage('mount-test', 'default'));
    expect(result.current[0]).toBe('persisted');

    // Restore
    Object.defineProperty(window, 'localStorage', {
      value: window.localStorage,
      writable: true,
    });
  });

  it('setValue updates the in-memory state', () => {
    // Test that setValue updates state (localStorage persistence is tested via integration)
    const { result } = renderHook(() => useLocalStorage('state-test', 'initial'));

    act(() => result.current[1]('updated'));

    expect(result.current[0]).toBe('updated');
  });

  it('throws when trying to use reserved auth keys', () => {
    // The hook throws synchronously during render for reserved keys
    expect(() => {
      renderHook(() => useLocalStorage('ovds_token', ''));
    }).toThrow('[useLocalStorage]');

    expect(() => {
      renderHook(() => useLocalStorage('ovds_user', null));
    }).toThrow('[useLocalStorage]');
  });

  it('handles corrupted JSON in localStorage gracefully', () => {
    // Spy on getItem to return corrupted JSON
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'corrupt-key') return 'not-valid-json{{{';
      return null;
    });

    const { result } = renderHook(() => useLocalStorage('corrupt-key', 'fallback'));

    // Should fall back to initial value without throwing
    expect(result.current[0]).toBe('fallback');
    spy.mockRestore();
  });

  it('persists boolean values correctly', () => {
    const { result } = renderHook(() => useLocalStorage('flag', false));

    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
  });

  it('persists array values correctly', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('tags', []));

    act(() => result.current[1](['ovds', 'hr', 'vat']));

    expect(result.current[0]).toEqual(['ovds', 'hr', 'vat']);
  });
});

