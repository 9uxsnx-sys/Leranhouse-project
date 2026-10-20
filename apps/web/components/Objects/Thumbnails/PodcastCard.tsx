'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getPodcastThumbnailMediaDirectory } from '@services/media/media'
import { useOrg } from '@components/Contexts/OrgContext'

export interface PodcastCardProps {
  id: string
  title: string
  description: string
  thumbnailImage?: string
  episodeCount: number
  totalDurationSeconds: number
  creationDate?: string
  org_uuid?: string
  href?: string
}

export function PodcastCard({ id, title, description, thumbnailImage, episodeCount, totalDurationSeconds, creationDate, org_uuid, href }: PodcastCardProps) {
  const { t } = useTranslation()
  const org = useOrg() as any

  const formatDuration = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return t('podcast.page.not_available')
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (hours > 0) return t('podcast.page.duration_hours', { hours, minutes })
    return t('podcast.page.duration_minutes', { minutes })
  }

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return t('podcast.card.today')
      if (diffDays === 1) return t('podcast.card.yesterday')
      if (diffDays < 7) return t('podcast.card.days_ago', { count: diffDays })
      if (diffDays < 30) return t('podcast.card.weeks_ago', { count: Math.floor(diffDays / 7) })
      if (diffDays < 365) return t('podcast.card.months_ago', { count: Math.floor(diffDays / 30) })
      return t('podcast.card.years_ago', { count: Math.floor(diffDays / 365) })
    } catch {
      return dateStr
    }
  }

  const imageUrl = thumbnailImage
    ? getPodcastThumbnailMediaDirectory(org_uuid || org?.org_uuid, `podcast_${id}`, thumbnailImage)
    : ''

  return (
    <Link
      href={href || `/podcast/${id}`}
      className="flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
    >
      {/* 16:9 Cover Image */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
        {imageUrl ? (
          <img className="w-full h-full object-cover" src={imageUrl} alt={title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-gray-900">
            {title}
          </h3>
          <p className={`text-[13px] font-normal leading-relaxed line-clamp-3 ${description ? 'text-[#6B7280]' : 'invisible'}`}>
            {description || 'placeholder'}
          </p>
        </div>
        <p className="text-[12px] text-gray-400 mt-1.5">
          {t('podcast.page.episode', { count: episodeCount })} &middot; {formatDuration(totalDurationSeconds)} &middot; {creationDate ? formatDate(creationDate) : ''}
        </p>
      </div>
    </Link>
  )
}
