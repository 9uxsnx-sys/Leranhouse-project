"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Medusa-style Avatar (ported from @medusajs/ui `avatar.tsx`, Radix-free).
 * Shows `src` image, falls back to initials when the image can't load.
 */
const avatarVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden border border-border bg-background",
  {
    variants: {
      variant: {
        squared: "",
        rounded: "rounded-full",
      },
      size: {
        "2xsmall": "h-5 w-5",
        xsmall: "h-6 w-6",
        small: "h-7 w-7",
        base: "h-8 w-8",
        large: "h-10 w-10",
        xlarge: "h-12 w-12",
      },
    },
    compoundVariants: [
      { variant: "squared", size: "2xsmall", className: "rounded" },
      { variant: "squared", size: "xsmall", className: "rounded-md" },
      { variant: "squared", size: "small", className: "rounded-md" },
      { variant: "squared", size: "base", className: "rounded-md" },
      { variant: "squared", size: "large", className: "rounded-lg" },
      { variant: "squared", size: "xlarge", className: "rounded-xl" },
    ],
    defaultVariants: {
      variant: "rounded",
      size: "base",
    },
  }
)

const fallbackVariants = cva(
  "pointer-events-none flex select-none items-center justify-center bg-gray-100 text-gray-700",
  {
    variants: {
      variant: {
        squared: "",
        rounded: "rounded-full",
      },
      size: {
        "2xsmall": "text-[10px] font-medium",
        xsmall: "text-[11px] font-medium",
        small: "text-[11px] font-medium",
        base: "text-xs font-medium",
        large: "text-sm font-medium",
        xlarge: "text-base font-medium",
      },
    },
    compoundVariants: [
      { variant: "squared", size: "2xsmall", className: "rounded" },
      { variant: "squared", size: "xsmall", className: "rounded-md" },
      { variant: "squared", size: "small", className: "rounded-md" },
      { variant: "squared", size: "base", className: "rounded-md" },
      { variant: "squared", size: "large", className: "rounded-lg" },
      { variant: "squared", size: "xlarge", className: "rounded-xl" },
    ],
    defaultVariants: {
      variant: "rounded",
      size: "base",
    },
  }
)

export interface AvatarProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "size">,
    VariantProps<typeof avatarVariants> {
  /** Text shown if the image in `src` can't be opened. */
  fallback: string
}

const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ src, fallback, variant = "rounded", size = "base", className, ...props }, ref) => {
    const [error, setError] = React.useState(false)
    const showImage = src && !error

    return (
      <span className={cn(avatarVariants({ variant, size }), className)}>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={ref}
            src={src}
            alt={props.alt ?? ""}
            onError={() => setError(true)}
            className="aspect-square h-full w-full object-cover object-center"
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              fallbackVariants({ variant, size }),
              "absolute inset-0 h-full w-full"
            )}
          >
            {fallback}
          </span>
        )}
      </span>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
