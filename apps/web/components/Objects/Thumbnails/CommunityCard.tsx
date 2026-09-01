'use client'
import Link from 'next/link'
import { getCommunityThumbnailMediaDirectory } from '@services/media/media'
import { Users } from 'lucide-react'

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

function formatDate(dateStr: string) {
  if (!dateStr) return 'Recently'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 1) return 'Today'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  } catch {
    return 'Recently'
  }
}

export function CommunityCard({ id, title, description, org_uuid, community_uuid, course_id, ...props }: CommunityCardProps) {
  const imageUrl = props.thumbnail_image && org_uuid
    ? getCommunityThumbnailMediaDirectory(org_uuid, community_uuid, props.thumbnail_image)
    : ''

  const communityType = course_id ? 'Course' : 'General'

  return (
    <Link
      href={props.href || `/community/${id}`}
      className="flex flex-col h-full bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      style={{ transformOrigin: 'top center' }}
    >
      {/* 16:9 Cover Image */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
        {imageUrl ? (
          <img className="w-full h-full object-cover" src={imageUrl} alt={title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Users size={40} strokeWidth={1.5} />
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
          {communityType} &middot; {props.public ? 'Public' : 'Private'} &middot; {formatDate(props.creation_date)}
        </p>
      </div>
    </Link>
  )
}
