'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'

/**
 * Breadcrumb model for the learner shell (`(withmenu)`).
 *
 * Two layers:
 *  1. Page-registered trail — entity pages push the exact trail from data they
 *     already hold (course / module / lesson, community / discussion, …).
 *  2. Route-derived trail — a fallback built from the pathname, used on plain
 *     sections and on the first frame before a page registers.
 *
 * The trail excludes `Home`; the top bar always prepends it.
 */
export interface Crumb {
  label: string
  /** Omitted on the current page. Links are only rendered for non-last crumbs. */
  href?: string
  /** Hidden below `lg` — used for the module crumb on lesson pages. */
  mobileHidden?: boolean
}

interface UserBreadcrumbContextValue {
  trail: Crumb[] | null
  setTrail: (trail: Crumb[] | null) => void
}

const UserBreadcrumbContext = createContext<UserBreadcrumbContextValue | null>(null)

export function UserBreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [trail, setTrail] = useState<Crumb[] | null>(null)
  const value = useMemo(() => ({ trail, setTrail }), [trail])
  return <UserBreadcrumbContext.Provider value={value}>{children}</UserBreadcrumbContext.Provider>
}

/**
 * Register the current page's trail (without `Home`).
 * Clears the trail on unmount so a previous page can never leak through.
 */
export function useRegisterBreadcrumb(trail: Crumb[]) {
  const ctx = useContext(UserBreadcrumbContext)
  const setTrail = ctx?.setTrail

  const signature = trail
    .map((crumb) => `${crumb.label}|${crumb.href ?? ''}|${crumb.mobileHidden ? 1 : 0}`)
    .join('~')

  useEffect(() => {
    if (!setTrail) return
    setTrail(trail)
    // `signature` captures the content; `trail` is intentionally omitted so a
    // freshly-created array on every render doesn't re-register endlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, setTrail])

  useEffect(() => {
    return () => {
      setTrail?.(null)
    }
  }, [setTrail])
}

/** Resolve the final trail: page-registered first, route-derived fallback. */
export function useUserBreadcrumb(): Crumb[] {
  const ctx = useContext(UserBreadcrumbContext)
  const pathname = usePathname()
  const { t } = useTranslation()

  const routeTrail = useMemo(() => buildRouteTrail(pathname, t), [pathname, t])

  return ctx?.trail ?? routeTrail
}

// ─── Route-derived fallback ──────────────────────────────────────────────────

const SECTION_KEYS: Record<string, string> = {
  courses: 'courses.courses',
  collections: 'collections.collections',
  podcasts: 'podcasts.podcasts',
  communities: 'communities.title',
  playgrounds: 'common.playgrounds',
  boards: 'common.boards',
  store: 'navigation.breadcrumb.store',
  trail: 'courses.progress',
  search: 'common.search',
  copilot: 'navigation.breadcrumb.copilot',
  account: 'navigation.breadcrumb.account',
}

const ACCOUNT_SUBPAGE_KEYS: Record<string, string> = {
  general: 'account.general',
  profile: 'account.profile',
  security: 'account.security',
  purchases: 'account.purchases',
}

function label(t: (key: string) => string, key: string, fallback: string): string {
  const translated = t(key)
  return translated !== key ? translated : fallback
}

/** Build the trail (without `Home`) from the pathname. */
export function buildRouteTrail(
  pathname: string | null,
  t: (key: string) => string,
): Crumb[] {
  const normalized = (pathname ?? '').replace(/^\/orgs\/[^/]+/, '')
  const segs = normalized.split('/').filter(Boolean)
  if (segs.length === 0) return []

  const section = segs[0]

  // Entity detail pages the UI actually exposes. The page will normally
  // replace these with real names; these are the first-frame fallbacks.
  if (section === 'course') {
    // `/course/{uuid}/activity/end` is the course-completion screen.
    const isCourseEnd = segs[3] === 'end'
    return [
      { label: label(t, 'courses.courses', 'Courses'), href: '/courses' },
      {
        label: isCourseEnd
          ? label(t, 'navigation.breadcrumb.course_complete', 'Course Complete')
          : label(t, 'navigation.breadcrumb.course_fallback', 'Course'),
      },
    ]
  }

  if (section === 'collection') {
    // No `Collections` parent: the listing is not reachable in the learner UI.
    return [{ label: label(t, 'navigation.breadcrumb.collection_fallback', 'Collection') }]
  }

  if (section === 'podcast') {
    return [
      { label: label(t, 'podcasts.podcasts', 'Podcasts'), href: '/podcasts' },
      { label: label(t, 'navigation.breadcrumb.podcast_fallback', 'Podcast') },
    ]
  }

  if (section === 'community') {
    const trail: Crumb[] = [
      { label: label(t, 'communities.title', 'Communities'), href: '/communities' },
      { label: label(t, 'navigation.breadcrumb.community_fallback', 'Community') },
    ]
    if (segs[1] && segs[2] === 'discussion') {
      trail.push({ label: label(t, 'navigation.breadcrumb.discussion_fallback', 'Discussion') })
    }
    return trail
  }

  if (section === 'playground') {
    // No `Playgrounds` parent: the listing is not reachable in the learner UI.
    return [{ label: label(t, 'navigation.breadcrumb.playground_fallback', 'Playground') }]
  }

  if (section === 'store' && segs[1] === 'offers') {
    return [
      { label: label(t, 'navigation.breadcrumb.store', 'Store'), href: '/store' },
      { label: label(t, 'navigation.breadcrumb.offer_fallback', 'Offer') },
    ]
  }

  if (section === 'user') {
    return [{ label: label(t, 'navigation.breadcrumb.profile_fallback', 'Profile') }]
  }

  if (section === 'certificates') {
    return [
      {
        label: label(
          t,
          'navigation.breadcrumb.certificate_verification',
          'Certificate Verification',
        ),
      },
    ]
  }

  if (section === 'account') {
    const trail: Crumb[] = [
      { label: label(t, 'navigation.breadcrumb.account', 'Account'), href: '/account/general' },
    ]
    const subpage = segs[1]
    if (subpage && ACCOUNT_SUBPAGE_KEYS[subpage]) {
      trail.push({ label: label(t, ACCOUNT_SUBPAGE_KEYS[subpage], capitalize(subpage)) })
    }
    return trail
  }

  if (section === 'collections' && segs[1] === 'new') {
    return [
      { label: label(t, 'collections.collections', 'Collections'), href: '/collections' },
      { label: label(t, 'collections.new_collection', 'New Collection') },
    ]
  }

  const mapped = SECTION_KEYS[section]
  if (mapped) {
    return [{ label: label(t, mapped, capitalize(section)) }]
  }

  return [{ label: capitalize(section) }]
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')
}
