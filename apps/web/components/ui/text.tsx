"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Medusa-style Text (ported from @medusajs/ui `text.tsx`).
 * Medusa typography scale: xsmall 12px / small 13px / base 14px / large 16px / xlarge 18px.
 * `weight="plus"` maps to Medusa's font-medium (+ variants).
 */
const textVariants = cva("font-sans", {
  variants: {
    size: {
      xsmall: "text-xs",
      small: "text-[13px]",
      base: "text-sm",
      large: "text-base",
      xlarge: "text-lg",
    },
    weight: {
      regular: "font-normal",
      plus: "font-medium",
    },
    family: {
      sans: "font-sans",
      mono: "font-mono",
    },
    leading: {
      normal: "leading-normal",
      compact: "leading-tight",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "regular",
    family: "sans",
    leading: "normal",
  },
})

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  asChild?: boolean
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  (
    { className, size, weight, family, leading, asChild = false, ...props },
    ref
  ) => {
    const Component = asChild ? Slot : "p"
    return (
      <Component
        ref={ref}
        className={cn(textVariants({ size, weight, family, leading }), className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text, textVariants }
