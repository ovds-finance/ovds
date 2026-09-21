/**
 * FullPageShell
 *
 * The default layout mode for routes with handle.layout === 'table' (or no
 * handle at all). It is intentionally transparent — it simply renders its
 * children with no additional chrome. The Layout component already provides
 * the sidebar, header, tab-bar, and footer.
 */
import React from 'react';

interface FullPageShellProps {
  children: React.ReactNode;
}

export const FullPageShell: React.FC<FullPageShellProps> = ({ children }) => (
  <>{children}</>
);
