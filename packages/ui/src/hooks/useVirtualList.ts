/**
 * useVirtualList — efficient virtual scrolling for large lists.
 *
 * Renders only the items visible in the viewport + overscan buffer,
 * keeping DOM nodes minimal regardless of total item count.
 *
 * Works with fixed-height rows (variable height requires measuring —
 * see the `estimatedItemHeight` option for approximate support).
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { visibleItems, totalHeight, offsetTop } = useVirtualList({
 *     items: invoices,
 *     itemHeight: 56,
 *     containerRef,
 *   });
 *
 *   <div ref={containerRef} style={{ height: '500px', overflowY: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetTop}px)` }}>
 *         {visibleItems.map(({ item, index }) => (
 *           <InvoiceRow key={item.id} item={item} index={index} />
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 */
import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';

export interface VirtualListOptions<T> {
  items: T[];
  /** Fixed height of each item in pixels */
  itemHeight: number;
  /** Ref to the scroll container element */
  containerRef: RefObject<HTMLElement | null>;
  /** Extra items to render above and below the visible window (default: 3) */
  overscan?: number;
}

export interface VirtualListResult<T> {
  /** Items currently in the render window (visible + overscan) */
  visibleItems: Array<{ item: T; index: number }>;
  /** Total height of all items — set as the inner container height */
  totalHeight: number;
  /** Pixel offset from top — apply as translateY to the visible items wrapper */
  offsetTop: number;
  /** Index of the first visible item */
  startIndex: number;
  /** Index of the last visible item */
  endIndex: number;
  /** Scroll to a specific item index */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
}

export function useVirtualList<T>({
  items,
  itemHeight,
  containerRef,
  overscan = 3,
}: VirtualListOptions<T>): VirtualListResult<T> {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const rafRef = useRef<number | null>(null);

  const totalHeight = items.length * itemHeight;

  // Observe container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height ?? el.clientHeight;
      setContainerHeight(h);
    });
    ro.observe(el);
    setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, [containerRef]);

  // Listen to scroll events with RAF throttle
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(el.scrollTop);
        rafRef.current = null;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  // Compute visible window
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({ item: items[i], index: i });
  }

  const offsetTop = startIndex * itemHeight;

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ top: index * itemHeight, behavior });
    },
    [containerRef, itemHeight],
  );

  return { visibleItems, totalHeight, offsetTop, startIndex, endIndex, scrollToIndex };
}
