'use client'

import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useTheme, type ThemeMode } from '@components/Contexts/ThemeContext'

const OPTIONS = [
  { mode: 'light' as ThemeMode, icon: Sun, labelKey: 'common.theme.light' },
  { mode: 'dark' as ThemeMode, icon: Moon, labelKey: 'common.theme.dark' },
  { mode: 'system' as ThemeMode, icon: Monitor, labelKey: 'common.theme.system' },
]

interface ThemeToggleProps {
  /** Narrow sidebar: one icon that cycles instead of the segmented control. */
  collapsed?: boolean
  className?: string
}

export function ThemeToggle({ collapsed = false, className }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  if (collapsed) {
    const next: ThemeMode = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    const Current = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={t('common.theme.label')}
        title={t(`common.theme.${theme}`)}
        className={cn(
          'flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all',
          className
        )}
      >
        <Current className="w-[18px] h-[18px]" />
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-label={t('common.theme.label')}
      className={cn(
        'flex items-center gap-1 rounded-lg border border-ui-border-base bg-ui-bg-base p-1',
        className
      )}
    >
      {OPTIONS.map(({ mode, icon: Icon, labelKey }) => {
        const isActive = theme === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            aria-pressed={isActive}
            title={t(labelKey)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 h-7 rounded-md text-xs font-medium transition-colors',
              isActive
                ? 'bg-ui-bg-subtle-pressed text-ui-fg-base'
                : 'text-ui-fg-muted hover:bg-ui-bg-base-hover hover:text-ui-fg-base'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{t(labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ThemeToggle
