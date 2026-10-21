'use client'
import Link from 'next/link'

export interface CourseCardProps {
  id: string
  title: string
  description: string
  image: string
  lessons?: number
  duration?: string
  difficulty?: string
  href?: string
  /** Noun for the count shown in the meta row (defaults to "lessons"). */
  lessonsLabel?: string
}
export function CourseCard({ id, title, description, image, lessons, duration, difficulty, href, lessonsLabel = 'lessons' }: CourseCardProps) {
  // Only render the parts we actually have — list endpoints do not return a
  // lesson count, and metadata can be empty for older courses.
  const metaParts = [
    typeof lessons === 'number' ? `${lessons} ${lessonsLabel}` : null,
    duration,
    difficulty,
  ].filter(Boolean)
  return (
    <Link
      href={href || `/course/${id}`}
      className="flex flex-col h-full bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden"
    >
      {/* 16:9 Cover Image */}
      <div className="relative overflow-hidden bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
        {image ? (
          <img className="w-full h-full object-cover" src={image} alt={title} />
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
        {/* Top section: title + description */}
        <div className="flex flex-col gap-1">
          {/* Title: 15px, 600 weight, 2-line clamp */}
          <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-gray-900">
            {title}
          </h3>
          {/* Description: 13px, 400 weight, 3-line clamp — always rendered to keep spacing consistent */}
          <p className={`text-[13px] font-normal leading-relaxed line-clamp-3 ${description ? 'text-[#6B7280]' : 'invisible'}`}>
            {description || 'placeholder'}
          </p>
        </div>
        {/* Metadata: directly below description. The row is always rendered
            (invisible when empty) so every card in a grid keeps the same
            height — older courses often have no duration/difficulty set. */}
        <p dir="auto" className={`text-[12px] text-gray-400 mt-1.5 ${metaParts.length === 0 ? 'invisible' : ''}`}>
          {metaParts.length > 0 ? metaParts.join(' · ') : '\u00A0'}
        </p>
      </div>
    </Link>
  )
}
