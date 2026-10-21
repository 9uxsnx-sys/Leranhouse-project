'use client'

import { useEffect, useState } from 'react'
import i18n from '@/lib/i18n'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { CourseTranslation, getCourseTranslations } from '@services/courses/translations'

/**
 * Tracks the locale selected in the platform language switcher. There is no
 * second content selector — the dashboard always edits the active language.
 */
export function useContentLocale() {
  const [contentLocale, setContentLocale] = useState(() => (i18n.language || 'en').split('-')[0])

  useEffect(() => {
    const onLanguageChanged = (lng: string) => setContentLocale((lng || 'en').split('-')[0])
    i18n.on('languageChanged', onLanguageChanged)
    return () => {
      i18n.off('languageChanged', onLanguageChanged)
    }
  }, [])

  return contentLocale
}

/**
 * Resolves which content row the dashboard should edit.
 *
 * The base `course` row always holds the source locale; every other locale is a
 * `course_translation` row. The locale comes from the platform language
 * switcher — there is no second selector.
 */
export function useCourseTranslation(courseUuid: string | undefined, sourceLocale: string) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const contentLocale = useContentLocale()

  const normalizedSource = (sourceLocale || 'en').split('-')[0]
  const isSourceLocale = contentLocale === normalizedSource

  const [translation, setTranslation] = useState<CourseTranslation | null>(null)

  useEffect(() => {
    if (isSourceLocale || !courseUuid) {
      setTranslation(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getCourseTranslations(courseUuid, access_token)
        if (!cancelled) setTranslation(rows.find(row => row.locale === contentLocale) || null)
      } catch {
        if (!cancelled) setTranslation(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contentLocale, isSourceLocale, courseUuid, access_token])

  return {
    contentLocale,
    sourceLocale: normalizedSource,
    isSourceLocale,
    translation,
    setTranslation,
  }
}
