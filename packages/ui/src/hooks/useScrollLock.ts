/**
 * useScrollLock — prevent body scroll when a modal/drawer/overlay is open.
 *
 * Correctly handles:
 * - Saving and restoring scroll position (prevents jump)
 * - Multiple concurrent locks (reference-counted — last unlock restores scroll)
 * - iOS Safari momentum scroll fix (position: fixed)
 * - Scrollbar-width compensation (prevents layout shift)
 *
 * Usage:
 *   const { lock, unlock, isLocked } = useScrollLock();
 *
 *   useEffect(() => {
 *     if (isOpen) lock();
 *     else unlock();
 *     return () => unlock();
 *   }, [isOpen]);
 *
 * Or the simple boolean form:
 *   useScrollLock(isOpen);   // auto locks/unlocks with the boolean
 */
import { useEffect, useCallback, useRef } from 'react';

// Global reference count — supports multiple concurrent locks
let lockCount = 0;
let savedScrollY = 0;
let savedPaddingRight = '';

function applyLock() {
  if (lockCount++ > 0) return; // already locked
  if (typeof document === 'undefined') return;

  const body = document.body;
  savedScrollY       = window.scrollY;
  savedPaddingRight  = body.style.paddingRight;

  // Compensate for scrollbar disappearing (prevents layout shift)
  const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarW > 0) {
    body.style.paddingRight = `${scrollbarW}px`;
  }

  // iOS Safari fix: use position:fixed to truly prevent scroll
  body.style.overflow  = 'hidden';
  body.style.position  = 'fixed';
  body.style.top       = `-${savedScrollY}px`;
  body.style.width     = '100%';
}

function releaseLock() {
  if (--lockCount > 0) return; // still locked by another caller
  lockCount = Math.max(0, lockCount); // never go negative
  if (typeof document === 'undefined') return;

  const body = document.body;
  body.style.overflow     = '';
  body.style.position     = '';
  body.style.top          = '';
  body.style.width        = '';
  body.style.paddingRight = savedPaddingRight;

  // Restore scroll position
  window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
}

// -- Simple boolean form -------------------------------------------------------

/**
 * When called with a boolean, automatically locks on `true` and unlocks on `false`.
 * Cleans up on unmount.
 */
export function useScrollLock(locked?: boolean): void {
  const wasLocked = useRef(false);

  useEffect(() => {
    if (locked === undefined) return;
    if (locked && !wasLocked.current) {
      applyLock();
      wasLocked.current = true;
    } else if (!locked && wasLocked.current) {
      releaseLock();
      wasLocked.current = false;
    }
    return () => {
      if (wasLocked.current) {
        releaseLock();
        wasLocked.current = false;
      }
    };
  }, [locked]);
}

// -- Imperative form -----------------------------------------------------------

export interface UseScrollLockControls {
  lock: () => void;
  unlock: () => void;
  isLocked: boolean;
}

/**
 * Returns imperative `lock()` / `unlock()` controls.
 * Automatically releases on unmount.
 */
export function useScrollLockControls(): UseScrollLockControls {
  const isLocked = useRef(false);

  const lock = useCallback(() => {
    if (!isLocked.current) {
      applyLock();
      isLocked.current = true;
    }
  }, []);

  const unlock = useCallback(() => {
    if (isLocked.current) {
      releaseLock();
      isLocked.current = false;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (isLocked.current) {
        releaseLock();
        isLocked.current = false;
      }
    };
  }, []);

  return { lock, unlock, isLocked: isLocked.current };
}
