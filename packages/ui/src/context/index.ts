/**
 * @ovds/ui/context — lightweight sub-path export.
 *
 * Import ThemeProvider and useTheme from here instead of the full barrel
 * when you only need theme context. This avoids triggering transformation
 * of the entire @ovds/ui module graph in Vite dev mode.
 *
 * Usage:
 *   import { ThemeProvider, useTheme } from '@ovds/ui/context';
 */
export { ThemeProvider, useTheme } from './ThemeContext';
export type { ThemeContextValue } from './ThemeContext';
