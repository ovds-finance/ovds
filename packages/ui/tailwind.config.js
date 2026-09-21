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
        // ── Brand green palette (primary — CTAs, buttons, nav markers, links) ──
        'pro-green':          'var(--pro-green)',
        'pro-green-dark':     'var(--pro-green-dark)',
        'pro-green-light':    'var(--pro-green-light)',
        'pro-green-50':       'var(--pro-green-50)',
        'pro-green-100':      'var(--pro-green-100)',
        'pro-green-200':      'var(--pro-green-200)',
        'pro-green-600':      'var(--pro-green-600)',
        'pro-green-700':      'var(--pro-green-700)',

        // ── Corporate green aliases (legacy --pro-azure kept for compat) ──────
        'pro-azure':          'var(--pro-azure)',
        'pro-azure-dark':     'var(--pro-azure-dark)',
        'pro-azure-light':    'var(--pro-azure-light)',
        'pro-azure-50':       'var(--pro-azure-50)',
        'pro-azure-100':      'var(--pro-azure-100)',

        // ── Supporting palette ─────────────────────────────────────────────────
        'pro-navy':           'var(--pro-navy)',
        'pro-navy-2':         'var(--pro-navy-2)',
        'pro-navy-3':         'var(--pro-navy-3)',
        'pro-navy-4':         'var(--pro-navy-4)',
        'pro-violet':         'var(--pro-violet)',
        'pro-violet-light':   'var(--pro-violet-light)',
        'pro-emerald':        'var(--pro-emerald)',
        'pro-emerald-light':  'var(--pro-emerald-light)',
        'pro-amber':          'var(--pro-amber)',
        'pro-amber-light':    'var(--pro-amber-light)',
        'pro-rose':           'var(--pro-rose)',
        'pro-rose-light':     'var(--pro-rose-light)',
        'pro-cyan':           'var(--pro-cyan)',
        'pro-cyan-light':     'var(--pro-cyan-light)',

        // ── Semantic surfaces (light/dark aware) ───────────────────────────────
        'sys-bg-base':                'var(--sys-bg-base)',
        'sys-bg-surface':             'var(--sys-bg-surface)',
        'sys-bg-surface-elevated':    'var(--sys-bg-surface-elevated)',
        'sys-bg-overlay':             'var(--sys-bg-overlay)',
        'sys-bg-subtle':              'var(--sys-bg-subtle)',
        'sys-bg-accent':              'var(--sys-bg-accent)',
        'sys-border-base':            'var(--sys-border-base)',
        'sys-border-surface':         'var(--sys-border-surface)',
        'sys-border-elevated':        'var(--sys-border-elevated)',
        'sys-border-accent':          'var(--sys-border-accent)',
        'sys-text-primary':           'var(--sys-text-primary)',
        'sys-text-secondary':         'var(--sys-text-secondary)',
        'sys-text-muted':             'var(--sys-text-muted)',
        'sys-text-subtle':            'var(--sys-text-subtle)',
        'sys-brand-primary':          'var(--sys-brand-primary)',
        'sys-brand-primary-hover':    'var(--sys-brand-primary-hover)',
        'sys-brand-primary-text':     'var(--sys-brand-primary-text)',
        'sys-state-success':          'var(--sys-state-success)',
        'sys-state-success-text':     'var(--sys-state-success-text)',
        'sys-state-success-border':   'var(--sys-state-success-border)',
        'sys-state-alert':            'var(--sys-state-alert)',
        'sys-state-alert-text':       'var(--sys-state-alert-text)',
        'sys-state-alert-border':     'var(--sys-state-alert-border)',
        'sys-state-critical':         'var(--sys-state-critical)',
        'sys-state-critical-text':    'var(--sys-state-critical-text)',
        'sys-state-critical-border':  'var(--sys-state-critical-border)',
        'sys-state-info':             'var(--sys-state-info)',
        'sys-state-info-text':        'var(--sys-state-info-text)',
        'sys-state-info-border':      'var(--sys-state-info-border)',

        // ── Sidebar tokens ─────────────────────────────────────────────────────
        'sidebar-bg':          'var(--sidebar-bg)',
        'sidebar-rail-bg':     'var(--sidebar-rail-bg)',
        'sidebar-fg':          'var(--sidebar-fg)',
        'sidebar-fg-muted':    'var(--sidebar-fg-muted)',
        'sidebar-fg-hover':    'var(--sidebar-fg-hover)',
        'sidebar-active-bg':   'var(--sidebar-active-bg)',
        'sidebar-active-fg':   'var(--sidebar-active-fg)',
        'sidebar-hover-bg':    'var(--sidebar-hover-bg)',

        // ── Runtime surface/text/border tokens ────────────────────────────────
        'surface':             'var(--surface)',
        'surface-alt':         'var(--surface-alt)',
        'border-default':      'var(--border)',
        'text-ink':            'var(--text)',
        'text-ink-2':          'var(--text-2)',
        'text-ink-3':          'var(--text-3)',
        'text-ink-4':          'var(--text-4)',

        // ── Legacy aki-green / aki-blue aliases ───────────────────────────────
        'aki-green':          'var(--pro-green)',
        'aki-blue':           'var(--aki-blue)',
        'aki-blue-dark':      'var(--aki-blue-dark)',
        'aki-blue-light':     'var(--aki-blue-light)',
        'aki-blue-50':        'var(--aki-blue-50)',
        'aki-blue-100':       'var(--aki-blue-100)',
        'aki-indigo':         'var(--aki-indigo)',
        'aki-indigo-dark':    'var(--aki-indigo-dark)',
        'aki-amber':          'var(--aki-amber)',
        'aki-err':            'var(--aki-err)',

        // ── Legacy ovds aliases ────────────────────────────────────────────────
        'ovds-primary':       'var(--ovds-primary)',
        'ovds-primary-dark':  'var(--ovds-primary-dark)',
        'ovds-primary-light': 'var(--ovds-primary-light)',
        'ovds-sidebar':       'var(--ovds-sidebar)',
        'ovds-background':    'var(--ovds-background)',
        'ovds-surface':       'var(--ovds-surface)',
        'ovds-surface-dark':  'var(--ovds-surface-dark)',
        'ovds-border':        'var(--ovds-border)',
        'ovds-muted':         'var(--ovds-muted)',
        'ovds-text-main':     'var(--ovds-text-main)',
        'ovds-text-muted':    'var(--ovds-text-muted)',
        'ovds-text-subtle':   'var(--ovds-text-subtle)',
        'ovds-success':       'var(--ovds-success)',
        'ovds-warning':       'var(--ovds-warning)',
        'ovds-danger':        'var(--ovds-danger)',
        'ovds-info':          'var(--ovds-info)',
        'ovds-accent':        'var(--ovds-accent)',
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand':   'var(--pro-gradient-primary)',
        'gradient-green':   'var(--pro-gradient-primary)',
        'gradient-azure':   'var(--pro-gradient-primary)',  /* compat alias */
        'gradient-success': 'var(--pro-gradient-success)',
        'gradient-warm':    'var(--pro-gradient-warm)',
        'gradient-sidebar': 'var(--pro-gradient-sidebar)',
        'gradient-hero':    'var(--pro-gradient-hero)',
      },
      boxShadow: {
        'card':        'var(--card-shadow)',
        'card-hover':  'var(--card-shadow-hover)',
        'card-raised': 'var(--card-shadow-raised)',
        'green':       '0 4px 14px rgba(79, 186, 111, 0.28)',
        'green-lg':    '0 8px 24px rgba(46, 212, 122, 0.35)',
        /* legacy names kept for smooth migration */
        'indigo':      '0 4px 14px rgba(79, 186, 111, 0.28)',
        'indigo-lg':   '0 8px 24px rgba(46, 212, 122, 0.35)',
      },
      borderRadius: {
        'card':    'var(--card-radius)',
        'card-sm': 'var(--card-radius-sm)',
        'card-lg': 'var(--card-radius-lg)',
      },
      spacing: {
        'page':              'var(--page-pad)',
        'card':              'var(--card-pad)',
        'header-h':          'var(--header-h)',
        'sidebar-w':         'var(--sidebar-w)',
        'sidebar-collapsed': 'var(--sidebar-collapsed)',
      },
      animation: {
        'aki-enter':      'aki-enter 180ms cubic-bezier(0.16,1,0.3,1) both',
        'aki-drop-in':    'aki-drop-in 240ms cubic-bezier(0.16,1,0.3,1) both',
        'aki-fade-in':    'aki-fade-in 220ms ease both',
        'aki-slide-up':   'aki-slide-up 300ms cubic-bezier(0.16,1,0.3,1) both',
        'aki-spin':       'aki-spin 0.8s linear infinite',
        'aki-pulse':      'aki-pulse 2s ease-in-out infinite',
        'aki-shimmer':    'aki-shimmer 1.4s ease-in-out infinite',
        'aki-float':      'aki-float 4s ease-in-out infinite',
        'page-fade':      'page-fade-in 240ms cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
};
