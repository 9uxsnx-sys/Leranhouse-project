"use client"

import * as React from "react"
import * as RadixSelect from "@radix-ui/react-select"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectValue,
} from "@/components/ui/select"
import { TrianglesMini } from "@components/Objects/Icons/MedusaIcons"

/**
 * Select with a trigger that matches the <Input/> field design.
 *
 * The shared ui/select trigger is button-styled (borderless, 32px, neutral
 * shadow), which is invisible next to the form fields in the dashboard. This
 * variant reuses the same dropdown (Content/Item) but renders a trigger with
 * the input's background, border shadow, height and focus ring.
 */
const triggerClassName = cn(
  "caret-ui-fg-base bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-borders-base text-ui-fg-base transition-fg relative flex w-full select-none appearance-none items-center justify-between gap-2",
  "txt-compact-small h-8 rounded-md px-2 py-1.5 outline-none",
  "data-[placeholder]:text-ui-fg-muted",
  "focus-visible:shadow-borders-interactive-with-active data-[state=open]:shadow-borders-interactive-with-active",
  "disabled:text-ui-fg-disabled disabled:!bg-ui-bg-disabled disabled:cursor-not-allowed",
  "[&>span]:line-clamp-1"
)

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={cn(triggerClassName, className)}
    {...props}
  >
    {children}
    <RadixSelect.Icon asChild>
      <TrianglesMini className="text-ui-fg-muted shrink-0" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
))
SelectTrigger.displayName = "SelectField.Trigger"

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
