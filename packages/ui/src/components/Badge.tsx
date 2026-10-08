/**
 * Badge — re-export of the canonical design-system badge.
 *
 * This module used to define a second, legacy Badge with hard-coded Tailwind
 * colors (blue/green/yellow/...) instead of the Ovds design tokens. Keeping two
 * badges meant the exported `Badge` type did not accept the variant/size values
 * used across the app (`indigo`, `rose`, `sky`, `amber`, `xs`, ...) and the
 * two renderings drifted apart visually.
 *
 * Everything now resolves to `components/ui/badge.tsx`, which owns the variants.
 * `size="md"` remains supported there as an alias of `default` so existing call
 * sites keep compiling.
 */
export { Badge, badgeVariants, type BadgeProps } from './ui/badge';
