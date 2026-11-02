'use client'

import React, { useState } from 'react'
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react'

const EPISODE_TITLE = 'UI/UX Masterclass: Design Thinking Fundamentals'
const PODCAST_NAME = 'Design Pro Podcast'
const CURRENT_TIME = 453
const DURATION = 2712
const PROGRESS_PCT = (CURRENT_TIME / DURATION) * 100

const formatTime = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function PlayerTestPage() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [muted, setMuted] = useState(false)
  const [prevVol, setPrevVol] = useState(0.7)

  const togglePlay = () => setPlaying(!playing)
  const toggleMute = () => {
    if (muted) { setVolume(prevVol); setMuted(false) }
    else { setPrevVol(volume); setVolume(0); setMuted(true) }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <h1 className="text-2xl font-bold text-neutral-800 mb-2">Player Design Comparison</h1>
      <p className="text-sm text-neutral-500 mb-8">Two approaches for the mini player bar. Click play/pause to see states.</p>

      {/* ── Design A: Episode Title focus ── */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-200 px-2 py-0.5 rounded">Design A</span>
          <h2 className="text-lg font-semibold text-neutral-700">Episode Title Focus</h2>
          <span className="text-xs text-neutral-400">(Apple Podcasts / Pocket Casts style)</span>
        </div>

        <div className="border border-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden">
          {/* Thin progress bar at top */}
          <div className="h-[3px] bg-neutral-100">
            <div className="h-full bg-neutral-800 transition-[width]" style={{ width: `${PROGRESS_PCT}%` }} />
          </div>

          <div className="h-14 px-4 flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-neutral-800 hover:opacity-80 transition-all"
            >
              {playing ? (
                <Pause size={16} className="text-white" fill="currentColor" />
              ) : (
                <Play size={16} className="text-white ms-0.5" fill="currentColor" />
              )}
            </button>

            {/* Episode Title — takes remaining space */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate leading-tight">{EPISODE_TITLE}</p>
              <p className="text-xs text-neutral-500 truncate leading-tight mt-0.5">{PODCAST_NAME}</p>
            </div>

            {/* Time */}
            <span className="text-xs text-neutral-400 tabular-nums flex-shrink-0">{formatTime(CURRENT_TIME)}</span>

            {/* Mute */}
            <button onClick={toggleMute} className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full hover:bg-neutral-100 transition-colors">
              {muted || volume === 0 ? <VolumeX size={14} className="text-neutral-400" /> : <Volume2 size={14} className="text-neutral-400" />}
            </button>

            {/* Close */}
            <button className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full hover:bg-neutral-100 transition-colors">
              <X size={14} className="text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-neutral-500">
          <div className="bg-neutral-100 rounded-lg p-3">
            <p className="font-medium text-neutral-700 mb-1">Pros</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Tells you what episode is playing</li>
              <li>Matches platform standards</li>
              <li>No WaveSurfer dependency needed</li>
              <li>Clean, minimal, informative</li>
            </ul>
          </div>
          <div className="bg-neutral-100 rounded-lg p-3">
            <p className="font-medium text-neutral-700 mb-1">Cons</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>No visual audio feedback</li>
              <li>Title can be long (truncated)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Design B: Clean platform match ── */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-200 px-2 py-0.5 rounded">Design B</span>
          <h2 className="text-lg font-semibold text-neutral-700">Simple Timeline Bar</h2>
          <span className="text-xs text-neutral-400">(Spotify mini player style)</span>
        </div>

        <div className="border border-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="h-14 px-4 flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-neutral-800 hover:opacity-80 transition-all"
            >
              {playing ? (
                <Pause size={16} className="text-white" fill="currentColor" />
              ) : (
                <Play size={16} className="text-white ms-0.5" fill="currentColor" />
              )}
            </button>

            {/* Episode Title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate leading-tight">{EPISODE_TITLE}</p>
              {/* Simple timeline bar below title */}
              <div className="mt-1.5 h-1 bg-neutral-100 rounded-full relative">
                <div
                  className="h-full bg-neutral-800 rounded-full transition-[width]"
                  style={{ width: `${PROGRESS_PCT}%` }}
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-xs text-neutral-400 tabular-nums flex-shrink-0">{formatTime(CURRENT_TIME)}</span>

            {/* Mute */}
            <button onClick={toggleMute} className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full hover:bg-neutral-100 transition-colors">
              {muted || volume === 0 ? <VolumeX size={14} className="text-neutral-400" /> : <Volume2 size={14} className="text-neutral-400" />}
            </button>

            {/* Close */}
            <button className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full hover:bg-neutral-100 transition-colors">
              <X size={14} className="text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-neutral-500">
          <div className="bg-neutral-100 rounded-lg p-3">
            <p className="font-medium text-neutral-700 mb-1">Pros</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Visual progress without waveform bloat</li>
              <li>Shows episode title + podcast name</li>
              <li>Simple CSS, no external lib needed</li>
              <li>Matches Spotify/Apple Music style</li>
            </ul>
          </div>
          <div className="bg-neutral-100 rounded-lg p-3">
            <p className="font-medium text-neutral-700 mb-1">Cons</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Slightly more vertical space per row</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Side by side comparison ── */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-200 px-2 py-0.5 rounded">VS</span>
          <h2 className="text-lg font-semibold text-neutral-700">Side by Side</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Design A */}
          <div className="border border-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden self-start">
            <div className="h-[3px] bg-neutral-100">
              <div className="h-full bg-neutral-800" style={{ width: `${PROGRESS_PCT}%` }} />
            </div>
            <div className="h-12 px-3 flex items-center gap-2">
              <button className="flex-shrink-0 h-7 w-7 rounded-full bg-neutral-800 flex items-center justify-center">
                <Play size={12} className="text-white ms-0.5" fill="currentColor" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-800 truncate">Design Thinking Fundamentals</p>
              </div>
              <span className="text-[11px] text-neutral-400 tabular-nums">7:33</span>
              <button className="flex-shrink-0 h-6 w-6 rounded-full hover:bg-neutral-100 flex items-center justify-center">
                <X size={12} className="text-neutral-400" />
              </button>
            </div>
            <div className="px-3 pb-2">
              <span className="text-[10px] text-neutral-400 font-medium bg-neutral-100 px-1.5 py-0.5 rounded">Design A</span>
            </div>
          </div>

          {/* Design B */}
          <div className="border border-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden self-start">
            <div className="h-12 px-3 flex items-center gap-2">
              <button className="flex-shrink-0 h-7 w-7 rounded-full bg-neutral-800 flex items-center justify-center">
                <Play size={12} className="text-white ms-0.5" fill="currentColor" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-800 truncate">Design Thinking Fundamentals</p>
                <div className="mt-1 h-[2px] bg-neutral-100 rounded-full">
                  <div className="h-full bg-neutral-800 rounded-full" style={{ width: `${PROGRESS_PCT}%` }} />
                </div>
              </div>
              <span className="text-[11px] text-neutral-400 tabular-nums">7:33</span>
              <button className="flex-shrink-0 h-6 w-6 rounded-full hover:bg-neutral-100 flex items-center justify-center">
                <X size={12} className="text-neutral-400" />
              </button>
            </div>
            <div className="px-3 pb-2">
              <span className="text-[10px] text-neutral-400 font-medium bg-neutral-100 px-1.5 py-0.5 rounded">Design B</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
