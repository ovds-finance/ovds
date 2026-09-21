import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

/**
 * Button — Ovds SaaS interaction primitive.
 *
 * Design principles:
 *  - Primary: brand green (#4FBA6F) with subtle shadow lift on hover
 *  - Focus ring: --pro-azure glow (green), 2px outline + 3px offset
 *  - Active: scale(0.97) press-down feedback on all variants
 *  - Disabled: 45% opacity, pointer-events none
 *  - Transitions: 150ms ease — snappy but not jarring
 */

const buttonVariants = cva(
  // Base — shared across all variants
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-[12px] font-semibold leading-none",
    "transition-all duration-150 ease-out",
    "select-none cursor-pointer",
    // Focus ring — Ovds SaaS green glow
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-2",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-45",
    // Active press-down
    "active:scale-[0.97]",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Ovds SaaS signature green — primary CTA */
        default: [
          "bg-[var(--pro-azure)] text-white border border-[var(--pro-azure)]",
          "shadow-sm shadow-[var(--pro-azure)]/20",
          "hover:bg-[var(--pro-azure-dark)] hover:border-[var(--pro-azure-dark)]",
          "hover:shadow-md hover:shadow-[var(--pro-azure)]/30 hover:-translate-y-px",
        ].join(" "),

        /** Soft destructive — rose tint, no heavy red */
        destructive: [
          "bg-rose-50 border border-rose-200 text-rose-700",
          "hover:bg-rose-100 hover:border-rose-300",
          "dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400",
          "dark:hover:bg-rose-950/50",
        ].join(" "),

        /** Secondary — white card button with border */
        outline: [
          "bg-white border border-[var(--border)] text-[var(--text-2)]",
          "shadow-sm shadow-black/[0.03]",
          "hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)]",
          "dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-[var(--text-2)]",
          "dark:hover:border-[var(--pro-azure)] dark:hover:text-[var(--pro-azure)]",
        ].join(" "),

        /** Muted background — secondary action */
        secondary: [
          "bg-[var(--surface-alt)] text-[var(--text-2)] border border-[var(--border)]",
          "hover:bg-[var(--border)] hover:text-[var(--text)]",
          "dark:bg-[var(--surface)] dark:text-[var(--text-2)]",
          "dark:hover:bg-[var(--surface-alt)]",
        ].join(" "),

        /** Ghost — no background, for icon-area or nav actions */
        ghost: [
          "text-[var(--text-3)] border border-transparent",
          "hover:bg-[var(--surface-alt)] hover:text-[var(--text)]",
          "dark:hover:bg-[var(--surface)]",
        ].join(" "),

        /** Link-style — underline on hover */
        link: [
          "text-[var(--pro-azure)] border-0 shadow-none underline-offset-4",
          "hover:underline hover:text-[var(--pro-azure-dark)]",
          "dark:text-[var(--pro-azure-light)]",
        ].join(" "),

        /** Danger (solid) — for high-impact destructive actions */
        danger: [
          "bg-rose-600 text-white border border-rose-600",
          "shadow-sm shadow-rose-500/20",
          "hover:bg-rose-700 hover:border-rose-700",
          "hover:shadow-md hover:shadow-rose-500/25",
        ].join(" "),

        /** Success soft pill */
        success: [
          "bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)]",
          "hover:bg-[var(--pro-azure-100)]",
        ].join(" "),
      },
      size: {
        xs:      "h-6 px-2 text-[10px] gap-1 rounded-md",
        sm:      "h-7 px-2.5 text-[11px] gap-1.5 rounded-md",
        default: "h-8 px-3 py-1.5",
        lg:      "h-9 px-4 text-[13px] gap-2 rounded-lg",
        xl:      "h-11 px-5 text-[14px] gap-2.5 rounded-lg",
        icon:    "h-8 w-8 p-0",
        "icon-sm": "h-7 w-7 p-0",
        "icon-xs": "h-6 w-6 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner and disables the button while true */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        aria-disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
