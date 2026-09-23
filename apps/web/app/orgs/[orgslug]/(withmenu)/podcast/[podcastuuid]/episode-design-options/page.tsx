'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Headphones,
  Calendar,
  ArrowLeft,
  Search,
  SortAsc,
  Mic,
  Download,
  Share2,
  BookOpen,
  BarChart3,
  Check,
} from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'

// ── Mock data ──

interface MockEpisode {
  number: number
  title: string
  description: string
  duration_seconds: number
  date: string
  completed: boolean
  progress: number // 0-100
  isPlaying: boolean
  thumbnail_url: string
}

const MOCK_EPISODES: MockEpisode[] = [
  {
    number: 1,
    title: 'Welcome to the Podcast — Setting the Stage',
    description:
      'In this premiere episode, we introduce the show, share our vision, and discuss what listeners can expect in the coming weeks. We cover the core themes and set the stage for an exciting season ahead.',
    duration_seconds: 1847,
    date: 'Mar 5, 2026',
    completed: true,
    progress: 100,
    isPlaying: false,
    thumbnail_url: '/empty_thumbnail.png',
  },
  {
    number: 2,
    title: 'Understanding Neural Networks — A Beginner\'s Guide',
    description:
      'We break down neural networks in plain English. No math, no jargon — just a clear explanation of how machines learn from data and why it matters for your daily life.',
    duration_seconds: 2532,
    date: 'Mar 12, 2026',
    completed: false,
    progress: 65,
    isPlaying: true,
    thumbnail_url: '/empty_thumbnail.png',
  },
  {
    number: 3,
    title: 'The Future of Edge Computing',
    description:
      'Edge computing is reshaping how we process data. We explore real-world applications, from smart factories to autonomous vehicles, and discuss what the next decade looks like.',
    duration_seconds: 2105,
    date: 'Mar 19, 2026',
    completed: false,
    progress: 0,
    isPlaying: false,
    thumbnail_url: '/empty_thumbnail.png',
  },
  {
    number: 4,
    title: 'Cybersecurity in the Age of AI',
    description:
      'As AI-powered attacks become more sophisticated, how do we defend ourselves? We talk to industry experts about the latest threats and the tools keeping us safe.',
    duration_seconds: 3210,
    date: 'Mar 26, 2026',
    completed: false,
    progress: 0,
    isPlaying: false,
    thumbnail_url: '/empty_thumbnail.png',
  },
  {
    number: 5,
    title: 'Building Scalable APIs — Lessons from the Trenches',
    description:
      'A practical deep-dive into API design patterns that scale. We share real-world mistakes, lessons learned, and the architecture decisions that made the difference between a fragile system and a robust one.',
    duration_seconds: 1876,
    date: 'Apr 2, 2026',
    completed: false,
    progress: 30,
    isPlaying: false,
    thumbnail_url: '/empty_thumbnail.png',
  },
]

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

