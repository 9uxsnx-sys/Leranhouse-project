import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusDotVariants = cva("h-2 w-2 rounded-sm", {
  variants: {
    color: {
      green: "bg-ui-tag-green-icon",
      red: "bg-ui-tag-red-icon",
      orange: "bg-ui-tag-orange-icon",
      blue: "bg-ui-tag-blue-icon",
      purple: "bg-ui-tag-purple-icon",
      grey: "bg-ui-tag-neutral-icon",
    },
  },
  defaultVariants: {
    color: "grey",
  },
})

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof statusDotVariants> {}

/**
 * Medusa StatusBadge — status-badge.tsx
 * Chip with a status dot + label. Dot is a 8px rounded square,
 * label in txt-compact-xsmall-plus.
 */
function StatusBadge({
  className,
  color = "grey",
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "txt-compact-xsmall-plus bg-ui-bg-subtle text-ui-fg-subtle border-ui-border-base box-border flex w-fit select-none items-center overflow-hidden rounded-md border pl-0 pr-1 leading-none",
        className
      )}
      {...props}
    >
      <span
        role="presentation"
        className="flex h-[18px] w-5 items-center justify-center"
      >
        <span className={cn(statusDotVariants({ color }))} />
      </span>
      {children}
    </span>
  )
}

export { StatusBadge, statusDotVariants }
