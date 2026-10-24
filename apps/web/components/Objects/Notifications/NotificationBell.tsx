'use client'
import React, { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import {
  Book,
  Check,
  Spinner,
  BellAlert,
  BellAlertDone,
  InformationCircleSolid,
} from '@components/Objects/Icons/MedusaIcons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@components/ui/dialog'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { swrFetcher } from '@services/utils/ts/requests'
import {
  getNotificationFeedKey,
  getUnreadCountKey,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
  type NotificationFeedResponse,
} from '@services/notifications'
import { cn } from '@/lib/utils'

// ─── Mockup mode ──────────────────────────────────────────────────────────────
// Design preview: renders hardcoded notifications instead of the live feed.
// Flip to `false` to go back to dynamic data.

const MOCK_MODE = true

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    notification_id: 1,
    event_type: 'assignment_graded',
    category: 'learning',
    title: 'Your assignment was graded',
    body: 'Your submission for "Build a responsive navbar" received 18/20.\n\nFeedback from the instructor: the layout and spacing are solid, and the mobile breakpoint behaves as expected. The only note is to use semantic landmarks for the navigation region instead of generic containers.\n\nStructure and naming were clear, and the component split made the code easy to follow. Consider extracting the repeated button styles into a shared class or component.\n\nAccessibility is in good shape overall. Add a visible focus state on the mobile menu trigger and confirm the contrast on the secondary text.\n\nYou can review the full evaluation and the rubric breakdown on the assignment page. Regrading is available for seven days after the result is published.',
    params: {},
    link_url: '/courses',
    created_at: minutesAgo(2),
    read_at: null,
  },
  {
    id: 2,
    notification_id: 2,
    event_type: 'certificate_claimed',
    category: 'achievement',
    title:
      'Your certificate for Advanced Product Design and Prototyping Masterclass is ready to download',
    body: 'Your certificate for "Advanced Product Design and Prototyping Masterclass" has been issued.\n\nThe certificate is available as a PDF from your certificates page and includes the course name, the completion date, and a verification link that employers can check.\n\nThe verification link does not expire. If your name is displayed incorrectly, update it in your profile and reissue the certificate from the same page.\n\nCertificates can be reissued at any time. Previous versions stay valid, so there is nothing to replace if you have already shared a copy.',
    params: {},
    link_url: '/courses',
    created_at: minutesAgo(47),
    read_at: null,
  },
  {
    id: 3,
    notification_id: 3,
    event_type: 'course_enrolled',
    category: 'learning',
    title: 'You are now enrolled in UI Design Fundamentals',
    body: 'You can start learning right away. Your progress is saved automatically, so you can pick up where you left off at any time.',
    params: {},
    link_url: '/courses',
    created_at: minutesAgo(180),
    read_at: minutesAgo(170),
  },
  {
    id: 4,
    notification_id: 4,
    event_type: 'course_completed',
    category: 'achievement',
    title: 'You completed Design Systems 101',
    body: 'Nice work. All lessons and activities in this course are marked as complete.',
    params: {},
    link_url: null,
    created_at: minutesAgo(1560),
    read_at: minutesAgo(1500),
  },
  {
    id: 5,
    notification_id: 5,
    event_type: 'course_update_published',
    category: 'learning',
    title: 'New lesson added to Advanced TypeScript',
    body: 'A new lesson, "Generics in Practice", has been published to a course you are enrolled in.\n\nThe lesson covers constrained generics, default type parameters, and when it is worth reaching for a generic instead of a union. It closes with a short exercise on typing a reusable API client.\n\nThe lesson is about forty minutes long and includes two knowledge checks. Your progress in the rest of the course is unchanged, and you can pick it up from the curriculum page whenever you are ready.',
    params: {},
    link_url: '/courses',
    created_at: minutesAgo(6000),
    read_at: null,
  },
  {
    id: 6,
    notification_id: 6,
    event_type: 'system_maintenance',
    category: 'system',
    title: 'Scheduled maintenance this Sunday',
    body: 'The platform will be briefly unavailable on Sunday between 02:00 and 03:00 UTC while we ship performance improvements.\n\nDuring this window, course pages, certificates, and the mobile apps may fail to load. Any work in progress is saved automatically and will be waiting for you once the maintenance is complete.\n\nLive sessions scheduled inside this window have been moved and their hosts have been notified. No action is needed on your side.\n\nWe will post an update here as soon as the platform is back.',
    params: {},
    link_url: null,
    created_at: minutesAgo(30000),
    read_at: minutesAgo(29000),
  },
  {
    id: 7,
    notification_id: 7,
    event_type: 'discussion_posted',
    category: 'system',
    title: 'New reply in the Design community',
    body: 'Someone replied to your question about spacing scales in the design community.',
    params: {},
    link_url: null,
    created_at: minutesAgo(140000),
    read_at: minutesAgo(139000),
  },
  {
    id: 8,
    notification_id: 8,
    event_type: 'user_signed_up',
    category: 'system',
    title: 'Welcome to the platform',
    body: 'Your account is ready. Browse the course catalog to find something to learn.',
    params: {},
    link_url: '/courses',
    created_at: minutesAgo(600000),
    read_at: minutesAgo(599000),
  },
]

// ─── Category helpers (monochrome, matches the platform chrome) ───────────────

const CATEGORY_LABELS: Record<string, string> = {
  learning: 'Learning',
  achievement: 'Achievement',
  system: 'System',
}

function categoryIcon(category: string) {
  switch ((category || '').toLowerCase()) {
    case 'learning':
      return <Book />
    case 'achievement':
      return <Star />
    default:
      return <InformationCircleSolid />
  }
}

