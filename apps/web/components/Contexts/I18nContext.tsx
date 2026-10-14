'use client'

import React, { useEffect, useState } from 'react'
import { DirectionProvider } from '@radix-ui/react-direction'
import i18n from '../../lib/i18n'
import { getDirection, localeCode } from '../../lib/direction'

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState(i18n.language)

  // Listen for language changes to force re-render of the entire tree.
  // (English is bundled at module load; non-English bundles load lazily and
  // translations swap in when ready via react-i18next's `useSuspense: false`
  // — no need to block initial render on the locale fetch.)
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLang(lng)
    }
    i18n.on('languageChanged', handleLanguageChanged)
    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  // Keep <html lang/dir> in sync when the language changes at runtime (the
  // language switcher, or the org default applied by OrgLanguageSync). The
  // server already rendered the right values from the cookie; this covers
  // in-app switches without a reload.
  useEffect(() => {
    const language = localeCode(lang) || 'en'
    document.documentElement.lang = language
    document.documentElement.dir = getDirection(language)
  }, [lang])

  // Radix overlays (dropdowns, selects, popovers, tooltips) read direction from
  // this provider — without it, submenu placement and arrow-key handling stay LTR.
  return <DirectionProvider dir={getDirection(lang)}>{children}</DirectionProvider>
}
