/**
 * useAnimatedValue — smoothly animates a numeric value from 0 to target on mount,
 * and re-animates when the value changes.
 *
 * Usage:
 *   const displayed = useAnimatedValue(healthScore.overall, { duration: 900 });
 */
import { useState, useEffect, useRef } from 'react';

interface Options {
  duration?: number;
  easing?: (t: number) => number;
  decimals?: number;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function useAnimatedValue(
  target: number,
  { duration = 700, easing = easeOut, decimals = 0 }: Options = {},
): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const current = fromRef.current + (target - fromRef.current) * easedProgress;
      setValue(parseFloat(current.toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, decimals]);

  return value;
}
