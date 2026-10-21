'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import { useContentLocale } from '@components/Hooks/useCourseTranslation'
import {
  PodcastEpisodeTranslation,
  PodcastTranslation,
  getEpisodeTranslations,
  getPodcastTranslations,
} from '@services/podcasts/podcastTranslations'

/**
 * Resolves which content row the podcast editor should edit.
 *
 * The base `podcast` row always holds the source locale
 * (`podcast.source_locale`); every other locale is a `podcast_translation`
 * row. The locale comes from the platform language switcher.
 */
export function usePodcastTranslation(
  podcastUuid: string | undefined,
  sourceLocale: string
) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const contentLocale = useContentLocale()
  const normalizedSource = (sourceLocale || 'en').split('-')[0]
  const isSourceLocale = contentLocale === normalizedSource

  const [translation, setTranslation] = useState<PodcastTranslation | null>(null)

  useEffect(() => {
    if (isSourceLocale || !podcastUuid) {
      setTranslation(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const rows = await getPodcastTranslations(podcastUuid, access_token)
        if (!cancelled) setTranslation(rows.find((row) => row.locale === contentLocale) || null)
      } catch {
        if (!cancelled) setTranslation(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contentLocale, isSourceLocale, podcastUuid, access_token])

  return {
    contentLocale,
    sourceLocale: normalizedSource,
    isSourceLocale,
    translation,
    setTranslation,
  }
}

/**
 * Same contract for one episode. Episodes inherit the podcast source locale,
 * and a missing row simply falls back to the base title/description.
 */
export function useEpisodeTranslation(
  episodeUuid: string | undefined,
  sourceLocale: string
) {
  const session = useLHSession() as any
  const access_token = session?.data?.tokens?.access_token

  const contentLocale = useContentLocale()
  const normalizedSource = (sourceLocale || 'en').split('-')[0]
  const isSourceLocale = contentLocale === normalizedSource

  const [translation, setTranslation] = useState<PodcastEpisodeTranslation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const reload = useCallback(async () => {
    if (isSourceLocale || !episodeUuid) {
      setTranslation(null)
      return
    }
    setIsLoading(true)
    try {
      const rows = await getEpisodeTranslations(episodeUuid, access_token)
      setTranslation(rows.find((row) => row.locale === contentLocale) || null)
    } catch {
      setTranslation(null)
    } finally {
      setIsLoading(false)
    }
  }, [contentLocale, isSourceLocale, episodeUuid, access_token])

  useEffect(() => {
    reload()
  }, [reload])

  return {
    contentLocale,
    sourceLocale: normalizedSource,
    isSourceLocale,
    translation,
    setTranslation,
    reload,
    isLoading,
  }
}
