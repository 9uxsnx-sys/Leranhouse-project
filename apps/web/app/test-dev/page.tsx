'use client'

import { PlaySolid, CreditCard, Book } from '@components/Objects/Icons/MedusaIcons'
import { BookOpen, Clock, Signal } from 'lucide-react'
import Link from 'next/link'

const sampleTitle = 'UI/UX Masterclass: Design Thinking Fundamentals'
const sampleDesc = 'Learn modern interface design principles and build stunning user experiences from scratch with hands-on projects and real-world examples.'
const thumbnailBg = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=a%20professional%20modern%20online%20course%20thumbnail%20with%20abstract%20gradient%20shapes%20in%20purple%20and%20blue%20tones%2C%20clean%20minimalist%20design%2C%20e-learning%20concept&image_size=landscape_16_9'

export default function TestDevPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Card Design Test</h1>

      {/* Row 1: Basic card variations */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Variation A: White Card + Shadow (Current Medusa Style)</h2>
        <div className="grid grid-cols-4 gap-6 max-w-[1200px]">
          <VariationA />
          <VariationA />
          <VariationA />
          <VariationA />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Variation B: Gray Shell + White Inner Card</h2>
        <div className="grid grid-cols-4 gap-6 max-w-[1200px]">
          <VariationB />
          <VariationB />
          <VariationB />
          <VariationB />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Variation C: White Card + Footer Metadata</h2>
        <div className="grid grid-cols-4 gap-6 max-w-[1200px]">
          <VariationC />
          <VariationC />
          <VariationC />
          <VariationC />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Variation D: Border Only, No Shadow</h2>
        <div className="grid grid-cols-4 gap-6 max-w-[1200px]">
          <VariationD />
          <VariationD />
          <VariationD />
          <VariationD />
        </div>
      </section>

      {/* Variation E: Spec-compliant clean card */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Variation E: White + Border + Clean Metadata (Spec Compliant)</h2>
        <div className="grid grid-cols-3 gap-6 max-w-[1200px]">
          <div className="flex justify-center overflow-visible">
            <CourseCard
              id="1"
              title={sampleTitle}
              description={sampleDesc}
              image={thumbnailBg}
              lessons={24}
              duration="12h 30m"
              difficulty="Intermediate"
            />
          </div>
          <div className="flex justify-center overflow-visible">
            <CourseCard
              id="2"
              title={sampleTitle}
              description={sampleDesc}
              image={thumbnailBg}
              lessons={18}
              duration="8h 45m"
              difficulty="Beginner"
            />
          </div>
          <div className="flex justify-center overflow-visible">
            <CourseCard
              id="3"
              title={sampleTitle}
              description={sampleDesc}
              image={thumbnailBg}
              lessons={32}
              duration="16h 20m"
              difficulty="Advanced"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

/* Variation A: White card with shadow - current Medusa style */
function VariationA() {
  return (
    <div className="group bg-ui-bg-base rounded-lg shadow-elevation-card-rest hover:shadow-elevation-card-hover transition-shadow overflow-hidden">
      <Link href="#" className="block relative aspect-video overflow-hidden bg-ui-bg-component">
        <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={thumbnailBg} alt="" />
      </Link>
      <div className="p-3 flex flex-col gap-y-2">
        <Link href="#" className="hover:opacity-80 transition-opacity">
          <h3 className="text-ui-fg-base font-semibold text-sm leading-tight line-clamp-1">{sampleTitle}</h3>
        </Link>
        <p className="text-ui-fg-subtle text-xs leading-relaxed line-clamp-3">{sampleDesc}</p>
      </div>
    </div>
  )
}

/* Variation B: Gray shell + white inner card */
function VariationB() {
  return (
    <div className="group bg-zinc-100/70 border border-zinc-200/60 rounded-xl p-3">
      <Link href="#" className="block relative aspect-video rounded-lg overflow-hidden bg-white border border-zinc-200/60">
        <img className="w-full h-full object-cover" src={thumbnailBg} alt="" />
      </Link>
      <div className="bg-white rounded-lg border border-zinc-200/70 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] mt-3">
        <Link href="#" className="hover:opacity-80 transition-opacity">
          <h3 className="text-sm font-semibold text-zinc-900 line-clamp-1">{sampleTitle}</h3>
        </Link>
        <p className="text-[11px] text-zinc-500 line-clamp-3 mt-1 leading-relaxed">{sampleDesc}</p>
      </div>
    </div>
  )
}

/* Variation C: White card + footer with metadata */
function VariationC() {
  return (
    <div className="group bg-ui-bg-base rounded-lg shadow-elevation-card-rest hover:shadow-elevation-card-hover transition-shadow overflow-hidden">
      <Link href="#" className="block relative aspect-video overflow-hidden bg-ui-bg-component">
        <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={thumbnailBg} alt="" />
      </Link>
      <div className="p-3 flex flex-col gap-y-2">
        <Link href="#" className="hover:opacity-80 transition-opacity">
          <h3 className="text-ui-fg-base font-semibold text-sm leading-tight line-clamp-1">{sampleTitle}</h3>
        </Link>
        <p className="text-ui-fg-subtle text-xs leading-relaxed line-clamp-2">{sampleDesc}</p>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-ui-fg-muted">
            <PlaySolid className="h-3.5 w-3.5" />
            <span className="text-[11px]">12h 30m</span>
          </div>
          <div className="flex items-center gap-1 text-ui-fg-muted">
            <Book className="h-3.5 w-3.5" />
            <span className="text-[11px]">14 Modules</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Variation D: Border only, no shadow */
function VariationD() {
  return (
    <div className="group bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors overflow-hidden">
      <Link href="#" className="block relative aspect-video overflow-hidden bg-gray-100">
        <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={thumbnailBg} alt="" />
      </Link>
      <div className="p-3 flex flex-col gap-y-2">
        <Link href="#" className="hover:opacity-80 transition-opacity">
          <h3 className="text-gray-900 font-semibold text-sm leading-tight line-clamp-1">{sampleTitle}</h3>
        </Link>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{sampleDesc}</p>
      </div>
    </div>
  )
}

/* ── CourseCard: Spec-compliant reusable component ── */

interface CourseCardProps {
  id: string
  title: string
  description: string
  image: string
  lessons: number
  duration: string
  difficulty: string
}

function CourseCard({ id, title, description, image, lessons, duration, difficulty }: CourseCardProps) {
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
        {/* Title: smaller, 600 weight, 2-line clamp */}
        <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-gray-900">
          {title}
        </h3>

        {/* Description: 13-14px, 400 weight, 2-line clamp, muted gray #6B7280 */}
        {description && (
          <p className="text-[13px] font-normal leading-relaxed line-clamp-2 text-[#6B7280] mt-2">
            {description}
          </p>
        )}

        {/* Subtle divider (#EAEAEA) between description and metadata */}
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
