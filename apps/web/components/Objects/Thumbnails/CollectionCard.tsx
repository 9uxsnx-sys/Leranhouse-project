'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  getCollectionThumbnailMediaDirectory,
  getCourseThumbnailMediaDirectory,
} from '@services/media/media'

export interface CollectionCardProps {
  id: string
  title: string
  description: string
  courses: any[]
  org_uuid?: string
  href?: string
  public: boolean
  creation_date: string
  /** Total members (courses + podcasts). Falls back to `courses.length`. */
  memberCount?: number
  /** Collection's own cover. Falls back to the first member course's cover. */
  thumbnail_image?: string
  collection_uuid?: string
  /** True when the learner claimed or bought this bundle. */
  owned?: boolean
}

function formatRelativeDate(dateStr: string, locale: string) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (diffDays < 1) return relative.format(0, 'day')
    if (diffDays < 7) return relative.format(-diffDays, 'day')
    if (diffDays < 30) return relative.format(-Math.floor(diffDays / 7), 'week')
    if (diffDays < 365) return relative.format(-Math.floor(diffDays / 30), 'month')
    return relative.format(-Math.floor(diffDays / 365), 'year')
  } catch {
    return ''
  }
}

export function CollectionCard({ id, title, description, courses, org_uuid, href, thumbnail_image, collection_uuid, memberCount, owned, ...props }: CollectionCardProps) {
  const { t, i18n } = useTranslation()
  const firstCourse = courses?.[0]
  const imageUrl = thumbnail_image && collection_uuid && org_uuid
    ? getCollectionThumbnailMediaDirectory(org_uuid, collection_uuid, thumbnail_image)
    : firstCourse?.thumbnail_image && org_uuid
      ? getCourseThumbnailMediaDirectory(org_uuid, firstCourse.course_uuid, firstCourse.thumbnail_image)
      : ''

  // Derive difficulty from courses
  const difficulty = useMemo(() => {
    if (!courses || courses.length === 0) return null
    const levels = courses.map((c: any) => c.difficulty || c.level || '').filter(Boolean)
    if (levels.length === 0) return null
    const counts: Record<string, number> = {}
    levels.forEach((l: string) => { counts[l] = (counts[l] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }, [courses])

  const itemCount = memberCount ?? courses?.length ?? 0
  const meta = [
    t('collections.item_count', { count: itemCount }),
    difficulty || t('collections.all_levels'),
    formatRelativeDate(props.creation_date, i18n.language),
  ].filter(Boolean)

  return (
    <Link
      href={href || `/collection/${id}`}
      className="flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
    >
      {/* 16:9 Cover Image */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
        {imageUrl ? (
          <img className="w-full h-full object-cover" src={imageUrl} alt={title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        )}
        {owned && (
          <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-medium text-emerald-600 shadow-sm ring-1 ring-black/5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {t('collections.owned_badge')}
          </span>
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
        <p className="text-[12px] text-gray-400 mt-1.5">{meta.join(' · ')}</p>
      </div>
    </Link>
  )
}
