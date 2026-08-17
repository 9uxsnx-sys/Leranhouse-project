import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Medusa Container — container.tsx
 * White block with the elevation-card-rest hairline ring, rounded-lg,
 * px-6 py-4 padding. Blocks are stacked with gap-y-3 between them.
 */
const Container = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "shadow-elevation-card-rest bg-ui-bg-base w-full rounded-lg px-6 py-4",
        className
      )}
      {...props}
    />
  )
})
Container.displayName = "Container"

export { Container }
