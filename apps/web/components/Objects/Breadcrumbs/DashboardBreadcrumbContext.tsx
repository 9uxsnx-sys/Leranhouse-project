'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Extra dashboard breadcrumbs registered by the current page.
 *
 * The admin top bar derives its trail from the pathname (`Home > Dashboard >
 * Courses > {course} > Content`). Pages that navigate inside their own state —
 * like the course structure editor (module → lesson) — push the remaining
 * crumbs here so the trail can continue past the tab name.
 */
export interface DashCrumb {
  label: string
  href?: string
  /** In-page navigation (state, not URL), e.g. back to the module's lesson list. */
  onClick?: () => void
}

interface DashboardBreadcrumbContextValue {
  trail: DashCrumb[] | null
  setTrail: (trail: DashCrumb[] | null) => void
}

const DashboardBreadcrumbContext = createContext<DashboardBreadcrumbContextValue | null>(null)

export function DashboardBreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [trail, setTrail] = useState<DashCrumb[] | null>(null)
  const value = useMemo(() => ({ trail, setTrail }), [trail])
  return (
    <DashboardBreadcrumbContext.Provider value={value}>
      {children}
    </DashboardBreadcrumbContext.Provider>
  )
}

/** Register the page's extra crumbs. Cleared on unmount so nothing leaks. */
export function useRegisterDashboardBreadcrumb(trail: DashCrumb[]) {
  const ctx = useContext(DashboardBreadcrumbContext)
  const setTrail = ctx?.setTrail

  const signature = trail
    .map((crumb) => `${crumb.label}|${crumb.href ?? ''}|${crumb.onClick ? 1 : 0}`)
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

export function useDashboardBreadcrumbTrail(): DashCrumb[] | null {
  return useContext(DashboardBreadcrumbContext)?.trail ?? null
}
