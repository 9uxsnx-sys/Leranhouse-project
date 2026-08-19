'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@components/ui/dialog"
import { cn } from "@/lib/utils"

type ModalParams = {
  dialogTitle?: React.ReactNode
  dialogDescription?: string
  dialogContent: React.ReactNode
  dialogClose?: React.ReactNode | null
  dialogTrigger?: React.ReactNode
  addDefCloseButton?: boolean
  onOpenChange: (open: boolean) => void
  isDialogOpen?: boolean
  minHeight?: 'sm' | 'md' | 'lg' | 'xl' | 'no-min'
  minWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'no-min'
  customHeight?: string
  customWidth?: string
  noPadding?: boolean
}

const Modal = (params: ModalParams) => {
  const getMinHeight = () => {
    switch (params.minHeight) {
      case 'sm': return 'md:min-h-[300px]'
      case 'md': return 'md:min-h-[500px]'
      case 'lg': return 'md:min-h-[700px]'
      case 'xl': return 'md:min-h-[900px]'
      default: return ''
    }
  }

  const getMinWidth = () => {
    switch (params.minWidth) {
      case 'sm': return 'md:min-w-[600px]'
      case 'md': return 'md:min-w-[800px]'
      case 'lg': return 'md:min-w-[1000px]'
      case 'xl': return 'md:min-w-[1200px]'
      default: return ''
    }
  }

  const hasFooter = params.dialogClose || params.addDefCloseButton

  return (
    <Dialog open={params.isDialogOpen} onOpenChange={params.onOpenChange}>
      {params.dialogTrigger && (
        <DialogTrigger asChild>{params.dialogTrigger}</DialogTrigger>
      )}
      <DialogContent className={cn(
        "flex flex-col",
        "w-[95vw] max-w-[95vw]",
        "max-h-[90vh]",
        "p-0",
        "overflow-hidden",
        "sm:w-[90vw] sm:max-w-[90vw]",
        "md:w-auto md:max-w-[90vw]",
        "lg:max-w-[85vw]",
        "xl:max-w-[80vw]",
        getMinHeight(),
        getMinWidth(),
        params.customHeight,
        params.customWidth
      )}>
        {/* Header */}
        {params.dialogTitle ? (
          <DialogHeader className="shrink-0 px-4 py-2 border-b border-ui-border-base space-y-0">
            <DialogTitle className="txt-compact-medium-plus text-ui-fg-base">
              {params.dialogTitle}
            </DialogTitle>
            {params.dialogDescription && (
              <DialogDescription className="text-ui-fg-muted text-sm">
                {params.dialogDescription}
              </DialogDescription>
            )}
          </DialogHeader>
        ) : (
          <DialogTitle className="sr-only">Dialog</DialogTitle>
        )}

        {/* Content */}
        <div className={cn(
          "flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          !params.noPadding && "p-5"
        )}>
          {params.dialogContent}
        </div>

        {/* Footer */}
        {hasFooter && (
          <DialogFooter className="shrink-0 border-t border-ui-border-base p-4 flex flex-row items-center justify-end gap-x-2">
            {params.dialogClose}
            {params.addDefCloseButton && (
              <button
                type="button"
                onClick={() => params.onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Close
              </button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default Modal
