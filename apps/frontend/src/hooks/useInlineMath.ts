import { useState, useCallback, useEffect, useRef } from 'react';

type MathError = 'invalid' | 'overflow' | null;

function safeEval(expr: string): { value: number | null; error: MathError } {
  const sanitized = expr
    .replace(/[^0-9+\-*/().%\s]/g, '')
    .trim();

  if (!sanitized) {
    return { value: null, error: null };
  }

  if (!/^[0-9+\-*/().%\s]+$/.test(sanitized)) {
    return { value: null, error: 'invalid' };
  }

  try {
    const result = Function('"use strict"; return (' + sanitized + ')')();
    if (typeof result !== 'number' || !isFinite(result)) {
      return { value: null, error: 'invalid' };
    }
    return { value: Math.round(result * 100) / 100, error: null };
  } catch {
    return { value: null, error: 'invalid' };
  }
}

export function useInlineMath(initialValue: number | string = 0) {
  const [raw, setRaw] = useState<string>(
    typeof initialValue === 'number' ? String(initialValue) : initialValue,
  );
  const [computed, setComputed] = useState<number | null>(() => {
    if (typeof initialValue === 'number') return initialValue;
    const result = safeEval(initialValue);
    return result.value;
  });
  const [error, setError] = useState<MathError>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const evaluate = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setComputed(null);
      setError(null);
      return;
    }

    const result = safeEval(trimmed);
    if (result.error) {
      setError(result.error);
      setComputed(null);
    } else {
      setError(null);
      setComputed(result.value);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setRaw(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => evaluate(value), 300);
    },
    [evaluate],
  );

  const handleBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    evaluate(raw);
  }, [evaluate, raw]);

  const reset = useCallback((value: number | string) => {
    const str = typeof value === 'number' ? String(value) : value;
    setRaw(str);
    if (typeof value === 'number') {
      setComputed(value);
      setError(null);
    } else {
      const result = safeEval(str);
      setError(result.error);
      setComputed(result.value);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    raw,
    computed,
    error,
    setRaw: handleChange,
    onBlur: handleBlur,
    reset,
    isValid: !error && raw.trim() !== '',
  };
}

export function useSmartQuantity(
  quantity: number,
  price: number,
  onChange: (qty: number, price: number, total: number) => void,
) {
  const [qtyRaw, setQtyRaw] = useState(String(quantity));
  const [priceRaw, setPriceRaw] = useState(String(price));
  const qtyMath = useInlineMath(quantity);
  const priceMath = useInlineMath(price);

  useEffect(() => {
    const qty = qtyMath.computed ?? quantity;
    const prc = priceMath.computed ?? price;
    const total = Math.round(qty * prc * 100) / 100;
    onChange(qty, prc, total);
  }, [qtyMath.computed, priceMath.computed, quantity, price, onChange]);

  return {
    qtyRaw,
    setQtyRaw: qtyMath.setRaw,
    qtyOnBlur: qtyMath.onBlur,
    qtyError: qtyMath.error,
    priceRaw,
    setPriceRaw: priceMath.setRaw,
    priceOnBlur: priceMath.onBlur,
    priceError: priceMath.error,
  };
}
