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
  "transition-fg relative inline-flex w-fit items-center justify-center overflow-hidden rounded-md outline-none disabled:bg-ui-bg-disabled disabled:border-ui-border-base disabled:text-ui-fg-disabled disabled:shadow-buttons-neutral disabled:after:hidden after:transition-fg after:absolute after:inset-0 after:content-['']",
  {
    variants: {
      variant: {
        primary:
          "shadow-buttons-inverted text-ui-contrast-fg-primary bg-ui-button-inverted after:button-inverted-gradient hover:bg-ui-button-inverted-hover hover:after:button-inverted-hover-gradient active:bg-ui-button-inverted-pressed active:after:button-inverted-pressed-gradient focus-visible:shadow-buttons-inverted-focus",
        secondary:
          "shadow-buttons-neutral text-ui-fg-base bg-ui-button-neutral after:button-neutral-gradient hover:bg-ui-button-neutral-hover hover:after:button-neutral-hover-gradient active:bg-ui-button-neutral-pressed active:after:button-neutral-pressed-gradient focus-visible:shadow-buttons-neutral-focus",
        transparent:
          "after:hidden text-ui-fg-base bg-ui-button-transparent hover:bg-ui-button-transparent-hover active:bg-ui-button-transparent-pressed focus-visible:shadow-buttons-neutral-focus focus-visible:bg-ui-bg-base disabled:!bg-transparent disabled:!shadow-none",
        danger:
          "shadow-buttons-danger text-ui-fg-on-color bg-ui-button-danger after:button-danger-gradient hover:bg-ui-button-danger-hover hover:after:button-danger-hover-gradient active:bg-ui-button-danger-pressed active:after:button-danger-pressed-gradient focus-visible:shadow-buttons-danger-focus",
        /* shadcn aliases → same classes as the Medusa variants above */
        default:
          "shadow-buttons-inverted text-ui-contrast-fg-primary bg-ui-button-inverted after:button-inverted-gradient hover:bg-ui-button-inverted-hover hover:after:button-inverted-hover-gradient active:bg-ui-button-inverted-pressed active:after:button-inverted-pressed-gradient focus-visible:shadow-buttons-inverted-focus",
        destructive:
          "shadow-buttons-danger text-ui-fg-on-color bg-ui-button-danger after:button-danger-gradient hover:bg-ui-button-danger-hover hover:after:button-danger-hover-gradient active:bg-ui-button-danger-pressed active:after:button-danger-pressed-gradient focus-visible:shadow-buttons-danger-focus",
        outline:
          "shadow-buttons-neutral text-ui-fg-base bg-ui-button-neutral after:button-neutral-gradient hover:bg-ui-button-neutral-hover hover:after:button-neutral-hover-gradient active:bg-ui-button-neutral-pressed active:after:button-neutral-pressed-gradient focus-visible:shadow-buttons-neutral-focus",
        ghost:
          "after:hidden text-ui-fg-base bg-ui-button-transparent hover:bg-ui-button-transparent-hover active:bg-ui-button-transparent-pressed focus-visible:shadow-buttons-neutral-focus focus-visible:bg-ui-bg-base disabled:!bg-transparent disabled:!shadow-none",
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
