/**
 * useRouteUITitle
 *
 * Lets a page component imperatively declare its own title — without having
 * to add an entry to the Layout's `routeTitleMap` or the RouteHandle.
 *
 * How it works:
 *   1. This hook fires a custom `ovds:route-title` CustomEvent on the window
 *      with the title string as `event.detail.title`.
 *   2. `layout.tsx` listens for that event and overrides `activePageTitle`
 *      with the received value until the next route change.
 *
 * This is useful for:
 *   - Dynamic titles that include record data  (e.g. "Invoice #INV-1042")
 *   - Pages shared across modes where the title differs per context
 *   - Quick overrides without modifying the global routeTitleMap
 *
 * @example
 * ```tsx
 * // Inside any page component:
 * useRouteUITitle(`Invoice #${invoice.number}`);
 *
 * // With a loading state — only fires once the title is available:
 * useRouteUITitle(invoice ? `Invoice #${invoice.number}` : null);
 * ```
 *
 * @param title  The title string to broadcast, or null/undefined to skip.
 */
import { useEffect } from 'react';

export const ROUTE_TITLE_EVENT = 'ovds:route-title' as const;

export interface RouteTitleEventDetail {
  title: string;
}

export function useRouteUITitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return;
    window.dispatchEvent(
      new CustomEvent<RouteTitleEventDetail>(ROUTE_TITLE_EVENT, {
        detail: { title },
        bubbles: false,
        cancelable: false,
      }),
    );
  }, [title]);
}
