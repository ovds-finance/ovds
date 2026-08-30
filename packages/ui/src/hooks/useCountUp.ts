/**
 * useCountUp — animates a numeric value from 0 to `target` over `duration` ms.
 * Returns the current display value as a string, preserving the original format.
 */
import { useEffect, useRef, useState } from 'react';

function parseNumeric(value: string | number): {
  prefix: string;
  num: number;
  suffix: string;
  decimals: number;
} {
  // Guard: if value is an object/array/null, fall back to '0' to avoid
  // "Cannot convert object to primitive value" crash
  if (value === null || value === undefined || (typeof value === 'object')) {
    return { prefix: '', num: 0, suffix: '', decimals: 0 };
  }
  const str = String(value);
  // Match optional prefix (non-digit/dot), number, optional suffix
  const match = str.match(/^([^0-9]*)([0-9,]+\.?[0-9]*)(.*)$/);
  if (!match) return { prefix: '', num: 0, suffix: str, decimals: 0 };
  const raw = match[2].replace(/,/g, '');
  const num = parseFloat(raw);
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  return {
    prefix: match[1],
    num: isNaN(num) ? 0 : num,
    suffix: match[3],
    decimals,
  };
}

export function useCountUp(value: string | number, duration = 800): string {
  const { prefix, num, suffix, decimals } = parseNumeric(value);
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const prevNumRef = useRef(0);

  useEffect(() => {
    const from = prevNumRef.current;
    const to = num;
    prevNumRef.current = to;

    if (from === to) {
      setDisplay(to);
      return;
    }

    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [num, duration]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${prefix}${formatted}${suffix}`;
}
