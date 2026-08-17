"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"
import { XMark } from "@components/Objects/Icons/MedusaIcons"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("lh-modal-overlay bg-ui-bg-overlay fixed inset-0", className)}
    style={{ zIndex: "var(--z-modal-backdrop)", willChange: "opacity" }}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  // NOTE: Overlay and Content are rendered as direct, sibling children of
  // DialogPortal. Radix wraps *each* child in <Presence> so it can defer
  // unmount until the exit animation finishes. Wrapping them in a single
  // outer <div> would collapse that into one Presence that sees no animation
  // on itself → immediate unmount → no close animation.
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      // Centering uses the standalone `translate` CSS property (not `transform`)
      // so the keyframes can animate `scale` and `opacity` independently
      // without ever touching the centering translate. Keeps shrink-to-fit
      // sizing (`w-auto`) working with `position: fixed`.
      style={{
        zIndex: "var(--z-modal)" as any,
        translate: "-50% -50%",
        willChange: "scale, opacity",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
      onKeyDown={(e) => {
        // Prevent Radix from swallowing keystrokes (e.g. "D") inside form inputs
        const target = e.target as HTMLElement
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
          e.stopPropagation()
        }
      }}
      className={cn(
        "lh-modal-content bg-ui-bg-base shadow-elevation-modal fixed left-[50%] top-[50%] grid w-full max-w-lg gap-0 rounded-lg border border-ui-border-base outline-none",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="text-ui-fg-muted hover:bg-ui-bg-subtle-hover absolute right-4 top-4 rounded-md p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
        aria-label="Close dialog"
      >
        <XMark className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-0 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-ui-fg-base font-medium",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-ui-fg-muted text-sm", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
