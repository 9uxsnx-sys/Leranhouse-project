'use client'
import { useOrg } from '@components/Contexts/OrgContext'
import { useTranslation } from 'react-i18next'
import {
  House,
  BookOpen,
  Users,
  DollarSign,
  Building2,
  Globe,
  HelpCircle,
  PanelLeftClose,
  Check,
  MessageCircle,
  Book,
  MessageCircleMore,
  Headphones,
  BarChart3,
  Search,
  MoreHorizontal,
} from 'lucide-react'
import { DiscordIcon } from '@components/Objects/Icons/DiscordIcon'
import CommandPaletteTrigger from '@components/Dashboard/CommandPalette/CommandPaletteTrigger'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import UserAvatar from '../../Objects/UserAvatar'
import { HeaderProfileBox } from '@components/Security/HeaderProfileBox'
import AdminAuthorization from '@components/Security/AdminAuthorization'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { changeLanguage } from '@/lib/i18n'
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
  HoverMenuLabel,
  HoverMenuSeparator,
} from "@components/ui/hover-menu"
import { FeedbackModal } from '@components/Objects/Modals/FeedbackModal'
import { AVAILABLE_LANGUAGES } from '@/lib/languages'
import { getOrgLogoMediaDirectory } from '@services/media/media'
import { cn } from '@/lib/utils'

import PlanBadge from '@components/Dashboard/Shared/PlanRestricted/PlanBadge'
import { usePlan } from '@components/Hooks/usePlan'

// Nav item base and active classes (light theme variant)
const NAV_BASE =
  'text-ui-fg-subtle hover:bg-ui-bg-subtle-hover flex items-center gap-x-2.5 h-10 px-4 rounded-xl transition-all'
const NAV_ACTIVE = 'text-ui-fg-base'

