'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
  RotateCcw,
  RotateCw,
  PictureInPicture2,
  Subtitles,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────

interface CloudflarePlayerProps {
  src: string
  poster?: string
  onProgress?: (currentTime: number, duration: number) => void
  onComplete?: () => void
  autoplay?: boolean
  subtitleUrl?: string  // VTT URL for captions/subtitles
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

// ── Component ─────────────────────────────────────────────────────────

const CloudflarePlayer: React.FC<CloudflarePlayerProps> = ({
  src,
  poster,
  onProgress,
  onComplete,
  autoplay = false,
  subtitleUrl,
}) => {
  // ── Refs ──────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const hideCenterIconTimeout = useRef<NodeJS.Timeout | null>(null)
  const progressReportedRef = useRef<Set<number>>(new Set())

  // ── State ─────────────────────────────────────────────────────────
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [showCenterIcon, setShowCenterIcon] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false)
  const [hasCaptions, setHasCaptions] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [previewPos, setPreviewPos] = useState(0)

  // ── Auto-hide controls ───────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current)
    setShowControls(true)
    // Also briefly show center icon on mouse move (when paused)
    if (!isPlaying) {
      setShowCenterIcon(true)
      if (hideCenterIconTimeout.current) clearTimeout(hideCenterIconTimeout.current)
      hideCenterIconTimeout.current = setTimeout(() => {
        setShowCenterIcon(false)
      }, 500)
    }
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
        setShowSpeedMenu(false)
      }, 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current)
      if (hideCenterIconTimeout.current) clearTimeout(hideCenterIconTimeout.current)
    }
  }, [])

  // ── Fullscreen listener ──────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Sync volume ──────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current && isReady) videoRef.current.volume = volume
  }, [volume, isReady])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  // ── Reset on src change ──────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    setIsReady(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setBuffered(0)
    setIsBuffering(true)
    setPlaybackRate(1)
    setShowSpeedMenu(false)
    video.load()
  }, [src])

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video || !isReady) return

      // Don't capture if user is typing in an input
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          video.paused ? video.play() : video.pause()
          break
        case 'k':
          e.preventDefault()
          video.paused ? video.play() : video.pause()
          break
        case 'j':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'l':
          e.preventDefault()
          video.currentTime = Math.min(video.duration, video.currentTime + 10)
          break
        case 'arrowleft':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 5)
          break
        case 'arrowright':
          e.preventDefault()
          video.currentTime = Math.min(video.duration, video.currentTime + 5)
          break
        case 'arrowup':
          e.preventDefault()
          video.volume = Math.min(1, video.volume + 0.1)
          setVolume(video.volume)
          if (video.muted) { video.muted = false; setIsMuted(false) }
          break
        case 'arrowdown':
          e.preventDefault()
          video.volume = Math.max(0, video.volume - 0.1)
          setVolume(video.volume)
          break
        case 'f':
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
          break
        case 'm':
          e.preventDefault()
          video.muted = !video.muted
          setIsMuted(video.muted)
          break
        case ']':
          e.preventDefault()
          {
            const idx = PLAYBACK_RATES.indexOf(video.playbackRate)
            if (idx < PLAYBACK_RATES.length - 1) {
              video.playbackRate = PLAYBACK_RATES[idx + 1]
              setPlaybackRate(video.playbackRate)
            }
          }
          break
        case '[':
          e.preventDefault()
          {
            const idx = PLAYBACK_RATES.indexOf(video.playbackRate)
            if (idx > 0) {
              video.playbackRate = PLAYBACK_RATES[idx - 1]
              setPlaybackRate(video.playbackRate)
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isReady])

  // ── Check for text tracks (captions) ─────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const check = () => {
      setHasCaptions(video.textTracks.length > 0 || !!subtitleUrl)
    }
    video.addEventListener('loadedmetadata', check)
    return () => video.removeEventListener('loadedmetadata', check)
  }, [subtitleUrl])

  // ── Handle subtitles ─────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = subtitlesEnabled ? 'showing' : 'hidden'
    }
  }, [subtitlesEnabled])

  // ── Video event handlers ─────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [])

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current
    if (!video || !duration) return
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
  }, [duration])

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
    setIsReady(true)
    setIsBuffering(false)
    if (autoplay) video.play().catch(() => {})
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)

    // Buffered
    if (video.buffered.length > 0) {
      const end = video.buffered.end(video.buffered.length - 1)
      setBuffered(end / video.duration)
    }

    // Progress callback (every 5s)
    const seg = Math.floor(video.currentTime / 5)
    if (!progressReportedRef.current.has(seg)) {
      progressReportedRef.current.add(seg)
      onProgress?.(video.currentTime, video.duration)
    }

    // Auto-complete at 95%
    if (video.duration > 0 && video.currentTime / video.duration >= 0.95) {
      onComplete?.()
    }
  }

  // ── Seek bar ─────────────────────────────────────────────────────
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * duration
  }

  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    setPreviewPos(pos * 100)
    if (duration) setPreviewTime(pos * duration)
  }

  const handleSeekLeave = () => {
    setPreviewTime(null)
  }

  // ── Volume ───────────────────────────────────────────────────────
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const v = Math.max(0, Math.min(1, pos))
    setVolume(v)
    if (v > 0 && isMuted) setIsMuted(false)
    const video = videoRef.current
    if (video) { video.volume = v; if (video.muted) video.muted = false }
  }

  // ── PiP ──────────────────────────────────────────────────────────
  const togglePiP = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch (err) {
      console.error('PiP error:', err)
    }
  }

  useEffect(() => {
    const handler = () => setIsPiP(!!document.pictureInPictureElement)
    document.addEventListener('enterpictureinpicture', handler)
    document.addEventListener('leavepictureinpicture', handler)
    return () => {
      document.removeEventListener('enterpictureinpicture', handler)
      document.removeEventListener('leavepictureinpicture', handler)
    }
  }, [])

  // ── Fullscreen ───────────────────────────────────────────────────
  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await containerRef.current.requestFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  // ── Speed ────────────────────────────────────────────────────────
  const handleSpeedChange = (rate: number) => {
    const video = videoRef.current
    if (!video) return
    setPlaybackRate(rate)
    video.playbackRate = rate
    setShowSpeedMenu(false)
  }

  // ── Derived ──────────────────────────────────────────────────────
  const played = duration > 0 ? currentTime / duration : 0

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* ─── Player Container ─────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video overflow-hidden bg-black rounded-xl shadow-md shadow-gray-300/25 outline outline-1 outline-neutral-200/40 group"
        onMouseMove={resetHideTimer}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="absolute inset-0 w-full h-full object-contain cursor-pointer"
          preload="metadata"
          playsInline
          muted={isMuted}
          controlsList="nodownload"
          disableRemotePlayback
          onClick={handlePlayPause}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => {
            setIsPlaying(true)
            setShowCenterIcon(false)
            if (hideCenterIconTimeout.current) clearTimeout(hideCenterIconTimeout.current)
          }}
          onPause={() => {
            setIsPlaying(false)
            setShowCenterIcon(true)
            if (hideCenterIconTimeout.current) clearTimeout(hideCenterIconTimeout.current)
            hideCenterIconTimeout.current = setTimeout(() => {
              setShowCenterIcon(false)
            }, 500)
          }}
          onEnded={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onVolumeChange={() => {
            const v = videoRef.current
            if (v) { setVolume(v.volume); setIsMuted(v.muted) }
          }}
          onError={(e) => console.error('Video error:', e)}
        >
          {subtitleUrl && (
            <track kind="subtitles" src={subtitleUrl} srcLang="en" label="English" default />
          )}
        </video>

        {/* ── Center play button (when paused) ─────────────────── */}
        <div
          onClick={handlePlayPause}
          className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300 cursor-pointer ${
            showCenterIcon && isReady && !isBuffering
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="transition-all duration-200 hover:scale-105">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>
        </div>

        {/* ── Buffering indicator ──────────────────────────────── */}
        {isBuffering && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* ── Controls overlay ─────────────────────────────────── */}
        <div
          className={`absolute inset-0 z-30 flex flex-col justify-end transition-opacity duration-300 pointer-events-none ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Controls */}
          <div className="relative z-10 px-3 pb-2.5 space-y-1.5 pointer-events-auto">
            {/* ── Seek bar ─────────────────────────────────────── */}
            <div
              className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/progress hover:h-2 transition-all"
              onClick={handleSeek}
              onMouseMove={handleSeekHover}
              onMouseLeave={handleSeekLeave}
            >
              {/* Buffered */}
              <div
                className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
                style={{ width: `${buffered * 100}%` }}
              />
              {/* Progress */}
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                style={{ width: `${played * 100}%` }}
              />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ left: `calc(${played * 100}% - 7px)` }}
              />
              {/* Preview tooltip */}
              {previewTime !== null && (
                <div
                  className="absolute -top-9 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap"
                  style={{ left: `${previewPos}%` }}
                >
                  {formatTime(previewTime)}
                </div>
              )}
            </div>

            {/* ── Button row ───────────────────────────────────── */}
            <div className="flex items-center justify-between">
              {/* Left controls */}
              <div className="flex items-center gap-1.5">
                {/* Play/Pause */}
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white fill-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white fill-white" />
                  )}
                </button>

                {/* Rewind 10s */}
                <button
                  onClick={() => skip(-10)}
                  className="w-10 h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                  title="Rewind 10s (J)"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>

                {/* Forward 10s */}
                <button
                  onClick={() => skip(10)}
                  className="w-10 h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                  title="Forward 10s (L)"
                >
                  <RotateCw className="w-5 h-5 text-white" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setIsMuted(v.muted) } }}
                    className="w-10 h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                    title="Mute (M)"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <div className="w-20 h-1 bg-white/30 rounded-full relative cursor-pointer group"
                    onClick={handleVolumeClick}
                  >
                    {/* Fill */}
                    <div
                      className="absolute inset-y-0 left-0 bg-white rounded-full"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                    {/* Thumb */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }}
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="text-white/90 text-sm font-medium tabular-nums ml-2 select-none">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-1">
                {/* Subtitles / CC */}
                {(hasCaptions || subtitleUrl) && (
                  <button
                    onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      subtitlesEnabled ? 'bg-primary/40 hover:bg-primary/50' : 'hover:bg-white/15'
                    }`}
                    title="Subtitles (CC)"
                  >
                    <Subtitles
                      className={`w-[18px] h-[18px] ${subtitlesEnabled ? 'text-primary' : 'text-white'}`}
                    />
                  </button>
                )}

                {/* Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="p-2 rounded-lg hover:bg-white/15 transition-colors text-white text-sm font-semibold min-w-[40px]"
                    title="Playback Speed"
                  >
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-neutral-900/95 backdrop-blur-lg border border-white/10 rounded-lg overflow-hidden min-w-[140px] shadow-xl">
                      <div className="px-3 py-1.5 text-[11px] text-white/50 font-medium border-b border-white/10">
                        Speed
                      </div>
                      {PLAYBACK_RATES.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedChange(rate)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                            playbackRate === rate
                              ? 'text-white font-semibold bg-white/5'
                              : 'text-white/80'
                          }`}
                        >
                          {rate === 1 ? 'Normal' : `${rate}x`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Picture-in-Picture */}
                <button
                  onClick={togglePiP}
                  className={`p-2 rounded-lg transition-colors ${
                    isPiP ? 'bg-primary/40' : 'hover:bg-white/15'
                  }`}
                  title="Picture-in-Picture"
                >
                  <PictureInPicture2
                    className={`w-[18px] h-[18px] ${isPiP ? 'text-primary' : 'text-white'}`}
                  />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}

export default CloudflarePlayer
