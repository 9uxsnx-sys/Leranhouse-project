'use client'

import React, { useEffect, useState } from 'react'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getPodcastAudioStreamUrl } from '@services/media/media'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { formatDuration } from '@services/podcasts/episodes'

export default function PodcastPlayer() {
  const { state, togglePlay, setVolume, closePlayer, audioRef, seekTo } = usePodcastPlayer()
  const org = useOrg() as any
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(1)
  const [isDragging, setIsDragging] = useState(false)

  const { currentEpisode, podcast, isPlaying, currentTime, duration, volume, isVisible } = state

  // Get audio URL — only when audio_file is present
  const audioUrl = currentEpisode && podcast && org && currentEpisode.audio_file
    ? getPodcastAudioStreamUrl(
        org.org_uuid,
        podcast.podcast_uuid,
        currentEpisode.episode_uuid,
        currentEpisode.audio_file
      )
    : ''

  // Sync audioUrl to the audio element's src
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (audio.src !== audioUrl) {
      audio.src = audioUrl
    }
  }, [audioUrl, audioRef])

  // Sync isPlaying state to the audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [isPlaying, audioUrl, audioRef])

  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume)
      setIsMuted(false)
    } else {
      setPreviousVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }

  // Progress percentage for the top timeline bar
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // Handle click/drag on the thin progress bar at the top
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    seekTo(percent * duration)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleProgressClick(e)
  }

  // Global mouse tracking while dragging — allows drag outside the bar
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const bar = document.getElementById('player-progress-bar')
      if (!bar) return
      const rect = bar.getBoundingClientRect()
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

  if (!isVisible || !currentEpisode || !podcast) {
    return null
  }

  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
          preload="metadata"
        />
      )}

      <div className="fixed bottom-0 end-0 z-50 start-0 lg:start-[var(--sidebar-width)] bg-ui-bg-base border-t border-ui-border-base">
        {/* Interactive thin progress bar at the top edge */}
        <div
          id="player-progress-bar"
          className="absolute top-0 left-0 right-0 cursor-pointer group"
          style={{ height: '3px' }}
          onMouseDown={handleMouseDown}
        >
          {/* Track background */}
          <div className="absolute inset-0 top-0 h-full">
            <div
              className="h-full bg-ui-fg-base transition-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Hover area — expands hit target */}
          <div className="absolute inset-0 top-0 transition-all -translate-y-1/2 group-hover:h-[6px]" style={{ height: '3px' }} />
        </div>

        <div className="h-16 px-5 flex items-center pt-0.5 gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-ui-fg-base hover:opacity-80 transition-all"
          >
            {isPlaying ? (
              <Pause size={18} className="text-ui-bg-base" fill="currentColor" />
            ) : (
              <Play size={18} className="text-ui-bg-base ms-0.5" fill="currentColor" />
            )}
          </button>

          {/* Episode title + Podcast name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ui-fg-base truncate leading-tight">
              {currentEpisode.title}
            </p>
            <p className="text-xs text-ui-fg-muted truncate leading-tight mt-0.5">
              {podcast.name}
            </p>
          </div>

          {/* Time */}
          <span className="text-sm text-ui-fg-muted tabular-nums flex-shrink-0">
            {formatDuration(Math.floor(currentTime))}
          </span>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full hover:bg-ui-bg-base-hover transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={15} className="text-ui-fg-muted" />
            ) : (
              <Volume2 size={15} className="text-ui-fg-muted" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={closePlayer}
            className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full hover:bg-ui-bg-base-hover transition-colors"
            title="Close"
          >
            <X size={15} className="text-ui-fg-muted" />
          </button>
        </div>
      </div>
    </>
  )
}
