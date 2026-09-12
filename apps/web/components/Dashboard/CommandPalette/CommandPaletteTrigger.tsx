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
        className="flex h-9 w-full items-center justify-center rounded-lg text-ui-fg-muted transition-colors hover:bg-ui-bg-subtle-hover hover:text-ui-fg-base"
      >
        <MagnifyingGlass size={16} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={t('dashboard.search.trigger')}
      className="group flex h-9 w-full items-center gap-2.5 rounded-lg bg-ui-bg-subtle-hover px-2.5 text-left transition-colors hover:bg-ui-bg-subtle-hover"
    >
      <MagnifyingGlass size={14} className="shrink-0 text-ui-fg-muted group-hover:text-ui-fg-base" />
      <span className="flex-1 text-[12.5px] font-normal text-ui-fg-muted group-hover:text-ui-fg-base">
        {t('dashboard.search.trigger')}
      </span>
      <kbd className="hidden sm:inline-flex shrink-0 h-[18px] items-center rounded bg-ui-bg-base px-1.5 font-sans text-[10.5px] font-medium leading-none tracking-wide text-ui-fg-muted group-hover:bg-ui-bg-subtle-hover group-hover:text-ui-fg-base">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  )
}
