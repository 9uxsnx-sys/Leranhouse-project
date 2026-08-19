import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Medusa Textarea — textarea.tsx (ported 1:1, light mode tokens).
 * Same base styles as Input: field bg, borders-base shadow, focus ring.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "caret-ui-fg-base bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-borders-base placeholder-ui-fg-muted text-ui-fg-base transition-fg relative w-full appearance-none rounded-md outline-none",
        "focus-visible:shadow-borders-interactive-with-active",
        "disabled:text-ui-fg-disabled disabled:!bg-ui-bg-disabled disabled:placeholder-ui-fg-disabled disabled:cursor-not-allowed",
        "aria-[invalid=true]:!shadow-borders-error invalid:!shadow-borders-error",
        "txt-small min-h-[60px] w-full px-2 py-1.5",
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
