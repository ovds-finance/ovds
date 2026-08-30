/**
 * PageWrapper — top-level page container.
 *
 * Provides consistent min-height, background, and responsive padding
 * for all app pages. Supports an optional `grid` prop to automatically
 * apply the OVDS responsive grid layout to the page body.
 */

import React from 'react';

export interface PageWrapperProps {
  children: React.ReactNode;
  /** Apply the standard page grid layout to the body */
  grid?: boolean;
  /** Extra CSS classes */
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  grid = false,
  className = '',
}) => (
  <div
    className={[
      'min-h-full bg-white rounded-xl overflow-hidden',
      grid ? 'ovds-grid-layout cols-auto' : '',
      className,
    ].filter(Boolean).join(' ')}
  >
    {children}
  </div>
);

export default PageWrapper;
