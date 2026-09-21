# @ovds/design-tokens

Single source of truth for all design token values in the OVDS platform. This package defines the canonical colors, typography, spacing, and status values consumed by CSS, Tailwind, React, and NestJS.

## Philosophy

1. **High contrast** — Dark charcoal (`#111827`) on white (`#FFFFFF`)
2. **Neutral grays** — Slate-50 through slate-900 for structure
3. **Functional accents** — Indigo (`#6366F1`) for primary actions
4. **Dark mode** — Full dark theme support via CSS custom properties

## Structure

```
packages/design-tokens/
├── src/
│   ├── tokens.ts          # Canonical token definitions
│   ├── css-variables.ts   # Token → CSS custom property mapping
│   ├── backend.ts         # Programmatic token access for NestJS
│   └── generated/         # Auto-generated artifacts
├── scripts/
│   ├── sync-css-variables.mjs    # Sync tokens.ts → tokens.css
│   └── generate-tailwind-config.mjs  # Generate Tailwind config
└── package.json
```

## Usage

### React / Tailwind

```tsx
import { canvas, brand, text } from '@ovds/design-tokens';

// Use with CSS custom properties
<div style={{ backgroundColor: canvas, color: text.primary }}>

// Or via Tailwind classes (recommended)
<div className="bg-surface-light text-primary">
```

### NestJS Backend

```ts
import { getToken, getStatusColor, hexToRgba } from '@ovds/design-tokens';

const primary = getToken('brand.primary'); // '#6366F1'
const paidColors = getStatusColor('paid'); // { bg, text, border, dot }
```

### CSS Variables

The `sync-css-variables.mjs` script generates CSS custom properties in `packages/ui/src/styles/tokens.css`:

```css
:root {
  --brand-primary: #6366F1;
  --text-primary: #111827;
  --surface-light: #F9FAFB;
}

.dark {
  --brand-primary: #818CF8;
  --text-primary: #F1F5F9;
  --surface-light: #1E293B;
}
```

## Token Categories

| Category | Example | Usage |
|----------|---------|-------|
| `brand` | `brand.primary` | Primary actions, links |
| `text` | `text.primary`, `text.secondary` | Typography hierarchy |
| `surface` | `surface.light`, `surface.active` | Backgrounds, cards |
| `status` | `status.paid`, `status.overdue` | Status badges |
| `success`, `alert`, `critical`, `info` | `success.badge` | Feedback colors |
| `border` | `border.default`, `border.subtle` | Borders, dividers |
| `typography` | `typography.fontFamily.sans` | Font stacks |
| `layout` | `layout.sidebarWidth` | Spacing, dimensions |
| `motion` | `motion.ease`, `motion.durBase` | Animations |

## Scripts

```bash
# Sync CSS variables from tokens.ts to tokens.css
npm run tokens:sync --workspace @ovds/design-tokens

# Generate Tailwind config from tokens
npm run tokens:generate-tailwind --workspace @ovds/design-tokens
```

## Dark Mode

Dark mode tokens are defined in `tokens.ts` under the `dark` export. The sync script generates `.dark` CSS overrides automatically.

## Best Practices

1. **Never hardcode hex values** — Always import from `@ovds/design-tokens`
2. **Never hardcode spacing** — Use the spacing scale from tokens
3. **Use semantic names** — `text.primary` not `#111827`
4. **Keep tokens in sync** — Run `tokens:sync` after editing `tokens.ts`
