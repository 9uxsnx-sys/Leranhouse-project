'use client'

import React, { useState } from 'react'
import { PodcastEpisode, Podcast } from '@services/podcasts/podcasts'
import { formatDuration } from '@services/podcasts/episodes'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { Play, Pause } from 'lucide-react'

interface EpisodeCardProps {
  episode: PodcastEpisode
  podcast: Podcast
}

export default function EpisodeCard({ episode, podcast }: EpisodeCardProps) {
  const { state, playEpisode, togglePlay } = usePodcastPlayer()
  const [isHovered, setIsHovered] = useState(false)

  const isCurrentEpisode = state.currentEpisode?.episode_uuid === episode.episode_uuid
  const isPlaying = isCurrentEpisode && state.isPlaying

  const progress = isCurrentEpisode && state.duration > 0
    ? Math.min(Math.round(state.currentTime / state.duration * 100), 100)
    : 0

  const handlePlay = () => {
    if (isCurrentEpisode) {
      togglePlay()
    } else {
      playEpisode(episode, podcast)
    }
  }

  return (
    <div
      className={`rounded-xl bg-white border transition-all duration-200 cursor-pointer ${
        isHovered
          ? 'border-gray-300 shadow-sm'
          : 'border-black/10'
      }`}
      onClick={handlePlay}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main row — always visible */}
      <div className="flex items-center gap-2 px-4 py-4">
        {/* Number */}
        <span
          className={`flex-shrink-0 w-6 text-right text-[15px] font-semibold leading-none mr-1.5 ${
            isCurrentEpisode ? 'text-indigo-600' : 'text-gray-300'
          }`}
        >
          {episode.episode_number}
        </span>

        {/* Title */}
        <h4
          className={`flex-1 min-w-0 text-[15px] font-medium truncate ${
            isCurrentEpisode ? 'text-indigo-700' : 'text-gray-900'
          }`}
        >
          {episode.title}
        </h4>

        {/* Play / Pause button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePlay()
          }}
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
            isCurrentEpisode
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          }`}
        >
          <div className="relative w-3.5 h-3.5 flex items-center justify-center">
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                isPlaying
                  ? 'opacity-0 rotate-90 scale-0'
                  : 'opacity-100 rotate-0 scale-100'
              }`}
            >
              <Play size={13} fill="currentColor" className="ml-0.5" />
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                isPlaying
                  ? 'opacity-100 rotate-0 scale-100'
                  : 'opacity-0 -rotate-90 scale-0'
              }`}
            >
              <Pause size={13} fill="currentColor" />
            </div>
          </div>
        </button>
      </div>

      {/* Expandable progress bar — only visible for the current episode */}
      <div
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCurrentEpisode ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`px-4 pb-4 transition-all duration-300 delay-75 ${
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