function getInitials(title: string): string {
  return title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

// ── Colors for thumbnails ──
const THUMB_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

// ── Option A: Horizontal Card (Recommended) ──

function OptionAHorizontalCard({
  episode,
  index,
}: {
  episode: MockEpisode
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-200 ${
        episode.isPlaying ? 'ring-2 ring-indigo-400' : ''
      } ${isHovered ? 'shadow-[0_0_0_1px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.05)] -translate-y-0.5' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Episode number */}
        <div className="flex-shrink-0 w-8 pt-1 text-center">
          <span className="text-sm font-bold text-gray-400">
            {episode.number}
          </span>
        </div>

        {/* Thumbnail */}
        <div className="flex-shrink-0 relative">
          <div
            className={`w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center text-lg font-bold ${
              THUMB_COLORS[index % THUMB_COLORS.length]
            }`}
          >
            {getInitials(episode.title)}
          </div>
          {/* Play overlay on hover */}
          <div
            className={`absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 transition-opacity ${
              episode.isPlaying
                ? 'opacity-100'
                : isHovered
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            <div className="bg-white rounded-full p-2">
              {episode.isPlaying ? (
                <Pause size={16} className="text-gray-900" fill="currentColor" />
              ) : (
                <Play size={16} className="text-gray-900 ml-0.5" fill="currentColor" />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-semibold truncate ${
                episode.isPlaying ? 'text-indigo-700' : 'text-gray-900'
              }`}
            >
              {episode.title}
            </h4>
            <span className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-1">
              <Clock size={11} />
              {formatDuration(episode.duration_seconds)}
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {episode.description}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Calendar size={11} />
              {episode.date}
            </span>
            {episode.completed && (
              <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={11} />
                Completed
              </span>
            )}
          </div>

          {/* Progress bar */}
          {episode.progress > 0 && !episode.completed && (
            <div className="mt-2.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${episode.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  {episode.progress}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right play button */}
        <button className="flex-shrink-0 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors self-center">
          {episode.isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}

// ── Option B: Stacked Card ──

function OptionBStackedCard({
  episode,
  index,
}: {
  episode: MockEpisode
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`rounded-xl bg-white border border-gray-200 overflow-hidden transition-all duration-200 ${
        episode.isPlaying ? 'border-indigo-300 bg-indigo-50/20' : ''
      } ${isHovered ? 'shadow-md border-gray-300' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-4 p-4">
        {/* Left: Thumbnail column */}
        <div className="flex-shrink-0">
          <div
            className={`w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center text-2xl font-bold relative ${
              THUMB_COLORS[index % THUMB_COLORS.length]
            }`}
          >
            {getInitials(episode.title)}
            {/* Always-visible play button */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div
                className={`rounded-full p-2 transition-colors ${
                  episode.isPlaying
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/90 text-gray-900 hover:bg-white'
                }`}
              >
                {episode.isPlaying ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-semibold ${
              episode.isPlaying ? 'text-indigo-700' : 'text-gray-900'
            }`}
          >
            {episode.title}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {episode.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
            <span>Ep. {episode.number}</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDuration(episode.duration_seconds)}
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {episode.date}
            </span>
          </div>

          {/* Progress bar */}
          {episode.progress > 0 && (
            <div className="mt-2.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      episode.completed ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${episode.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  {episode.completed ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 size={11} /> Done
                    </span>
                  ) : (
                    `${episode.progress}%`
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Option C: Minimal Row ──

function OptionCMinimalRow({
  episode,
  index,
}: {
  episode: MockEpisode
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-all cursor-pointer ${
        episode.isPlaying ? 'bg-indigo-50' : isHovered ? 'bg-gray-50' : ''
      } ${index > 0 ? 'border-t border-gray-100' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Number */}
      <span className="text-xs font-bold text-gray-400 w-6 text-center flex-shrink-0">
        {episode.number}
      </span>

      {/* Thumbnail tiny */}
      <div
        className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
          THUMB_COLORS[index % THUMB_COLORS.length]
        }`}
      >
        {getInitials(episode.title)}
      </div>

      {/* Title + metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm truncate ${
              episode.isPlaying
                ? 'font-semibold text-indigo-700'
                : 'font-medium text-gray-800'
            }`}
          >
            {episode.title}
          </span>
          {episode.completed && (
            <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{formatDuration(episode.duration_seconds)}</span>
          <span>&middot;</span>
          <span>{episode.date}</span>
        </div>
      </div>

      {/* Progress dot */}
      {episode.progress > 0 && !episode.completed && (
        <div className="flex-shrink-0">
          <div className="relative w-6 h-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#e5e7eb"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#6366f1"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 10}`}
                strokeDashoffset={`${2 * Math.PI * 10 * (1 - episode.progress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-gray-500">
              {episode.progress}%
            </span>
          </div>
        </div>
      )}

      {/* Play button */}
      <button
        className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
          episode.isPlaying
            ? 'bg-indigo-600 text-white'
            : isHovered
            ? 'bg-gray-200 text-gray-600'
            : 'text-gray-300'
        }`}
      >
        {episode.isPlaying ? (
          <Pause size={12} fill="currentColor" />
        ) : (
          <Play size={12} fill="currentColor" className="ml-0.5" />
        )}
      </button>
    </div>
  )
}

// ── Main Preview Page ──

export default function EpisodeDesignOptionsPreview() {
  const [expandedOption, setExpandedOption] = useState<string | null>(null)

  return (
    <GeneralWrapperStyled>
      <div className="w-full mx-auto max-w-7xl mt-8 space-y-8">
        {/* Back link */}
        <Link
          href="./"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to podcast
        </Link>

        {/* Page header */}
        <div>
          <Heading level="h1" className="!text-2xl">
            Episode Card Design Options
          </Heading>
          <Text size="base" className="text-ui-fg-muted mt-1">
            Three distinct approaches for displaying podcast episodes. Each uses the same mock data.
          </Text>
        </div>

        {/* ── Option A ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md">
                  RECOMMENDED
                </span>
                <Heading level="h3">Option A — Horizontal Card</Heading>
              </div>
              <Text size="small" className="text-ui-fg-muted mt-0.5">
                Thumbnail left, content center, play button right. Shadow card with progress bar. Best reading flow.
              </Text>
            </div>
            <button
              onClick={() =>
                setExpandedOption(expandedOption === 'a' ? null : 'a')
              }
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {expandedOption === 'a' ? 'Hide notes' : 'Show notes'}
            </button>
          </div>

          {expandedOption === 'a' && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 space-y-1">
              <p><strong>Card style:</strong> <code className="bg-amber-100 px-1 rounded">rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]</code> — matches CourseCurriculum module cards</p>
              <p><strong>Separation:</strong> <code className="bg-amber-100 px-1 rounded">space-y-3</code> between cards (not divide-y)</p>
              <p><strong>Progress:</strong> Thin bar at bottom when partially done, checkmark when completed</p>
              <p><strong>Play overlay:</strong> Appears on thumbnail hover + always visible on current episode</p>
              <p><strong>Current episode:</strong> <code className="bg-amber-100 px-1 rounded">ring-2 ring-indigo-400</code> outline</p>
              <p><strong>Hover:</strong> Subtle lift <code className="bg-amber-100 px-1 rounded">-translate-y-0.5</code> + deeper shadow</p>
              <p><strong>Row items:</strong> Number → Thumbnail → Title + Description + Date + Progress → Play button</p>
            </div>
          )}

          <div className="space-y-3">
            {MOCK_EPISODES.map((ep, i) => (
              <OptionAHorizontalCard key={i} episode={ep} index={i} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* ── Option B ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">
                  ALTERNATIVE
                </span>
                <Heading level="h3">Option B — Stacked Card</Heading>
              </div>
              <Text size="small" className="text-ui-fg-muted mt-0.5">
                Larger thumbnail on left with always-visible play button. Border card. Metadata in a row below title.
              </Text>
            </div>
            <button
              onClick={() =>
                setExpandedOption(expandedOption === 'b' ? null : 'b')
              }
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {expandedOption === 'b' ? 'Hide notes' : 'Show notes'}
            </button>
          </div>

          {expandedOption === 'b' && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 space-y-1">
              <p><strong>Card style:</strong> <code className="bg-amber-100 px-1 rounded">rounded-xl bg-white border border-gray-200</code> — simpler border card</p>
              <p><strong>Thumbnail:</strong> Larger (80x80), always shows play button overlay, good for podcasts with strong episode artwork</p>
              <p><strong>Metadata:</strong> All in one row: "Ep. 2 | 42 min | Mar 12, 2026"</p>
              <p><strong>Progress bar:</strong> Thicker (1.5px), changes color to green on completion</p>
              <p><strong>Current episode:</strong> Border turns indigo + subtle background tint</p>
              <p><strong>Hover:</strong> Shadow increase + border darkens</p>
              <p><strong>Trade-off:</strong> Takes more vertical space per episode, fewer visible per scroll</p>
            </div>
          )}

          <div className="space-y-3">
            {MOCK_EPISODES.map((ep, i) => (
              <OptionBStackedCard key={i} episode={ep} index={i} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* ── Option C ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">
                  COMPACT
                </span>
                <Heading level="h3">Option C — Minimal Row</Heading>
              </div>
              <Text size="small" className="text-ui-fg-muted mt-0.5">
                Compact row layout. No description shown. Thin dividers between rows. Circular progress indicator.
              </Text>
            </div>
            <button
              onClick={() =>
                setExpandedOption(expandedOption === 'c' ? null : 'c')
              }
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {expandedOption === 'c' ? 'Hide notes' : 'Show notes'}
            </button>
          </div>

          {expandedOption === 'c' && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 space-y-1">
              <p><strong>Layout:</strong> Simple row with <code className="bg-amber-100 px-1 rounded">border-t border-gray-100</code> between items (like current design but cleaner)</p>
              <p><strong>Thumbnail:</strong> Tiny (40x40), just a color initial — no play overlay</p>
              <p><strong>Description:</strong> Hidden — only title + duration + date shown</p>
              <p><strong>Progress:</strong> Circular SVG ring instead of a bar — compact and visual</p>
              <p><strong>Completion:</strong> Small green checkmark next to title</p>
              <p><strong>Play button:</strong> Hidden by default (gray-300), appears on hover (gray-200), or always visible when current episode (indigo-600)</p>
              <p><strong>Best for:</strong> Long episode lists (50+), where density matters more than rich previews</p>
              <p><strong>Trade-off:</strong> No description visible — user must hover or tap to see details</p>
            </div>
          )}

          <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden">
            {MOCK_EPISODES.map((ep, i) => (
              <OptionCMinimalRow key={i} episode={ep} index={i} />
            ))}
          </div>
        </div>

        {/* ── Comparison Table ── */}
        <div className="border-t border-gray-200 pt-8">
          <Heading level="h2" className="!text-xl mb-4">
            Quick Comparison
          </Heading>
          <div className="overflow-x-auto rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Aspect</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-700">A — Horizontal Card</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">B — Stacked Card</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">C — Minimal Row</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">Card style</td>
                  <td className="px-4 py-2.5 text-gray-700">Shadow card (no border)</td>
                  <td className="px-4 py-2.5 text-gray-700">Border card</td>
                  <td className="px-4 py-2.5 text-gray-700">Divided rows (no card)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">Thumbnail size</td>
                  <td className="px-4 py-2.5 text-gray-700">64x64</td>
                  <td className="px-4 py-2.5 text-gray-700">80x80</td>
                  <td className="px-4 py-2.5 text-gray-700">40x40</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">Play button</td>
                  <td className="px-4 py-2.5 text-gray-700">On thumbnail hover + right button</td>
                  <td className="px-4 py-2.5 text-gray-700">Always on thumbnail</td>
                  <td className="px-4 py-2.5 text-gray-700">On row hover</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">Description</td>
                  <td className="px-4 py-2.5 text-gray-700">2-line clamp</td>
                  <td className="px-4 py-2.5 text-gray-700">2-line clamp</td>
                  <td className="px-4 py-2.5 text-gray-700">Hidden</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">Progress indicator</td>
                  <td className="px-4 py-2.5 text-gray-700">Thin bar + percentage</td>
                  <td className="px-4 py-2.5 text-gray-700">Thicker bar + checkmark</td>
                  <td className="px-4 py-2.5 text-gray-700">Circular ring</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">Episodes per scroll</td>
                  <td className="px-4 py-2.5 text-gray-700">~6-8</td>
                  <td className="px-4 py-2.5 text-gray-700">~5-6</td>
                  <td className="px-4 py-2.5 text-gray-700">~12-15</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">Matches existing patterns</td>
                  <td className="px-4 py-2.5 text-indigo-700 font-medium">CourseCurriculum, CourseLearnings</td>
                  <td className="px-4 py-2.5 text-gray-700">DiscussionCard</td>
                  <td className="px-4 py-2.5 text-gray-700">None (custom)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">Best for</td>
                  <td className="px-4 py-2.5 text-gray-700">Most podcasts (recommended)</td>
                  <td className="px-4 py-2.5 text-gray-700">Visual-heavy podcasts</td>
                  <td className="px-4 py-2.5 text-gray-700">50+ episode catalogs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer note ── */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 px-5 py-4">
          <Text size="small" className="text-ui-fg-muted">
            <strong>Recommendation:</strong> Option A (Horizontal Card) balances rich content preview with visual density, matches the CourseCurriculum shadow-card pattern, and provides clear progress tracking. It is the safest and most premium option.
          </Text>
        </div>
      </div>
    </GeneralWrapperStyled>
  )
}
