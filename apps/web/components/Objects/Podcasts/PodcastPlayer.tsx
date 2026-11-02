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

  const audioUrl = currentEpisode && podcast && org && currentEpisode.audio_file
    ? getPodcastAudioStreamUrl(
        org.org_uuid,
        podcast.podcast_uuid,
        currentEpisode.episode_uuid,
        currentEpisode.audio_file
      )
    : ''

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (audio.src !== audioUrl) {
      audio.src = audioUrl
    }
  }, [audioUrl, audioRef])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return
    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [isPlaying, audioUrl, audioRef])

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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

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
        <audio ref={audioRef} preload="metadata" />
      )}

      <div className="fixed bottom-0 end-0 z-50 start-0 lg:start-[var(--sidebar-width)] bg-ui-bg-base border-t border-ui-border-base">
        <div className="h-20 px-5 flex gap-4">
          {/* ── Left column: Play button ── */}
          <div className="flex-shrink-0 flex flex-col">
            <div className="h-2" />
            <button
              onClick={togglePlay}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-ui-fg-base hover:opacity-80 transition-all"
            >
              {isPlaying ? (
                <Pause size={18} className="text-ui-bg-base" fill="currentColor" />
              ) : (
                <Play size={18} className="text-ui-bg-base ms-0.5" fill="currentColor" />
              )}
            </button>
            <div className="flex-1" />
          </div>

          {/* ── Right column: Title block + Timeline + Controls ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Top spacer: upper edge → title block */}
            <div className="h-2" />

            {/* ── Title block ── */}
            <div>
              <p className="text-sm font-medium text-ui-fg-base truncate leading-tight">
                {currentEpisode.title}
              </p>
              <p className="text-xs text-ui-fg-muted truncate leading-tight mt-0.5">
                {podcast.name}
              </p>
            </div>

            {/* Middle spacer: title block → timeline */}
            <div className="h-px" />

            {/* ── Timeline + Controls row ── */}
            <div className="flex-shrink-0 flex items-center gap-4">
              <div
                id="player-progress-bar"
                className="flex-1 cursor-pointer group self-stretch flex flex-col justify-center"
                onMouseDown={handleMouseDown}
              >
                <div className="relative w-full h-[5px] bg-ui-border-base rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-ui-fg-base rounded-full transition-none"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div className="absolute inset-0 -top-2 -bottom-2 group-hover:-top-3 group-hover:-bottom-3 transition-all" />
                </div>
              </div>

              <span className="text-sm text-ui-fg-muted tabular-nums flex-shrink-0">
                {formatDuration(Math.floor(currentTime))}
              </span>

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

              <button
                onClick={closePlayer}
                className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full hover:bg-ui-bg-base-hover transition-colors"
                title="Close"
              >
                <X size={15} className="text-ui-fg-muted" />
              </button>
            </div>

            {/* Bottom spacer: timeline → bottom edge */}
            <div className="h-1" />

            {/* Fills remaining container space */}
            <div className="flex-1" />
          </div>
        </div>
      </div>
    </>
  )
}
