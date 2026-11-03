'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PodcastEpisode } from '@services/podcasts/podcasts'
import { getUriWithOrg } from '@services/config/config'
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

interface EpisodeOutlineSidebarProps {
  episodes: PodcastEpisode[]
  currentEpisodeId: string
  orgslug: string
  podcastUuid: string
  trailData?: any
}

export default function EpisodeOutlineSidebar({
  episodes,
  currentEpisodeId,
  orgslug,
  podcastUuid,
  trailData,
}: EpisodeOutlineSidebarProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const isCompleted = (episodeId: number) => {
    if (!trailData?.runs) return false
    const run = trailData.runs.find((r: any) => {
      const cleanRunPodcastUuid = r.podcast?.podcast_uuid?.replace('podcast_', '')
      return cleanRunPodcastUuid === podcastUuid.replace('podcast_', '')
    })
    if (!run?.steps) return false
    return run.steps.some((s: any) => s.episode_id === episodeId && s.complete === true)
  }

  // Find current episode info
  const currentEpisode = episodes.find(
    (ep) => ep.episode_uuid === currentEpisodeId
  )
  const currentEpNumber = currentEpisode
    ? episodes.findIndex((ep) => ep.episode_uuid === currentEpisodeId) + 1
    : 0

  const cleanPodcastUuid = podcastUuid.replace('podcast_', '')

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-start transition-colors hover:bg-black/[0.02]"
      >
        <div className="min-w-0 flex-1 pe-2">
          <Text weight="plus" size="large" className="text-ui-fg-base truncate block">
            {currentEpisode?.title || t('podcast.episode.episodes', 'Episodes')}
          </Text>
          <Text size="small" className="text-ui-fg-muted block mt-0.5">
            {episodes.length > 0
              ? t('podcast.episode.episode_of', 'Episode {{current}} of {{total}}', { current: currentEpNumber, total: episodes.length })
              : t('podcast.episode.no_episodes', 'No episodes')}
          </Text>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            'text-ui-fg-muted shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4 space-y-0.5">
            {episodes.length === 0 && (
              <Text size="small" className="text-ui-fg-subtle italic">
                {t('podcast.episode.no_episodes_available', 'No episodes available.')}
              </Text>
            )}
            {episodes.map((ep) => {
              const isCurrent = ep.episode_uuid === currentEpisodeId
              const completed = isCompleted(ep.id)

              return (
                <Link
                  key={ep.id}
                  href={getUriWithOrg(orgslug, '') + `/podcast/${cleanPodcastUuid}/episode/${ep.episode_uuid.replace('episode_', '')}`}
                  prefetch={false}
                >
                  <div
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 rounded text-sm cursor-pointer hover:bg-ui-bg-subtle'
                    )}
                  >
                    {isCurrent ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-black flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    ) : completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-ui-fg-muted shrink-0" />
                    )}
                    <span
                      className={cn(
                        'truncate text-xs',
                        isCurrent
                          ? 'text-ui-fg-base font-medium'
                          : completed
                            ? 'text-ui-fg-muted'
                            : 'text-ui-fg-subtle'
                      )}
                    >
                      {ep.episode_number ? `Ep ${ep.episode_number}: ` : ''}{ep.title}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
