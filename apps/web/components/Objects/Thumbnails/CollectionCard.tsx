'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'

export interface CollectionCardProps {
  id: string
  title: string
  description: string
  courses: any[]
  org_uuid?: string
  href?: string
  public: boolean
  creation_date: string
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

export function CollectionCard({ id, title, description, courses, org_uuid, href, ...props }: CollectionCardProps) {
  const firstCourse = courses?.[0]
  const imageUrl = firstCourse?.thumbnail_image && org_uuid
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

  return (
    <Link
      href={href || `/collection/${id}`}
      className="flex flex-col h-full bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      style={{ transformOrigin: 'top center' }}
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
        <p className="text-[12px] text-gray-400">
          {courses?.length || 0} {courses?.length === 1 ? 'course' : 'courses'} &middot; {difficulty || 'All levels'} &middot; {formatDate(props.creation_date)}
        </p>
      </div>
    </Link>
  )
}
