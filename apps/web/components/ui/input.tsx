import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "base" | "small"
}

/**
 * Medusa Input — input.tsx (ported 1:1, light mode tokens).
 * Field bg #fafafa, borders-base shadow, h-8 rounded-md,
 * blue-600 focus ring (borders-interactive-with-active).
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "base", ...props }, ref) => {
    const isSearch = type === "search"

    const baseStyles = cn(
      "caret-ui-fg-base bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-borders-base placeholder-ui-fg-muted text-ui-fg-base transition-fg relative w-full appearance-none rounded-md outline-none",
      "focus-visible:shadow-borders-interactive-with-active",
      "disabled:text-ui-fg-disabled disabled:!bg-ui-bg-disabled disabled:placeholder-ui-fg-disabled disabled:cursor-not-allowed",
      "aria-[invalid=true]:!shadow-borders-error invalid:!shadow-borders-error",
      "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
      size === "base" ? "txt-compact-small h-8 px-2 py-1.5" : "txt-compact-small h-7 px-2 py-1",
      isSearch && (size === "base" ? "pl-8" : "pl-7"),
      className
    )

    if (isSearch) {
      return (
        <div className="relative w-full">
          <div
            className={cn(
              "text-ui-fg-muted pointer-events-none absolute bottom-0 left-0 flex items-center justify-center",
              size === "base" ? "h-8 w-8" : "h-7 w-7"
            )}
            role="img"
          >
            <Search className="h-4 w-4" />
          </div>
          <input type={type} ref={ref} className={baseStyles} {...props} />
        </div>
      )
    }
    return (
      <input type={type} ref={ref} className={baseStyles} {...props} />
    )
  }
)
Input.displayName = "Input"

export { Input }
