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
    // Safe math-only expression parser — no eval() or Function() constructor.
    // Implements operator-precedence parsing over the token stream so only
    // the characters already whitelisted above (0-9 + - * / ( ) . % space)
    // can reach the evaluator.  The Function() constructor was removed because
    // it is equivalent to eval() and violates the Content-Security-Policy
    // script-src directive (no 'unsafe-eval').
    const result = parseMathExpr(sanitized);
    if (typeof result !== 'number' || !isFinite(result)) {
      return { value: null, error: 'invalid' };
    }
    return { value: Math.round(result * 100) / 100, error: null };
  } catch {
    return { value: null, error: 'invalid' };
  }
}

// ── Operator-precedence math parser ──────────────────────────────────────────
// Grammar (EBNF):
//   expr   = term   { ('+' | '-') term }
//   term   = factor { ('*' | '/') factor }
//   factor = unary  [ '%' ]        <- percent postfix (value / 100)
//   unary  = '-' unary | primary
//   primary = number | '(' expr ')'
//
// Supports: integers, decimals, +, -, *, /, (, ), unary minus, % postfix.

function parseMathExpr(src: string): number {
  let pos = 0;

  function peek(): string { return src[pos] ?? ''; }
  function eat(): string  { return src[pos++] ?? ''; }
  function skipWs(): void { while (src[pos] === ' ') pos++; }

  function parseExpr(): number {
    skipWs();
    let left = parseTerm();
    skipWs();
    while (peek() === '+' || peek() === '-') {
      const op = eat();
      skipWs();
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
      skipWs();
    }
    return left;
  }

  function parseTerm(): number {
    skipWs();
    let left = parseFactor();
    skipWs();
    while (peek() === '*' || peek() === '/') {
      const op = eat();
      skipWs();
      const right = parseFactor();
      if (op === '/' && right === 0) throw new Error('Division by zero');
      left = op === '*' ? left * right : left / right;
      skipWs();
    }
    return left;
  }

  function parseFactor(): number {
    skipWs();
    let val = parseUnary();
    skipWs();
    if (peek() === '%') { eat(); val = val / 100; }
    return val;
  }

  function parseUnary(): number {
    skipWs();
    if (peek() === '-') { eat(); skipWs(); return -parseUnary(); }
    if (peek() === '+') { eat(); skipWs(); return parseUnary(); }
    return parsePrimary();
  }

  function parsePrimary(): number {
    skipWs();
    if (peek() === '(') {
      eat(); // consume '('
      const val = parseExpr();
      skipWs();
      if (peek() !== ')') throw new Error('Missing closing parenthesis');
      eat(); // consume ')'
      return val;
    }
    // Parse number (integer or decimal)
    const start = pos;
    while (/[0-9.]/.test(peek())) eat();
    const numStr = src.slice(start, pos);
    if (!numStr) throw new Error(`Unexpected character: "${peek()}"`);
    const num = parseFloat(numStr);
    if (isNaN(num)) throw new Error(`Invalid number: "${numStr}"`);
    return num;
  }

  const result = parseExpr();
  skipWs();
  if (pos < src.length) throw new Error(`Unexpected token at position ${pos}: "${src[pos]}"`);
  return result;
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
  const [qtyRaw, _setQtyRaw] = useState(String(quantity));
  const [priceRaw, _setPriceRaw] = useState(String(price));
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
