/**
 * Tests for frontend/src/lib/utils.ts
 * cn() — Tailwind class merging utility
 */
import { describe, it, expect } from 'vitest';

import { cn } from '../lib/utils';

describe('cn()', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-sm')).toBe('text-sm');
  });

  it('merges multiple classes', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    // tailwind-merge: text-sm overrides text-lg
    expect(cn('text-lg', 'text-sm')).toBe('text-sm');
  });

  it('handles conditional classes (falsy values ignored)', () => {
    const condition = false;
    expect(cn('base', condition && 'ignored', undefined, null, 'added')).toBe('base added');
  });

  it('handles object syntax from clsx', () => {
    expect(cn({ 'text-rose-500': true, 'text-green-500': false })).toBe('text-rose-500');
  });

  it('handles array syntax', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('merges padding conflicts correctly', () => {
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
    // px-2 overrides the x-axis padding from p-4
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });
});

