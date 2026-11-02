'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { PodcastEpisode, Podcast } from '@services/podcasts/podcasts'
import { formatDuration } from '@services/podcasts/episodes'
import { getUriWithOrg } from '@services/config/config'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'

interface EpisodeCardProps {
  episode: PodcastEpisode
  podcast: Podcast
  orgslug: string
  savedProgress?: { playback_position: number; duration: number } | null
}

export default function EpisodeCard({ episode, podcast, orgslug, savedProgress }: EpisodeCardProps) {
  const router = useRouter()
  const { state } = usePodcastPlayer()
  const [isHovered, setIsHovered] = React.useState(false)

  const isCurrentEpisode = state.currentEpisode?.episode_uuid === episode.episode_uuid

  const progress = isCurrentEpisode && state.duration > 0
    ? Math.min(Math.round(state.currentTime / state.duration * 100), 100)
    : 0

  const savedPercent = !isCurrentEpisode && savedProgress && savedProgress.duration > 0
    ? Math.min(Math.round((savedProgress.playback_position / savedProgress.duration) * 100), 100)
    : 0

  const cleanPodcastUuid = podcast.podcast_uuid.replace('podcast_', '')
  const cleanEpisodeUuid = episode.episode_uuid.replace('episode_', '')

  const handleClick = () => {
    router.push(getUriWithOrg(orgslug, '') + `/podcast/${cleanPodcastUuid}/episode/${cleanEpisodeUuid}`)
  }

  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-all duration-200 cursor-pointer ${
        isHovered ? 'bg-black/[0.02]' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main row — always visible */}
      <div className="flex items-center gap-2 px-5 py-3">
        {/* Number */}
        <span
          className={`flex-shrink-0 w-6 text-end text-sm font-semibold leading-none me-1.5 ${
            isCurrentEpisode ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          {episode.episode_number}
        </span>

        {/* Title */}
        <h4
          dir="auto"
          className={`flex-1 min-w-0 text-sm font-medium truncate ${
            isCurrentEpisode ? 'text-indigo-700' : 'text-ui-fg-base'
          }`}
        >
          {episode.title}
        </h4>
      </div>

      {/* Saved progress bar — shown for non-current episodes with saved progress */}
      {savedPercent > 0 && !isCurrentEpisode && (
        <div className="px-5 pb-4">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full"
              style={{ width: `${savedPercent}%` }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-gray-400 tabular-nums">
              {formatDuration(Math.floor(savedProgress!.playback_position))}
            </span>
          </div>
        </div>
      )}

      {/* Expandable progress bar — only visible for the current episode */}
      <div
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCurrentEpisode ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`px-5 pb-4 transition-all duration-300 delay-75 ${
              isCurrentEpisode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
          {/* Progress bar */}
          <div className="h-1 bg-gray-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Time labels */}
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-gray-400 tabular-nums">
              {formatDuration(Math.floor(state.currentTime))}
            </span>
            <span className="text-[11px] text-gray-400 tabular-nums">
              {formatDuration(Math.floor(state.duration))}
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
