'use client'
import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface SectionRowProps {
  title: string
  seeAllHref: string
  seeAllLabel?: string
  children: React.ReactNode
}

export function SectionRow({ title, seeAllHref, seeAllLabel = 'See All', children }: SectionRowProps) {
  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[22px] font-semibold text-ui-fg-base">{title}</h2>
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          {seeAllLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {/* Grid — matching listing page grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {children}
      </div>
    </section>
  )
}
