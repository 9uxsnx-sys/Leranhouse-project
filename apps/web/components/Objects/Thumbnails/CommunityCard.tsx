'use client'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getCommunityThumbnailMediaDirectory } from '@services/media/media'
import { Users } from 'lucide-react'
import { CardMetaRow } from './CardMetaRow'

export interface CommunityCardProps {
  id: string
  title: string
  description: string
  org_uuid?: string
  community_uuid: string
  course_id: number | null
  public: boolean
  creation_date: string
  thumbnail_image?: string | null
  href?: string
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

export function CommunityCard({ id, title, description, org_uuid, community_uuid, course_id, ...props }: CommunityCardProps) {
  const { t, i18n } = useTranslation()
  const imageUrl = props.thumbnail_image && org_uuid
    ? getCommunityThumbnailMediaDirectory(org_uuid, community_uuid, props.thumbnail_image)
    : ''

  // Course-linked vs general, access mode and age are UI labels, not content.
  const meta = [
    course_id ? t('communities.linked_course') : t('communities.general'),
    props.public ? t('communities.public') : t('communities.private'),
    formatRelativeDate(props.creation_date, i18n.language),
  ].filter(Boolean)

  return (
    <Link
      href={props.href || `/community/${id}`}
      className="flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
    >
      {/* 16:9 Cover Image */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
        {imageUrl ? (
          <img
            className="w-full h-full object-cover"
            src={imageUrl}
            alt={title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Users size={40} strokeWidth={1.5} />
          </div>
        )}
      </div>
      {/* Content */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
        <div className="flex flex-col gap-1">
          <h3 dir="auto" className="text-[15px] font-semibold leading-snug line-clamp-2 text-gray-900">
            {title}
          </h3>
          {/* Three lines are reserved in every locale so cards keep one rhythm. */}
          <p dir="auto" className={`text-[13px] font-normal leading-relaxed line-clamp-3 min-h-[63px] ${description ? 'text-[#6B7280]' : 'invisible'}`}>
            {description || 'placeholder'}
          </p>
        </div>
        <CardMetaRow parts={meta} />
      </div>
    </Link>
  )
}
