'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import {
  Book,
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
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { getAPIUrl, getUriWithOrg } from '@services/config/config'
import { swrFetcher } from '@services/utils/ts/requests'

const LAST_READ_NOTIFICATION_KEY = 'notificationsLastReadAt'

// ─── UUID detection ───────────────────────────────────────────────────────────
// Matches standard UUID format: 8-4-4-4-12 hex chars, optionally with a
// prefix like "course_" or "board_".
const UUID_PATTERN = /^([a-zA-Z]+_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(str: string): boolean {
  return UUID_PATTERN.test(str)
}

// ─── Subpage label map ────────────────────────────────────────────────────────
const SUBPAGE_LABELS: Record<string, Record<string, string>> = {
  courses: {
    general: 'General',
    content: 'Content',
    access: 'Access',
    contributors: 'Contributors',
    seo: 'SEO',
    certification: 'Certification',
    analytics: 'Analytics',
    migrate: 'Migrate',
  },
  boards: {
    general: 'General',
    thumbnail: 'Thumbnail',
    access: 'Access',
    members: 'Members',
  },
  communities: {
    general: 'General',
    access: 'Access',
    course: 'Course',
    moderation: 'Moderation',
  },
  podcasts: {
    general: 'General',
    content: 'Episodes',
    distribution: 'Distribution',
  },
  org: {
    general: 'General',
    branding: 'Branding',
    seo: 'SEO',
    domains: 'Domains',
    automations: 'Automations',
    api: 'API Access',
  },
  users: {
    users: 'Users',
    signups: 'Sign Ups',
    usergroups: 'User Groups',
    roles: 'Roles',
    'audit-logs': 'Audit Logs',
  },
  payments: {
    overview: 'Overview',
    customers: 'Customers',
    transactions: 'Transactions',
    subscriptions: 'Subscriptions',
    offers: 'Offers',
    groups: 'Payment Groups',
    configuration: 'Configuration',
  },
}

function getSubpageLabel(section: string, subpage: string): string {
  return SUBPAGE_LABELS[section]?.[subpage]
    ?? subpage.charAt(0).toUpperCase() + subpage.slice(1).replace(/-/g, ' ')
}

// ─── Entity API helpers ───────────────────────────────────────────────────────
function buildEntityApiUrl(type: string, uuid: string): string {
  const base = getAPIUrl()
  switch (type) {
    case 'course':
      return `${base}courses/course_${uuid}/meta?with_unpublished_activities=false&slim=true`
    case 'board':
      return `${base}boards/board_${uuid}`
    case 'community':
      return `${base}communities/community_${uuid}`
    case 'podcast':
      return `${base}podcasts/podcast_${uuid}/meta`
    case 'assignment':
      return `${base}assignments/assignment_${uuid}`
    default:
      return ''
  }
}

function extractEntityName(type: string, data: any): string {
  switch (type) {
    case 'course':
      return data?.name ?? data?.courseStructure?.name ?? '...'
    case 'board':
      return data?.name ?? '...'
    case 'community':
      return data?.name ?? '...'
    case 'podcast':
      return data?.podcast?.name ?? data?.name ?? '...'
    case 'assignment':
      return data?.title ?? '...'
    default:
      return '...'
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────
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

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
interface Crumb {
  label: string
  href?: string
}

const SECTION_LABELS: Record<string, string> = {
  courses: 'Courses',
  assignments: 'Assignments',
  communities: 'Communities',
  boards: 'Boards',
  podcasts: 'Podcasts',
  playgrounds: 'Playgrounds',
  analytics: 'Analytics',
  payments: 'Payments',
  org: 'Organization',
  users: 'Users',
}

function AdminBreadcrumbNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  if (!pathname) return null

  const orgslug = pathname.split('/')[2]
  const normalized = pathname.replace(/^\/orgs\/[^/]+/, '')
  const segs = normalized.split('/').filter(Boolean)

  // Only render on dashboard pages
  if (segs[0] !== 'dash') return null

  const remaining = segs.slice(1) // everything after 'dash'

  // ── Parse URL structure ─────────────────────────────────────────────────
  // Detect entity type, UUID, section, and subpage from URL segments.
  let entityType: string | null = null
  let entityUuid: string | null = null
  let section: string | null = remaining[0] ?? null
  let subpage: string | null = null

  if (remaining.length >= 2) {
    // courses/course/{uuid}[/{subpage}]
    if (remaining[0] === 'courses' && remaining[1] === 'course' && remaining[2] && isUuid(remaining[2])) {
      entityType = 'course'
      entityUuid = remaining[2]
      subpage = remaining[3] ?? null
    }
    // podcasts/podcast/{uuid}[/{subpage}]
    else if (remaining[0] === 'podcasts' && remaining[1] === 'podcast' && remaining[2] && isUuid(remaining[2])) {
      entityType = 'podcast'
      entityUuid = remaining[2]
      subpage = remaining[3] ?? null
    }
    // communities/{uuid}[/{subpage}]
    else if (remaining[0] === 'communities' && isUuid(remaining[1])) {
      entityType = 'community'
      entityUuid = remaining[1]
      subpage = remaining[2] ?? null
    }
    // boards/{uuid}[/{subpage}]
    else if (remaining[0] === 'boards' && isUuid(remaining[1])) {
      entityType = 'board'
      entityUuid = remaining[1]
      subpage = remaining[2] ?? null
    }
    // assignments/{uuid}
    else if (remaining[0] === 'assignments' && isUuid(remaining[1])) {
      entityType = 'assignment'
      entityUuid = remaining[1]
    }
    // org/settings/{subpage}
    else if (remaining[0] === 'org' && remaining[1] === 'settings' && remaining[2]) {
      subpage = remaining[2]
    }
    // users/settings/{subpage}
    else if (remaining[0] === 'users' && remaining[1] === 'settings' && remaining[2]) {
      subpage = remaining[2]
    }
    // payments/{subpage}
    else if (remaining[0] === 'payments' && remaining[1]) {
      subpage = remaining[1]
    }
    // courses/migrate or other sub-section with a keyword second segment
    else if (remaining[1]) {
      subpage = remaining[1]
    }
  }

  // ── Fetch entity name via SWR ───────────────────────────────────────────
  const swrKey =
    entityType && entityUuid && access_token
      ? buildEntityApiUrl(entityType, entityUuid)
      : null

  const { data: entityData } = useSWR(
    swrKey,
    (url: string) => swrFetcher(url, access_token),
    { revalidateOnFocus: false },
  )

  const entityName = entityData ? extractEntityName(entityType!, entityData) : null

  // ── Build crumb trail ───────────────────────────────────────────────────
  const crumbs: Crumb[] = [
    { label: t('common.home'), href: getUriWithOrg(orgslug, '/') },
    { label: 'Dashboard', href: getUriWithOrg(orgslug, '/dash') },
  ]

  if (section) {
    const sectionLabel = SECTION_LABELS[section] ?? section.charAt(0).toUpperCase() + section.slice(1)

    if (entityType) {
      // Entity detail page: section is a clickable link back to listing
      crumbs.push({ label: sectionLabel, href: getUriWithOrg(orgslug, `/dash/${section}`) })
      crumbs.push({ label: entityName || '...' })
      if (subpage) {
        crumbs.push({ label: getSubpageLabel(section, subpage) })
      }
    } else if (subpage) {
      // Section with subpage (settings, payments): section is a clickable link
      crumbs.push({ label: sectionLabel, href: getUriWithOrg(orgslug, `/dash/${section}`) })
      crumbs.push({ label: getSubpageLabel(section, subpage) })
    } else {
      // Plain section page (analytics, playgrounds, courses listing)
      crumbs.push({ label: sectionLabel })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const isSingle = crumbs.length === 1

  return (
    <nav aria-label="Breadcrumb">
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
    </nav>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
export function AdminTopBar({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <header className={cn('grid w-full grid-cols-2 border-b p-3 bg-ui-bg-subtle', className)}>
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
