'use client'

import React, { useState } from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

// ── Types ──

interface Lesson {
  id: number
  name: string
}

interface Module {
  id: number
  name: string
  lessons: Lesson[]
}

interface CourseCurriculumProps {
  chapters?: any[]
}

function toModule(chapter: any): Module {
  return {
    id: chapter.id,
    name: chapter.name || '',
    lessons: (chapter.activities || []).map((activity: any) => ({
      id: activity.id,
      name: activity.name || '',
    })),
  }
}

// ── Sub-components ──

function ModuleCard({
  module,
  isOpen,
  onToggle,
}: {
  module: Module
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* ── Header (always visible, clickable) ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 text-start transition-colors hover:bg-black/[0.02]"
      >
        <span className="flex flex-col min-w-0">
          <Text weight="plus" size="base" className="text-ui-fg-base truncate">
            {module.name}
          </Text>
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-ui-fg-muted shrink-0 ms-2 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* ── Expanded content: the module's lesson titles, as plain stacked text ── */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <ul className="px-5 pb-4 pt-1">
            {module.lessons.map((lesson, idx) => (
              <li
                key={lesson.id ?? idx}
                className="flex items-start gap-2 py-[3px] text-[13px] leading-relaxed text-ui-fg-base"
              >
                <span className="mt-[7px] block w-1.5 h-1.5 rounded-full bg-ui-fg-muted shrink-0" />
                {lesson.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── Main component ──

export default function CourseCurriculum({ chapters = [] }: CourseCurriculumProps) {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const modules = chapters.map(toModule)
  if (modules.length === 0) return null

  return (
    <div>
      {/* Section header */}
      <div className="mb-5">
        <Heading level="h1" className="!text-2xl">{t('course.page.curriculum_title')}</Heading>
      </div>

      {/* Description */}
      <div className="mb-7">
        <Text size="base" className="text-ui-fg-subtle leading-relaxed">
          {t('course.page.curriculum_description')}
        </Text>
      </div>

      {/* Modules */}
      <div className="space-y-2.5">
        {modules.map((module, idx) => (
          <ModuleCard
            key={module.id ?? idx}
            module={module}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  )
}
