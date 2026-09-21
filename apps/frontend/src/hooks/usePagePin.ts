/**
 * usePagePin — Ovds-style star-to-favorites for any feature page.
 *
 * Reads from the same `sidebar_favorites_v2` localStorage key that the
 * sidebar uses, so pinning from a page header instantly reflects in the
 * sidebar favorites strip and vice-versa.
 *
 * Usage:
 *   const { pinned, toggle } = usePagePin('/iot', 'IoT Hub');
 *
 *   <button onClick={toggle}>
 *     <StarIcon filled={pinned} />
 *   </button>
 */
import { useLocalStorage } from '@ovds/ui';
import { useCallback } from 'react';

export interface PagePinItem {
  to: string;
  label: string;
  icon?: string;
}

export function usePagePin(to: string, _label: string, _icon?: string) {
  const [pinned, setPinned] = useLocalStorage<string[]>('sidebar_favorites_v2', []);

  const isPinned = pinned.includes(to);

  const toggle = useCallback(() => {
    setPinned(prev =>
      prev.includes(to)
        ? prev.filter(r => r !== to)
        : [...prev, to],
    );
  }, [to, setPinned]);

  const pin   = useCallback(() => setPinned(prev => prev.includes(to) ? prev : [...prev, to]), [to, setPinned]);
  const unpin = useCallback(() => setPinned(prev => prev.filter(r => r !== to)), [to, setPinned]);

  return { pinned: isPinned, toggle, pin, unpin };
}
