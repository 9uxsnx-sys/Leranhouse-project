"use client"

import * as React from "react"
import * as RadixSelect from "@radix-ui/react-select"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Check, TrianglesMini } from "@components/Objects/Icons/MedusaIcons"

interface SelectProps
  extends React.ComponentPropsWithoutRef<typeof RadixSelect.Root> {
  size?: "base" | "small"
}

type SelectContextValue = {
  size: "base" | "small"
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

const useSelectContext = () => {
  const context = React.useContext(SelectContext)

  if (context === null) {
    throw new Error("useSelectContext must be used within a SelectProvider")
  }

  return context
}

/**
 * Medusa Select — select.tsx (ported 1:1 from @medusajs/ui, light mode tokens).
 * Based on [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select).
 */
const Root = ({ children, size = "base", ...props }: SelectProps) => {
  return (
    <SelectContext.Provider value={React.useMemo(() => ({ size }), [size])}>
      <RadixSelect.Root {...props}>{children}</RadixSelect.Root>
    </SelectContext.Provider>
  )
}
Root.displayName = "Select"

const Group = RadixSelect.Group
Group.displayName = "Select.Group"

const Value = RadixSelect.Value
Value.displayName = "Select.Value"

const triggerVariants = cva({
  base: cn(
    "bg-ui-bg-field shadow-buttons-neutral transition-fg flex w-full select-none items-center justify-between rounded-md outline-none",
    "data-[placeholder]:text-ui-fg-muted text-ui-fg-base",
    "hover:bg-ui-bg-field-hover",
    "focus-visible:shadow-borders-interactive-with-active data-[state=open]:!shadow-borders-interactive-with-active",
    "aria-[invalid=true]:border-ui-border-error aria-[invalid=true]:shadow-borders-error",
    "invalid:border-ui-border-error invalid:shadow-borders-error",
    "disabled:!bg-ui-bg-disabled disabled:!text-ui-fg-disabled",
    "group/trigger"
  ),
  variants: {
    size: {
      base: "h-8 px-2 py-1.5 txt-compact-small",
      small: "h-7 px-2 py-1 txt-compact-small",
    },
  },
})

const Trigger = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>
>(({ className, children, ...props }, ref) => {
  const { size } = useSelectContext()

  return (
    <RadixSelect.Trigger
      ref={ref}
      className={cn(triggerVariants({ size }), className)}
      {...props}
    >
      {children}
      <RadixSelect.Icon asChild>
        <TrianglesMini className="text-ui-fg-muted group-disabled/trigger:text-ui-fg-disabled" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  )
})
Trigger.displayName = "Select.Trigger"

const Content = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(
  (
    {
      className,
      children,
      onScroll,
      position = "popper",
      sideOffset = 8,
      collisionPadding = 24,
      ...props
    },
    ref
  ) => (
    <RadixSelect.Portal>
      <RadixSelect.Content
        ref={ref}
        className={cn(
          "bg-ui-bg-component text-ui-fg-base shadow-elevation-flyout relative max-h-[200px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          {
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1":
              position === "popper",
          },
          className
        )}
        position={position}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      >
        <RadixSelect.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
          onScroll={onScroll}
        >
          {children}
        </RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
)
Content.displayName = "Select.Content"

const Label = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Label>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Label>
>(({ className, ...props }, ref) => (
  <RadixSelect.Label
    ref={ref}
    className={cn(
      "txt-compact-xsmall-plus text-ui-fg-muted px-2 py-1.5",
      className
    )}
    {...props}
  />
))
Label.displayName = "Select.Label"

const Item = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadixSelect.Item
      ref={ref}
      className={cn(
        "bg-ui-bg-component txt-compact-small grid cursor-pointer grid-cols-[15px_1fr] items-center gap-x-2 rounded-[4px] px-2 py-1.5 outline-none transition-colors",
        "focus-visible:bg-ui-bg-component-hover",
        "active:bg-ui-bg-component-pressed",
        "data-[state=checked]:txt-compact-small-plus",
        "disabled:text-ui-fg-disabled",
        className
      )}
      {...props}
    >
      <span className="flex h-[15px] w-[15px] items-center justify-center">
        <RadixSelect.ItemIndicator className="flex items-center justify-center">
          <Check />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText className="flex-1 truncate">
        {children}
      </RadixSelect.ItemText>
    </RadixSelect.Item>
  )
})
Item.displayName = "Select.Item"

const Separator = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>
>(({ className, ...props }, ref) => (
  <RadixSelect.Separator
    ref={ref}
    className={cn(
      "bg-ui-border-component border-t-ui-border-menu-top border-b-ui-border-menu-bot -mx-1 my-1 h-0.5 border-b border-t",
      className
    )}
    {...props}
  />
))
Separator.displayName = "Select.Separator"

const Select = Object.assign(Root, {
  Group,
  Value,
  Trigger,
  Content,
  Label,
  Item,
  Separator,
})

export {
  Select,
  Group as SelectGroup,
  Value as SelectValue,
  Trigger as SelectTrigger,
  Content as SelectContent,
  Label as SelectLabel,
  Item as SelectItem,
  Separator as SelectSeparator,
}
