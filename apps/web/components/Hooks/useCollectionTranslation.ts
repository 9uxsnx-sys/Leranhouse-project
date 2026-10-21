'use client'

import { useEffect, useState } from 'react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useContentLocale } from '@components/Hooks/useCourseTranslation'
import {
  CollectionTranslation,
  getCollectionTranslations,
} from '@services/courses/collectionTranslations'

/**
 * Resolves which content row the collection editor should edit.
 *
 * The base `collection` row always holds the source locale
 * (`collection.source_locale`); every other locale is a
 * `collection_translation` row. The locale comes from the platform language
 * switcher — there is no second selector.
 */
export function useCollectionTranslation(
  collectionUuid: string | undefined,
  sourceLocale: string
) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const contentLocale = useContentLocale()
  const normalizedSource = (sourceLocale || 'en').split('-')[0]
  const isSourceLocale = contentLocale === normalizedSource

  const [translation, setTranslation] = useState<CollectionTranslation | null>(null)

  useEffect(() => {
    if (isSourceLocale || !collectionUuid) {
      setTranslation(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getCollectionTranslations(collectionUuid, access_token)
        if (!cancelled) setTranslation(rows.find((row) => row.locale === contentLocale) || null)
      } catch {
        if (!cancelled) setTranslation(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contentLocale, isSourceLocale, collectionUuid, access_token])

  return {
    contentLocale,
    sourceLocale: normalizedSource,
    isSourceLocale,
    translation,
    setTranslation,
  }
}
