'use client'
import { useOrg } from '@components/Contexts/OrgContext'
import { useTranslation } from 'react-i18next'
import {
  House,
  BookOpen,
  Users,
  ShoppingCart,
  Route,
  LayoutDashboard,
  Globe,
  HelpCircle,
  PanelLeftClose,
  Check,
  Book,
  MessageCircleMore,
  Headphones,
} from 'lucide-react'
import { DiscordIcon } from '@components/Objects/Icons/DiscordIcon'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import UserAvatar from '../../Objects/UserAvatar'
import { HeaderProfileBox } from '@components/Security/HeaderProfileBox'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import { changeLanguage } from '@/lib/i18n'
import { getUriWithOrg } from '@services/config/config'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip"
import {
  HoverMenu,
  HoverMenuContent,
  HoverMenuItem,
} from "@components/ui/hover-menu"
import { FeedbackModal } from '@components/Objects/Modals/FeedbackModal'
import { AVAILABLE_LANGUAGES } from '@/lib/languages'
import { getOrgLogoMediaDirectory, getOrgLogoIconMediaDirectory } from '@services/media/media'
import { cn } from '@/lib/utils'

function UserLeftMenu() {
  const org = useOrg() as any
  const session = useLHSession() as any
  const { t, i18n } = useTranslation()
  const rawPathname = usePathname() || ''
  // Strip /orgs/{slug} prefix
  const pathname = rawPathname.replace(/^\/orgs\/[^/]+/, '')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { rights } = useAdminStatus()

  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === ''
    }
    return pathname === path || pathname.startsWith(path + '/')
  }
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const access_token = session?.data?.tokens?.access_token
  const orgslug = org?.slug || ''

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user-menu-collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('user-menu-collapsed', String(newState))
  }

  if (!org || !session) return null

  // Feature visibility from API resolved_features
  const rf = org?.config?.config?.resolved_features
  const isEnabled = (feature: string) => rf?.[feature]?.enabled === true

  const showCommunities = isEnabled('communities')
  const showPodcasts = isEnabled('podcasts')
  const showPayments = isEnabled('payments')

  // Floating indicator: measure active nav item position
  const navContainerRef = useRef<HTMLDivElement>(null)
  const [indicatorTop, setIndicatorTop] = useState(-9999)
  const [indicatorOpacity, setIndicatorOpacity] = useState(0)

  const measureIndicator = useCallback(() => {
    const container = navContainerRef.current
    if (!container) return false

    const activeLink = container.querySelector('[aria-current="page"]')
    if (activeLink) {
      const navItem = (activeLink as HTMLElement).closest('[data-nav-item]')
      if (navItem) {
        const containerRect = container.getBoundingClientRect()
        const itemRect = navItem.getBoundingClientRect()
        setIndicatorTop(itemRect.top - containerRect.top)
        setIndicatorOpacity(1)
        return true
      }
    }
    return false
  }, [])

  useEffect(() => {
    const container = navContainerRef.current
    if (!container) return

    measureIndicator()

    const ro = new ResizeObserver(() => {
      measureIndicator()
    })
    ro.observe(container)

    return () => ro.disconnect()
  }, [pathname, isCollapsed, showCommunities, showPodcasts, showPayments, measureIndicator])

  return (
    <TooltipProvider delayDuration={0}>
    <nav
      aria-label="User sidebar navigation"
      className={cn(
        "flex flex-col h-screen sticky top-0 z-overlay border-r border-gray-200 bg-ui-bg-subtle transition-all duration-300",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("w-full", isCollapsed ? "px-3 pt-4 pb-3" : "pt-5 pb-3")}>
        <div className={cn(
          "flex items-center",
          isCollapsed && "justify-center"
        )}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={'/'} className="flex items-center justify-center py-1">
                  {org?.logo_icon ? (
                    <img
                      src={getOrgLogoIconMediaDirectory(org.org_uuid, org.logo_icon)}
                      alt={org?.name || 'Organization'}
                      className="h-7 w-7 object-contain"
                    />
                  ) : (
                    <span className="text-base font-semibold text-ui-fg-muted">
                      {(org?.name || 'L').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-tooltip bg-ui-bg-base shadow-elevation-card-rest text-ui-fg-base text-xs px-2 py-1">
                {org?.name || 'Organization'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link href={'/'} className="block w-full px-3 outline-none">
              {org?.logo_image ? (
                <div className="flex items-center justify-center w-full">
                  <img
                    src={getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)}
                    alt={org?.name || 'Organization'}
                    className="max-w-[180px] max-h-14 w-auto h-auto object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-x-3">
                  <div className="shadow-borders-base flex h-8 w-8 items-center justify-center rounded-md bg-ui-bg-base text-sm font-semibold text-ui-fg-muted">
                    {(org?.name || 'L').slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-ui-fg-base truncate">
                    {org?.name || 'LearnHouse'}
                  </span>
                </div>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Main Navigation - Vertically Centered */}
      <div className="flex-1 flex flex-col justify-center py-4 px-3">
        <div className="relative" ref={navContainerRef}>
          {/* Floating active indicator */}
          <div
            className="absolute left-0 right-0 bg-ui-bg-base shadow-elevation-card-rest rounded-xl transition-all duration-200 ease-out pointer-events-none"
            style={{ top: indicatorTop, height: 40, opacity: indicatorOpacity }}
          />
          <div className="flex flex-col">
            {/* General group */}
            <div className={cn("px-3 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wider text-ui-fg-muted", isCollapsed && "hidden")}>
              General
            </div>
            <div data-nav-item>
              <MenuLink
                href={getUriWithOrg(orgslug, '/')}
                icon={<House className="w-[18px] h-[18px]" />}
                label={t('common.home')}
                isCollapsed={isCollapsed}
                active={isActivePath('/')}
              />
            </div>

            {/* Content group label */}
            <div className={cn("px-3 pt-5 pb-1 text-[11px] font-medium uppercase tracking-wider text-ui-fg-muted", isCollapsed && "hidden")}>
              Content
            </div>
            {/* Courses */}
            <div data-nav-item>
              <MenuLink
                href={getUriWithOrg(orgslug, '/courses')}
                icon={<BookOpen className="w-[18px] h-[18px]" />}
                label={t('courses.courses')}
                isCollapsed={isCollapsed}
                active={isActivePath('/courses')}
              />
            </div>

            {showCommunities && (
              <div data-nav-item>
                <MenuLink
                  href={getUriWithOrg(orgslug, '/communities')}
                  icon={<Users className="w-[18px] h-[18px]" />}
                  label={t('communities.title')}
                  isCollapsed={isCollapsed}
                  active={isActivePath('/communities')}
                />
              </div>
            )}
            {showPodcasts && (
              <div data-nav-item>
                <MenuLink
                  href={getUriWithOrg(orgslug, '/podcasts')}
                  icon={<Headphones className="w-[18px] h-[18px]" />}
                  label={t('podcasts.podcasts')}
                  isCollapsed={isCollapsed}
                  active={isActivePath('/podcasts')}
                />
              </div>
            )}

            {/* Store */}
            {showPayments && (
              <div data-nav-item>
                <MenuLink
                  href={getUriWithOrg(orgslug, '/store')}
                  icon={<ShoppingCart className="w-[18px] h-[18px]" />}
                  label="Store"
                  isCollapsed={isCollapsed}
                  active={isActivePath('/store')}
                />
              </div>
            )}

            {/* Trail / Progress */}
            <div data-nav-item>
              <MenuLink
                href={getUriWithOrg(orgslug, '/trail')}
                icon={<Route className="w-[18px] h-[18px]" />}
                label={t('courses.progress')}
                isCollapsed={isCollapsed}
                active={isActivePath('/trail')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 py-3 px-3 shrink-0">
        <div className="space-y-1">
          {/* Collapse sidebar button (expanded state) */}
          {!isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Collapse sidebar"
                  onClick={toggleCollapse}
                  className="flex items-center w-full h-10 px-4 gap-x-2.5 rounded-xl text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all"
                >
                  <PanelLeftClose className="w-[18px] h-[18px]" />
                  <span className="text-sm font-medium">{t('common.collapse')}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-tooltip bg-ui-bg-base shadow-elevation-card-rest text-ui-fg-base text-xs px-2 py-1">
                {t('common.collapse')}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Expand sidebar"
                  onClick={toggleCollapse}
                  className="flex items-center justify-center w-full h-10 rounded-lg text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all"
                >
                  <PanelLeftClose className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-tooltip bg-ui-bg-base shadow-elevation-card-rest text-ui-fg-base text-xs px-2 py-1">
                {t('common.expand')}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Language Switcher with hover menu */}
          <HoverMenu
            align="end"
            content={
              <HoverMenuContent className="w-64 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {AVAILABLE_LANGUAGES.map((language) => (
                  <HoverMenuItem
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className="justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{language.nativeName}</span>
                      <span className="text-xs text-ui-fg-muted">{t(language.translationKey)}</span>
                    </div>
                    {i18n.language.split('-')[0] === language.code && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </HoverMenuItem>
                ))}
              </HoverMenuContent>
            }
          >
            <button aria-label="Open language menu" className={cn(
              "flex items-center w-full rounded-xl text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all group",
              isCollapsed ? "justify-center h-10" : "h-10 px-4 gap-x-2.5"
            )}>
              <Globe className="w-[18px] h-[18px]" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{t('common.language')}</span>
              )}
            </button>
          </HoverMenu>

          {/* Help with hover menu */}
          <HoverMenu
            align="end"
            content={
              <HoverMenuContent className="w-56">
                <HoverMenuItem asChild>
                  <a
                    href="https://docs.learnhouse.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Book className="w-4 h-4" />
                    <span>{t('common.help_menu.documentation')}</span>
                  </a>
                </HoverMenuItem>
                <HoverMenuItem asChild>
                  <a
                    href="https://learnhouse.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{t('common.help_menu.website')}</span>
                  </a>
                </HoverMenuItem>
                <HoverMenuItem asChild>
                  <a
                    href="https://discord.gg/learnhouse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <DiscordIcon size={16} />
                    <span>{t('common.help_menu.discord')}</span>
                  </a>
                </HoverMenuItem>
                <HoverMenuItem
                  onClick={() => setFeedbackModalOpen(true)}
                >
                  <MessageCircleMore className="w-4 h-4" />
                  <span>{t('common.help_menu.report_feedback')}</span>
                </HoverMenuItem>
              </HoverMenuContent>
            }
          >
            <button aria-label="Open help menu" className={cn(
              "flex items-center w-full rounded-xl text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all group",
              isCollapsed ? "justify-center h-10" : "h-10 px-4 gap-x-2.5"
            )}>
              <HelpCircle className="w-[18px] h-[18px]" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{t('common.help')}</span>
              )}
            </button>
          </HoverMenu>

          {/* Dashboard shortcut for admins */}
          {rights?.dashboard?.action_access && (
            <>
              {!isCollapsed && <div className="border-t border-gray-200 mt-1 mb-3" />}
              <div data-nav-item>
                <MenuLink
                  href={getUriWithOrg(orgslug, '/dash')}
                  icon={<LayoutDashboard className="w-[18px] h-[18px]" />}
                  label={t('common.dashboard')}
                  isCollapsed={isCollapsed}
                />
              </div>
            </>
          )}

          {/* Divider */}
          {!isCollapsed && <div className="border-t border-gray-200 mt-1 mb-3" />}

          {/* User Menu */}
          {!isCollapsed && <HeaderProfileBox />}
          {isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center w-full h-10 rounded-lg text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all">
                  <UserAvatar width={24} rounded="rounded-full" shadow="shadow-none" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-tooltip bg-ui-bg-base shadow-elevation-card-rest text-ui-fg-base text-xs px-2 py-1">
                {session?.data?.user?.username || 'User'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </nav>

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
        theme="light"
        userName={session?.data?.user?.username}
        userEmail={session?.data?.user?.email}
      />
    </TooltipProvider>
  )
}

const MenuLink = ({ href, icon, label, isCollapsed, isExternal, active }: {
  href: string
  icon: React.ReactNode
  label: string
  isCollapsed: boolean
  isExternal?: boolean
  active?: boolean
}) => {
  const content = (
    <div
      className={cn(
        "relative flex items-center w-full rounded-xl transition-all",
        active
          ? "text-ui-fg-base"
          : "text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover",
        isCollapsed ? "justify-center h-10" : "h-10 px-4 gap-x-2.5"
      )}
    >
      {icon}
      {!isCollapsed && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </div>
  )

  const ariaCurrent = active ? 'page' : undefined
  const linkElement = isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {content}
    </a>
  ) : (
    <Link aria-label={label} aria-current={ariaCurrent} href={href}>
      {content}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkElement}
        </TooltipTrigger>
        <TooltipContent side="right" className="z-tooltip bg-ui-bg-base shadow-elevation-card-rest text-ui-fg-base text-xs px-2 py-1">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkElement
}

export default UserLeftMenu
