'use client'
import React, { useEffect, useRef, useState } from 'react'
import CopilotBubble from '@components/Copilot/CopilotBubble'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { getUriWithOrg } from '@services/config/config'
import { fetchRAGChatSessions, RAGChatSession } from '@services/ai/ai'
import { MedusaSidebarContent } from './MedusaSidebar'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { SearchBar } from '@components/Objects/Search/SearchBar'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import {
  BarsThree,
  Book,
  ChatBubble,
  BellAlert,
  BellAlertDone,
  GlobeEurope,
  QuestionMark,
  SidebarLeft,
  TriangleRightMini,
  XMark,
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
import { FeedbackModal } from '@components/Objects/Modals/FeedbackModal'
import { SearchModal } from '@components/Objects/Modals/SearchModal'
import AuthenticatedClientElement from '@components/Security/AuthenticatedClientElement'
import { useJoinBannerVisible, JOIN_BANNER_HEIGHT } from '@components/Objects/Banners/OrgJoinBanner'
import { usePlan } from '@components/Hooks/usePlan'
import Watermark from '@components/Objects/Watermark'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@components/ui/tooltip'

/**
 * LearnHouse port of the Medusa v2.18.0 shell (shell.tsx + main-layout.tsx):
 * h-screen overflow-hidden, grey #fafafa canvas, 220px sidebar, slim grid topbar
 * with breadcrumb + notifications, centered max-w-[1600px] gutter with 12px padding.
 */

// shell.tsx NavigationBar + progress-bar.tsx — top route-change bar
const ProgressBar = () => (
  <div
    className="bg-ui-fg-subtle size-full"
    style={{ animation: 'medusa-progress 2s linear 0.2s forwards' }}
  />
)

const NavigationBar = () => {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      setShow(true)
      const timeout = setTimeout(() => setShow(false), 2400)
      return () => clearTimeout(timeout)
    }
  }, [pathname])

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1">
      {show ? <ProgressBar /> : null}
    </div>
  )
}

