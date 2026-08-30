/**
 * Tests for useBladeState — Akaunting-style deterministic async state machine.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBladeState } from '../hooks/useBladeState';

describe('useBladeState()', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('starts in idle state with initial data', () => {
    const { result } = renderHook(() => useBladeState<string>('initial'));
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.data).toBe('initial');
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('starts in idle state with null initial data', () => {
    const { result } = renderHook(() => useBladeState<number>(null));
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.data).toBeNull();
  });

  it('transitions to loading when run is called', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('data'), 100);
    });
    const { result } = renderHook(() => useBladeState<string>(null));

    const runPromise = result.current.run(promise);

    await act(async () => {
      await vi.advanceTimersByTime(0);
    });

    expect(result.current.state.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTime(100);
      await runPromise;
    });

    expect(result.current.state.status).toBe('success');
    expect(result.current.state.data).toBe('data');
    expect(result.current.isSuccess).toBe(true);
  });

  it('transitions to error on rejection', async () => {
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('fetch failed')), 50);
    });
    const { result } = renderHook(() => useBladeState<string>(null));

    const runPromise = result.current.run(promise);

    await act(async () => {
      await vi.advanceTimersByTime(0);
    });

    expect(result.current.state.status).toBe('loading');

    await act(async () => {
      await vi.advanceTimersByTime(50);
      try {
        await runPromise;
      } catch {
        // expected
      }
    });

    expect(result.current.state.status).toBe('error');
    expect(result.current.state.error?.message).toBe('fetch failed');
    expect(result.current.state.error?.statusCode).toBe(500);
    expect(result.current.isError).toBe(true);
  });

  it('preserves previous data on error', async () => {
    const { result } = renderHook(() => useBladeState<string>('previous'));

    await act(async () => {
      try {
        await result.current.run(Promise.reject(new Error('fail')));
      } catch {
        // expected
      }
    });

    expect(result.current.state.status).toBe('error');
    expect(result.current.state.data).toBe('previous');
  });

  it('resets to idle state', async () => {
    const { result } = renderHook(() => useBladeState<string>(null));

    await act(async () => {
      await result.current.run(Promise.resolve('data'));
    });

    expect(result.current.state.status).toBe('success');

    act(() => result.current.reset());

    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.data).toBeNull();
    expect(result.current.state.error).toBeNull();
    expect(result.current.isIdle).toBe(true);
  });

  it('supports manual setLoading', () => {
    const { result } = renderHook(() => useBladeState<string>('data'));
    act(() => result.current.setLoading());
    expect(result.current.state.status).toBe('loading');
    expect(result.current.state.data).toBe('data');
  });

  it('supports manual setSuccess', () => {
    const { result } = renderHook(() => useBladeState<string>(null));
    act(() => result.current.setSuccess('new-data'));
    expect(result.current.state.status).toBe('success');
    expect(result.current.state.data).toBe('new-data');
  });

  it('supports manual setError', () => {
    const { result } = renderHook(() => useBladeState<string>(null));
    act(() => result.current.setError({ message: 'manual error', statusCode: 400 }));
    expect(result.current.state.status).toBe('error');
    expect(result.current.state.error?.message).toBe('manual error');
  });

  it('extracts status code and requestId from thrown errors', async () => {
    const error = new Error('validation failed') as any;
    error.statusCode = 422;
    error.requestId = 'req-123';
    error.fields = { name: 'required' };

    const { result } = renderHook(() => useBladeState<string>(null));

    await act(async () => {
      try {
        await result.current.run(Promise.reject(error));
      } catch {
        // expected
      }
    });

    expect(result.current.state.error?.statusCode).toBe(422);
    expect(result.current.state.error?.requestId).toBe('req-123');
    expect(result.current.state.error?.fields).toEqual({ name: 'required' });
  });
});
