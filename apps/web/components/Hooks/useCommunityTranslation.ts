'use client'

import { useEffect, useState } from 'react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useContentLocale } from '@components/Hooks/useCourseTranslation'
import {
  CommunityTranslation,
  getCommunityTranslations,
} from '@services/communities/communityTranslations'

/**
 * Resolves which content row the community editor should edit.
 *
 * The base `community` row always holds the source locale
 * (`community.source_locale`); every other locale is a
 * `community_translation` row. The locale comes from the platform language
 * switcher — there is no second selector.
 */
export function useCommunityTranslation(
  communityUuid: string | undefined,
  sourceLocale: string
) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const contentLocale = useContentLocale()
  const normalizedSource = (sourceLocale || 'en').split('-')[0]
  const isSourceLocale = contentLocale === normalizedSource

  const [translation, setTranslation] = useState<CommunityTranslation | null>(null)

  useEffect(() => {
    if (isSourceLocale || !communityUuid) {
      setTranslation(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getCommunityTranslations(communityUuid, access_token)
        if (!cancelled) setTranslation(rows.find((row) => row.locale === contentLocale) || null)
      } catch {
        if (!cancelled) setTranslation(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contentLocale, isSourceLocale, communityUuid, access_token])

  return {
    contentLocale,
    sourceLocale: normalizedSource,
    isSourceLocale,
    translation,
    setTranslation,
  }
}
