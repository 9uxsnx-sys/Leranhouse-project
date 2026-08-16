"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Medusa-style Heading (ported from @medusajs/ui `heading.tsx`).
 * Medusa headings are always `font-medium` (not bold); sizes map to
 * h1-core 24px / h2-core 18px / h3-core 16px.
 */
const headingVariants = cva("font-sans font-medium", {
  variants: {
    level: {
      h1: "text-2xl leading-8",
      h2: "text-lg leading-7",
      h3: "text-base leading-6",
    },
  },
  defaultVariants: {
    level: "h2",
  },
})

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  asChild?: boolean
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : level ?? "h2"
    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ level }), className)}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Heading, headingVariants }
