"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Medusa-style IconButton (ported from @medusajs/ui `icon-button.tsx`).
 */
const iconButtonVariants = cva(
  "transition-colors inline-flex w-fit items-center justify-center overflow-hidden rounded-md outline-none cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 focus-visible:ring-2 focus-visible:ring-ring",
        transparent:
          "text-gray-700 bg-transparent hover:bg-gray-100 active:bg-gray-200 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring",
      },
      size: {
        "2xsmall": "h-5 w-5",
        xsmall: "h-6 w-6 p-1",
        small: "h-7 w-7 p-1",
        base: "h-8 w-8 p-1.5",
        large: "h-10 w-10 p-2.5",
        xlarge: "h-12 w-12 p-3.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "base",
    },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  asChild?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "primary",
      size = "base",
      asChild = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? Slot : "button"
    return (
      <Component
        ref={ref}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }
