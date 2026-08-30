import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MATH_RE = /^[0-9+\-*/().\s]+$/;

export function evalMath(expr: string): number | null {
  const raw = String(expr).trim();
  if (!raw || !MATH_RE.test(raw)) return null;
  if (!/[0-9]/.test(raw)) return null;
  const sanitized = raw.replace(/[^0-9+\-*/().]/g, "");
  if (!sanitized) return null;
  try {
    const result = new Function(`"use strict"; return (${sanitized})`)();
    if (typeof result === "number" && Number.isFinite(result)) return result;
    return null;
  } catch {
    return null;
  }
}

export function formatCurrency(value: number, currency = "ETB") {
  return `${currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number, decimals = 2) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
