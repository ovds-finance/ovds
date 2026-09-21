/**
 * @ovds/design-tokens — canonical design token definitions
 *
 * This is the single source of truth for all design token values.
 * Both @ovds/design-system (TypeScript objects) and tokens.css (CSS custom
 * properties) must stay in sync with the values declared here.
 *
 * Design philosophy:
 *  1. High contrast: dark charcoal text (#0F172A) on white surfaces
 *  2. Neutral grays: slate-50 through slate-900 for structure
 *  3. Brand primary: corporate green #4FBA6F / vibrant #2ED47A for all CTAs
 *  4. Functional accents: amber for warnings, rose for danger, blue for info
 *  5. Strict typographic hierarchy via Inter font at defined scales
 *
 * Color system (60-30-10):
 *  60% Neutrals & Base    — #F8FAFC → #1E293B grayscale / cool slate
 *  30% Supporting Accents — functional pastels (status, charts)
 *  10% Primary Brand      — corporate green #4FBA6F / vibrant #2ED47A
 */

export const canvas = '#FFFFFF';

export const surface = {
  light:     '#F9FAFB',
  active:    '#F0FDF4',
  elevated:  '#FFFFFF',
  overlay:   '#FFFFFF',
  subtle:    '#F8FAFC',
} as const;

export const text = {
  primary:   '#111827',
  secondary: '#6B7280',
  muted:     '#94A3B8',
  subtle:    '#CBD5E1',
  inverse:   '#FFFFFF',
} as const;

export const border = {
  DEFAULT:   '#E2E8F0',
  subtle:    '#F1F5F9',
  strong:    '#CBD5E1',
} as const;

export const brand = {
  primary:       '#4FBA6F',
  primaryDark:   '#3B9957',
  primaryLight:  '#7DD49A',
  primary50:     '#F0FDF4',
  primary100:    '#DCFCE7',
  /** Vibrant actionable variant — CTAs, save/submit, nav markers */
  vibrant:       '#2ED47A',
  vibrantDark:   '#22A85F',
  vibrantLight:  '#6EE8A4',
} as const;

export const success = {
  badge:   '#DEF7EC',
  text:    '#03543F',
  border:  '#A7F3D0',
  solid:   '#ECFDF5',
} as const;

export const alert = {
  bg:      '#FFFBEB',
  text:    '#B45309',
  border:  '#FDE68A',
  dot:     '#F59E0B',
} as const;

export const critical = {
  bg:      '#FFF1F2',
  text:    '#9F1239',
  border:  '#FECDD3',
  dot:     '#E11D48',
} as const;

export const info = {
  bg:      '#EFF6FF',
  text:    '#1E40AF',
  border:  '#BFDBFE',
  dot:     '#3B82F6',
} as const;

export const status = {
  draft:     { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0', dot: '#94A3B8' },
  pending:   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  sent:      { bg: '#EFF6FF', text: '#1E3A8A', border: '#CCE0FF', dot: '#0066FF' },
  paid:      { bg: '#F0FDF4', text: '#03543F', border: '#A7F3D0', dot: '#059669' },
  overdue:   { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3', dot: '#E11D48' },
  approved:  { bg: '#F0FDF4', text: '#03543F', border: '#A7F3D0', dot: '#059669' },
  rejected:  { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3', dot: '#E11D48' },
  cancelled: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', dot: '#94A3B8' },
  active:    { bg: '#F0FDF4', text: '#03543F', border: '#A7F3D0', dot: '#059669' },
  open:      { bg: '#EFF6FF', text: '#1E3A8A', border: '#CCE0FF', dot: '#0066FF' },
  closed:    { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', dot: '#94A3B8' },
  success:   { bg: '#F0FDF4', text: '#03543F', border: '#A7F3D0', dot: '#059669' },
  warning:   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  danger:    { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3', dot: '#E11D48' },
  info:      { bg: '#EFF6FF', text: '#1E3A8A', border: '#CCE0FF', dot: '#0066FF' },
} as const;

export const typography = {
  fontFamily: {
    sans:   ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    mono:   ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
  },
  fontSize: {
    '2xs':  '10px',
    xs:     '11px',
    sm:     '12px',
    base:   '13px',
    md:     '14px',
    lg:     '15px',
    xl:     '16px',
    '2xl':  '20px',
    '3xl':  '24px',
    display:'30px',
  },
  fontWeight: {
    normal:  '400',
    medium:  '500',
    semibold:'600',
    bold:    '700',
    extrabold:'800',
  },
  lineHeight: {
    tight:   '1.3',
    normal:  '1.5',
    relaxed: '1.6',
  },
} as const;

export const spacing = {
  '0.5': '0.125rem',
  '1':   '0.25rem',
  '2':   '0.5rem',
  '3':   '0.75rem',
  '4':   '1rem',
  '5':   '1.25rem',
  '6':   '1.5rem',
  '8':   '2rem',
  '10':  '2.5rem',
  '12':  '3rem',
  '16':  '4rem',
  '20':  '5rem',
  '24':  '6rem',
} as const;

export const borderRadius = {
  sm:   '4px',
  DEFAULT: '6px',
  md:   '8px',
  lg:   '10px',
  xl:   '12px',
  full: '9999px',
} as const;

export const shadow = {
  card:    '0 1px 3px 0 rgb(0 0 0 / 0.03), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
  raised:  '0 4px 12px 0 rgb(0 0 0 / 0.05)',
  modal:   '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
  dropdown:'0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
} as const;

export const layout = {
  sidebarWidth:      '276px',
  sidebarCollapsed:  '56px',
  headerHeight:      '60px',
  pagePadding:       '24px',
  pageMaxWidth:      '1440px',
  cardPadding:       '20px',
  cardRadius:        '8px',
  cardRadiusSm:      '4px',
  cardRadiusLg:      '12px',
} as const;

export const chartColors = [
  '#4FBA6F',  /* brand green — primary series */
  '#10B981',  /* emerald */
  '#F59E0B',  /* amber */
  '#E74C3C',  /* red */
  '#7C3AED',  /* violet */
  '#2980B9',  /* blue */
  '#8E44AD',  /* purple */
  '#16A085',  /* teal */
] as const;

export const motion = {
  ease:        'cubic-bezier(0.4, 0, 0.2, 1)',
  easeSpring:  'cubic-bezier(0.16, 1, 0.3, 1)',
  durFast:     '120ms',
  durBase:     '180ms',
  durSlow:     '280ms',
  durEnter:    '220ms',
} as const;

export const dark = {
  canvas:     '#0F172A',
  surface: {
    light:     '#1E293B',
    active:    '#1E293B',
    elevated:  '#334155',
    overlay:   '#1E293B',
    subtle:    '#1A2332',
  },
  text: {
    primary:   '#F1F5F9',
    secondary: '#94A3B8',
    muted:     '#64748B',
    subtle:    '#475569',
    inverse:   '#0F172A',
  },
  border: {
    DEFAULT:   '#334155',
    subtle:    '#1E293B',
    strong:    '#475569',
  },
} as const;