function categoryLabel(category: string) {
  return CATEGORY_LABELS[(category || '').toLowerCase()] || 'Other'
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Compact relative time — 5m, 5h, 2d, 3w, 4mo, 1y. */
function formatRelative(dateStr: string): string {
  const time = new Date(dateStr).getTime()
  if (Number.isNaN(time)) return ''

  const minutes = Math.floor((Date.now() - time) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`

  const weeks = Math.floor(days / 7)
  if (days < 30) return `${weeks}w`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`

  return `${Math.floor(days / 365)}y`
}

// ─── Bell ─────────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { t } = useTranslation()
  const session = useLHSession() as any
  const org = useOrg() as any
  const access_token = session?.data?.tokens?.access_token
  const org_id = org?.id

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<NotificationItem | null>(null)
  const [localReadIds, setLocalReadIds] = useState<Set<number>>(new Set())
  const [markingAll, setMarkingAll] = useState(false)

  const unreadKey = MOCK_MODE ? null : getUnreadCountKey(access_token, org_id)
  const { data: unreadData, mutate: mutateUnread } = useSWR(
    unreadKey,
    (url: string) => swrFetcher(url, access_token),
    { revalidateOnFocus: true, refreshInterval: 30000 }
  )

  const feedKey = MOCK_MODE ? null : getNotificationFeedKey(access_token, org_id, 1, 8)
  const { data: feed, mutate: mutateFeed } = useSWR<NotificationFeedResponse>(
    feedKey,
    (url: string) => swrFetcher(url, access_token),
    { revalidateOnFocus: true }
  )

  const items = useMemo(
    () => (MOCK_MODE ? MOCK_NOTIFICATIONS : feed?.notifications ?? []),
    [feed]
  )

  const isRead = useCallback(
    (notif: NotificationItem) => Boolean(notif.read_at) || localReadIds.has(notif.id),
    [localReadIds]
  )

  const unreadCount = MOCK_MODE
    ? items.filter((n) => !isRead(n)).length
    : Math.max(0, (unreadData?.count ?? 0) - localReadIds.size)

  const markRead = useCallback(
    async (notif: NotificationItem) => {
      if (isRead(notif)) return
      setLocalReadIds((prev) => new Set(prev).add(notif.id))
      if (MOCK_MODE) return
      try {
        await markNotificationAsRead(notif.id, access_token)
      } catch {
        setLocalReadIds((prev) => {
          const next = new Set(prev)
          next.delete(notif.id)
          return next
        })
      }
    },
    [access_token, isRead]
  )

  const handleSelect = useCallback(
    (notif: NotificationItem) => {
      setOpen(false)
      setSelected(notif)
      void markRead(notif)
    },
    [markRead]
  )

  const handleMarkAllRead = useCallback(async () => {
    if (MOCK_MODE) {
      setLocalReadIds(new Set(items.map((n) => n.id)))
      return
    }
    if (!org_id) return
    setMarkingAll(true)
    try {
      await markAllNotificationsAsRead(org_id, access_token)
      setLocalReadIds(new Set(items.map((n) => n.id)))
      mutateUnread()
      mutateFeed()
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false)
    }
  }, [org_id, access_token, items, mutateUnread, mutateFeed])

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative inline-flex h-7 w-7 items-center justify-center rounded-md text-ui-fg-muted hover:bg-gray-100 hover:text-ui-fg-subtle transition-colors focus:outline-none [&_svg]:w-4 [&_svg]:h-4"
            aria-label={t('common.notifications', 'Notifications')}
          >
            {unreadCount > 0 ? <BellAlertDone /> : <BellAlert />}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-gray-900 text-white text-[10px] font-semibold leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[360px] p-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
            <span className="text-sm font-medium text-ui-fg-base">
              {t('notifications.page.title', 'Notifications')}
            </span>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto overscroll-contain p-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <BellAlert className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-sm text-ui-fg-muted">
                  {t('notifications.page.empty_title', 'No notifications yet')}
                </p>
              </div>
            ) : (
              items.map((notif) => {
                const read = isRead(notif)
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleSelect(notif)}
                    className="w-full text-start px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center [&_svg]:w-3.5 [&_svg]:h-3.5">
                        {categoryIcon(notif.category)}
                      </span>

                      <span className="flex-1 min-w-0">
                        <span
                          className={cn(
                            'block text-sm leading-5 truncate',
                            read ? 'text-gray-600' : 'font-medium text-ui-fg-base'
                          )}
                        >
                          {notif.title || notif.event_type}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-[11px] leading-4 text-gray-500">
                          <span>{formatRelative(notif.created_at)}</span>
                          <span className="truncate">{categoryLabel(notif.category)}</span>
                        </span>
                      </span>

                      {!read && (
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Centered detail window */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(next) => {
          if (!next) setSelected(null)
        }}
      >
        <DialogContent
          hideCloseButton
          aria-describedby={undefined}
          className="flex flex-col w-[480px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[85vh] border-0 p-8 rounded-2xl"
        >
          {selected && (
            <>
              <DialogTitle className="shrink-0 text-xl font-semibold tracking-tight text-ui-fg-base leading-snug">
                {selected.title || selected.event_type}
              </DialogTitle>

              {selected.body && (
                <div
                  tabIndex={0}
                  className="mt-6 flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide focus:outline-none"
                >
                  <div className="space-y-4">
                    {selected.body
                      .split(/\n{2,}/)
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index} className="text-[15px] text-gray-600 leading-7 text-pretty">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NotificationBell
