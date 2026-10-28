'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePodcastPlayer } from '@components/Contexts/PodcastPlayerContext'
import { useOrg } from '@components/Contexts/OrgContext'
import { getPodcastAudioStreamUrl } from '@services/media/media'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react'
import { formatDuration } from '@services/podcasts/episodes'
import WaveSurfer from 'wavesurfer.js'

export default function PodcastPlayer() {
  const { state, togglePlay, seekTo, setVolume, closePlayer, toggleMinimize, audioRef } = usePodcastPlayer()
  const org = useOrg() as any
  const waveformRef = useRef<HTMLDivElement>(null)
  const miniWaveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const miniWavesurferRef = useRef<WaveSurfer | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(1)

  const { currentEpisode, podcast, isPlaying, currentTime, duration, volume, isMinimized, isVisible } = state

  // Get audio URL — only when audio_file is present
  const audioUrl = currentEpisode && podcast && org && currentEpisode.audio_file
    ? getPodcastAudioStreamUrl(
        org.org_uuid,
        podcast.podcast_uuid,
        currentEpisode.episode_uuid,
        currentEpisode.audio_file
      )
    : ''

  // Progress percentage for the top bar
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // Initialize WaveSurfer for expanded view
  useEffect(() => {
    if (!waveformRef.current || !audioUrl || isMinimized) return

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
    }

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'var(--color-ui-border-base)',
      progressColor: 'var(--color-ui-fg-base)',
      cursorColor: 'var(--color-ui-fg-base)',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 32,
      normalize: true,
      backend: 'MediaElement',
      media: audioRef.current || undefined,
    })

    wavesurferRef.current = wavesurfer
    wavesurfer.load(audioUrl)

    wavesurfer.on('click', () => {
      const time = wavesurfer.getCurrentTime()
      seekTo(time)
    })

    return () => {
      wavesurfer.destroy()
    }
  }, [audioUrl, isMinimized])

  // Initialize mini WaveSurfer for minimized view
  useEffect(() => {
    if (!miniWaveformRef.current || !audioUrl || !isMinimized) return

    if (miniWavesurferRef.current) {
      miniWavesurferRef.current.destroy()
    }

    const wavesurfer = WaveSurfer.create({
      container: miniWaveformRef.current,
      waveColor: 'var(--color-ui-border-base)',
      progressColor: 'var(--color-ui-fg-base)',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 20,
      normalize: true,
      backend: 'MediaElement',
      media: audioRef.current || undefined,
    })

    miniWavesurferRef.current = wavesurfer
    wavesurfer.load(audioUrl)

    wavesurfer.on('click', () => {
      const time = wavesurfer.getCurrentTime()
      seekTo(time)
    })

    return () => {
      wavesurfer.destroy()
    }
  }, [audioUrl, isMinimized])

  // Sync play/pause state with WaveSurfer
  useEffect(() => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.play()
      } else {
        wavesurferRef.current.pause()
      }
    }
    if (miniWavesurferRef.current) {
      if (isPlaying) {
        miniWavesurferRef.current.play()
      } else {
        miniWavesurferRef.current.pause()
      }
    }
  }, [isPlaying])

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

  const skipForward = () => {
    seekTo(Math.min(currentTime + 15, duration))
  }

  const skipBackward = () => {
    seekTo(Math.max(currentTime - 15, 0))
  }

  if (!isVisible || !currentEpisode || !podcast) {
    return null
  }

  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
        />
      )}

      <div className="fixed bottom-0 start-0 end-0 bg-ui-bg-base border-t border-ui-border-base shadow-elevation-flyout z-50">
        {/* Full-width thin progress bar at the top */}
        <div className="absolute top-0 start-0 end-0 h-[3px] bg-ui-border-base">
          <div
            className="h-full bg-ui-fg-base transition-[width] duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isMinimized ? (
          /* ── Minimized view ── */
          <div className="h-14 max-w-7xl mx-auto px-4 flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-ui-fg-base hover:opacity-80 transition-all"
            >
              {isPlaying ? (
                <Pause size={16} className="text-ui-bg-base" fill="currentColor" />
              ) : (
                <Play size={16} className="text-ui-bg-base ms-0.5" fill="currentColor" />
              )}
            </button>

            <div ref={miniWaveformRef} className="flex-1 cursor-pointer min-w-[60px]" />

            <span className="txt-compact-xsmall text-ui-fg-muted tabular-nums flex-shrink-0">
              {formatDuration(Math.floor(currentTime))}
            </span>

            <button
              onClick={toggleMute}
              className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full hover:bg-ui-bg-base-hover transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={14} className="text-ui-fg-muted" />
              ) : (
                <Volume2 size={14} className="text-ui-fg-muted" />
              )}
            </button>

            <button
              onClick={toggleMinimize}
              className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full hover:bg-ui-bg-base-hover transition-colors"
              title="Expand"
            >
              <Maximize2 size={14} className="text-ui-fg-muted" />
            </button>
            <button
              onClick={closePlayer}
              className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full hover:bg-ui-bg-base-hover transition-colors"
              title="Close"
            >
              <X size={14} className="text-ui-fg-muted" />
            </button>
          </div>
        ) : (
          /* ── Expanded view ── */
          <div className="pt-1.5 pb-3">
            <div className="max-w-7xl mx-auto px-5">
              {/* Row 1: Controls + Episode info + Volume + Actions */}
              <div className="flex items-center gap-1.5 py-2">
                <button
                  onClick={skipBackward}
                  className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full hover:bg-ui-bg-base-hover transition-colors"
                  title="Skip back 15s"
                >
                  <SkipBack size={18} className="text-ui-fg-subtle" />
                </button>

                <button
                  onClick={togglePlay}
                  className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-ui-fg-base hover:opacity-80 transition-all"
                >
                  {isPlaying ? (
                    <Pause size={20} className="text-ui-bg-base ms-0.5" fill="currentColor" />
                  ) : (
                    <Play size={20} className="text-ui-bg-base ms-0.5" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={skipForward}
                  className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full hover:bg-ui-bg-base-hover transition-colors"
                  title="Skip forward 15s"
                >
                  <SkipForward size={18} className="text-ui-fg-subtle" />
                </button>

                <span className="txt-compact-small-plus text-ui-fg-base truncate text-center flex-1 mx-2">
                  {currentEpisode.title}
                  <span className="text-ui-fg-muted mx-1.5 font-normal">·</span>
                  <span className="text-ui-fg-muted font-normal">{podcast.name}</span>
                </span>

                <button
                  onClick={toggleMute}
                  className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full hover:bg-ui-bg-base-hover transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={18} className="text-ui-fg-subtle" />
                  ) : (
                    <Volume2 size={18} className="text-ui-fg-subtle" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value)
                    setVolume(newVolume)
                    setIsMuted(newVolume === 0)
                  }}
                  className="w-20 h-1 bg-ui-border-base rounded-full appearance-none cursor-pointer accent-ui-fg-base flex-shrink-0
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-ui-fg-base
                    [&::-webkit-slider-thumb]:shadow-elevation-card-rest
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-ui-fg-base
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:shadow-elevation-card-rest"
                />

                <button
                  onClick={toggleMinimize}
                  className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full hover:bg-ui-bg-base-hover transition-colors"
                  title="Minimize"
                >
                  <Minimize2 size={18} className="text-ui-fg-subtle" />
                </button>
                <button
                  onClick={closePlayer}
                  className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-full hover:bg-ui-bg-base-hover transition-colors"
                  title="Close"
                >
                  <X size={18} className="text-ui-fg-subtle" />
                </button>
              </div>

              {/* Row 2: Time + Waveform + Total duration */}
              <div className="flex items-center justify-between px-0.5">
                <span className="txt-compact-xsmall text-ui-fg-muted tabular-nums w-12">
                  {formatDuration(Math.floor(currentTime))}
                </span>
                <div ref={waveformRef} className="flex-1 cursor-pointer mx-2" />
                <span className="txt-compact-xsmall text-ui-fg-muted tabular-nums w-12 text-end">
                  {formatDuration(Math.floor(duration))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
