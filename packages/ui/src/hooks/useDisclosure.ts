/**
 * useDisclosure — manages open/closed state for modals, drawers, popovers.
 *
 * Provides a consistent API across all overlay components.
 *
 * Usage:
 *   const { isOpen, open, close, toggle } = useDisclosure();
 *   const drawerWithId = useDisclosure<string>(); // typed payload
 *   drawerWithId.open('invoice-123');
 *   drawerWithId.data // → 'invoice-123'
 */
import { useState, useCallback } from 'react';

export interface Disclosure {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
  toggle: () => void;
}

export interface DisclosureWithData<T> {
  isOpen: boolean;
  data:   T | null;
  open:   (data?: T) => void;
  close:  () => void;
  toggle: (data?: T) => void;
}

/** Simple open/closed toggle — no payload */
export function useDisclosure(defaultOpen = false): Disclosure {
  const [isOpen, setOpen] = useState(defaultOpen);
  const open   = useCallback(() => setOpen(true), []);
  const close  = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen(v => !v), []);
  return { isOpen, open, close, toggle };
}

/** Open/closed toggle that carries a typed data payload */
export function useDisclosureWithData<T>(defaultOpen = false): DisclosureWithData<T> {
  const [isOpen, setOpen] = useState(defaultOpen);
  const [data,   setData] = useState<T | null>(null);

  const open = useCallback((payload?: T) => {
    if (payload !== undefined) setData(payload);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Delay data reset to allow close animations to complete
    setTimeout(() => setData(null), 300);
  }, []);

  const toggle = useCallback((payload?: T) => {
    if (payload !== undefined) setData(payload);
    setOpen(v => !v);
  }, []);

  return { isOpen, data, open, close, toggle };
}