// shell.tsx Breadcrumbs — muted 13px medium, TriangleRightMini separators, mobile `...`
const BreadcrumbNav = ({ orgslug }: { orgslug: string }) => {
  const pathname = usePathname()
  const { t } = useTranslation()

  // Derive segments relative to the org base URL (works for single + multi tenancy)
  const orgBase = getUriWithOrg(orgslug, '/')
  const rest = pathname && pathname.startsWith(orgBase) ? pathname.slice(orgBase.length) : (pathname ?? '')
  const segs = rest.split('/').filter(Boolean)

  const labels: Record<string, string> = {
    courses: t('courses.courses'),
    collections: t('collections.collections'),
    podcasts: t('podcasts.podcasts'),
    communities: t('communities.title'),
    playgrounds: 'Playgrounds',
    store: 'Store',
    trail: t('courses.progress'),
    boards: 'Boards',
    copilot: 'Copilot',
  }

  const crumbs: { label: string; href?: string }[] = [
    { label: t('common.home'), href: getUriWithOrg(orgslug, '/') },
  ]

  if (segs.length > 0) {
    const section = segs[0]
    const label = labels[section] ?? section.charAt(0).toUpperCase() + section.slice(1)
    // Last crumb is the current page. On detail pages we show the section label
    // (entity data lives on the page itself).
    crumbs.push({ label })
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

// shell.tsx ToggleSidebar — desktop collapses the sidebar, mobile opens the drawer
const ToggleSidebar = ({
  isMenuOpen,
  onMobileToggle,
  onDesktopToggle,
}: {
  isMenuOpen: boolean
  onMobileToggle: () => void
  onDesktopToggle: () => void
}) => {
  return (
    <div>
      <IconButton
        className="hidden lg:flex"
        variant="transparent"
        size="small"
        aria-label="Toggle sidebar"
        onClick={onDesktopToggle}
      >
        <SidebarLeft className="text-ui-fg-muted rtl:rotate-180" />
      </IconButton>
      <IconButton
        className="hidden max-lg:flex"
        variant="transparent"
        size="small"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        onClick={onMobileToggle}
      >
        <BarsThree className="text-ui-fg-muted" />
      </IconButton>
    </div>
  )
}

// notifications.tsx — bell trigger (no feed yet; unread state kept for when one lands)
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

function OrgFooter() {
  const org = useOrg() as any
  const footerText =
    org?.config?.config?.customization?.general?.footer_text ||
    org?.config?.config?.general?.footer_text ||
    ''
  const plan = usePlan()
  const watermarkConfig =
    org?.config?.config?.customization?.general?.watermark ??
    org?.config?.config?.general?.watermark
  const showWatermark = false

  return (
    <footer className="w-full py-0 mt-0">
      <div className="flex flex-col items-center justify-center space-y-4">
        {footerText && <p className="text-sm text-gray-500">{footerText}</p>}
        {showWatermark && (
          <Link href="https://learnhouse.app" target="_blank" rel="noopener noreferrer">
            <Image
              src="/lrn.svg"
              alt="LearnHouse"
              width={24}
              height={24}
              style={{ height: 'auto' }}
              className="opacity-15 hover:opacity-40 transition-opacity duration-300 cursor-pointer"
            />
          </Link>
        )}
      </div>
    </footer>
  )
}

export const OrgMenu = ({
  orgslug,
  children,
}: {
  orgslug: string
  children: React.ReactNode
}) => {
  const session = useLHSession() as any;
  const org = useOrg() as any;
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()
  const { rights } = useAdminStatus()
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const { isVisible: isJoinBannerVisible } = useJoinBannerVisible()

  // Copilot bubble state
  const [bubbleOpen, setBubbleOpen] = useState(false)
  const [bubbleSessionToLoad, setBubbleSessionToLoad] = useState<string | null>(null)
  const [isBubbleMode, setIsBubbleMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('copilot-bubble-mode')
    return stored === 'true'
  })

  const toggleBubbleMode = (value: boolean) => {
    setIsBubbleMode(value)
    localStorage.setItem('copilot-bubble-mode', String(value))
    if (!value) setBubbleOpen(false)
  }

  const openBubbleWithSession = (sessionUuid?: string) => {
    if (sessionUuid) setBubbleSessionToLoad(sessionUuid)
    setBubbleOpen(true)
  }
  const topOffset = isJoinBannerVisible ? JOIN_BANNER_HEIGHT : 0

  // Get primary color from org config (v2: customization.general.color, v1: general.color)
  const config = org?.config?.config
  const primaryColor = config?.customization?.general?.color || config?.general?.color || ''

  // Filter dashboard menu items by resolved_features from API
  const rf = config?.resolved_features

  useEffect(() => {
    // Only check focus mode if we're in an activity page
    if (typeof window !== 'undefined' && pathname?.includes('/activity/')) {
      const saved = localStorage.getItem('globalFocusMode');
      setIsFocusMode(saved === 'true');
    } else {
      setIsFocusMode(false);
    }

    // Add storage event listener for cross-window changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'globalFocusMode' && pathname?.includes('/activity/')) {
        setIsFocusMode(e.newValue === 'true');
      }
    };

    // Add custom event listener for same-window changes
    const handleFocusModeChange = (e: CustomEvent) => {
      if (pathname?.includes('/activity/')) {
        setIsFocusMode(e.detail.isFocusMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focusModeChange', handleFocusModeChange as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focusModeChange', handleFocusModeChange as EventListener);
    };
  }, [pathname]);

  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen)
  }

  // Pages that use a full-bleed layout (no footer/watermark)
  const isFullBleedPage = pathname?.includes('copilot') || pathname?.includes('/courses')

  // Focus mode: only render content, hide shell
  if (pathname?.includes('/activity/') && isFocusMode) {
    return <>{children}</>
  }

  const shellHeight = topOffset ? `calc(100vh - ${topOffset}px)` : undefined

  return (
    <>
      <NavigationBar />
      <div
        className="relative flex h-screen w-full flex-col items-start overflow-hidden lg:flex-row"
        style={{
          ...(shellHeight ? { height: shellHeight } : {}),
          ['--brand' as string]: primaryColor || '#6366f1',
        }}
      >
        {/* Desktop sidebar — shell.tsx DesktopSidebarContainer (h-screen w-[220px] border-e) */}
        <aside
          className={`hidden h-full w-[240px] shrink-0 flex-col border-e border-ui-border-base ${sidebarCollapsed ? 'lg:hidden' : 'lg:flex'}`}
        >
          <MedusaSidebarContent orgslug={orgslug} onSearchClick={() => setSearchModalOpen(true)} />
        </aside>

        {/* Right column — shell.tsx (flex h-screen w-full flex-col overflow-auto) */}
        <div className="flex h-full w-full flex-col overflow-auto scrollbar-hide min-h-0">
          {/* Topbar — shell.tsx Topbar (grid w-full grid-cols-2 border-b p-3, canvas shows through) */}
          <header className="grid w-full grid-cols-2 border-b p-3">
            <div className="flex items-center gap-x-1.5">
              <ToggleSidebar
                isMenuOpen={isMenuOpen}
                onMobileToggle={toggleMenu}
                onDesktopToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
              <BreadcrumbNav orgslug={orgslug} />
            </div>

            <div className="flex items-center justify-end gap-x-3">
              {/* Notifications bell */}
              <NotificationsBell />

              {/* AI Copilot */}
              {rf?.ai?.enabled && config?.admin_toggles?.ai?.copilot_enabled !== false && (
                <AuthenticatedClientElement checkMethod="authentication">
                  <div className="hidden md:flex">
                    <CopilotMenuButton
                      orgslug={orgslug}
                      isBubbleMode={isBubbleMode}
                      onToggleBubbleMode={toggleBubbleMode}
                      bubbleOpen={bubbleOpen}
                      onOpenBubble={openBubbleWithSession}
                    />
                  </div>
                </AuthenticatedClientElement>
              )}

              {/* Help Dropdown - Only visible to admins/maintainers/instructors */}
              {session?.status === 'authenticated' && rights?.dashboard?.action_access && (
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setFeedbackModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <ChatBubble className="h-4 w-4" />
                        <span>{t('common.help_menu.report_feedback')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </header>

          {/* Content — shell.tsx main + Gutter (max-w-[1600px] p-3 gap-y-3) */}
          <main className="flex flex-1 w-full flex-col items-center">
            <div className="flex w-full max-w-[1600px] flex-col gap-y-3 px-1 py-3 flex-1">
              <div className="flex-1 relative flex flex-col" style={{ zIndex: 'var(--z-content)' }}>
                {children}
              </div>
              {!isFullBleedPage && <OrgFooter />}
              {!isFullBleedPage && <Watermark />}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile drawer — shell.tsx MobileSidebarContainer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isMenuOpen ? '' : 'pointer-events-none'}`}
        style={{ zIndex: 'var(--z-nav-menu)' }}
      >
        <div
          className={`bg-ui-bg-overlay absolute inset-0 transition-opacity duration-200 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`bg-ui-bg-subtle shadow-elevation-modal fixed inset-y-2 start-2 flex w-full max-w-[304px] flex-col overflow-hidden rounded-lg border-r transition-transform duration-200 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-3">
            <div className="flex items-center">
              <IconButton
                size="small"
                variant="transparent"
                className="text-ui-fg-subtle"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <XMark />
              </IconButton>
              <h2 className="sr-only">{t('app.nav.accessibility.title', 'Navigation')}</h2>
            </div>
          </div>
          <MedusaSidebarContent orgslug={orgslug} onSearchClick={() => setSearchModalOpen(true)} />
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
        theme="light"
        userName={session?.data?.user?.username}
        userEmail={session?.data?.user?.email}
      />

      {/* Search modal */}
      <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} orgslug={orgslug} />

      {/* Copilot floating bubble */}
      {isBubbleMode && (
        <CopilotBubble
          orgslug={orgslug}
          open={bubbleOpen}
          onOpenChange={setBubbleOpen}
          sessionToLoad={bubbleSessionToLoad}
        />
      )}
    </>
  )
}

const CopilotMenuButton = ({
  orgslug,
  isBubbleMode,
  onToggleBubbleMode,
  bubbleOpen,
  onOpenBubble,
}: {
  orgslug: string
  isBubbleMode: boolean
  onToggleBubbleMode: (v: boolean) => void
  bubbleOpen: boolean
  onOpenBubble: (sessionUuid?: string) => void
}) => {
  const session = useLHSession() as any
  const accessToken = session?.data?.tokens?.access_token

  const { data: sessions } = useSWR<RAGChatSession[]>(
    accessToken && orgslug ? ['menu-rag-sessions', orgslug] : null,
    () => fetchRAGChatSessions(accessToken, orgslug),
    { revalidateOnFocus: false }
  )

  const recentSessions = (sessions || []).slice(0, 5)

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <IconButton
                variant="transparent"
                size="small"
                aria-label="Copilot"
                className="relative text-ui-fg-muted hover:text-ui-fg-subtle"
              >
                <ChatBubble />
                {/* Active indicator dot */}
                {isBubbleMode && bubbleOpen && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-white dark:ring-neutral-900" />
                )}
              </IconButton>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Copilot
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <ChatBubble className="h-4 w-4" />
          <span>Copilot</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentSessions.length > 0 ? (
          <>
            {recentSessions.map((s) => (
              isBubbleMode ? (
                <DropdownMenuItem
                  key={s.aichat_uuid}
                  onSelect={() => onOpenBubble(s.aichat_uuid)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ChatBubble className="h-3.5 w-3.5 shrink-0 text-ui-fg-muted" />
                  <span className="truncate text-[13px]">{s.title || 'Untitled'}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem key={s.aichat_uuid} asChild>
                  <Link href={getUriWithOrg(orgslug, `/copilot?chat=${s.aichat_uuid}`)} className="flex items-center gap-2">
                    <ChatBubble className="h-3.5 w-3.5 shrink-0 text-ui-fg-muted" />
                    <span className="truncate text-[13px]">{s.title || 'Untitled'}</span>
                  </Link>
                </DropdownMenuItem>
              )
            ))}
            <DropdownMenuSeparator />
          </>
        ) : (
          <div className="px-2 py-3 text-center">
            <p className="text-xs text-ui-fg-muted">No conversations yet</p>
          </div>
        )}

        {/* Primary action */}
        {isBubbleMode ? (
          <DropdownMenuItem
            onSelect={() => onOpenBubble()}
            className="flex items-center gap-2 font-medium cursor-pointer"
          >
            <ChatBubble className="h-4 w-4" />
            <span>{recentSessions.length > 0 ? 'New conversation' : 'Start a conversation'}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={getUriWithOrg(orgslug, '/copilot')} className="flex items-center gap-2 font-medium">
              <ChatBubble className="h-4 w-4" />
              <span>{recentSessions.length > 0 ? 'View all conversations' : 'Start a conversation'}</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Bubble mode toggle */}
        <button
          onClick={() => onToggleBubbleMode(!isBubbleMode)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-ui-bg-subtle-hover transition-fg group"
        >
          <span className="text-[13px] text-ui-fg-subtle group-hover:text-ui-fg-base transition-fg">
            Open in bubble
          </span>
          <span
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${
              isBubbleMode ? 'bg-primary' : 'bg-ui-bg-disabled'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                isBubbleMode ? 'translate-x-3.5' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
