/**
 * Tests for frontend/src/hooks/usePagination.ts
 * Note: .tsx extension required because we use JSX for the MemoryRouter wrapper.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { usePagination } from '@ovds/ui';

function renderWithRouter(hook: () => ReturnType<typeof usePagination>) {
  return renderHook(hook, {
    wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
  });
}

describe('usePagination()', () => {
  it('initializes with default values', () => {
    const { result } = renderWithRouter(() => usePagination());

    expect(result.current.page).toBe(1);
    expect(result.current.take).toBe(10);
    expect(result.current.total).toBe(0);
    expect(result.current.pages).toBe(1);
  });

  it('respects custom initial take', () => {
    const { result } = renderWithRouter(() =>
      usePagination({ initialTake: 25 }),
    );

    expect(result.current.take).toBe(25);
  });

  it('setTotal updates total and recalculates pages', () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 10 }));

    act(() => result.current.setTotal(95));

    expect(result.current.total).toBe(95);
    expect(result.current.pages).toBe(10); // ceil(95/10)
  });

  it('calculates pages correctly', () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 20 }));

    act(() => result.current.setTotal(100));
    expect(result.current.pages).toBe(5);

    act(() => result.current.setTotal(101));
    expect(result.current.pages).toBe(6); // ceil(101/20)
  });

  it('next() increments page', () => {
    const { result } = renderWithRouter(() => usePagination());

    act(() => result.current.setTotal(50));
    act(() => result.current.next());

    expect(result.current.page).toBe(2);
  });

  it('prev() decrements page', () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 10 }));

    act(() => result.current.setTotal(100));
    act(() => result.current.goTo(3)); // go to page 3 first
    act(() => result.current.prev());

    expect(result.current.page).toBe(2);
  });

  it('prev() does not go below page 1', () => {
    const { result } = renderWithRouter(() => usePagination({ initialPage: 1 }));

    act(() => result.current.setTotal(50));
    act(() => result.current.prev());

    expect(result.current.page).toBe(1);
  });

  it('first() goes to page 1', () => {
    const { result } = renderWithRouter(() => usePagination({ initialPage: 5 }));

    act(() => result.current.setTotal(100));
    act(() => result.current.first());

    expect(result.current.page).toBe(1);
  });

  it('last() goes to the last page', () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 10 }));

    act(() => result.current.setTotal(95));
    act(() => result.current.last());

    expect(result.current.page).toBe(10);
  });

  it('goTo() navigates to a specific page', () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 10 }));

    act(() => result.current.setTotal(100));
    act(() => result.current.goTo(7));

    expect(result.current.page).toBe(7);
  });

  it('setTake() resets to page 1', () => {
    const { result } = renderWithRouter(() =>
      usePagination({ initialPage: 5, initialTake: 10 }),
    );

    act(() => result.current.setTotal(100));
    act(() => result.current.setTake(20));

    expect(result.current.page).toBe(1);
    expect(result.current.take).toBe(20);
  });

  it('reset() returns to initial page', () => {
    const { result } = renderWithRouter(() => usePagination({ initialPage: 1 }));

    act(() => result.current.setTotal(100));
    act(() => result.current.goTo(5));
    act(() => result.current.reset());

    expect(result.current.page).toBe(1);
  });

  it('hasNext is true when not on last page', () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 10 }));

    act(() => result.current.setTotal(50));

    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrev).toBe(false);
  });

  it('hasPrev is true when not on first page', () => {
    const { result } = renderWithRouter(() =>
      usePagination({ initialTake: 10 }),
    );

    act(() => result.current.setTotal(50));
    act(() => result.current.goTo(3)); // navigate to page 3

    expect(result.current.hasPrev).toBe(true);
  });

  it('hasNext is false on last page', () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 10 }));

    act(() => result.current.setTotal(30));
    act(() => result.current.last());

    expect(result.current.hasNext).toBe(false);
    expect(result.current.hasPrev).toBe(true);
  });

  it('paginationProps contains all required fields', () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 20 }));

    act(() => result.current.setTotal(100));

    const props = result.current.paginationProps;
    expect(props.page).toBe(1);
    expect(props.take).toBe(20);
    expect(props.total).toBe(100);
    expect(props.pages).toBe(5);
    expect(typeof props.onPageChange).toBe('function');
    expect(typeof props.onTakeChange).toBe('function');
    expect(props.hasNext).toBe(true);
    expect(props.hasPrev).toBe(false);
  });

  it('auto-clamps page when total decreases', async () => {
    const { result } = renderWithRouter(() => usePagination({ initialTake: 10 }));

    act(() => result.current.setTotal(100));
    act(() => result.current.goTo(8));
    expect(result.current.page).toBe(8);

    // Total drops — only 3 pages now
    act(() => result.current.setTotal(30));

    // After the effect runs, page should be clamped to 3
    expect(result.current.page).toBeLessThanOrEqual(3);
  });
});
