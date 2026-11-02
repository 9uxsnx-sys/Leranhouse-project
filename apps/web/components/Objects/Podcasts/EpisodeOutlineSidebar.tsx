'use client'

import React from 'react'
import Link from 'next/link'
import { PodcastEpisode } from '@services/podcasts/podcasts'
import { getUriWithOrg } from '@services/config/config'
import { Check, Play, Headphones } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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

  const isCompleted = (episodeId: number) => {
    if (!trailData?.runs) return false
    const run = trailData.runs.find((r: any) => {
      const cleanRunPodcastUuid = r.podcast?.podcast_uuid?.replace('podcast_', '')
      return cleanRunPodcastUuid === podcastUuid.replace('podcast_', '')
    })
    if (!run?.steps) return false
    return run.steps.some((s: any) => s.episode_id === episodeId && s.complete === true)
  }

  const getPlaybackProgress = (episodeId: number) => {
    if (!trailData?.runs) return null
    const run = trailData.runs.find((r: any) => {
      const cleanRunPodcastUuid = r.podcast?.podcast_uuid?.replace('podcast_', '')
      return cleanRunPodcastUuid === podcastUuid.replace('podcast_', '')
    })
    if (!run?.steps) return null
    const step = run.steps.find((s: any) => s.episode_id === episodeId)
    if (step?.data?.playback_position && step?.data?.duration) {
      return {
        playback_position: step.data.playback_position,
        duration: step.data.duration,
      }
    }
    return null
  }

  const cleanPodcastUuid = podcastUuid.replace('podcast_', '')

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('podcast.episode.episodes', 'Episodes')}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {episodes.length} {t('podcast.episode.total_episodes', 'episodes')}
        </p>
      </div>
      <div className="max-h-[calc(100vh-320px)] overflow-y-auto divide-y divide-gray-50">
        {episodes.map((ep) => {
          const isCurrent = ep.episode_uuid === currentEpisodeId
          const completed = isCompleted(ep.id)
          const progress = getPlaybackProgress(ep.id)

          return (
            <Link
              key={ep.id}
              href={getUriWithOrg(orgslug, '') + `/podcast/${cleanPodcastUuid}/episode/${ep.episode_uuid.replace('episode_', '')}`}
              prefetch={false}
            >
              <div
                className={`flex items-start gap-2.5 px-4 py-2.5 transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-gray-50 border-s-2 border-gray-900 ps-[14px]'
                    : 'hover:bg-gray-50 border-s-2 border-transparent ps-4'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {completed ? (
                    <Check size={13} className="stroke-[3] text-teal-600" />
                  ) : progress ? (
                    <Play size={11} className="text-gray-400 fill-gray-400" />
                  ) : (
                    <div className="w-[13px] h-[13px] rounded-full border-2 border-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    dir="auto"
                    className={`text-xs leading-snug ${
                      isCurrent
                        ? 'font-semibold text-gray-900'
                        : 'font-medium text-gray-600'
                    }`}
                  >
                    {ep.episode_number ? `Ep ${ep.episode_number}: ` : ''}{ep.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                    <Headphones size={10} />
                    <span>
                      {t('podcast.episode.episode_label', 'Episode')} {ep.episode_number || ep.order}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
