/**
 * Course difficulty is a fixed vocabulary, not free-form content.
 *
 * The source locale stores one of `DIFFICULTY_OPTIONS`; the label shown to the
 * reader comes from i18n. Translation locales may hold an authored label
 * (e.g. "مبتدئ") — `difficultyTranslationKey` returns null for anything outside
 * the vocabulary so that authored text passes through untouched.
 */

export const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const

export type DifficultyOption = (typeof DIFFICULTY_OPTIONS)[number]

const DIFFICULTY_KEYS: Record<string, string> = {
  beginner: 'dashboard.courses.general.details.difficulty_beginner',
  intermediate: 'dashboard.courses.general.details.difficulty_intermediate',
  advanced: 'dashboard.courses.general.details.difficulty_advanced',
}

/** Canonical `Beginner | Intermediate | Advanced` value, or null when authored. */
export function canonicalDifficulty(
  value: string | null | undefined
): DifficultyOption | null {
  const normalized = (value || '').trim().toLowerCase()
  return (
    DIFFICULTY_OPTIONS.find((option) => option.toLowerCase() === normalized) ?? null
  )
}

/** i18n key for a canonical difficulty value, or null when it is authored text. */
export function difficultyTranslationKey(value: string | null | undefined): string | null {
  const canonical = canonicalDifficulty(value)
  return canonical ? DIFFICULTY_KEYS[canonical.toLowerCase()] : null
}
