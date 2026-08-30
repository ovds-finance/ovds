import { useEffect, useCallback, RefObject } from 'react';

export const useFocusTrap = (ref: RefObject<HTMLElement | null>, isActive: boolean) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    if (e.key === 'Escape') {
      (ref.current as any)?.blur?.();
      (ref.current as HTMLElement).querySelector('button')?.focus();
    }
  }, [ref, isActive]);

  // Only auto-focus when trap becomes active (mobile overlay open)
  // Use a ref to track previous isActive to avoid re-focusing on every render
  useEffect(() => {
    if (isActive && ref.current) {
      // Small delay to let the sidebar animation start before stealing focus
      const timer = setTimeout(() => {
        if (!ref.current) return;
        // Don't steal focus if user is already focused inside the sidebar
        if (ref.current.contains(document.activeElement)) return;
        const first = ref.current.querySelector(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        first?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActive, ref]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

