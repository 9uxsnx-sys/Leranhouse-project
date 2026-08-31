'use client'
import Link from 'next/link'
import { getPodcastThumbnailMediaDirectory } from '@services/media/media'
import { useOrg } from '@components/Contexts/OrgContext'

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'N/A'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} min`
  if (hours > 0) return `${hours} hr`
  return `${minutes} min`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  } catch {
    return dateStr
  }
}

interface ShowcasePodcast {
  id: string
  title: string
  description: string
  thumbnailImage?: string
  episodeCount: number
  totalDurationSeconds: number
  creationDate?: string
  org_uuid?: string
}

/* ===================== Option A — "Album Style" ===================== */
function OptionA({ p }: { p: ShowcasePodcast }) {
  const imageUrl = p.thumbnailImage
    ? getPodcastThumbnailMediaDirectory(p.org_uuid || '', `podcast_${p.id}`, p.thumbnailImage)
    : ''
  return (
    <Link
      href="#"
      className="flex flex-col bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] group"
    >
      {/* 1:1 square cover art */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '1/1' }}>
        {imageUrl ? (
          <img className="w-full h-full object-cover" src={imageUrl} alt={p.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
        )}
        {/* Play button overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      {/* Minimal info */}
      <div className="px-3 pt-2.5 pb-3">
        <h3 className="text-[14px] font-semibold leading-snug line-clamp-1 text-gray-900">{p.title}</h3>
        <p className="text-[12px] text-gray-400 mt-0.5">
          {p.episodeCount} {p.episodeCount === 1 ? 'episode' : 'episodes'}
        </p>
      </div>
    </Link>
  )
}

/* ===================== Option B — "Horizontal List" ===================== */
function OptionB({ p }: { p: ShowcasePodcast }) {
  const imageUrl = p.thumbnailImage
    ? getPodcastThumbnailMediaDirectory(p.org_uuid || '', `podcast_${p.id}`, p.thumbnailImage)
    : ''
  return (
    <Link
      href="#"
      className="flex gap-3 bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-3"
    >
      {/* Small square thumbnail */}
      <div className="w-[80px] h-[80px] shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img className="w-full h-full object-cover" src={imageUrl} alt={p.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <h3 className="text-[14px] font-semibold leading-snug line-clamp-1 text-gray-900">{p.title}</h3>
        <p className="text-[12px] text-gray-500 line-clamp-1 mt-0.5">{p.description}</p>
        <p className="text-[11px] text-gray-400 mt-1">
          {p.episodeCount} {p.episodeCount === 1 ? 'episode' : 'episodes'} &middot; {formatDuration(p.totalDurationSeconds)}
        </p>
      </div>
    </Link>
  )
}

/* ===================== Option C — "Metadata Emphasis" ===================== */
function OptionC({ p }: { p: ShowcasePodcast }) {
  const imageUrl = p.thumbnailImage
    ? getPodcastThumbnailMediaDirectory(p.org_uuid || '', `podcast_${p.id}`, p.thumbnailImage)
    : ''
  return (
    <Link
      href="#"
      className="flex flex-col bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] group"
    >
      {/* 16:9 thumbnail with badge */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
        {imageUrl ? (
          <img className="w-full h-full object-cover" src={imageUrl} alt={p.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
        )}
        {/* Episode count badge */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
          {p.episodeCount} {p.episodeCount === 1 ? 'ep' : 'eps'}
        </div>
      </div>
      {/* Content with prominent metadata */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
        <h3 className="text-[16px] font-bold leading-snug line-clamp-2 text-gray-900">{p.title}</h3>
        <p className="text-[13px] text-gray-500 mt-1 font-medium">
          {formatDuration(p.totalDurationSeconds)} total
        </p>
        <p className="text-[12px] text-gray-400 mt-auto pt-2">
          {p.creationDate ? `Updated ${formatDate(p.creationDate)}` : ''}
        </p>
      </div>
    </Link>
  )
}

/* ===================== Option D — "Visual Flair" ===================== */
function OptionD({ p }: { p: ShowcasePodcast }) {
  const imageUrl = p.thumbnailImage
    ? getPodcastThumbnailMediaDirectory(p.org_uuid || '', `podcast_${p.id}`, p.thumbnailImage)
    : ''
  return (
    <Link
      href="#"
      className="flex flex-col bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] group"
    >
      {/* Square thumbnail with gradient overlay */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '1/1' }}>
        {imageUrl ? (
          <>
            <img className="w-full h-full object-cover" src={imageUrl} alt={p.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
        )}
        {/* Headphone icon badge */}
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
        </div>
        {/* Play button */}
        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {/* Content with accent bar */}
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1">
        <h3 className="text-[14px] font-semibold leading-snug line-clamp-2 text-gray-900">{p.title}</h3>
        <p className="text-[12px] text-gray-400 line-clamp-1">
          {p.episodeCount} {p.episodeCount === 1 ? 'episode' : 'episodes'} &middot; {formatDuration(p.totalDurationSeconds)}
        </p>
      </div>
      {/* Colored accent bar */}
      <div className="h-[3px] bg-gradient-to-r from-purple-500 to-pink-400" />
    </Link>
  )
}

/* ===================== Showcase Component ===================== */
export default function PodcastCardShowcase({ podcasts }: { podcasts: ShowcasePodcast[] }) {
  const org = useOrg() as any
  const p = podcasts[0]
  if (!p) return null

  const enriched: ShowcasePodcast = { ...p, org_uuid: p.org_uuid || org?.org_uuid }

  return (
    <div className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ui-fg-base">Pick a card design</h2>
        <p className="text-sm text-ui-fg-muted mt-1">Each option uses the same podcast data. Which one do you prefer?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <div className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wide mb-2 text-center">A &mdash; Album Style</div>
          <OptionA p={enriched} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wide mb-2 text-center">B &mdash; Horizontal List</div>
          <OptionB p={enriched} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wide mb-2 text-center">C &mdash; Metadata Emphasis</div>
          <OptionC p={enriched} />
        </div>
        <div>
          <div className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wide mb-2 text-center">D &mdash; Visual Flair</div>
          <OptionD p={enriched} />
        </div>
      </div>
    </div>
  )
}
