"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"
import { Label } from "@components/ui/label"
import { Hint } from "@components/ui/hint"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip"
import { InformationCircleSolid } from "@components/Objects/Icons/MedusaIcons"

/**
 * Medusa Form pattern — form.tsx (ported visually).
 *
 * Formik-compatible wrapper that mirrors Medusa's Form.Item / Form.Label /
 * Form.Control / Form.ErrorMessage / Form.Hint structure and styling.
 */

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-2", className)} {...props} />
  )
)
Item.displayName = "Form.Item"

interface LabelProps extends React.ComponentPropsWithoutRef<"label"> {
  optional?: boolean
  tooltip?: React.ReactNode
  tooltipSide?: "top" | "right" | "bottom" | "left"
}

const FormLabel = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, optional, tooltip, tooltipSide = "top", children, ...props }, ref) => (
    <div className="flex items-center gap-x-1">
      <Label size="small" weight="plus" ref={ref} className={cn(className)} {...props}>
        {children}
        {optional && (
          <span className="text-ui-fg-muted">&nbsp;(optional)</span>
        )}
      </Label>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger type="button" className="text-ui-fg-muted hover:text-ui-fg-subtle outline-none">
            <InformationCircleSolid />
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
)
FormLabel.displayName = "Form.Label"

interface ControlProps extends React.ComponentPropsWithoutRef<"div"> {}

const Control = React.forwardRef<HTMLDivElement, ControlProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  )
)
Control.displayName = "Form.Control"

interface ErrorMessageProps extends React.ComponentPropsWithoutRef<"span"> {}

const ErrorMessage = React.forwardRef<HTMLSpanElement, ErrorMessageProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    return (
      <Hint ref={ref} variant="error" className={className} {...props}>
        {children}
      </Hint>
    )
  }
)
ErrorMessage.displayName = "Form.ErrorMessage"

interface HintProps extends React.ComponentPropsWithoutRef<"span"> {}

const FormHint = React.forwardRef<HTMLSpanElement, HintProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    return (
      <Hint ref={ref} variant="info" className={className} {...props}>
        {children}
      </Hint>
    )
  }
)
FormHint.displayName = "Form.Hint"

/**
 * Form.Control passthrough for children that should receive
 * the field's aria wiring (kept for API parity with Medusa).
 */
const FormSlot = Slot

export const Form = Object.assign({}, {
  Item,
  Label: FormLabel,
  Control,
  ErrorMessage,
  Hint: FormHint,
  Slot: FormSlot,
})
