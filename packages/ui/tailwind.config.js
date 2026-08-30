/**
 * @ovds/ui — canonical Tailwind CSS configuration.
 *
 * This is the single base config that apps/frontend and apps/portal extend.
 * Theme values are intentionally minimal here; runtime colors come from the
 * CSS custom properties in packages/ui/src/styles/tokens.css (exposed as
 * Tailwind color utilities below). Edit tokens.css for the actual palette.
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
    // Shared UI library sources so Tailwind purges correctly
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/styles/**/*.css',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        'aki-blue': 'var(--aki-blue)',
        'aki-blue-dark': 'var(--aki-blue-dark)',
        'aki-blue-light': 'var(--aki-blue-light)',
        'aki-indigo': 'var(--aki-indigo)',
        'aki-indigo-dark': 'var(--aki-indigo-dark)',
        'aki-green': 'var(--aki-green)',
        'aki-amber': 'var(--aki-amber)',
        'aki-err': 'var(--aki-err)',
        // Multi-surface system (light/dark aware)
        'sys-bg-base': 'var(--sys-bg-base)',
        'sys-bg-surface': 'var(--sys-bg-surface)',
        'sys-bg-surface-elevated': 'var(--sys-bg-surface-elevated)',
        'sys-bg-overlay': 'var(--sys-bg-overlay)',
        'sys-border-base': 'var(--sys-border-base)',
        'sys-border-surface': 'var(--sys-border-surface)',
        'sys-border-elevated': 'var(--sys-border-elevated)',
        'sys-text-primary': 'var(--sys-text-primary)',
        'sys-text-secondary': 'var(--sys-text-secondary)',
        'sys-text-muted': 'var(--sys-text-muted)',
        'sys-brand-primary': 'var(--sys-brand-primary)',
        'sys-brand-primary-text': 'var(--sys-brand-primary-text)',
        'sys-state-success': 'var(--sys-state-success)',
        'sys-state-success-text': 'var(--sys-state-success-text)',
        'sys-state-alert': 'var(--sys-state-alert)',
        'sys-state-alert-text': 'var(--sys-state-alert-text)',
        'sys-state-critical': 'var(--sys-state-critical)',
        'sys-state-critical-text': 'var(--sys-state-critical-text)',
        // Legacy ovds aliases
        'ovds-primary': 'var(--ovds-primary)',
        'ovds-primary-dark': 'var(--ovds-primary-dark)',
        'ovds-primary-light': 'var(--ovds-primary-light)',
        'ovds-sidebar': 'var(--ovds-sidebar)',
        'ovds-background': 'var(--ovds-background)',
        'ovds-surface': 'var(--ovds-surface)',
        'ovds-surface-dark': 'var(--ovds-surface-dark)',
        'ovds-border': 'var(--ovds-border)',
        'ovds-muted': 'var(--ovds-muted)',
        'ovds-text-main': 'var(--ovds-text-main)',
        'ovds-text-muted': 'var(--ovds-text-muted)',
        'ovds-text-subtle': 'var(--ovds-text-subtle)',
        'ovds-success': 'var(--ovds-success)',
        'ovds-warning': 'var(--ovds-warning)',
        'ovds-danger': 'var(--ovds-danger)',
        'ovds-info': 'var(--ovds-info)',
        'ovds-accent': 'var(--ovds-accent)',
      },
      fontFamily: {
        sans: 'var(--font)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
};
