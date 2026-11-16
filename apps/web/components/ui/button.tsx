import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Medusa Button — button.tsx (ported 1:1, light mode tokens).
 *
 * Variants are the real Medusa ones (primary/secondary/transparent/danger).
 * The old shadcn names (default/destructive/outline/secondary/ghost/link)
 * are kept as aliases so existing call sites inherit the Medusa look
 * without a rename sweep.
 */
const buttonVariants = cva(
  "transition-fg relative inline-flex w-fit items-center justify-center rounded-md outline-none disabled:bg-ui-bg-disabled disabled:border-ui-border-base disabled:text-ui-fg-disabled disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900/20",
  {
    variants: {
      variant: {
        primary:
          "text-ui-contrast-fg-primary bg-ui-button-inverted hover:bg-ui-button-inverted-hover active:bg-ui-button-inverted-pressed",
        secondary:
          "text-ui-fg-base bg-ui-button-neutral border border-ui-border-base hover:bg-ui-button-neutral-hover active:bg-ui-button-neutral-pressed",
        transparent:
          "text-ui-fg-base bg-ui-button-transparent hover:bg-ui-button-transparent-hover active:bg-ui-button-transparent-pressed disabled:!bg-transparent",
        danger:
          "text-ui-fg-on-color bg-ui-button-danger hover:bg-ui-button-danger-hover active:bg-ui-button-danger-pressed focus-visible:ring-red-500/25",
        /* shadcn aliases → same classes as the Medusa variants above */
        default:
          "text-ui-contrast-fg-primary bg-ui-button-inverted hover:bg-ui-button-inverted-hover active:bg-ui-button-inverted-pressed",
        destructive:
          "text-ui-fg-on-color bg-ui-button-danger hover:bg-ui-button-danger-hover active:bg-ui-button-danger-pressed focus-visible:ring-red-500/25",
        outline:
          "text-ui-fg-base bg-ui-button-neutral border border-ui-border-base hover:bg-ui-button-neutral-hover active:bg-ui-button-neutral-pressed",
        ghost:
          "text-ui-fg-base bg-ui-button-transparent hover:bg-ui-button-transparent-hover active:bg-ui-button-transparent-pressed disabled:!bg-transparent",
        link: "text-ui-fg-interactive underline-offset-4 hover:underline focus-visible:text-ui-fg-interactive-hover",
      },
      size: {
        small: "txt-compact-small-plus gap-x-1.5 px-2 py-1",
        base: "txt-compact-small-plus gap-x-1.5 px-3 py-1.5",
        large: "txt-compact-medium-plus gap-x-1.5 px-4 py-2.5",
        xlarge: "txt-compact-large-plus gap-x-1.5 px-5 py-3.5",
        /* shadcn aliases → Medusa sizes */
        default: "txt-compact-small-plus gap-x-1.5 px-3 py-1.5",
        sm: "txt-compact-small-plus gap-x-1.5 px-2 py-1",
        lg: "txt-compact-medium-plus gap-x-1.5 px-4 py-2.5",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "base",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="pointer-events-none">
            <span className="bg-ui-bg-disabled absolute inset-0 flex items-center justify-center rounded-md">
              <span className="size-4 animate-spin rounded-full border-2 border-ui-fg-subtle border-t-transparent" />
            </span>
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
