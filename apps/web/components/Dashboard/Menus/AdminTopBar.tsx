'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Book,
  ChatBubble,
  BellAlert,
  BellAlertDone,
  GlobeEurope,
  QuestionMark,
  TriangleRightMini,
} from '@components/Objects/Icons/MedusaIcons'
import { DiscordIcon } from '@components/Objects/Icons/DiscordIcon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import { IconButton } from '@components/ui/icon-button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@components/ui/tooltip'
import { cn } from '@/lib/utils'

const LAST_READ_NOTIFICATION_KEY = 'notificationsLastReadAt'

function NotificationsBell() {
  const { t } = useTranslation()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    const lastRead = localStorage.getItem(LAST_READ_NOTIFICATION_KEY)
    const lastReadTs = lastRead ? Date.parse(lastRead) : 0
    setHasUnread(Date.now() > lastReadTs && !!lastRead)
  }, [])

  const handleOnOpen = () => {
    setHasUnread(false)
    localStorage.setItem(LAST_READ_NOTIFICATION_KEY, new Date().toISOString())
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            variant="transparent"
            size="small"
            className="text-ui-fg-muted hover:text-ui-fg-subtle"
            aria-label={t('common.notifications', 'Notifications')}
            onClick={handleOnOpen}
          >
            {hasUnread ? <BellAlertDone /> : <BellAlert />}
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t('common.notifications', 'Notifications')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function AdminBreadcrumbNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  // Strip /orgs/{slug} prefix and /dash prefix
  const normalized = pathname ? pathname.replace(/^\/orgs\/[^/]+\/dash/, '') : ''
  const segs = normalized.split('/').filter(Boolean)

  const labels: Record<string, string> = {
    users: t('common.users'),
    settings: t('common.settings'),
    payments: 'Payments',
    org: t('common.organization'),
    analytics: 'Analytics',
    courses: t('courses.courses'),
    communities: t('communities.title'),
    podcasts: t('podcasts.podcasts'),
    home: t('common.home'),
  }

  const crumbs: { label: string; href?: string }[] = [
    { label: t('common.home'), href: '/dash' },
  ]

  if (segs.length > 0) {
    segs.forEach((seg, i) => {
      const label = labels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
      crumbs.push({ label })
    })
  }

  const isSingle = crumbs.length === 1

  return (
    <ol className="text-ui-fg-muted txt-compact-small-plus flex select-none items-center">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <li key={index} className="flex items-center">
            {!isLast && crumb.href ? (
              <Link
                href={crumb.href}
                className="transition-fg hover:text-ui-fg-subtle"
              >
                {crumb.label}
              </Link>
            ) : (
              <div>
                {!isSingle && <span className="block lg:hidden">...</span>}
                <span className={isSingle ? '' : 'hidden lg:block'}>
                  {crumb.label}
                </span>
              </div>
            )}
            {!isLast && (
              <span className="mx-2">
                <TriangleRightMini className="rtl:rotate-180" />
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function AdminTopBar({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <header className={cn("grid w-full grid-cols-2 border-b p-3", className)}>
      <div className="flex items-center gap-x-1.5">
        <AdminBreadcrumbNav />
      </div>

      <div className="flex items-center justify-end gap-x-3">
        {/* Notifications bell */}
        <NotificationsBell />

        {/* Help Dropdown */}
        <div className="hidden md:flex">
          <DropdownMenu>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      variant="transparent"
                      size="small"
                      className="text-ui-fg-muted hover:text-ui-fg-subtle"
                      aria-label={t('common.help')}
                    >
                      <QuestionMark />
                    </IconButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {t('common.help')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <QuestionMark className="h-4 w-4" />
                <span>{t('common.help')}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a
                  href="https://docs.learnhouse.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Book className="h-4 w-4" />
                  <span>{t('common.help_menu.documentation')}</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://learnhouse.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <GlobeEurope className="h-4 w-4" />
                  <span>{t('common.help_menu.website')}</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://discord.gg/learnhouse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <DiscordIcon size={16} />
                  <span>{t('common.help_menu.discord')}</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
