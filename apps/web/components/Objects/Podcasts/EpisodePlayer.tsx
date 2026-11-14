'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { PodcastEpisode, Podcast } from '@services/podcasts/podcasts'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat } from 'lucide-react'
import { getPodcastAudioStreamUrl } from '@services/media/media'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { formatDuration } from '@services/podcasts/episodes'
import { useTranslation } from 'react-i18next'

interface EpisodePlayerProps {
  episode: PodcastEpisode
  podcast: Podcast
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2]

export default function EpisodePlayer({ episode, podcast }: EpisodePlayerProps) {
  const { t } = useTranslation()
  const { state, playEpisode, play, pause, togglePlay, seekTo, setVolume, setRate, toggleLoop, audioRef } = usePodcastPlayer()
  const org = useOrg() as any
  const [isDragging, setIsDragging] = useState(false)
  const [isAdjustingVolume, setIsAdjustingVolume] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeTrackRef = useRef<HTMLDivElement>(null)
  const lastVolumeRef = useRef(1)
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

  // Progress is drawn from the inline start, so the seek ratio has to follow
  // the reading direction as well (right → left in RTL).
  const seekFromClientX = useCallback((clientX: number) => {
    const bar = progressRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const isRTL = getComputedStyle(bar).direction === 'rtl'
    const ratio = isRTL ? (rect.right - clientX) / rect.width : (clientX - rect.left) / rect.width
    seekTo(Math.max(0, Math.min(1, ratio)) * duration)
  }, [duration, seekTo])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    seekFromClientX(e.clientX)
  }, [seekFromClientX])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleProgressClick(e)
  }

  // Handle drag on window level
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      seekFromClientX(e.clientX)
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
  }, [isDragging, seekFromClientX])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Volume ──
  // Remember the last audible level so the mute button can restore it.
  useEffect(() => {
    if (volume > 0) lastVolumeRef.current = volume
  }, [volume])

  const updateVolumeFromPointer = useCallback((clientX: number) => {
    const track = volumeTrackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const isRTL = getComputedStyle(track).direction === 'rtl'
    const ratio = isRTL ? (rect.right - clientX) / rect.width : (clientX - rect.left) / rect.width
    setVolume(Math.max(0, Math.min(1, ratio)))
  }, [setVolume])

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Capture is best-effort; dragging still works through pointermove.
    }
    setIsAdjustingVolume(true)
    updateVolumeFromPointer(e.clientX)
  }

  const handleVolumePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAdjustingVolume) updateVolumeFromPointer(e.clientX)
  }

  const handleVolumePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsAdjustingVolume(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handleVolumeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.05
    const isRTL = getComputedStyle(e.currentTarget).direction === 'rtl'
    const forward = isRTL ? 'ArrowLeft' : 'ArrowRight'
    const backward = isRTL ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === forward || e.key === 'ArrowUp') {
      e.preventDefault()
      setVolume(Math.min(1, volume + step))
    } else if (e.key === backward || e.key === 'ArrowDown') {
      e.preventDefault()
      setVolume(Math.max(0, volume - step))
    }
  }

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(lastVolumeRef.current || 1)
    } else {
      lastVolumeRef.current = volume
      setVolume(0)
    }
  }

  // ── Keyboard shortcuts ──
  // Space/K play-pause, ←/→ seek 5s, ↑/↓ volume, M mute. Skipped while typing
  // or when a control is focused, so native button/keyboard behaviour wins.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))) return

      const audio = audioRef.current
      const total = audio && Number.isFinite(audio.duration)
        ? audio.duration
        : (episode.duration_seconds || 0)

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault()
          if (isCurrentEpisode) {
            togglePlay()
          } else {
            playEpisode(episode, podcast)
            play()
          }
          break
        case 'ArrowRight':
        case 'ArrowLeft': {
          if (!isCurrentEpisode) break
          e.preventDefault()
          const delta = e.key === 'ArrowRight' ? 5 : -5
          seekTo(Math.max(0, Math.min(total, (audio?.currentTime || 0) + delta)))
          break
        }
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(1, volume + 0.05))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(0, volume - 0.05))
          break
        case 'm':
        case 'M':
          toggleMute()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCurrentEpisode, togglePlay, seekTo, setVolume, volume, toggleMute, play, playEpisode, episode, podcast, audioRef])

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl">
      {/* Audio element */}
      {audioUrl && (
        <audio ref={audioRef} preload="metadata" />
      )}

      {/* Episode title area */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('podcast.episode.now_playing', 'Now Playing')}
        </p>
        <h3 className="text-sm font-medium text-gray-900 mt-0.5 truncate">
          {episode.title}
        </h3>
      </div>

      {/* Main player controls */}
      <div className="px-5 py-4">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-2 bg-gray-100 rounded-full cursor-pointer mb-3"
          onMouseDown={handleMouseDown}
        >
          <div
            className="absolute inset-y-0 start-0 bg-gray-900 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Time labels */}
        <div className="flex justify-between mb-4">
          <span className="text-xs text-gray-500 tabular-nums font-medium">
            {formatDuration(Math.floor(currentTime))}
          </span>
          <span className="text-xs text-gray-400 tabular-nums">
            {formatDuration(Math.floor(duration))}
          </span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          {/* Volume — track slides out of the icon on hover */}
          <div className="relative group/volume">
            <button
              onClick={toggleMute}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title={volume === 0 ? t('podcast.episode.unmute', 'Unmute') : t('podcast.episode.mute', 'Mute')}
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* The padded, slightly overlapping box keeps the hover target
                contiguous with the icon so the track can't vanish mid-reach. */}
            <div
              className="absolute start-full -ms-1 top-1/2 -translate-y-1/2 h-9 w-0 px-2 opacity-0 overflow-hidden pointer-events-none
                flex items-center transition-[width,opacity] duration-200 ease-out
                group-hover/volume:w-24 group-hover/volume:opacity-100 group-hover/volume:pointer-events-auto
                group-focus-within/volume:w-24 group-focus-within/volume:opacity-100 group-focus-within/volume:pointer-events-auto"
            >
              <div
                ref={volumeTrackRef}
                role="slider"
                aria-label={t('podcast.episode.volume', 'Volume')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(volume * 100)}
                tabIndex={0}
                onPointerDown={handleVolumePointerDown}
                onPointerMove={handleVolumePointerMove}
                onPointerUp={handleVolumePointerUp}
                onPointerCancel={handleVolumePointerUp}
                onKeyDown={handleVolumeKeyDown}
                className="relative w-full h-4 flex items-center cursor-pointer touch-none outline-none"
              >
                <div className="h-1 w-full rounded-full bg-gray-200" />
                <div
                  className="absolute h-1 rounded-full bg-gray-900"
                  style={{ insetInlineStart: 0, width: `${volume * 100}%` }}
                />
                <div
                  className="absolute h-2 w-2 rounded-full bg-gray-900"
                  style={{ insetInlineStart: `calc(${volume * 100}% - 4px)` }}
                />
              </div>
            </div>
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

          {/* Speed + loop */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="w-11 h-9 flex items-center justify-center rounded-full text-sm font-medium tabular-nums text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title={t('podcast.episode.playback_speed', 'Playback speed')}
              >
                {state.rate}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full end-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setRate(rate)
                        setShowSpeedMenu(false)
                      }}
                      className={`block w-full text-start px-3 py-1.5 rounded-md text-sm tabular-nums transition-colors cursor-pointer ${
                        state.rate === rate
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleLoop}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                state.isLooping
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={t('podcast.episode.loop', 'Loop episode')}
            >
              <Repeat size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
