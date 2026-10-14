export interface Language {
  code: string
  translationKey: string
  nativeName: string
}

/**
 * The languages the platform ships.
 *
 * Keep this in sync with `supportedLngs` in `lib/i18n.ts` — the platform only
 * ships these three. Other locale files still exist under `locales/`, but they
 * are unreachable until re-added here.
 */
export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', translationKey: 'common.english', nativeName: 'English' },
  { code: 'fr', translationKey: 'common.french', nativeName: 'Français' },
  { code: 'ar', translationKey: 'common.arabic', nativeName: 'العربية' },
]

export const getLanguageByCode = (code: string): Language | undefined => {
  return AVAILABLE_LANGUAGES.find(lang => lang.code === code)
}

export const getCurrentLanguageNativeName = (currentLang: string): string => {
  const language = getLanguageByCode(currentLang)
  return language?.nativeName || 'English'
}

