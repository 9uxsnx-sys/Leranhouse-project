'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  /** What the user asked for: light, dark, or follow the OS. */
  theme: ThemeMode
  /** What is actually painted right now. */
  resolvedTheme: ResolvedTheme
  setTheme: (mode: ThemeMode) => void
}

const THEME_COOKIE = 'lh_theme'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Stored value, preferring localStorage (instant) over the cookie (SSR). */
function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem(THEME_COOKIE)
    if (isThemeMode(stored)) return stored
  } catch {
    // private mode / storage blocked — fall through to the cookie
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`))
  const fromCookie = match ? decodeURIComponent(match[1]) : null
  return isThemeMode(fromCookie) ? fromCookie : 'light'
}

/**
 * Put the mode on <html> and, when asked, persist it.
 *
 * The cookie is what the server reads to render `class="dark"` on the first
 * paint, so it must be written here and not only in localStorage.
 */
function applyTheme(mode: ThemeMode, persist: boolean) {
  if (typeof window === 'undefined') return

  const dark = mode === 'dark' || (mode === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', dark)

  if (!persist) return

  const secure = window.location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${THEME_COOKIE}=${mode}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
  try {
    window.localStorage.setItem(THEME_COOKIE, mode)
  } catch {
    // non-fatal: the cookie still carries the choice
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The server already painted the right mode, so start from the DOM rather
  // than a hard-coded value to avoid a one-frame flip after hydration.
  const [theme, setThemeState] = useState<ThemeMode>('light')
  const [systemDark, setSystemDark] = useState(false)

  // Sync the real stored mode after hydration and follow OS changes while in
  // system mode. No persist here — reading a preference is not writing one.
  useEffect(() => {
    const stored = readStoredTheme()
    setThemeState(stored)
    applyTheme(stored, false)

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(query.matches)
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  // Re-apply whenever the resolved value changes: mode switch or OS change.
  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'system' && systemDark)
    document.documentElement.classList.toggle('dark', dark)
  }, [theme, systemDark])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
    applyTheme(mode, true)
  }, [])

  const resolvedTheme: ResolvedTheme =
    theme === 'dark' || (theme === 'system' && systemDark) ? 'dark' : 'light'

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return context
}

export { THEME_COOKIE }
