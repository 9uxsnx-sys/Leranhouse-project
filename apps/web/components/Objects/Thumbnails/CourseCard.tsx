'use client'

import Link from 'next/link'
import { BookOpen, Clock, Signal } from 'lucide-react'

export interface CourseCardProps {
  id: string
  title: string
  description: string
  image: string
  lessons: number
  duration: string
  difficulty: string
}

export function CourseCard({ id, title, description, image, lessons, duration, difficulty }: CourseCardProps) {
  return (
    <Link
      href={`/course/${id}`}
      className="block bg-white border border-[#E7E7E7] rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:border-[#DADADA] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-[360px] shrink-0"
      style={{ transformOrigin: 'top center' }}
    >
      {/* 4:3 Cover Image - clean, no overlay, no zoom */}
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
        <img className="w-full h-full object-cover" src={image} alt={title} />
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4 flex flex-col">
        {/* Title: 15px, 600 weight, 2-line clamp */}
        <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-gray-900">
          {title}
        </h3>

        {/* Description: 13px, 400 weight, 2-line clamp */}
        {description && (
          <p className="text-[13px] font-normal leading-relaxed line-clamp-2 text-[#6B7280] mt-2">
            {description}
          </p>
        )}

        {/* Subtle divider */}
        <div className="border-t border-[#EAEAEA] mt-6 mb-6" />

        {/* Metadata row: lessons left · duration center · difficulty right */}
        <div className="flex items-center justify-between text-[12px] text-gray-500">
          <span className="flex items-center gap-1.5 text-left">
            <BookOpen className="h-3.5 w-3.5" />
            {lessons} lessons
          </span>
          <span className="flex items-center gap-1.5 text-center font-medium">
            <Clock className="h-3.5 w-3.5" />
            {duration}
          </span>
          <span className="flex items-center gap-1.5 text-right">
            <Signal className="h-3.5 w-3.5" />
            {difficulty}
          </span>
        </div>
      </div>
    </Link>
  )
}
