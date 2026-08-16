'use client'
import React, { useEffect, useState } from 'react'
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
  GlobeEurope,
  GridLayout,
  QuestionMark,
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
import { DASHBOARD_MENU_ITEMS, DashboardMenuItem } from '@/lib/dashboard-menu-items'
import { isFeatureAvailable } from '@services/plans/plans'
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
 * grey #fafafa canvas, white nav chip on the active item, 220px sidebar,
 * slim topbar with breadcrumb, white content blocks.
 */

// Medusa shell.tsx: Breadcrumbs — muted 13px medium, TriangleRightMini separators
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

  return (
    <ol className="flex min-w-0 select-none items-center">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <li key={index} className="flex items-center">
            {!isLast && crumb.href ? (
              <Link
                href={crumb.href}
                className="truncate text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate text-[13px] font-medium text-gray-500">
                {crumb.label}
              </span>
            )}
            {!isLast && (
              <span className="mx-2">
                <TriangleRightMini className="h-3.5 w-3.5 text-gray-300 rtl:rotate-180" />
              </span>
            )}
          </li>
        )
      })}
    </ol>
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
  const isFree = plan === 'free'
  const showWatermark = isFree || watermarkConfig !== false

  return (
    <footer className="w-full py-8 mt-12">
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
  const [isFocusMode, setIsFocusMode] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()
  const { rights } = useAdminStatus()
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
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
  const visibleDashboardItems = DASHBOARD_MENU_ITEMS.filter((item: DashboardMenuItem) => {
    if (!item.featureKey) return true
    if (rf?.[item.featureKey]) return rf[item.featureKey].enabled
    return isFeatureAvailable(item.featureKey)
  })

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
  const isFullBleedPage = pathname?.includes('copilot')

  // Focus mode: only render content, hide shell
  if (pathname?.includes('/activity/') && isFocusMode) {
    return <>{children}</>
  }

  return (
    <>
      <div
        className="relative flex min-h-screen w-full flex-col items-start lg:flex-row"
        style={{ ['--brand' as string]: primaryColor || '#6366f1' }}
      >
        {/* Desktop sidebar — Medusa DesktopSidebarContainer (w-[220px] border-e) */}
        <aside
          className="bg-canvas hidden lg:flex sticky top-0 h-screen w-[220px] shrink-0 flex-col border-e border-border"
          style={{ top: topOffset, height: topOffset ? `calc(100vh - ${topOffset}px)` : undefined }}
        >
          <MedusaSidebarContent orgslug={orgslug} />
        </aside>

        {/* Right column */}
        <div className="flex w-full min-w-0 flex-1 flex-col">
          {/* Topbar — Medusa shell.tsx Topbar (grid-cols-2 border-b p-3) */}
          <header
            className="sticky top-0 z-40 grid w-full grid-cols-2 items-center gap-x-2 border-b border-border bg-white px-4 py-3"
            style={{ top: topOffset }}
          >
            <div className="flex min-w-0 items-center gap-x-1.5">
              <div className="lg:hidden">
                <IconButton
                  variant="transparent"
                  size="small"
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                  onClick={toggleMenu}
                >
                  {isMenuOpen ? <XMark /> : <BarsThree />}
                </IconButton>
              </div>
              <BreadcrumbNav orgslug={orgslug} />
            </div>

            <div className="flex items-center justify-end gap-x-1">
              <div className="mr-2 hidden w-56 md:block">
                <SearchBar orgslug={orgslug} className="w-full" />
              </div>

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

              {/* Dashboard Dropdown - Only visible to admins */}
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
                              aria-label={t('common.dashboard')}
                            >
                              <GridLayout />
                            </IconButton>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {t('common.dashboard')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="flex items-center gap-2">
                        <GridLayout className="h-4 w-4" />
                        <span>{t('common.dashboard')}</span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {visibleDashboardItems.map((item) => {
                        const IconComponent = item.icon
                        return (
                          <DropdownMenuItem key={item.id} asChild>
                            <Link href={item.href} className="flex items-center gap-2">
                              <IconComponent size={16} weight="fill" />
                              <span>{t(item.labelKey)}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

          {/* Content */}
          <div className="flex-1 relative" style={{ zIndex: 'var(--z-content)' }}>
            {children}
          </div>

          {/* Footer + watermark */}
          {!isFullBleedPage && <OrgFooter />}
          {!isFullBleedPage && <Watermark />}
        </div>
      </div>

      {/* Mobile drawer — Medusa MobileSidebarContainer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isMenuOpen ? '' : 'pointer-events-none'}`}
        style={{ zIndex: 'var(--z-nav-menu)' }}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`bg-canvas absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col shadow-2xl transition-transform duration-200 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ top: topOffset }}
        >
          <div className="p-3 pb-0">
            <SearchBar orgslug={orgslug} isMobile={true} />
          </div>
          <MedusaSidebarContent orgslug={orgslug} />
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
                className="relative"
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
                  <ChatBubble className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate text-[13px]">{s.title || 'Untitled'}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem key={s.aichat_uuid} asChild>
                  <Link href={getUriWithOrg(orgslug, `/copilot?chat=${s.aichat_uuid}`)} className="flex items-center gap-2">
                    <ChatBubble className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate text-[13px]">{s.title || 'Untitled'}</span>
                  </Link>
                </DropdownMenuItem>
              )
            ))}
            <DropdownMenuSeparator />
          </>
        ) : (
          <div className="px-2 py-3 text-center">
            <p className="text-xs text-gray-400">No conversations yet</p>
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
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors group"
        >
          <span className="text-[13px] text-gray-600 group-hover:text-gray-900 transition-colors">
            Open in bubble
          </span>
          <span
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${
              isBubbleMode ? 'bg-primary' : 'bg-gray-200'
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