function DashLeftMenu() {
  const org = useOrg() as any
  const session = useLHSession() as any
  const { t, i18n } = useTranslation()
  const pathname = usePathname() || ''
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isActivePath = (path: string) => {
    if (path === '/dash') {
      return pathname === '/dash' || pathname === '/dash/'
    }
    return pathname === path || pathname.startsWith(path + '/')
  }
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const access_token = session?.data?.tokens?.access_token

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dash-menu-collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('dash-menu-collapsed', String(newState))
  }


  if (!org || !session) return null

  const plan = usePlan()

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

  useEffect(() => {
    const container = navContainerRef.current
    if (!container) return

    const activeLink = container.querySelector('[aria-current="page"]')
    if (activeLink) {
      const navItem = (activeLink as HTMLElement).closest('[data-nav-item]')
      if (navItem) {
        const containerRect = container.getBoundingClientRect()
        const itemRect = navItem.getBoundingClientRect()
        setIndicatorTop(itemRect.top - containerRect.top)
        setIndicatorOpacity(1)
        return
      }
    }
    setIndicatorTop(-9999)
    setIndicatorOpacity(0)
  }, [pathname, isCollapsed, showCommunities, showPodcasts, showPayments])

  return (
    <TooltipProvider delayDuration={0}>
    <nav
      aria-label="Dashboard sidebar navigation"
      className={cn(
        "flex flex-col h-screen sticky top-0 z-overlay border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header with OrgHeader style (matching user sidebar) */}
      <div className="w-full p-3">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <Link
            href={'/'}
            className="bg-ui-bg-subtle transition-fg grid w-full grid-cols-[24px_1fr_15px] items-center gap-x-3 rounded-md p-0.5 pe-2 outline-none hover:bg-ui-bg-subtle-hover focus-visible:shadow-borders-focus"
          >
            {plan === 'enterprise' && org?.logo_image ? (
              <img
                src={getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)}
                alt={org?.name || 'Organization'}
                className="h-6 w-6 rounded-md object-cover"
              />
            ) : (
              <div className="shadow-borders-base flex h-6 w-6 items-center justify-center rounded-md bg-ui-bg-base text-xs font-medium text-ui-fg-muted">
                {(org?.name || 'L').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="block overflow-hidden text-start">
              <span className="text-sm font-medium truncate text-ui-fg-base block">
                {org?.name || 'LearnHouse'}
              </span>
            </div>
            <MoreHorizontal className="w-3.5 h-3.5 text-ui-fg-muted" />
          </Link>
          {!isCollapsed && (
            <button
              aria-label="Collapse sidebar"
              onClick={toggleCollapse}
              className="p-2 rounded-lg text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-all shrink-0"
            >
              <PanelLeftClose className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3">
        <CommandPaletteTrigger isCollapsed={isCollapsed} />
      </div>

      {/* Main Navigation - Vertically Centered */}
      <div className="flex-1 flex flex-col justify-center py-4 px-3">
        <AdminAuthorization authorizationMode="component">
          <div className="relative" ref={navContainerRef}>
            {/* Floating active indicator */}
            <div
              className="absolute left-0 right-0 bg-ui-bg-base shadow-elevation-card-rest rounded-xl transition-all duration-200 ease-out pointer-events-none"
              style={{ top: indicatorTop, height: 40, opacity: indicatorOpacity }}
            />
            <div className="flex flex-col">
              <div className={cn("px-3 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wider text-ui-fg-muted", isCollapsed && "hidden")}>
                General
              </div>
              <div data-nav-item>
                <MenuLink
                  href="/dash"
                  icon={<House className="w-[18px] h-[18px]" />}
                  label={t('common.home')}
                  isCollapsed={isCollapsed}
                  active={isActivePath('/dash')}
                />
              </div>

              {/* Content group label */}
              <div className={cn("px-3 pt-5 pb-1 text-[11px] font-medium uppercase tracking-wider text-ui-fg-muted", isCollapsed && "hidden")}>
                Content
              </div>
              {/* Courses */}
              <div data-nav-item>
                <MenuLink
                  href="/dash/courses"
                  icon={<BookOpen className="w-[18px] h-[18px]" />}
                  label={t('courses.courses')}
                  isCollapsed={isCollapsed}
                  active={isActivePath('/dash/courses')}
                />
              </div>


              {showCommunities && (
                <div data-nav-item>
                  <MenuLink
                    href="/dash/communities"
                    icon={<MessageCircle className="w-[18px] h-[18px]" />}
                    label={t('communities.title')}
                    isCollapsed={isCollapsed}
                    active={isActivePath('/dash/communities')}
                  />
                </div>
              )}
              {showPodcasts && (
                <div data-nav-item>
                  <MenuLink
                    href="/dash/podcasts"
                    icon={<Headphones className="w-[18px] h-[18px]" />}
                    label={t('podcasts.podcasts')}
                    isCollapsed={isCollapsed}
                    active={isActivePath('/dash/podcasts')}
                  />
                </div>
              )}

              {/* Administration group label */}
              <div className={cn("px-3 pt-5 pb-1 text-[11px] font-medium uppercase tracking-wider text-ui-fg-muted", isCollapsed && "hidden")}>
                Administration
              </div>
              {/* Users */}
              <div data-nav-item>
                <MenuLink
                  href="/dash/users/settings/users"
                  icon={<Users className="w-[18px] h-[18px]" />}
                  label={t('common.users')}
                  isCollapsed={isCollapsed}
                  active={isActivePath('/dash/users')}
                />
              </div>

              {/* Payments */}
              <div data-nav-item>
                <MenuLink
                  href="/dash/payments/overview"
                  icon={<DollarSign className="w-[18px] h-[18px]" />}
                  label={t('common.payments')}
                  isCollapsed={isCollapsed}
                  active={isActivePath('/dash/payments')}
                />
              </div>

              {/* Organization */}
              <div data-nav-item>
                <MenuLink
                  href="/dash/org/settings/general"
                  icon={<Building2 className="w-[18px] h-[18px]" />}
                  label={t('common.organization')}
                  isCollapsed={isCollapsed}
                  active={isActivePath('/dash/org')}
                />
              </div>

              {/* Analytics */}
              <div data-nav-item>
                <MenuLink
                  href="/dash/analytics"
                  icon={<BarChart3 className="w-[18px] h-[18px]" />}
                  label="Analytics"
                  isCollapsed={isCollapsed}
                  active={isActivePath('/dash/analytics')}
                />
              </div>
            </div>
          </div>
        </AdminAuthorization>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 py-3 px-3 shrink-0">
        <div className="space-y-1">
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
                <HoverMenuLabel className="flex items-center gap-2 text-ui-fg-base font-medium">
                  <Globe className="w-4 h-4" />
                  <span>{t('common.language')}</span>
                </HoverMenuLabel>
                <HoverMenuSeparator />
                {AVAILABLE_LANGUAGES.map((language) => (
                  <HoverMenuItem
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover transition-colors"
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
                <HoverMenuLabel className="flex items-center gap-2 text-ui-fg-base font-medium">
                  <HelpCircle className="w-4 h-4" />
                  <span>{t('common.help')}</span>
                </HoverMenuLabel>
                <HoverMenuSeparator />
                <HoverMenuItem asChild>
                  <a
                    href="https://docs.learnhouse.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover cursor-pointer transition-colors"
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
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover cursor-pointer transition-colors"
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
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover cursor-pointer transition-colors"
                  >
                    <DiscordIcon size={16} />
                    <span>{t('common.help_menu.discord')}</span>
                  </a>
                </HoverMenuItem>
                <HoverMenuSeparator />
                <HoverMenuItem
                  onClick={() => setFeedbackModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle-hover cursor-pointer transition-colors"
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

          {/* Divider */}
          {!isCollapsed && <div className="border-t border-gray-200 mt-1 mb-3" />}

          {/* User Menu - same style as user sidebar */}
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

export default DashLeftMenu
