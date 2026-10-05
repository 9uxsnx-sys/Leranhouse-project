'use client'
import React, { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useCommandPalette } from './CommandPaletteContext'

interface Props {
  isCollapsed?: boolean
}

export default function CommandPaletteTrigger({ isCollapsed = false }: Props) {
  const { t } = useTranslation()
  const { setOpen } = useCommandPalette()
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
    }
  }, [])

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('dashboard.search.trigger')}
        className="flex h-10 w-full items-center justify-center rounded-xl text-ui-fg-subtle transition-colors hover:bg-ui-bg-subtle-hover hover:text-ui-fg-base"
      >
        <MagnifyingGlass size={18} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={t('dashboard.search.trigger')}
      className="group flex h-10 w-full items-center gap-x-2.5 rounded-xl px-4 text-left text-ui-fg-subtle transition-colors hover:bg-ui-bg-subtle-hover hover:text-ui-fg-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-muted/20"
    >
      <MagnifyingGlass size={18} className="shrink-0" />
      <span className="flex-1 text-sm font-medium">
        {t('dashboard.search.trigger')}
      </span>
      <kbd className="hidden sm:inline-flex h-[18px] items-center rounded-md bg-ui-bg-base px-1.5 font-sans text-[10.5px] font-medium leading-none text-ui-fg-muted">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  )
}
