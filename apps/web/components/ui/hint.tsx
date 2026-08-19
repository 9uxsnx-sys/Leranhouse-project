"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { ExclamationCircleSolid } from "@components/Objects/Icons/MedusaIcons"

const hintVariants = cva("txt-small", {
  variants: {
    variant: {
      info: "text-ui-fg-subtle",
      error: "text-ui-fg-error grid grid-cols-[20px_1fr] items-start gap-1",
    },
  },
  defaultVariants: {
    variant: "info",
  },
})

export interface HintProps
  extends React.ComponentPropsWithoutRef<"span">,
    VariantProps<typeof hintVariants> {}

const Hint = React.forwardRef<HTMLSpanElement, HintProps>(
  ({ className, variant = "info", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(hintVariants({ variant }), className)}
        {...props}
      >
        {variant === "error" && (
          <div className="flex size-5 items-center justify-center">
            <ExclamationCircleSolid />
          </div>
        )}
        {children}
      </span>
    )
  }
)
Hint.displayName = "Hint"

export { Hint }
