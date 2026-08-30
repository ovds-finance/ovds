/** True when JWT is delivered via httpOnly cookie (not localStorage) */
export function isHttpOnlyAuth(): boolean {
  return import.meta.env.VITE_USE_HTTPONLY_TOKEN === 'true';
}

export function getCsrfToken(): string | null {
  try {
    return sessionStorage.getItem('ovds_csrf');
  } catch {
    return null;
  }
}

export function setCsrfToken(token: string | undefined | null): void {
  try {
    if (token) sessionStorage.setItem('ovds_csrf', token);
    else sessionStorage.removeItem('ovds_csrf');
  } catch {
    /* ignore */
  }
}

export function clearCsrfToken(): void {
  setCsrfToken(null);
}

export function isValidEthiopianTin(tin: string): boolean {
  if (typeof tin !== 'string') return false;
  const cleaned = tin.replace(/\s/g, '');
  return /^\d{10}$/.test(cleaned);
}
