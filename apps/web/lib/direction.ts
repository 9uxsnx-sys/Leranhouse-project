/**
 * Direction is a function of language — one source of truth for the whole app.
 *
 * Read this instead of scattering `language === 'ar'` checks around the code.
 * Called from both the server layout (to render the first paint) and client
 * components (to react to a language switch), so it stays dependency-free.
 */

export type Direction = 'ltr' | 'rtl'

/** Languages written right-to-left. Arabic is the one we ship today. */
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'] as const

export const DEFAULT_DIRECTION: Direction = 'ltr'

/** `ar-SA` / `ar-EG` → `ar`. Falls back to an empty string for nullish input. */
export function localeCode(language: string | undefined | null): string {
  return (language || '').split('-')[0].toLowerCase()
}

export function getDirection(language: string | undefined | null): Direction {
  const code = localeCode(language)
  return (RTL_LANGUAGES as readonly string[]).includes(code) ? 'rtl' : DEFAULT_DIRECTION
}

export function isRTL(language: string | undefined | null): boolean {
  return getDirection(language) === 'rtl'
}
