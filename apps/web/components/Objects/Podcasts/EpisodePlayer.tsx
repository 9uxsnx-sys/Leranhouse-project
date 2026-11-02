'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { PodcastEpisode, Podcast } from '@services/podcasts/podcasts'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { getPodcastAudioStreamUrl } from '@services/media/media'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { formatDuration } from '@services/podcasts/episodes'
import { useTranslation } from 'react-i18next'

interface EpisodePlayerProps {
  episode: PodcastEpisode
  podcast: Podcast
}

export default function EpisodePlayer({ episode, podcast }: EpisodePlayerProps) {
  const { t } = useTranslation()
  const { state, play, pause, togglePlay, seekTo, setVolume, audioRef } = usePodcastPlayer()
  const org = useOrg() as any
  const [isDragging, setIsDragging] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const hasSetEpisode = useRef(false)

  const isCurrentEpisode = state.currentEpisode?.episode_uuid === episode.episode_uuid
  const isPlaying = isCurrentEpisode && state.isPlaying
  const currentTime = isCurrentEpisode ? state.currentTime : 0
  const duration = isCurrentEpisode ? state.duration : (episode.duration_seconds || 0)
  const volume = state.volume

  // Build audio URL
  const audioUrl = episode.audio_file && org && podcast
    ? getPodcastAudioStreamUrl(
        org.org_uuid,
        podcast.podcast_uuid,
        episode.episode_uuid,
        episode.audio_file
      )
    : ''

  // Set audio src when URL changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (audio.src !== audioUrl) {
      audio.src = audioUrl
      hasSetEpisode.current = true
    }
  }, [audioUrl, audioRef])

  // Auto-play when audio is loaded and this is the current episode
  useEffect(() => {
    if (!isCurrentEpisode || !audioUrl || !audioRef.current) return

    const audio = audioRef.current

    const handleCanPlay = () => {
      if (state.isPlaying) {
        audio.play().catch(() => {})
      }
    }

    audio.addEventListener('canplay', handleCanPlay)
    return () => audio.removeEventListener('canplay', handleCanPlay)
  }, [isCurrentEpisode, audioUrl, audioRef, state.isPlaying])

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (isPlaying) {
      audio.play().catch(() => {})
    } else if (isCurrentEpisode) {
      audio.pause()
    }
  }, [isPlaying, audioUrl, audioRef, isCurrentEpisode])

  const handlePlayPause = () => {
    if (!isCurrentEpisode) {
      // This is handled by the page component which calls playEpisode
      return
    }
    togglePlay()
  }

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seekTo(percent * duration)
  }, [duration, seekTo])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleProgressClick(e)
  }

  // Handle drag on window level
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current || !duration) return
      const rect = progressRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = Math.max(0, Math.min(1, x / rect.width))
      seekTo(percent * duration)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, duration, seekTo])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
      {/* Audio element */}
      {audioUrl && (
        <audio ref={audioRef} preload="metadata" />
      )}

      {/* Episode title area */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('podcast.episode.now_playing', 'Now Playing')}
        </p>
        <h3 className="text-sm font-bold text-gray-900 mt-0.5 truncate">
          {episode.title}
        </h3>
      </div>

      {/* Main player controls */}
      <div className="px-5 py-4">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-2 bg-gray-100 rounded-full cursor-pointer group mb-3"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute inset-y-0 start-0 bg-indigo-600 rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />
        </div>

        {/* Time labels */}
        <div className="flex justify-between mb-4">
          <span className="text-xs text-gray-400 tabular-nums">
            {formatDuration(Math.floor(currentTime))}
          </span>
          <span className="text-xs text-gray-400 tabular-nums">
            {formatDuration(Math.floor(duration))}
          </span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="relative">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title={volume === 0 ? t('podcast.episode.unmute', 'Unmute') : t('podcast.episode.mute', 'Mute')}
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            {showVolumeSlider && (
              <div className="absolute bottom-full mb-2 start-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 accent-gray-900"
                />
              </div>
            )}
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-3">
            {/* Skip Back 15s */}
            <button
              onClick={() => seekTo(Math.max(0, currentTime - 15))}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title={t('podcast.episode.skip_back', 'Skip back 15s')}
            >
              <SkipBack size={16} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              disabled={!isCurrentEpisode}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={isPlaying ? t('common.pause', 'Pause') : t('common.play', 'Play')}
            >
              {isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ms-0.5" />
              )}
            </button>

            {/* Skip Forward 15s */}
            <button
              onClick={() => seekTo(Math.min(duration, currentTime + 15))}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title={t('podcast.episode.skip_forward', 'Skip forward 15s')}
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Spacer for symmetry */}
          <div className="w-9" />
        </div>
      </div>
    </div>
  )
}
