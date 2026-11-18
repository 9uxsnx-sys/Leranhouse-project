'use client'

import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useTheme, type ThemeMode } from '@components/Contexts/ThemeContext'
import {
  HoverMenu,
  HoverMenuContent,
  HoverMenuItem,
} from '@components/ui/hover-menu'

const OPTIONS = [
  { mode: 'light' as ThemeMode, icon: Sun, labelKey: 'common.theme.light' },
  { mode: 'dark' as ThemeMode, icon: Moon, labelKey: 'common.theme.dark' },
  { mode: 'system' as ThemeMode, icon: Monitor, labelKey: 'common.theme.system' },
]

interface ThemeToggleProps {
  /** Narrow sidebar: icon-only trigger that still opens the same menu. */
  collapsed?: boolean
  className?: string
}

/**
 * Theme picker as a sidebar option — the same hover menu used by the language
 * switcher: a normal row that opens a card on hover, with the active mode
 * keeping the hover look instead of a check mark.
 */
export function ThemeToggle({ collapsed = false, className }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const Current = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun

  return (
    <HoverMenu
      align="end"
      className={className}
      content={
        <HoverMenuContent className="w-52">
          {OPTIONS.map(({ mode, icon: Icon, labelKey }) => (
            <HoverMenuItem
              key={mode}
              onClick={() => setTheme(mode)}
              selected={theme === mode}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{t(labelKey)}</span>
              </div>
            </HoverMenuItem>
          ))}
        </HoverMenuContent>
      }
    >
      <button
        aria-label={t('common.theme.label')}
        className={cn(
          'flex items-center w-full rounded-xl text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all group',
          collapsed ? 'justify-center h-10' : 'h-10 px-4 gap-x-2.5'
        )}
      >
        <Current className="w-[18px] h-[18px]" />
        {!collapsed && (
          <span className="text-sm font-medium">{t('common.theme.label')}</span>
        )}
      </button>
    </HoverMenu>
  )
}

export default ThemeToggle
